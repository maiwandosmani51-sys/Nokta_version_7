import { Router } from 'express';
import { Request } from 'express';
import Joi from 'joi';
import { User } from '../../models/User';
import { authenticate, authorize } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import { createResponse, createError } from '../../helpers/response';
import { paginationSchema } from '../../validators/pagination';
import { hashPassword } from '../../utils/password';

const router = Router();

const createSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(4).max(32).required(),
    role: Joi.string().valid('super_admin', 'admin', 'teacher', 'student', 'parent', 'owner', 'branch_manager', 'system_automation', 'family_student', 'accountant', 'librarian').required()
  })
});

const updateSchema = Joi.object({
  body: Joi.object({
    name: Joi.string(),
    email: Joi.string().email(),
    password: Joi.string().min(4).max(32).optional(),
    role: Joi.string().valid('super_admin', 'admin', 'teacher', 'student', 'parent', 'owner', 'branch_manager', 'system_automation', 'family_student', 'accountant', 'librarian'),
    active: Joi.boolean()
  }),
  params: Joi.object({ id: Joi.string().hex().length(24).required() })
});

const permissionsSchema = Joi.object({
  body: Joi.object({
    permissions: Joi.object().pattern(
      Joi.string(),
      Joi.array().items(Joi.string().valid('create', 'read', 'update', 'delete')).unique()
    ).required()
  }),
  params: Joi.object({ id: Joi.string().hex().length(24).required() })
});

const idParamsSchema = Joi.object({
  params: Joi.object({ id: Joi.string().hex().length(24).required() })
});

router.use(authenticate, authorize(['super_admin', 'admin']));

function requireSuperAdmin(req: any, res: any) {
  if (req.user?.role !== 'super_admin') {
    res.status(403).json(createError('Forbidden'));
    return false;
  }
  return true;
}

function normalizeEmail(value: string) {
  return String(value || '').trim().toLowerCase();
}

router.post('/', validate(createSchema), async (req: Request, res, next) => {
  try {
    if (!requireSuperAdmin(req, res)) return;
    const { name, email, password, role } = req.body;
    const normalizedEmail = normalizeEmail(email);
    const exists = await User.findOne({ email: normalizedEmail, isDeleted: false }).lean();
    if (exists) return res.status(409).json(createError('Email already exists'));
    const hashed = await hashPassword(password);
    const user = await User.create({ name, email: normalizedEmail, password: hashed, role });
    res.status(201).json(createResponse({ id: user._id, name: user.name, email: user.email, role: user.role }, 'User created'));
  } catch (error) {
    next(error);
  }
});

router.get('/', validate(paginationSchema), async (req, res, next) => {
  try {
    if (!requireSuperAdmin(req, res)) return;
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const search = String(req.query.search || '').trim();
    const filter = search
      ? { isDeleted: false, $or: [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }] }
      : { isDeleted: false };
    const [users, total] = await Promise.all([
      User.find(filter).select('-password').lean().skip((page - 1) * limit).limit(limit),
      User.countDocuments(filter)
    ]);
    const normalizedUsers = users.map(user => ({ ...user, profileImage: user?.profileImage?.replace('/uploads/', '') || null }));
    res.json(createResponse(normalizedUsers, '', { page, limit, total }));
  } catch (error) {
    next(error);
  }
});

router.get('/count', async (req, res, next) => {
  try {
    if (!req.user) return res.status(401).json(createError('Authentication required'));
    if (!['super_admin', 'admin'].includes(req.user.role)) {
      return res.status(403).json(createError('Access denied'));
    }
    const count = await User.countDocuments();
    res.json(createResponse({ count }));
  } catch (error) {
    next(error);
  }
});

router.get('/:id', validate(idParamsSchema), async (req, res, next) => {
  try {
    if (!requireSuperAdmin(req, res)) return;
    const user: any = await User.findOne({ _id: req.params.id, isDeleted: false }).select('-password').lean();
    if (!user) return res.status(404).json(createError('User not found'));
    const normalizedUser = { ...user, profileImage: user?.profileImage?.replace('/uploads/', '') || null };
    res.json(createResponse(normalizedUser));
  } catch (error) {
    next(error);
  }
});

const updateUserHandler = async (req: Request, res: any, next: any) => {
  try {
    if (!requireSuperAdmin(req, res)) return;
    if (req.body.email) {
      const normalizedEmail = normalizeEmail(req.body.email);
      const existingUser = await User.findOne({ email: normalizedEmail, _id: { $ne: req.params.id }, isDeleted: false }).lean();
      if (existingUser) {
        return res.status(409).json(createError('Email already exists'));
      }
      req.body.email = normalizedEmail;
    }
    const updatePayload = { ...req.body };
    if (updatePayload.password) {
      updatePayload.password = await hashPassword(updatePayload.password);
    } else {
      delete updatePayload.password;
    }

    const user: any = await User.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      updatePayload,
      { new: true, runValidators: true }
    ).select('-password').lean();
    if (!user) return res.status(404).json(createError('User not found'));
    const normalizedUser = { ...user, profileImage: user?.profileImage?.replace('/uploads/', '') || null };
    res.json(createResponse(normalizedUser, 'User updated'));
  } catch (error) {
    next(error);
  }
};

router.patch('/:id', validate(updateSchema), updateUserHandler);
router.put('/:id', validate(updateSchema), updateUserHandler);

router.put('/:id/permissions', validate(permissionsSchema), async (req, res, next) => {
  try {
    if (!requireSuperAdmin(req, res)) return;
    const { permissions } = req.body;
    const user = await User.findOne({ _id: req.params.id, isDeleted: false });
    if (!user) return res.status(404).json(createError('User not found'));
    user.permissions = permissions;
    await user.save();
    const current = await User.findOne({ _id: req.params.id, isDeleted: false }).select('-password').lean();
    res.json(createResponse(current, 'User permissions updated'));
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', validate(idParamsSchema), async (req, res, next) => {
  try {
    if (!requireSuperAdmin(req, res)) return;
    const user = await User.findByIdAndDelete(req.params.id).lean();
    if (!user) return res.status(404).json(createError('User not found'));
    res.json(createResponse({}, 'User deleted'));
  } catch (error) {
    next(error);
  }
});

export const userRouter = router;
