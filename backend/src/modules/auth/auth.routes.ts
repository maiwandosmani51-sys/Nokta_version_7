import { Router, type Request } from 'express';
import Joi from 'joi';
import { validate } from '../../middlewares/validate';
import { authLimiter } from '../../middlewares/rateLimiter';
import { createResponse, createError } from '../../helpers/response';
import { authenticate } from '../../middlewares/auth';
import { AuthService } from '../../services/authService';
import { profileUpload } from '../../middlewares/upload';
import { ClassModel } from '../../models/Class';
import { Subject } from '../../models/Subject';
import { Student } from '../../models/Student';
import { User } from '../../models/User';
import { Family } from '../../models/Family';
import { hashPassword } from '../../utils/password';
import { BusinessRuleService } from '../../services/businessRuleService';

const router = Router();
const authService = new AuthService();
const businessRuleService = new BusinessRuleService();

const loginSchema = Joi.object({
  body: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  })
});

const refreshSchema = Joi.object({
  body: Joi.object({
    refreshToken: Joi.string().required()
  })
});

const logoutSchema = Joi.object({
  body: Joi.object({
    refreshToken: Joi.string().optional()
  })
});

const forgotPasswordSchema = Joi.object({
  body: Joi.object({
    email: Joi.string().email().required()
  })
});

const resetPasswordSchema = Joi.object({
  body: Joi.object({
    token: Joi.string().required(),
    newPassword: Joi.string().required()
  })
});

const phoneRequestSchema = Joi.object({
  body: Joi.object({
    phone: Joi.string().optional()
  })
});

const phoneConfirmSchema = Joi.object({
  body: Joi.object({
    code: Joi.string().required()
  })
});

const tokenConfirmSchema = Joi.object({
  body: Joi.object({
    token: Joi.string().required()
  })
});

const publicStudentRegistrationSchema = Joi.object({
  firstName: Joi.string().trim().required(),
  lastName: Joi.string().trim().required(),
  email: Joi.string().email().required(),
  phone: Joi.string().trim().required(),
  whatsapp: Joi.string().trim().allow('', null).optional(),
  password: Joi.string().min(4).max(32).required(),
  confirmPassword: Joi.string().required(),
  gender: Joi.string().valid('male', 'female', 'other').required(),
  classId: Joi.string().hex().length(24).required(),
  subjectId: Joi.string().hex().length(24).required(),
  teacherId: Joi.string().hex().length(24).required()
});

function uploadSingleProfile(req: Request, res: any) {
  return new Promise<void>((resolve, reject) => {
    profileUpload.single('profileImage')(req as any, res, (error: any) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}

async function generateStudentRollNo() {
  const count = await Student.countDocuments();
  return `STD-${count + 1}`;
}

function generateStudentId() {
  return `S${Date.now().toString().slice(-6)}${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
}

function getRequestContext(req: Request) {
  return {
    ipAddress: req.ip,
    userAgent: req.get('user-agent') ?? '',
    deviceId: req.get('x-device-id') ?? 'web-browser',
    deviceName: req.get('x-device-name') ?? 'Web Browser'
  };
}

router.post('/login', authLimiter, validate(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password, getRequestContext(req));

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token: result.tokens.accessToken,
      refreshToken: result.tokens.refreshToken,
      user: result.user,
      tokens: result.tokens
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Login failed';
    return res.status(401).json(createError(message));
  }
});

router.get('/register/options', async (req, res) => {
  try {
    const classId = String(req.query.classId || '').trim();
    const subjectId = String(req.query.subjectId || '').trim();

    const classFilter: Record<string, unknown> = { active: true, isDeleted: false };
    const subjectFilter: Record<string, unknown> = { activeStatus: true, isDeleted: false };
    if (classId) {
      subjectFilter.classId = classId;
    }

    const [classes, subjects] = await Promise.all([
      ClassModel.find(classFilter).select('className name classCode branchId feeAmount').sort({ className: 1 }).lean(),
      Subject.find(subjectFilter).select('title code classId teacher branchId feeAmount').populate('teacher', 'name email assignedClasses assignedSubjects').sort({ title: 1 }).lean()
    ]);

    const teacherMap = new Map<string, any>();
    subjects.forEach((subject: any) => {
      const teacher = subject.teacher;
      if (!teacher) return;
      const teacherKey = String(teacher._id);
      const currentTeacher = teacherMap.get(teacherKey);
      if (currentTeacher) {
        currentTeacher.subjectIds = Array.from(new Set([...currentTeacher.subjectIds, String(subject._id)]));
        currentTeacher.classIds = Array.from(new Set([...currentTeacher.classIds, String(subject.classId)]));
        return;
      }

      teacherMap.set(teacherKey, {
        _id: teacher._id,
        name: teacher.name,
        email: teacher.email,
        subjectIds: [String(subject._id)],
        classIds: [String(subject.classId)]
      });
    });

    const teachers = Array.from(teacherMap.values())
      .filter((teacher: any) => {
        if (subjectId) {
          return teacher.subjectIds.some((id: any) => String(id) === subjectId);
        }
        if (classId) {
          return teacher.classIds.some((id: any) => String(id) === classId);
        }
        return true;
      })
      .map((teacher: any) => ({
        _id: teacher._id,
        name: teacher.name,
        email: teacher.email
      }));

    return res.json(createResponse({
      classes: classes.map((klass: any) => ({
        _id: klass._id,
        className: klass.className ?? klass.name,
        classCode: klass.classCode,
        branchId: klass.branchId ?? null,
        feeAmount: Number(klass.feeAmount ?? 0)
      })),
      subjects: subjects.map((subject: any) => ({
        _id: subject._id,
        title: subject.title,
        classId: subject.classId,
        code: subject.code,
        teacherId: subject.teacher?._id ?? null,
        feeAmount: Number(subject.feeAmount ?? 0)
      })),
      teachers
    }));
  } catch (error: any) {
    return res.status(500).json(createError(error?.message || 'Unable to load registration options'));
  }
});

router.post('/register/student', authLimiter, async (req, res) => {
  try {
    await uploadSingleProfile(req, res);

    const { error, value } = publicStudentRegistrationSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      return res.status(400).json(createError(error.details.map((detail) => detail.message).join(', ')));
    }

    if (value.password !== value.confirmPassword) {
      return res.status(400).json(createError('Password confirmation does not match'));
    }

    const [existingEmail, klass, subject, teacher] = await Promise.all([
      User.findOne({ email: value.email.toLowerCase(), isDeleted: false }).lean(),
      ClassModel.findOne({ _id: value.classId, active: true, isDeleted: false }).lean(),
      Subject.findOne({ _id: value.subjectId, activeStatus: true, isDeleted: false }).lean(),
      User.findOne({ _id: value.teacherId, role: 'teacher', isDeleted: false }).lean()
    ]) as [any, any, any, any];

    if (existingEmail) {
      return res.status(409).json(createError('Email already exists'));
    }

    if (!klass) {
      return res.status(400).json(createError('Selected class does not exist'));
    }

    if (!subject) {
      return res.status(400).json(createError('Selected subject does not exist'));
    }

    if (!teacher) {
      return res.status(400).json(createError('Selected teacher does not exist'));
    }

    if (String(subject.classId) !== String(klass._id)) {
      return res.status(400).json(createError('Selected subject does not belong to the chosen class'));
    }

    if (subject.teacher && String(subject.teacher) !== String(teacher._id)) {
      return res.status(400).json(createError('Selected teacher is not assigned to the chosen subject'));
    }

    await businessRuleService.assertStudentGenderMatchesClass(value.gender, value.classId);
    await businessRuleService.assertTeacherGenderMatchesClass(value.teacherId, value.classId);

    const classFeeAmount = Number((klass as any).feeAmount ?? 0);
    const subjectFeeAmount = Number((subject as any).feeAmount ?? 0);
    const totalFeeAmount = classFeeAmount + subjectFeeAmount;

    const family = await Family.create({
      guardianName: `${value.firstName} ${value.lastName}`.trim(),
      guardianEmail: value.email.toLowerCase(),
      guardianPhone: value.phone,
      students: []
    });

    const studentId = generateStudentId();
    const profileImage = req.file ? `/uploads/profile/${req.file.filename}` : '';
    const student = await Student.create({
      rollNo: await generateStudentRollNo(),
      studentId,
      branchId: (klass as any).branchId ?? (subject as any).branchId ?? (teacher as any).branchId ?? null,
      firstName: value.firstName,
      lastName: value.lastName,
      fatherName: `${value.firstName} ${value.lastName}`.trim(),
      familyPhone: value.phone,
      familyEmail: value.email.toLowerCase(),
      gender: value.gender,
      classId: value.classId,
      subjectId: value.subjectId,
      teacherId: value.teacherId,
      feeAmount: totalFeeAmount,
      paidAmount: 0,
      remainingBalance: totalFeeAmount,
      familyId: family._id,
      profileImage
    });

    family.students = [student._id];
    await family.save();

    const user = await User.create({
      name: `${value.firstName} ${value.lastName}`.trim(),
      firstName: value.firstName,
      lastName: value.lastName,
      email: value.email.toLowerCase(),
      phone: value.phone,
      whatsapp: value.whatsapp || value.phone,
      password: await hashPassword(value.password),
      role: 'student',
      studentId,
      classId: value.classId,
      subjectId: value.subjectId,
      assignedTeacherId: value.teacherId,
      branchId: (klass as any).branchId ?? (subject as any).branchId ?? (teacher as any).branchId ?? null,
      familyId: family._id,
      feeAmount: totalFeeAmount,
      paidAmount: 0,
      remainingBalance: totalFeeAmount,
      fatherName: `${value.firstName} ${value.lastName}`.trim(),
      gender: value.gender,
      profileImage,
      mustChangePassword: false,
      status: 'active'
    });

    return res.status(201).json(createResponse({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      studentId,
      pricing: {
        classFee: classFeeAmount,
        subjectFee: subjectFeeAmount,
        totalFee: totalFeeAmount
      }
    }, 'Student account registered successfully'));
  } catch (error: any) {
    return res.status(400).json(createError(error?.message || 'Student registration failed'));
  }
});

router.post('/refresh', authLimiter, validate(refreshSchema), async (req, res) => {
  try {
    const result = await authService.refresh(req.body.refreshToken, getRequestContext(req));
    return res.json(createResponse({
      accessToken: result.tokens.accessToken,
      refreshToken: result.tokens.refreshToken,
      sessionId: result.tokens.sessionId,
      user: result.user,
      tokens: result.tokens
    }, 'Tokens refreshed'));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Refresh failed';
    return res.status(401).json(createError(message));
  }
});

router.post('/logout', authenticate, validate(logoutSchema), async (req, res) => {
  try {
    const accessToken = req.headers.authorization?.split(' ')[1];
    await authService.logout({
      userId: req.user!.userId,
      accessToken,
      refreshToken: req.body?.refreshToken,
      sessionId: req.user?.sessionId,
      context: getRequestContext(req)
    });
    return res.json(createResponse({}, 'Logged out successfully'));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Logout failed';
    return res.status(400).json(createError(message));
  }
});

router.post('/logout-all', authenticate, async (req, res) => {
  try {
    await authService.logoutAll(req.user!.userId);
    return res.json(createResponse({}, 'All sessions revoked successfully'));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Logout all failed';
    return res.status(400).json(createError(message));
  }
});

router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), async (req, res) => {
  try {
    const result = await authService.requestPasswordReset(req.body.email, getRequestContext(req));
    return res.json(createResponse(result, result.message));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to request password reset';
    return res.status(400).json(createError(message));
  }
});

router.post('/reset-password', authLimiter, validate(resetPasswordSchema), async (req, res) => {
  try {
    const result = await authService.resetPassword(req.body.token, req.body.newPassword);
    return res.json(createResponse(result, result.message));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to reset password';
    return res.status(400).json(createError(message));
  }
});

router.post('/email-verification/request', authenticate, async (req, res) => {
  try {
    const result = await authService.requestEmailVerification(req.user!.userId, getRequestContext(req));
    return res.json(createResponse(result, result.message));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create email verification token';
    return res.status(400).json(createError(message));
  }
});

router.post('/email-verification/confirm', validate(tokenConfirmSchema), async (req, res) => {
  try {
    const result = await authService.confirmEmailVerification(req.body.token);
    return res.json(createResponse(result, result.message));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Email verification failed';
    return res.status(400).json(createError(message));
  }
});

router.post('/phone-verification/request', authenticate, validate(phoneRequestSchema), async (req, res) => {
  try {
    const result = await authService.requestPhoneVerification(req.user!.userId, req.body?.phone, getRequestContext(req));
    return res.json(createResponse(result, result.message));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create phone verification code';
    return res.status(400).json(createError(message));
  }
});

router.post('/phone-verification/confirm', validate(phoneConfirmSchema), async (req, res) => {
  try {
    const result = await authService.confirmPhoneVerification(req.body.code);
    return res.json(createResponse(result, result.message));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Phone verification failed';
    return res.status(400).json(createError(message));
  }
});

router.get('/profile', authenticate, async (req, res) => {
  try {
    const profile = await authService.getProfile(req.user!.userId);
    return res.json(createResponse(profile));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load profile';
    return res.status(404).json(createError(message));
  }
});

export const authRouter = router;
