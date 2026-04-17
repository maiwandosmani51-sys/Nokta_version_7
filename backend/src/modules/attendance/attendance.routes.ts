import { Router, type Request } from 'express';
import Joi from 'joi';
import { Attendance } from '../../models/Attendance';
import { AttendancePolicy } from '../../models/AttendancePolicy';
import { ClassModel } from '../../models/Class';
import { Notification } from '../../models/Notification';
import { Student } from '../../models/Student';
import { User } from '../../models/User';
import { authenticate, authorize } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import { createError, createResponse } from '../../helpers/response';
import { BusinessRuleService } from '../../services/businessRuleService';

const router = Router();
const businessRuleService = new BusinessRuleService();

const attendanceSchema = Joi.object({
  body: Joi.object({
    studentId: Joi.string().hex().length(24).required(),
    classId: Joi.string().hex().length(24).required(),
    teacherId: Joi.string().hex().length(24).optional(),
    branchId: Joi.string().hex().length(24).optional(),
    attendanceDate: Joi.date().required(),
    session: Joi.string().valid('morning', 'afternoon', 'evening', 'online').required(),
    status: Joi.string().valid('present', 'absent', 'late', 'excused', 'online_auto_marked').required(),
    source: Joi.string().valid('manual', 'automation', 'mobile', 'web').optional(),
    notes: Joi.string().allow('', null).optional()
  })
});

const attendanceQuerySchema = Joi.object({
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    search: Joi.string().allow('', null).optional(),
    classId: Joi.string().hex().length(24).optional(),
    studentId: Joi.string().hex().length(24).optional(),
    teacherId: Joi.string().hex().length(24).optional(),
    branchId: Joi.string().hex().length(24).optional(),
    status: Joi.string().valid('present', 'absent', 'late', 'excused', 'online_auto_marked').optional(),
    session: Joi.string().valid('morning', 'afternoon', 'evening', 'online').optional(),
    date: Joi.date().optional(),
    from: Joi.date().optional(),
    to: Joi.date().optional()
  })
});

const policySchema = Joi.object({
  body: Joi.object({
    branchId: Joi.string().hex().length(24).allow(null).optional(),
    name: Joi.string().required(),
    duplicateWindowMinutes: Joi.number().min(1).optional(),
    absenceSuspensionThreshold: Joi.number().min(1).optional(),
    onlineAutoMarkEnabled: Joi.boolean().optional(),
    salaryDeductionPerAbsence: Joi.number().min(0).optional(),
    reminderLeadDays: Joi.number().min(1).optional(),
    active: Joi.boolean().optional()
  })
});

router.use(authenticate);

function serializeAttendance(record: any) {
  return {
    ...record,
    studentName: [record?.studentId?.firstName, record?.studentId?.lastName].filter(Boolean).join(' ').trim(),
    className: record?.classId?.className ?? record?.classId?.name ?? '',
    teacherName: record?.teacherId?.name ?? '',
    source: record?.source ?? 'web'
  };
}

function buildDayRange(value: string | Date) {
  const start = new Date(value);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setHours(23, 59, 59, 999);
  return { $gte: start, $lte: end };
}

function idsEqual(left: unknown, right: unknown) {
  return String(left ?? '') === String(right ?? '');
}

async function getScopedStudentIds(req: Request) {
  const role = req.user?.canonicalRole;
  if (!role || !req.user?.userId) {
    return null;
  }

  if (role === 'teacher') {
    const students = await Student.find({ teacherId: req.user.userId, isDeleted: false }).select('_id').lean();
    return students.map((student: any) => student._id);
  }

  if (role === 'student') {
    const currentUser = await User.findById(req.user.userId).select('studentId').lean<Record<string, any>>();
    if (!currentUser?.studentId) {
      return [];
    }
    const student = await Student.findOne({ studentId: currentUser.studentId, isDeleted: false }).select('_id').lean<Record<string, any>>();
    return student ? [student._id] : [];
  }

  if (role === 'parent') {
    const currentUser = await User.findById(req.user.userId).select('familyId parentProfileId').lean<Record<string, any>>();
    const filter: Record<string, unknown> = { isDeleted: false };
    if (currentUser?.familyId) {
      filter.familyId = currentUser.familyId;
    } else if (currentUser?.parentProfileId) {
      filter.parentProfileId = currentUser.parentProfileId;
    } else {
      return [];
    }

    const students = await Student.find(filter).select('_id').lean();
    return students.map((student: any) => student._id);
  }

  return null;
}

async function buildAttendanceFilter(req: Request) {
  const filter: Record<string, unknown> = { isDeleted: false };
  const role = req.user?.canonicalRole;

  if (req.query.classId) {
    filter.classId = req.query.classId;
  }

  if (req.query.status) {
    filter.status = req.query.status;
  }

  if (req.query.session) {
    filter.session = req.query.session;
  }

  if (req.query.teacherId) {
    filter.teacherId = req.query.teacherId;
  }

  if (req.query.branchId) {
    filter.branchId = req.query.branchId;
  } else if (['admin', 'branch_manager'].includes(role ?? '') && req.user?.branchId) {
    filter.branchId = req.user.branchId;
  }

  if (req.query.date) {
    filter.attendanceDate = buildDayRange(String(req.query.date));
  } else if (req.query.from || req.query.to) {
    const range: Record<string, Date> = {};
    if (req.query.from) {
      const from = new Date(String(req.query.from));
      from.setHours(0, 0, 0, 0);
      range.$gte = from;
    }
    if (req.query.to) {
      const to = new Date(String(req.query.to));
      to.setHours(23, 59, 59, 999);
      range.$lte = to;
    }
    filter.attendanceDate = range;
  }

  const scopedStudentIds = await getScopedStudentIds(req);
  if (Array.isArray(scopedStudentIds)) {
    if (req.query.studentId) {
      const requestedStudentId = String(req.query.studentId);
      const matchesScope = scopedStudentIds.some((studentId: any) => String(studentId) === requestedStudentId);
      filter.studentId = matchesScope ? requestedStudentId : { $in: [] };
    } else {
      filter.studentId = { $in: scopedStudentIds };
    }
  } else if (req.query.studentId) {
    filter.studentId = req.query.studentId;
  }

  if (role === 'teacher' && req.user?.userId) {
    filter.teacherId = req.user.userId;
  }

  return filter;
}

router.get('/options', authorize(['super_admin', 'admin', 'branch_manager', 'teacher', 'student', 'parent', 'owner']), async (req, res, next) => {
  try {
    const role = req.user?.canonicalRole;
    const scopedStudentIds = await getScopedStudentIds(req);
    const studentFilter: Record<string, unknown> = { isDeleted: false };
    const classFilter: Record<string, unknown> = { isDeleted: false };

    if (Array.isArray(scopedStudentIds)) {
      studentFilter._id = { $in: scopedStudentIds };
    } else if (role === 'teacher' && req.user?.userId) {
      studentFilter.teacherId = req.user.userId;
    } else if (['admin', 'branch_manager'].includes(role ?? '') && req.user?.branchId) {
      studentFilter.branchId = req.user.branchId;
      classFilter.branchId = req.user.branchId;
    }

    const students = await Student.find(studentFilter)
      .select('firstName lastName classId')
      .populate('classId', 'className')
      .sort({ firstName: 1, lastName: 1 })
      .lean();

    const classIds = Array.from(new Set(students.map((student: any) => student.classId?._id?.toString?.() ?? student.classId?.toString?.()).filter(Boolean)));
    if (classIds.length) {
      classFilter._id = { $in: classIds };
    } else if (Array.isArray(scopedStudentIds)) {
      classFilter._id = { $in: [] };
    }

    const classes = await ClassModel.find(classFilter).select('className').sort({ className: 1 }).lean();

    res.json(createResponse({
      students: students.map((student: any) => ({
        _id: student._id,
        name: [student.firstName, student.lastName].filter(Boolean).join(' ').trim(),
        classId: student.classId?._id ?? student.classId ?? null,
        className: student.classId?.className ?? ''
      })),
      classes: classes.map((klass: any) => ({
        _id: klass._id,
        className: klass.className
      }))
    }));
  } catch (error) {
    next(error);
  }
});

router.get('/summary', authorize(['super_admin', 'admin', 'branch_manager', 'teacher', 'student', 'parent', 'owner']), validate(attendanceQuerySchema), async (req, res, next) => {
  try {
    const filter = await buildAttendanceFilter(req);
    const [statusSummary, sessionSummary, studentIds, classIds, recentTrend] = await Promise.all([
      Attendance.aggregate([
        { $match: filter },
        { $group: { _id: '$status', total: { $sum: 1 } } }
      ]),
      Attendance.aggregate([
        { $match: filter },
        { $group: { _id: '$session', total: { $sum: 1 } } }
      ]),
      Attendance.distinct('studentId', filter),
      Attendance.distinct('classId', filter),
      Attendance.aggregate([
        { $match: filter },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$attendanceDate' } },
            present: {
              $sum: {
                $cond: [{ $in: ['$status', ['present', 'online_auto_marked']] }, 1, 0]
              }
            },
            absent: {
              $sum: {
                $cond: [{ $eq: ['$status', 'absent'] }, 1, 0]
              }
            },
            late: {
              $sum: {
                $cond: [{ $eq: ['$status', 'late'] }, 1, 0]
              }
            }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    const statusTotals = statusSummary.reduce<Record<string, number>>((acc, item: any) => {
      acc[item._id] = Number(item.total ?? 0);
      return acc;
    }, {});

    res.json(createResponse({
      totalRecords: statusSummary.reduce((sum: number, item: any) => sum + Number(item.total ?? 0), 0),
      present: (statusTotals.present ?? 0) + (statusTotals.online_auto_marked ?? 0),
      absent: statusTotals.absent ?? 0,
      late: statusTotals.late ?? 0,
      excused: statusTotals.excused ?? 0,
      onlineAutoMarked: statusTotals.online_auto_marked ?? 0,
      studentCount: studentIds.length,
      classCount: classIds.length,
      byStatus: statusSummary.map((item: any) => ({ status: item._id, total: item.total })),
      bySession: sessionSummary.map((item: any) => ({ session: item._id, total: item.total })),
      recentTrend: recentTrend.map((item: any) => ({
        date: item._id,
        present: item.present ?? 0,
        absent: item.absent ?? 0,
        late: item.late ?? 0
      }))
    }));
  } catch (error) {
    next(error);
  }
});

router.get('/', authorize(['super_admin', 'admin', 'branch_manager', 'teacher', 'student', 'parent', 'owner']), validate(attendanceQuerySchema), async (req, res, next) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const filter = await buildAttendanceFilter(req);

    const [records, total] = await Promise.all([
      Attendance.find(filter)
        .populate('studentId', 'firstName lastName studentId')
        .populate('classId', 'className classCode')
        .populate('teacherId', 'name email')
        .lean()
        .sort({ attendanceDate: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Attendance.countDocuments(filter)
    ]);

    res.json(createResponse(records.map(serializeAttendance), '', { page, limit, total }));
  } catch (error) {
    next(error);
  }
});

router.post('/', authorize(['super_admin', 'admin', 'branch_manager', 'teacher', 'system_automation']), validate(attendanceSchema), async (req, res, next) => {
  try {
    const student = await Student.findById(req.body.studentId);
    if (!student) {
      return res.status(404).json(createError('Student not found'));
    }

    const assignedClassId = student.classId?.toString?.() ?? '';
    if (!idsEqual(assignedClassId, req.body.classId)) {
      return res.status(400).json(createError('Selected class does not match the student assignment'));
    }

    if (['admin', 'branch_manager'].includes(req.user?.canonicalRole ?? '') && req.user?.branchId && String(student.branchId ?? '') !== String(req.user.branchId)) {
      return res.status(403).json(createError('Attendance can only be recorded for students in your branch'));
    }

    if (req.user?.canonicalRole === 'teacher') {
      if (String(student.teacherId) !== String(req.user.userId)) {
        return res.status(403).json(createError('Teachers can only record attendance for their assigned students'));
      }

      if (req.body.teacherId && String(req.body.teacherId) !== String(req.user.userId)) {
        return res.status(403).json(createError('Teachers cannot record attendance on behalf of another teacher'));
      }
    }

    await businessRuleService.assertStudentGenderMatchesClass(student.gender, req.body.classId);
    await businessRuleService.assertTeacherGenderMatchesClass(req.body.teacherId ?? student.teacherId.toString(), req.body.classId);

    const attendanceDate = new Date(req.body.attendanceDate);
    const existing = await Attendance.findOne({
      studentId: req.body.studentId,
      attendanceDate,
      session: req.body.session,
      isDeleted: false
    }).lean();

    if (existing) {
      return res.status(409).json(createError('Attendance already recorded for this student, date, and session'));
    }

    const policy: any = await businessRuleService.getAttendancePolicy(req.body.branchId ?? student.branchId?.toString?.() ?? null);
    const attendance = await Attendance.create({
      ...req.body,
      teacherId: req.body.teacherId ?? student.teacherId,
      branchId: req.body.branchId ?? student.branchId ?? null,
      policyId: (policy as any)?._id ?? null,
      attendanceDate,
      markedBy: req.user?.userId ?? null
    });

    if (req.body.status === 'absent' && policy?.absenceSuspensionThreshold) {
      const absenceCount = await Attendance.countDocuments({
        studentId: req.body.studentId,
        status: 'absent',
        isDeleted: false
      });

      if (absenceCount >= policy.absenceSuspensionThreshold && student.status !== 'suspended') {
        await Student.updateOne(
          { _id: student._id },
          { $set: { status: 'suspended' } }
        );

        await Notification.create({
          branchId: student.branchId ?? null,
          title: 'Student suspended automatically',
          description: `Attendance policy triggered automatic suspension for ${student.firstName} ${student.lastName}.`,
          message: `Attendance policy triggered automatic suspension for ${student.firstName} ${student.lastName}.`,
          recipientRoles: ['super_admin', 'admin', 'owner', 'branch_manager'],
          recipientIds: [],
          publishStatus: 'published',
          publishDate: new Date()
        });
      }
    }

    const savedAttendance = await Attendance.findById(attendance._id)
      .populate('studentId', 'firstName lastName studentId')
      .populate('classId', 'className classCode')
      .populate('teacherId', 'name email')
      .lean();

    res.status(201).json(createResponse(serializeAttendance(savedAttendance), 'Attendance recorded successfully'));
  } catch (error) {
    next(error);
  }
});

router.get('/policies', authorize(['super_admin', 'admin', 'branch_manager', 'owner']), async (_req, res, next) => {
  try {
    const policies = await AttendancePolicy.find({ isDeleted: false }).lean();
    res.json(createResponse(policies));
  } catch (error) {
    next(error);
  }
});

router.post('/policies', authorize(['super_admin', 'admin', 'owner']), validate(policySchema), async (req, res, next) => {
  try {
    const policy = await AttendancePolicy.create(req.body);
    res.status(201).json(createResponse(policy, 'Attendance policy created successfully'));
  } catch (error) {
    next(error);
  }
});

router.put('/policies/:id', authorize(['super_admin', 'admin', 'owner']), validate(policySchema), async (req, res, next) => {
  try {
    const policy = await AttendancePolicy.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).lean();
    if (!policy) {
      return res.status(404).json(createError('Attendance policy not found'));
    }
    res.json(createResponse(policy, 'Attendance policy updated successfully'));
  } catch (error) {
    next(error);
  }
});

export const attendanceRouter = router;
