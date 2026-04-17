import { Router } from 'express';
import Joi from 'joi';
import { Result } from '../../models/Result';
import { Student } from '../../models/Student';
import { User } from '../../models/User';
import { Exam } from '../../models/Exam';
import { authenticate, authorize } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import { createResponse, createError } from '../../helpers/response';
import { paginationSchema } from '../../validators/pagination';

const router = Router();

const resultSchema = Joi.object({
  body: Joi.object({
    student: Joi.string().hex().length(24).required(),
    exam: Joi.string().hex().length(24).required(),
    score: Joi.number().min(0).required(),
    remarks: Joi.string().allow('', null).optional(),
    gradedBy: Joi.string().hex().length(24).optional()
  })
});

function deriveGrade(score: number, totalMarks: number) {
  const percentage = totalMarks > 0 ? (score / totalMarks) * 100 : 0;
  if (percentage >= 90) return 'A';
  if (percentage >= 80) return 'B';
  if (percentage >= 70) return 'C';
  if (percentage >= 60) return 'D';
  if (percentage >= 40) return 'E';
  return 'F';
}

async function resolveStudentContext(studentIdentifier: string) {
  const directUser = await User.findOne({ _id: studentIdentifier, role: 'student', isDeleted: false }).lean<any>();
  if (directUser) {
    const studentRecord = directUser.studentId
      ? await Student.findOne({ studentId: directUser.studentId, isDeleted: false }).lean<any>()
      : null;

    return {
      studentUser: directUser,
      studentRecord
    };
  }

  const studentRecord = await Student.findOne({ _id: studentIdentifier, isDeleted: false }).lean<any>();
  if (!studentRecord) {
    return null;
  }

  const linkedUser = await User.findOne({ studentId: studentRecord.studentId, role: 'student', isDeleted: false }).lean<any>();
  if (!linkedUser) {
    return null;
  }

  return {
    studentUser: linkedUser,
    studentRecord
  };
}

function serializeResult(result: any) {
  const studentName =
    result?.student?.name ??
    [result?.student?.firstName, result?.student?.lastName].filter(Boolean).join(' ').trim();

  return {
    ...result,
    studentName: studentName || result?.student?.email || '',
    examName: result?.exam?.title ?? '',
    subjectName: result?.exam?.subject?.title ?? '',
    className: result?.exam?.class?.className ?? result?.exam?.class?.name ?? '',
    teacherName: result?.exam?.teacherId?.name ?? result?.gradedBy?.name ?? '',
    totalMarks: result?.exam?.totalMarks ?? null
  };
}

router.use(authenticate);

router.post('/', authorize(['super_admin', 'admin', 'branch_manager', 'teacher']), validate(resultSchema), async (req, res, next) => {
  try {
    const [studentContext, exam] = await Promise.all([
      resolveStudentContext(req.body.student),
      Exam.findById(req.body.exam).lean<any>()
    ]);

    const studentUser = studentContext?.studentUser ?? null;
    const studentRecord = studentContext?.studentRecord ?? null;

    if (!studentUser || Array.isArray(studentUser)) {
      return res.status(404).json(createError('Student not found'));
    }

    if (!exam || Array.isArray(exam)) {
      return res.status(404).json(createError('Exam not found'));
    }

    const studentClassId = studentRecord?.classId ?? studentUser.classId ?? null;
    const studentSubjectId = studentRecord?.subjectId ?? studentUser.subjectId ?? null;

    if (studentClassId && exam.class && String(studentClassId) !== String(exam.class)) {
      return res.status(400).json(createError('Student is not assigned to the selected exam class'));
    }

    if (studentSubjectId && exam.subject && String(studentSubjectId) !== String(exam.subject)) {
      return res.status(400).json(createError('Student is not assigned to the selected exam subject'));
    }

    const grade = deriveGrade(Number(req.body.score), Number(exam.totalMarks || 100));
    const result = await Result.create({
      ...req.body,
      student: studentUser._id,
      grade,
      gradedBy: req.body.gradedBy ?? req.user?.userId ?? null
    });

    const populated = await Result.findById(result._id)
      .populate('student', 'name firstName lastName email assignedTeacherId familyId')
      .populate({
        path: 'exam',
        select: 'title date totalMarks subject class teacherId',
        populate: [
          { path: 'subject', select: 'title code' },
          { path: 'class', select: 'className name classCode' },
          { path: 'teacherId', select: 'name email' }
        ]
      })
      .populate('gradedBy', 'name email')
      .lean();

    res.status(201).json(createResponse(serializeResult(populated), 'Result created'));
  } catch (error) {
    next(error);
  }
});

router.get('/', authorize(['super_admin', 'admin', 'branch_manager', 'teacher', 'student', 'family_student', 'parent', 'owner']), validate(paginationSchema), async (req, res, next) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const search = String(req.query.search || '').trim();
    const filter: any = {};

    if (search) {
      filter.score = { $gte: Number(search) || 0 };
    }

    if (req.user?.canonicalRole === 'student') {
      filter.student = req.user.userId;
    }

    if (req.user?.canonicalRole === 'parent' || req.user?.role === 'family_student') {
      const familyUser = await User.findById(req.user.userId).lean();
      const children = (familyUser as any)?.familyId
        ? await User.find({ role: 'student', familyId: (familyUser as any).familyId }).select('_id').lean()
        : [];
      filter.student = { $in: children.map((child: any) => child._id) };
    }

    if (req.user?.canonicalRole === 'teacher') {
      const students = await User.find({ role: 'student', assignedTeacherId: req.user.userId }).select('_id').lean();
      filter.student = { $in: students.map((student: any) => student._id) };
    }

    const [results, total] = await Promise.all([
      Result.find(filter)
        .populate('student', 'name firstName lastName email assignedTeacherId familyId')
        .populate({
          path: 'exam',
          select: 'title date totalMarks subject class teacherId',
          populate: [
            { path: 'subject', select: 'title code' },
            { path: 'class', select: 'className name classCode' },
            { path: 'teacherId', select: 'name email' }
          ]
        })
        .populate('gradedBy', 'name email')
        .lean()
        .skip((page - 1) * limit)
        .limit(limit),
      Result.countDocuments(filter)
    ]);

    res.json(createResponse(results.map(serializeResult), '', { page, limit, total }));
  } catch (error) {
    next(error);
  }
});

router.get('/:id', authorize(['super_admin', 'admin', 'branch_manager', 'teacher', 'student', 'family_student', 'parent', 'owner']), async (req, res, next) => {
  try {
    const result = await Result.findById(req.params.id)
      .populate('student', 'name firstName lastName email familyId assignedTeacherId')
      .populate({
        path: 'exam',
        select: 'title date totalMarks subject class teacherId',
        populate: [
          { path: 'subject', select: 'title code' },
          { path: 'class', select: 'className name classCode' },
          { path: 'teacherId', select: 'name email' }
        ]
      })
      .populate('gradedBy', 'name email')
      .lean();

    if (!result) return res.status(404).json(createError('Result not found'));

    if (req.user?.canonicalRole === 'student' && (result as any).student._id.toString() !== req.user.userId) {
      return res.status(403).json(createError('Access denied'));
    }

    if (req.user?.canonicalRole === 'parent' || req.user?.role === 'family_student') {
      const familyUser = await User.findById(req.user.userId).lean();
      if (!(familyUser as any)?.familyId || (result as any).student.familyId?.toString() !== (familyUser as any).familyId.toString()) {
        return res.status(403).json(createError('Access denied'));
      }
    }

    if (req.user?.canonicalRole === 'teacher') {
      if ((result as any).student.assignedTeacherId?.toString() !== req.user.userId) {
        return res.status(403).json(createError('Access denied'));
      }
    }

    res.json(createResponse(serializeResult(result)));
  } catch (error) {
    next(error);
  }
});

export const resultRouter = router;
