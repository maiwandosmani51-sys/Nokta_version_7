import { Router } from 'express';
import Joi from 'joi';
import { Exam } from '../../models/Exam';
import { Subject } from '../../models/Subject';
import { ClassModel } from '../../models/Class';
import { User } from '../../models/User';
import { authenticate, authorize } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import { createResponse, createError } from '../../helpers/response';
import { paginationSchema } from '../../validators/pagination';

const router = Router();

const examSchema = Joi.object({
  body: Joi.object({
    title: Joi.string().required(),
    subject: Joi.string().hex().length(24).required(),
    class: Joi.string().hex().length(24).required(),
    teacherId: Joi.string().hex().length(24).optional(),
    date: Joi.date().required(),
    totalMarks: Joi.number().min(1).default(100),
    passingMarks: Joi.number().min(1).optional(),
    examType: Joi.string().valid('midterm', 'final', 'quiz').optional(),
    status: Joi.string().valid('draft', 'published').optional()
  })
});

const examUpdateSchema = Joi.object({
  body: Joi.object({
    title: Joi.string().optional(),
    subject: Joi.string().hex().length(24).optional(),
    class: Joi.string().hex().length(24).optional(),
    teacherId: Joi.string().hex().length(24).optional(),
    date: Joi.date().optional(),
    totalMarks: Joi.number().min(1).optional(),
    passingMarks: Joi.number().min(1).optional(),
    examType: Joi.string().valid('midterm', 'final', 'quiz').optional(),
    status: Joi.string().valid('draft', 'published').optional()
  }).min(1)
});

const readRoles = ['super_admin', 'admin', 'branch_manager', 'teacher', 'student', 'parent', 'owner'];
const writeRoles = ['super_admin', 'admin', 'branch_manager', 'teacher'];

function buildExamCode(title: string) {
  const slug = title
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 18) || 'EXAM';

  return `${slug}-${Date.now().toString().slice(-6)}`;
}

function idsEqual(left: unknown, right: unknown) {
  return String(left ?? '') === String(right ?? '');
}

async function ensureExamRelations(subjectId: string, classId: string, teacherId: string) {
  const [subject, klass, teacher] = await Promise.all([
    Subject.findOne({ _id: subjectId, isDeleted: false }).lean<any>(),
    ClassModel.findOne({ _id: classId, isDeleted: false }).lean<any>(),
    User.findOne({ _id: teacherId, role: 'teacher', isDeleted: false }).lean<any>()
  ]);

  if (!subject || Array.isArray(subject)) return 'Subject not found';
  if (!klass || Array.isArray(klass)) return 'Class not found';
  if (!teacher || Array.isArray(teacher) || teacher.role !== 'teacher') return 'Teacher not found';
  if (!idsEqual(subject.classId, klass._id)) return 'Selected subject does not belong to the selected class';

  const assignedSubjectIds = Array.isArray(teacher.assignedSubjects) ? teacher.assignedSubjects.map((item: any) => String(item)) : [];
  const assignedClassIds = Array.isArray(teacher.assignedClasses) ? teacher.assignedClasses.map((item: any) => String(item)) : [];
  const subjectTeacherMatches = subject.teacher ? idsEqual(subject.teacher, teacher._id) : false;
  const teacherSubjectMatches = assignedSubjectIds.includes(String(subject._id));
  const teacherClassMatches = assignedClassIds.includes(String(klass._id));

  if (!subjectTeacherMatches && !teacherSubjectMatches && !teacherClassMatches) {
    return 'Selected teacher is not assigned to the selected subject';
  }

  return null;
}

function serializeExam(exam: any) {
  return {
    ...exam,
    subjectName: exam?.subject?.title ?? exam?.subjectName ?? exam?.subjectTitle ?? '',
    className: exam?.class?.className ?? exam?.class?.name ?? exam?.className ?? '',
    teacherName: exam?.teacherId?.name ?? exam?.teacher?.name ?? exam?.teacherName ?? ''
  };
}

router.use(authenticate);

router.post('/', authorize(writeRoles), validate(examSchema), async (req, res, next) => {
  try {
    const teacherId = req.body.teacherId ?? (req.user?.canonicalRole === 'teacher' ? req.user.userId : null);
    if (!teacherId) {
      return res.status(400).json(createError('Teacher is required'));
    }

    const relationError = await ensureExamRelations(req.body.subject, req.body.class, teacherId);
    if (relationError) {
      return res.status(400).json(createError(relationError));
    }

    const subjectDoc = await Subject.findById(req.body.subject).select('branchId').lean<any>();

    const exam = await Exam.create({
      ...req.body,
      teacherId,
      branchId: subjectDoc?.branchId ?? null,
      examCode: buildExamCode(req.body.title),
      publishedAt: req.body.status === 'published' ? new Date() : null
    });

    const populated = await Exam.findById(exam._id)
      .populate('subject', 'title code')
      .populate('class', 'className name classCode')
      .populate('teacherId', 'name email')
      .lean();

    res.status(201).json(createResponse(serializeExam(populated), 'Exam created'));
  } catch (error) {
    next(error);
  }
});

router.put('/:id', authorize(writeRoles), validate(examUpdateSchema), async (req, res, next) => {
  try {
    const currentExam = await Exam.findById(req.params.id).lean<any>();
    if (!currentExam) {
      return res.status(404).json(createError('Exam not found'));
    }

    const nextSubject = req.body.subject ?? String(currentExam.subject);
    const nextClass = req.body.class ?? String(currentExam.class);
    const nextTeacherId = req.body.teacherId ?? String(currentExam.teacherId);

    const relationError = await ensureExamRelations(nextSubject, nextClass, nextTeacherId);
    if (relationError) {
      return res.status(400).json(createError(relationError));
    }

    const subjectDoc = await Subject.findById(nextSubject).select('branchId').lean<any>();

    const nextStatus = req.body.status ?? currentExam.status;
    const exam = await Exam.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        teacherId: nextTeacherId,
        branchId: subjectDoc?.branchId ?? currentExam.branchId ?? null,
        publishedAt: nextStatus === 'published' ? currentExam.publishedAt ?? new Date() : null
      },
      { new: true, runValidators: true }
    )
      .populate('subject', 'title code')
      .populate('class', 'className name classCode')
      .populate('teacherId', 'name email')
      .lean();

    res.json(createResponse(serializeExam(exam), 'Exam updated'));
  } catch (error) {
    next(error);
  }
});

router.get('/', authorize(readRoles), validate(paginationSchema), async (req, res, next) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const search = String(req.query.search || '').trim();
    const filter: any = {};

    if (search) {
      filter.title = { $regex: search, $options: 'i' };
    }

    const [exams, total] = await Promise.all([
      Exam.find(filter)
        .populate('subject', 'title code')
        .populate('class', 'className name classCode')
        .populate('teacherId', 'name email')
        .lean()
        .skip((page - 1) * limit)
        .limit(limit),
      Exam.countDocuments(filter)
    ]);

    res.json(createResponse(exams.map(serializeExam), '', { page, limit, total }));
  } catch (error) {
    next(error);
  }
});

router.get('/:id', authorize(readRoles), async (req, res, next) => {
  try {
    const exam = await Exam.findById(req.params.id)
      .populate('subject', 'title code')
      .populate('class', 'className name classCode')
      .populate('teacherId', 'name email')
      .lean();

    if (!exam) return res.status(404).json(createError('Exam not found'));

    res.json(createResponse(serializeExam(exam)));
  } catch (error) {
    next(error);
  }
});

export const examRouter = router;
