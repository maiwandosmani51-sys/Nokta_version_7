import { Router } from 'express';
import { Request } from 'express';
import Joi from 'joi';
import mongoose from 'mongoose';
import { UserService } from '../../services/userService';
import { TeacherProfile } from '../../models/Teacher';
import { User } from '../../models/User';
import { authenticate } from '../../middlewares/auth';
import { requireAdmin } from '../../middlewares/rbac';
import { validate } from '../../middlewares/validate';
import { teacherCreateLimiter } from '../../middlewares/rateLimiter';
import { createError, createResponse } from '../../helpers/response';

const router = Router();
const userService = new UserService();

const createTeacherSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().optional(),
    firstName: Joi.string().optional(),
    lastName: Joi.string().optional(),
    email: Joi.string().email().required(),
    password: Joi.string().min(4).max(32).required(),
    phone: Joi.string().optional(),
    whatsapp: Joi.string().optional(),
    address: Joi.string().optional(),
    gender: Joi.string().valid('male', 'female', 'other').optional(),
    branchId: Joi.string().hex().length(24).optional(),
    salaryType: Joi.string().valid('fixed', 'percentage').required(),
    salaryValue: Joi.number().min(0).optional(),
    fixedSalary: Joi.number().min(0).optional(),
    percentageRate: Joi.number().min(0).max(100).optional(),
    customPercentage: Joi.number().min(0).max(100).optional(),
    assignedSubjects: Joi.array().items(Joi.string().hex().length(24)).optional(),
    assignedClasses: Joi.array().items(Joi.string().hex().length(24)).optional()
  }).or('name', 'firstName')
});

const idParamsSchema = Joi.object({
  params: Joi.object({
    id: Joi.string().hex().length(24).required()
  })
});

const updateTeacherSchema = Joi.object({
  params: Joi.object({
    id: Joi.string().hex().length(24).required()
  }),
  body: Joi.object({
    name: Joi.string().optional(),
    firstName: Joi.string().optional(),
    lastName: Joi.string().optional(),
    email: Joi.string().email().optional(),
    password: Joi.string().min(4).max(32).allow('', null).optional(),
    phone: Joi.string().allow('', null).optional(),
    whatsapp: Joi.string().allow('', null).optional(),
    address: Joi.string().allow('', null).optional(),
    gender: Joi.string().valid('male', 'female', 'other').optional(),
    branchId: Joi.string().hex().length(24).allow('', null).optional(),
    salaryType: Joi.string().valid('fixed', 'percentage').optional(),
    salaryValue: Joi.number().min(0).optional(),
    fixedSalary: Joi.number().min(0).optional(),
    percentageRate: Joi.number().min(0).max(100).optional(),
    customPercentage: Joi.number().min(0).max(100).optional(),
    assignedSubjects: Joi.array().items(Joi.string().hex().length(24)).optional(),
    assignedClasses: Joi.array().items(Joi.string().hex().length(24)).optional(),
    active: Joi.boolean().optional(),
    status: Joi.string().valid('active', 'inactive', 'locked', 'suspended', 'pending_verification').optional()
  }).min(1)
});

router.use(authenticate);

function buildTeacherPayload(body: Record<string, any>, isCreate = false) {
  let firstName = body.firstName;
  let lastName = body.lastName;

  if (body.name && !firstName && !lastName) {
    const nameParts = String(body.name).trim().split(/\s+/);
    firstName = nameParts[0] || '';
    lastName = nameParts.slice(1).join(' ') || '';
  }

  const teacherData: Record<string, any> = {
    ...body,
    firstName,
    lastName,
    name: body.name || `${firstName ?? ''} ${lastName ?? ''}`.trim(),
    role: 'teacher'
  };

  if (body.salaryValue !== undefined && body.salaryValue !== null && body.salaryValue !== '') {
    if ((body.salaryType ?? teacherData.salaryType) === 'fixed') {
      teacherData.fixedSalary = Number(body.salaryValue);
      teacherData.percentageRate = 0;
    } else if ((body.salaryType ?? teacherData.salaryType) === 'percentage') {
      teacherData.percentageRate = Number(body.salaryValue);
      teacherData.fixedSalary = 0;
    }
    delete teacherData.salaryValue;
  }

  if (!teacherData.password) {
    delete teacherData.password;
  }

  if (!isCreate && !teacherData.name && (firstName || lastName)) {
    teacherData.name = `${firstName ?? ''} ${lastName ?? ''}`.trim();
  }

  return teacherData;
}

function serializeTeacher(teacher: any) {
  const assignedSubjects = Array.isArray(teacher?.assignedSubjects) ? teacher.assignedSubjects : [];
  return {
    ...teacher,
    assignedSubjects: assignedSubjects.map((subject: any) => subject?._id ?? subject).filter(Boolean),
    assignedSubjectNames: assignedSubjects.map((subject: any) => subject?.title ?? subject).filter(Boolean).join(', '),
    displaySubject: assignedSubjects.length ? (assignedSubjects[0]?.title ?? assignedSubjects[0]) : '',
    salaryValue: teacher?.salaryType === 'percentage'
      ? Number(teacher?.percentageRate ?? teacher?.customPercentage ?? 0)
      : Number(teacher?.fixedSalary ?? 0),
    profileImage: teacher?.profileImage?.replace('/uploads/', '') || null
  };
}

async function syncTeacherProfile(teacher: any, payload: Record<string, any>) {
  await TeacherProfile.findOneAndUpdate(
    { userId: teacher._id },
    {
      userId: teacher._id,
      branchId: teacher.branchId ?? payload.branchId ?? null,
      teacherCode: teacher.teacherId,
      gender: teacher.gender ?? payload.gender ?? 'other',
      salaryType: teacher.salaryType,
      fixedSalary: teacher.fixedSalary,
      percentageRate: teacher.percentageRate,
      assignedSubjectIds: teacher.assignedSubjects ?? [],
      assignedClassIds: teacher.assignedClasses ?? [],
      active: teacher.active !== false
    },
    { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
  );
}

// Get all teachers - admin only
router.get('/', requireAdmin, async (req, res) => {
  try {
    const teachers = await User.find({ role: 'teacher', isDeleted: false })
      .populate('assignedSubjects', 'title')
      .lean();

    res.json(createResponse(teachers.map(serializeTeacher)));
  } catch (error) {
    console.error('Get teachers error:', error);
    res.status(500).json(createResponse(null, 'Failed to fetch teachers'));
  }
});

// Create teacher - admin only
router.post('/', teacherCreateLimiter, requireAdmin, validate(createTeacherSchema), async (req: Request, res) => {
  try {
    const existingEmail = await User.findOne({ email: req.body.email.toLowerCase(), isDeleted: false }).lean();
    if (existingEmail) {
      return res.status(409).json(createError('Email already exists'));
    }

    const teacherData = buildTeacherPayload(req.body, true);
    const teacher = await userService.createUser(teacherData);
    await syncTeacherProfile(teacher, teacherData);

    const savedTeacher = await User.findById(teacher._id)
      .populate('assignedSubjects', 'title')
      .lean();

    res.status(201).json(createResponse(serializeTeacher(savedTeacher), 'Teacher created successfully'));
  } catch (error: any) {
    console.error('Teacher creation error:', error);
    if (error instanceof mongoose.Error.ValidationError) {
      return res.status(400).json(createError(error.message));
    }
    if (typeof error?.message === 'string') {
      if (/duplicate key/i.test(error.message) || /already exists/i.test(error.message)) {
        return res.status(409).json(createError('Teacher already exists'));
      }
      return res.status(400).json(createError(error.message));
    }
    res.status(500).json(createError('Failed to create teacher'));
  }
});

// Get teacher by ID
router.get('/:id', requireAdmin, validate(idParamsSchema), async (req, res) => {
  try {
    const teacher = await User.findOne({ _id: req.params.id, role: 'teacher', isDeleted: false })
      .populate('assignedSubjects', 'title')
      .lean();
    if (!teacher) {
      return res.status(404).json(createResponse(null, 'Teacher not found'));
    }
    res.json(createResponse(serializeTeacher(teacher)));
  } catch (error) {
    res.status(500).json(createResponse(null, 'Failed to fetch teacher'));
  }
});

// Update teacher
router.put('/:id', requireAdmin, validate(updateTeacherSchema), async (req: Request, res) => {
  try {
    const existingTeacher = await User.findOne({ _id: req.params.id, role: 'teacher', isDeleted: false }).lean();
    if (!existingTeacher) {
      return res.status(404).json(createError('Teacher not found'));
    }

    if (req.body.email) {
      const duplicateEmail = await User.findOne({
        email: req.body.email.toLowerCase(),
        _id: { $ne: req.params.id },
        isDeleted: false
      }).lean();
      if (duplicateEmail) {
        return res.status(409).json(createError('Email already exists'));
      }
    }

    const teacherPayload = buildTeacherPayload(req.body);
    const teacher = await userService.updateUser(req.params.id, teacherPayload);
    await syncTeacherProfile(teacher, teacherPayload);

    const savedTeacher = await User.findById(req.params.id)
      .populate('assignedSubjects', 'title')
      .lean();

    res.json(createResponse(serializeTeacher(savedTeacher), 'Teacher updated successfully'));
  } catch (error: any) {
    if (error instanceof mongoose.Error.ValidationError) {
      return res.status(400).json(createError(error.message));
    }
    res.status(400).json(createError(String(error?.message || 'Failed to update teacher')));
  }
});

// Delete teacher
router.delete('/:id', requireAdmin, validate(idParamsSchema), async (req, res) => {
  try {
    const deletedAt = new Date();
    const teacher = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'teacher', isDeleted: false },
      {
        $set: {
          isDeleted: true,
          deletedAt,
          deletedBy: req.user?.userId ?? null,
          active: false,
          status: 'inactive'
        }
      },
      { new: true }
    ).lean();

    if (!teacher) return res.status(404).json(createError('Teacher not found'));

    await TeacherProfile.findOneAndUpdate(
      { userId: req.params.id },
      {
        $set: {
          isDeleted: true,
          deletedAt,
          deletedBy: req.user?.userId ?? null,
          active: false
        }
      }
    );

    res.json(createResponse({}, 'Teacher deleted successfully'));
  } catch (error) {
    res.status(500).json(createError('Failed to delete teacher'));
  }
});

export const teacherRouter = router;
