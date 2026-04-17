import { Router } from 'express';
import { Request } from 'express';
import Joi from 'joi';
import { StudentService } from '../../services/studentService';
import { Student } from '../../models/Student';
import { User } from '../../models/User';
import { authenticate } from '../../middlewares/auth';
import { requireAdmin, requireFamily, requireTeacher } from '../../middlewares/rbac';
import { validate } from '../../middlewares/validate';
import { createResponse, createError } from '../../helpers/response';
import { paginationSchema } from '../../validators/pagination';

const router = Router();
const studentService = new StudentService();

function serializeStudent(student: any) {
  const classRef = student?.classId;
  const subjectRef = student?.subjectId;
  const teacherRef = student?.teacherId;

  return {
    ...student,
    classId: classRef?._id ?? classRef ?? null,
    subjectId: subjectRef?._id ?? subjectRef ?? null,
    teacherId: teacherRef?._id ?? teacherRef ?? null,
    className: classRef?.name ?? classRef?.className ?? '',
    subjectName: subjectRef?.title ?? '',
    teacherName: teacherRef?.name ?? '',
    classCode: classRef?.classCode ?? '',
    profileImage: student?.profileImage?.replace('/uploads/', '') || null
  };
}

const registerStudentSchema = Joi.object({
  body: Joi.object({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    fatherName: Joi.string().required(),
    familyPhone: Joi.string().required(),
    gender: Joi.string().valid('male', 'female', 'other').required(),
    branchId: Joi.string().hex().length(24).optional(),
    classId: Joi.string().hex().length(24).required(),
    subjectId: Joi.string().hex().length(24).required(),
    teacherId: Joi.string().hex().length(24).required(),
    feeAmount: Joi.number().min(0).required(),
    paidAmount: Joi.number().min(0).optional(),
    registrationExpiryDate: Joi.date().optional()
  })
});

const updateStudentSchema = Joi.object({
  body: Joi.object({
    firstName: Joi.string().optional(),
    lastName: Joi.string().optional(),
    fatherName: Joi.string().optional(),
    familyPhone: Joi.string().optional(),
    gender: Joi.string().valid('male', 'female', 'other').optional(),
    branchId: Joi.string().hex().length(24).optional(),
    classId: Joi.string().hex().length(24).optional(),
    subjectId: Joi.string().hex().length(24).optional(),
    teacherId: Joi.string().hex().length(24).optional(),
    feeAmount: Joi.number().min(0).optional(),
    paidAmount: Joi.number().min(0).optional(),
    registrationExpiryDate: Joi.date().allow(null).optional(),
    status: Joi.string().valid('active', 'inactive', 'suspended', 'graduated').optional()
  }).min(1)
});

const updateStudentWithIdSchema = Joi.object({
  params: Joi.object({
    id: Joi.string().hex().length(24).required()
  }),
  body: Joi.object({
    firstName: Joi.string().optional(),
    lastName: Joi.string().optional(),
    fatherName: Joi.string().optional(),
    familyPhone: Joi.string().optional(),
    gender: Joi.string().valid('male', 'female', 'other').optional(),
    branchId: Joi.string().hex().length(24).optional(),
    classId: Joi.string().hex().length(24).optional(),
    subjectId: Joi.string().hex().length(24).optional(),
    teacherId: Joi.string().hex().length(24).optional(),
    feeAmount: Joi.number().min(0).optional(),
    paidAmount: Joi.number().min(0).optional(),
    registrationExpiryDate: Joi.date().allow(null).optional(),
    status: Joi.string().valid('active', 'inactive', 'suspended', 'graduated').optional()
  }).min(1)
});

const idParamsSchema = Joi.object({
  params: Joi.object({
    id: Joi.string().hex().length(24).required()
  })
});

router.use(authenticate);

// Register student - admin only
router.post('/', requireAdmin, validate(registerStudentSchema), async (req: Request, res) => {
  try {
    console.log('Incoming data:', req.body);

    const classId = req.body.classId || req.body.class;
    const subjectId = req.body.subjectId || req.body.subject;
    const teacherId = req.body.teacherId || req.body.teacher;

    if (!classId || !subjectId || !teacherId) {
      return res.status(400).json(createError('Missing required fields: classId, subjectId, or teacherId'));
    }

    const count = await Student.countDocuments();
    req.body.rollNo = `STD-${count + 1}`;

    const student = await studentService.registerStudent({
      ...req.body,
      classId,
      subjectId,
      teacherId
    });
    console.log('Saved student:', student);
    res.status(201).json(createResponse(student, 'Student registered successfully'));
  } catch (error: any) {
    console.error('Student create error:', error);
    res.status(500).json(createError(String(error?.message || 'Failed to register student')));
  }
});

router.put('/:id', requireAdmin, validate(updateStudentWithIdSchema), async (req: Request, res) => {
  try {
    const updatedStudent = await studentService.updateStudent(req.params.id, req.body);
    if (!updatedStudent) {
      return res.status(404).json(createError('Student not found'));
    }
    res.json(createResponse(updatedStudent, 'Student updated successfully'));
  } catch (error: any) {
    res.status(500).json(createError(String(error?.message || 'Failed to update student')));
  }
});

router.get('/', requireTeacher, validate(paginationSchema), async (req, res) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const search = String(req.query.search || '').trim();
    const filter: any = { isDeleted: false };

    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { fatherName: { $regex: search, $options: 'i' } },
        { familyPhone: { $regex: search, $options: 'i' } }
      ];
    }

    if (req.user?.canonicalRole === 'teacher') {
      filter.teacherId = req.user.userId;
    }

    const [students, total] = await Promise.all([
      Student.find(filter)
        .populate('classId', 'className name classCode')
        .populate('subjectId', 'title code')
        .populate('teacherId', 'name email')
        .lean()
        .skip((page - 1) * limit)
        .limit(limit),
      Student.countDocuments(filter)
    ]);

    res.json(createResponse(students.map(serializeStudent), '', { page, limit, total }));
  } catch (error: any) {
    res.status(500).json(createError(String(error?.message || 'Failed to fetch students')));
  }
});

router.delete('/:id', requireAdmin, validate(idParamsSchema), async (req, res) => {
  try {
    const deletedStudent = await studentService.deleteStudent(req.params.id, req.user?.userId ?? null);
    if (!deletedStudent) {
      return res.status(404).json(createError('Student not found'));
    }

    res.json(createResponse({}, 'Student deleted successfully'));
  } catch (error: any) {
    res.status(500).json(createError(String(error?.message || 'Failed to delete student')));
  }
});

// Get students by family - family only
router.get('/family', requireFamily, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user?.userId).lean<Record<string, any>>();
    const familyId = currentUser?.familyId;
    if (!familyId) {
      return res.json(createResponse([]));
    }
    const students = await studentService.getStudentsByFamily(familyId);
    const normalizedStudents = students.map((student) => serializeStudent(student.toObject()));
    res.json(createResponse(normalizedStudents));
  } catch (error) {
    res.status(500).json(createError('Failed to fetch students'));
  }
});

// Get students by teacher - teacher only
router.get('/teacher', requireTeacher, async (req, res) => {
  try {
    const teacherId = req.user?.userId;
    if (!teacherId) {
      return res.status(401).json(createError('Authentication required'));
    }
    const students = await studentService.getStudentsByTeacher(teacherId);
    const normalizedStudents = students.map((student) => serializeStudent(student.toObject()));
    res.json(createResponse(normalizedStudents));
  } catch (error) {
    res.status(500).json(createError('Failed to fetch students'));
  }
});

router.get('/:id', requireTeacher, validate(idParamsSchema), async (req, res) => {
  try {
    const filter: Record<string, unknown> = {
      _id: req.params.id,
      isDeleted: false
    };

    if (req.user?.canonicalRole === 'teacher') {
      filter.teacherId = req.user.userId;
    }

    const student = await Student.findOne(filter)
      .populate('classId', 'className name classCode')
      .populate('subjectId', 'title code')
      .populate('teacherId', 'name email')
      .lean();

    if (!student) {
      return res.status(404).json(createError('Student not found'));
    }

    res.json(createResponse(serializeStudent(student)));
  } catch (error: any) {
    res.status(500).json(createError(String(error?.message || 'Failed to fetch student')));
  }
});

export const studentRouter = router;
