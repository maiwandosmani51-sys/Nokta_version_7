import { Router } from 'express';
import Joi from 'joi';
import { ClassModel } from '../../models/Class';
import { Exam } from '../../models/Exam';
import { Subject } from '../../models/Subject';
import { User } from '../../models/User';
import { Student } from '../../models/Student';
import { authenticate, authorize } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import { createResponse, createError } from '../../helpers/response';
import { paginationSchema } from '../../validators/pagination';

const router = Router();

const subjectCreateSchema = Joi.object({
  body: Joi.object({
    title: Joi.string().trim().required(),
    code: Joi.string().trim().required(),
    classId: Joi.string().hex().length(24).required(),
    feeAmount: Joi.number().min(0).default(0),
    teacher: Joi.string().hex().length(24).allow('', null).optional(),
    branchId: Joi.string().hex().length(24).allow('', null).optional(),
    description: Joi.string().allow('', null).optional(),
    activeStatus: Joi.boolean().optional()
  })
});

const subjectUpdateSchema = Joi.object({
  params: Joi.object({
    id: Joi.string().hex().length(24).required()
  }),
  body: Joi.object({
    title: Joi.string().trim().optional(),
    code: Joi.string().trim().optional(),
    classId: Joi.string().hex().length(24).optional(),
    feeAmount: Joi.number().min(0).optional(),
    teacher: Joi.string().hex().length(24).allow('', null).optional(),
    branchId: Joi.string().hex().length(24).allow('', null).optional(),
    description: Joi.string().allow('', null).optional(),
    activeStatus: Joi.boolean().optional()
  }).min(1)
});

const idParamsSchema = Joi.object({
  params: Joi.object({
    id: Joi.string().hex().length(24).required()
  })
});

router.use(authenticate);

function serializeSubject(subject: any) {
  const classRef = subject?.classId;
  const teacherRef = subject?.teacher;

  return {
    ...subject,
    classId: classRef?._id ?? classRef ?? null,
    className: classRef?.className ?? classRef?.name ?? '',
    teacher: teacherRef?._id ?? teacherRef ?? null,
    teacherId: teacherRef?._id ?? teacherRef ?? null,
    teacherName: teacherRef?.name ?? '',
    feeAmount: Number(subject?.feeAmount ?? 0)
  };
}

async function validateSubjectRelations(classId: string, teacherId?: string | null) {
  const klass = await ClassModel.findOne({ _id: classId, isDeleted: false }).lean<any>();
  if (!klass) {
    throw new Error('Selected class is invalid');
  }

  let teacher: any = null;
  if (teacherId) {
    teacher = await User.findOne({ _id: teacherId, role: 'teacher', isDeleted: false }).lean<any>();
    if (!teacher) {
      throw new Error('Selected teacher is invalid');
    }
  }

  return { klass, teacher };
}

async function syncTeacherAssignments(subjectId: string, classId: string, nextTeacherId?: string | null, previousTeacherId?: string | null) {
  if (previousTeacherId && String(previousTeacherId) !== String(nextTeacherId)) {
    await User.updateOne(
      { _id: previousTeacherId, role: 'teacher' },
      { $pull: { assignedSubjects: subjectId } }
    );
  }

  if (nextTeacherId) {
    await User.updateOne(
      { _id: nextTeacherId, role: 'teacher' },
      { $addToSet: { assignedSubjects: subjectId, assignedClasses: classId } }
    );
  }
}

async function syncClassAssignments(subjectId: string, nextClassId: string, previousClassId?: string | null) {
  if (previousClassId && String(previousClassId) !== String(nextClassId)) {
    await ClassModel.updateOne(
      { _id: previousClassId },
      { $pull: { assignedSubjects: subjectId } }
    );
  }

  await ClassModel.updateOne(
    { _id: nextClassId },
    { $addToSet: { assignedSubjects: subjectId } }
  );
}

router.get('/', authorize(['super_admin', 'admin', 'branch_manager', 'teacher', 'student', 'family_student', 'parent', 'owner']), validate(paginationSchema), async (req, res, next) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const search = String(req.query.search || '').trim();
    const filter: any = { isDeleted: false };

    if (search) filter.title = { $regex: search, $options: 'i' };

    const [subjects, total] = await Promise.all([
      Subject.find(filter)
        .populate('teacher', 'name email')
        .populate('classId', 'className name classCode')
        .lean()
        .skip((page - 1) * limit)
        .limit(limit),
      Subject.countDocuments(filter)
    ]);

    res.json(createResponse(subjects.map(serializeSubject), '', { page, limit, total }));
  } catch (error) {
    next(error);
  }
});

router.post('/', authorize(['super_admin', 'admin', 'branch_manager']), validate(subjectCreateSchema), async (req, res, next) => {
  try {
    const { klass, teacher } = await validateSubjectRelations(req.body.classId, req.body.teacher || null);

    const duplicate = await Subject.findOne({
      $or: [
        { code: req.body.code.trim() },
        { title: req.body.title.trim(), classId: req.body.classId, isDeleted: false }
      ]
    }).lean();

    if (duplicate) {
      return res.status(409).json(createError('Subject already exists'));
    }

    const subject = await Subject.create({
      ...req.body,
      branchId: req.body.branchId ?? klass.branchId ?? teacher?.branchId ?? null,
      title: req.body.title.trim(),
      code: req.body.code.trim(),
      description: req.body.description ?? '',
      teacher: req.body.teacher || null,
      activeStatus: req.body.activeStatus ?? true
    });

    await Promise.all([
      syncTeacherAssignments(String(subject._id), String(req.body.classId), req.body.teacher || null),
      syncClassAssignments(String(subject._id), String(req.body.classId))
    ]);

    const savedSubject = await Subject.findById(subject._id)
      .populate('teacher', 'name email')
      .populate('classId', 'className name classCode')
      .lean();

    res.status(201).json(createResponse(serializeSubject(savedSubject), 'Subject created successfully'));
  } catch (error: any) {
    if (/invalid/i.test(String(error?.message || ''))) {
      return res.status(400).json(createError(String(error.message)));
    }
    next(error);
  }
});

router.get('/:id', authorize(['super_admin', 'admin', 'branch_manager', 'teacher', 'student', 'family_student', 'parent', 'owner']), validate(idParamsSchema), async (req, res, next) => {
  try {
    const subject = await Subject.findOne({ _id: req.params.id, isDeleted: false })
      .populate('teacher', 'name email')
      .populate('classId', 'className name classCode')
      .lean();

    if (!subject) return res.status(404).json(createError('Subject not found'));
    res.json(createResponse(serializeSubject(subject)));
  } catch (error) {
    next(error);
  }
});

const updateSubjectHandler = async (req: any, res: any, next: any) => {
  try {
    const existingSubject = await Subject.findOne({ _id: req.params.id, isDeleted: false }).lean<any>();
    if (!existingSubject) {
      return res.status(404).json(createError('Subject not found'));
    }

    const nextClassId = req.body.classId ?? String(existingSubject.classId);
    const nextTeacherId = req.body.teacher === '' ? null : (req.body.teacher ?? (existingSubject.teacher ? String(existingSubject.teacher) : null));
    const nextCode = req.body.code ? String(req.body.code).trim() : existingSubject.code;
    const nextTitle = req.body.title ? String(req.body.title).trim() : existingSubject.title;

    await validateSubjectRelations(nextClassId, nextTeacherId);

    const duplicate = await Subject.findOne({
      _id: { $ne: req.params.id },
      isDeleted: false,
      $or: [
        { code: nextCode },
        { title: nextTitle, classId: nextClassId }
      ]
    }).lean();

    if (duplicate) {
      return res.status(409).json(createError('Subject already exists'));
    }

    const subject = await Subject.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        title: nextTitle,
        code: nextCode,
        classId: nextClassId,
        teacher: nextTeacherId,
        description: req.body.description ?? existingSubject.description ?? '',
        branchId: req.body.branchId ?? existingSubject.branchId ?? null
      },
      { new: true, runValidators: true }
    )
      .populate('teacher', 'name email')
      .populate('classId', 'className name classCode')
      .lean();

    await Promise.all([
      syncTeacherAssignments(String(req.params.id), String(nextClassId), nextTeacherId, existingSubject.teacher ? String(existingSubject.teacher) : null),
      syncClassAssignments(String(req.params.id), String(nextClassId), existingSubject.classId ? String(existingSubject.classId) : null)
    ]);

    res.json(createResponse(serializeSubject(subject), 'Subject updated successfully'));
  } catch (error) {
    next(error);
  }
};

router.put('/:id', authorize(['super_admin', 'admin', 'branch_manager']), validate(subjectUpdateSchema), updateSubjectHandler);
router.patch('/:id', authorize(['super_admin', 'admin', 'branch_manager']), validate(subjectUpdateSchema), updateSubjectHandler);

router.delete('/:id', authorize(['super_admin', 'admin']), validate(idParamsSchema), async (req, res, next) => {
  try {
    const [studentCount, examCount, subject] = await Promise.all([
      Student.countDocuments({ subjectId: req.params.id, isDeleted: false }),
      Exam.countDocuments({ subject: req.params.id, isDeleted: false }),
      Subject.findOne({ _id: req.params.id, isDeleted: false }).lean<any>()
    ]);

    if (!subject) {
      return res.status(404).json(createError('Subject not found'));
    }

    if (studentCount > 0 || examCount > 0) {
      return res.status(400).json(createError('Cannot delete a subject that is linked to students or exams'));
    }

    const deletedAt = new Date();
    await Promise.all([
      Subject.updateOne(
        { _id: req.params.id },
        {
          $set: {
            isDeleted: true,
            deletedAt,
            deletedBy: req.user?.userId ?? null,
            activeStatus: false
          }
        }
      ),
      User.updateOne(
        { _id: subject.teacher, role: 'teacher' },
        { $pull: { assignedSubjects: req.params.id } }
      ),
      ClassModel.updateOne(
        { _id: subject.classId },
        { $pull: { assignedSubjects: req.params.id } }
      )
    ]);

    res.json(createResponse({}, 'Subject deleted successfully'));
  } catch (error) {
    next(error);
  }
});

export const subjectRouter = router;
