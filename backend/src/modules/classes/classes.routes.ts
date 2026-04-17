import { Router } from 'express';
import mongoose from 'mongoose';
import Joi from 'joi';
import { ClassModel } from '../../models/Class';
import { Student } from '../../models/Student';
import { User } from '../../models/User';
import { authenticate, authorize } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import { createResponse, createError } from '../../helpers/response';
import { paginationSchema } from '../../validators/pagination';
import { ClassService } from '../../services/classService';

const router = Router();
const classService = new ClassService();

const classBodySchema = Joi.object({
  branchId: Joi.string().hex().length(24).allow('', null).optional(),
  className: Joi.string().trim().required(),
  classCode: Joi.string().trim().optional(),
  genderRestriction: Joi.string().valid('male', 'female', 'coed').optional(),
  feeAmount: Joi.number().min(0).default(0),
  subjects: Joi.array().items(Joi.string().trim().required()).min(1).required(),
  assignedTeachers: Joi.array().items(Joi.string().hex().length(24)).optional(),
  capacity: Joi.number().min(10).max(120).default(30),
  examSchedule: Joi.array().items(Joi.date().iso()).optional(),
  active: Joi.boolean().optional()
});

const createSchema = Joi.object({
  body: classBodySchema
});

const updateSchema = Joi.object({
  params: Joi.object({
    id: Joi.string().hex().length(24).required()
  }),
  body: Joi.object({
    branchId: Joi.string().hex().length(24).allow('', null).optional(),
    className: Joi.string().trim().optional(),
    classCode: Joi.string().trim().optional(),
    genderRestriction: Joi.string().valid('male', 'female', 'coed').optional(),
    feeAmount: Joi.number().min(0).optional(),
    subjects: Joi.array().items(Joi.string().trim().required()).min(1).optional(),
    assignedTeachers: Joi.array().items(Joi.string().hex().length(24)).optional(),
    capacity: Joi.number().min(10).max(120).optional(),
    examSchedule: Joi.array().items(Joi.date().iso()).optional(),
    active: Joi.boolean().optional()
  }).min(1)
});

const idParamsSchema = Joi.object({
  params: Joi.object({
    id: Joi.string().hex().length(24).required()
  })
});

router.use(authenticate);

function serializeClass(klass: any, studentCountMap = new Map<string, number>()) {
  const assignedTeachers = Array.isArray(klass?.assignedTeachers) ? klass.assignedTeachers : [];
  const assignedSubjects = Array.isArray(klass?.assignedSubjects) ? klass.assignedSubjects : [];

  return {
    ...klass,
    name: klass?.className ?? klass?.name ?? '',
    assignedTeachers: assignedTeachers.map((teacher: any) => teacher?._id ?? teacher).filter(Boolean),
    assignedTeacherNames: assignedTeachers.map((teacher: any) => teacher?.name ?? teacher).filter(Boolean),
    assignedTeacherCount: assignedTeachers.length,
    assignedSubjects: assignedSubjects.map((subject: any) => subject?._id ?? subject).filter(Boolean),
    subjects: assignedSubjects.map((subject: any) => subject?.title ?? subject).filter(Boolean),
    assignedSubjectCount: assignedSubjects.length,
    studentCount: studentCountMap.get(String(klass?._id ?? '')) ?? Number(klass?.studentCount ?? 0),
    feeAmount: Number(klass?.feeAmount ?? 0)
  };
}

router.post('/', authorize(['super_admin', 'admin', 'branch_manager']), validate(createSchema), async (req, res, next) => {
  try {
    const klass = await classService.createClass(req.body, req.user?.userId ?? '');
    const savedClass = await ClassModel.findById(klass._id)
      .populate('assignedTeachers', 'name email')
      .populate('assignedSubjects', 'title code')
      .lean();

    res.status(201).json(createResponse(serializeClass(savedClass), 'Class created successfully'));
  } catch (error: any) {
    if (error instanceof mongoose.Error.ValidationError) {
      return res.status(400).json(createError(error.message));
    }

    const message = String(error?.message || 'Unable to create class');
    if (/already exists/i.test(message)) {
      return res.status(400).json(createError(message));
    }

    next(error);
  }
});

router.get('/', authorize(['super_admin', 'admin', 'branch_manager', 'teacher', 'student', 'family_student', 'parent', 'owner']), validate(paginationSchema), async (req, res, next) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const search = String(req.query.search || '').trim();
    const filter: any = { isDeleted: false };
    if (search) filter.className = { $regex: search, $options: 'i' };

    if (req.user?.canonicalRole === 'teacher') {
      filter.assignedTeachers = req.user.userId;
    }

    if (req.user?.canonicalRole === 'student') {
      const currentUser = await User.findById(req.user.userId).select('classId').lean();
      filter._id = (currentUser as any)?.classId ?? null;
    }

    if (req.user?.canonicalRole === 'parent' || req.user?.role === 'family_student') {
      const currentUser = await User.findById(req.user.userId).lean();
      const children = (currentUser as any)?.familyId
        ? await User.find({ role: { $in: ['student'] }, familyId: (currentUser as any).familyId, isDeleted: false }).select('classId').lean()
        : [];
      const classIds = children.map((child: any) => child.classId).filter(Boolean);
      filter._id = { $in: classIds };
    }

    const [classes, total] = await Promise.all([
      ClassModel.find(filter)
        .populate('assignedTeachers', 'name email')
        .populate('assignedSubjects', 'title code')
        .lean()
        .skip((page - 1) * limit)
        .limit(limit),
      ClassModel.countDocuments(filter)
    ]);

    const classIds = classes.map((klass: any) => klass._id).filter(Boolean);
    const studentCounts = await Student.aggregate([
      { $match: { classId: { $in: classIds }, isDeleted: false } },
      { $group: { _id: '$classId', count: { $sum: 1 } } }
    ]);
    const studentCountMap = new Map(studentCounts.map((item: any) => [String(item._id), Number(item.count)]));

    res.json(createResponse(classes.map((klass: any) => serializeClass(klass, studentCountMap)), '', { page, limit, total }));
  } catch (error) {
    next(error);
  }
});

router.get('/:id', authorize(['super_admin', 'admin', 'branch_manager', 'teacher', 'student', 'family_student', 'parent', 'owner']), validate(idParamsSchema), async (req, res, next) => {
  try {
    const klass = (await ClassModel.findOne({ _id: req.params.id, isDeleted: false })
      .populate('assignedTeachers', 'name email')
      .populate('assignedSubjects', 'title code')
      .lean()) as any;

    if (!klass) return res.status(404).json(createError('Class not found'));

    if (req.user?.canonicalRole === 'teacher') {
      const teacherIds = Array.isArray(klass.assignedTeachers) ? klass.assignedTeachers.map((item: any) => item._id?.toString?.() ?? String(item)) : [];
      if (!teacherIds.includes(req.user.userId)) {
        return res.status(403).json(createError('Access denied'));
      }
    }

    if (req.user?.canonicalRole === 'student') {
      const currentUser = await User.findById(req.user.userId).select('classId').lean();
      if (!(currentUser as any)?.classId?.toString?.() || String((klass as any)._id) !== String((currentUser as any).classId)) {
        return res.status(403).json(createError('Access denied'));
      }
    }

    if (req.user?.canonicalRole === 'parent' || req.user?.role === 'family_student') {
      const currentUser = await User.findById(req.user.userId).lean();
      const children = (currentUser as any)?.familyId
        ? await User.find({ role: 'student', familyId: (currentUser as any).familyId, isDeleted: false }).select('classId').lean()
        : [];
      const classIds = children.map((child: any) => child.classId?.toString?.()).filter(Boolean);
      if (!classIds.includes(String((klass as any)._id))) {
        return res.status(403).json(createError('Access denied'));
      }
    }

    const studentCount = await Student.countDocuments({ classId: klass._id, isDeleted: false });
    res.json(createResponse(serializeClass(klass, new Map([[String(klass._id), studentCount]]))));
  } catch (error) {
    next(error);
  }
});

const updateClassHandler = async (req: any, res: any, next: any) => {
  try {
    const klass = await classService.updateClass(req.params.id, req.body, req.user?.userId ?? '');
    const savedClass = await ClassModel.findById(klass._id)
      .populate('assignedTeachers', 'name email')
      .populate('assignedSubjects', 'title code')
      .lean();
    const studentCount = await Student.countDocuments({ classId: klass._id, isDeleted: false });

    res.json(createResponse(serializeClass(savedClass, new Map([[String(klass._id), studentCount]])), 'Class updated successfully'));
  } catch (error: any) {
    if (error instanceof mongoose.Error.ValidationError) {
      return res.status(400).json(createError(error.message));
    }

    const message = String(error?.message || 'Unable to update class');
    if (/not found/i.test(message)) {
      return res.status(404).json(createError(message));
    }
    if (/already exists/i.test(message) || /at least one subject/i.test(message) || /invalid/i.test(message)) {
      return res.status(400).json(createError(message));
    }

    next(error);
  }
};

router.put('/:id', authorize(['super_admin', 'admin', 'branch_manager']), validate(updateSchema), updateClassHandler);
router.patch('/:id', authorize(['super_admin', 'admin', 'branch_manager']), validate(updateSchema), updateClassHandler);

router.delete('/:id', authorize(['super_admin', 'admin']), validate(idParamsSchema), async (req, res, next) => {
  try {
    await classService.deleteClass(req.params.id, req.user?.userId ?? '');
    res.json(createResponse({}, 'Class deleted successfully'));
  } catch (error: any) {
    const message = String(error?.message || 'Unable to delete class');
    if (/not found/i.test(message)) {
      return res.status(404).json(createError(message));
    }
    if (/active students/i.test(message)) {
      return res.status(400).json(createError(message));
    }

    next(error);
  }
});

export const classRouter = router;
