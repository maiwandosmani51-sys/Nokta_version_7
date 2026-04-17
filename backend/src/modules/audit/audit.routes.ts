import { Router } from 'express';
import Joi from 'joi';
import { AuditLog } from '../../models/AuditLog';
import { authenticate, authorize } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import { createResponse } from '../../helpers/response';
import { paginationSchema } from '../../validators/pagination';

const router = Router();
const querySchema = Joi.object({
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20)
  })
});

router.use(authenticate, authorize(['super_admin', 'admin', 'owner']));

function resolveAuditType(action: string) {
  const normalizedAction = String(action || '').toUpperCase();
  if (normalizedAction.startsWith('AUTH_')) return 'authentication';
  if (normalizedAction.startsWith('ATTENDANCE_')) return 'attendance';
  if (normalizedAction.startsWith('PAYMENT_') || normalizedAction.startsWith('FINANCE_') || normalizedAction.startsWith('EXPENSE_')) return 'finance';
  if (normalizedAction.startsWith('ROLE_') || normalizedAction.startsWith('PERMISSION_')) return 'rbac';
  if (normalizedAction.startsWith('REPORT_')) return 'reporting';
  return 'system';
}

router.get('/', validate(querySchema), async (req, res, next) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const [logs, total] = await Promise.all([
      AuditLog.find().sort({ createdAt: -1 }).lean().skip((page - 1) * limit).limit(limit),
      AuditLog.countDocuments()
    ]);
    res.json(createResponse(logs.map((log: any) => ({
      ...log,
      type: log.type ?? resolveAuditType(log.action),
      severity: log.severity ?? 'info'
    })), '', { page, limit, total }));
  } catch (error) {
    next(error);
  }
});

export const auditRouter = router;
