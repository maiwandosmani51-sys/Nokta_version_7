import { Router, type Request } from 'express';
import Joi from 'joi';
import { authenticate, authorize } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import { createError, createResponse } from '../../helpers/response';
import { paginationSchema } from '../../validators/pagination';
import { Expense } from '../../models/Expense';
import { Payment } from '../../models/Payment';
import { Student } from '../../models/Student';
import { User } from '../../models/User';

const router = Router();

function serializePayment(payment: any) {
  return {
    ...payment,
    studentName: [payment?.studentId?.firstName, payment?.studentId?.lastName].filter(Boolean).join(' ').trim(),
    studentRollNo: payment?.studentId?.rollNo ?? payment?.studentId?.studentId ?? '',
    invoiceNumber: payment?._id ? `INV-${String(payment._id).slice(-8).toUpperCase()}` : '',
    remainingBalance: Number(payment?.studentId?.remainingBalance ?? 0)
  };
}

const paymentSchema = Joi.object({
  body: Joi.object({
    studentId: Joi.string().hex().length(24).required(),
    amount: Joi.number().positive().required(),
    method: Joi.string().valid('cash', 'bank_transfer', 'mobile_money', 'card').optional(),
    referenceNumber: Joi.string().allow('', null).optional(),
    notes: Joi.string().allow('', null).optional(),
    branchId: Joi.string().hex().length(24).optional()
  })
});

router.use(authenticate);

async function getScopedPaymentStudentIds(req: Request) {
  const role = req.user?.canonicalRole;
  if (!role || !req.user?.userId) {
    return null;
  }

  if (role === 'student') {
    const user = await User.findById(req.user.userId).select('studentId').lean<Record<string, any>>();
    if (!user?.studentId) {
      return [];
    }
    const student = await Student.findOne({ studentId: user.studentId, isDeleted: false }).select('_id').lean<Record<string, any>>();
    return student ? [student._id] : [];
  }

  if (role === 'parent') {
    const user = await User.findById(req.user.userId).select('familyId parentProfileId').lean<Record<string, any>>();
    const filter: Record<string, unknown> = { isDeleted: false };
    if (user?.familyId) {
      filter.familyId = user.familyId;
    } else if (user?.parentProfileId) {
      filter.parentProfileId = user.parentProfileId;
    } else {
      return [];
    }

    const students = await Student.find(filter).select('_id').lean();
    return students.map((student: any) => student._id);
  }

  return null;
}

router.get('/', authorize(['super_admin', 'admin', 'branch_manager', 'owner', 'student', 'parent']), validate(paginationSchema), async (req, res, next) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const filter: Record<string, unknown> = { isDeleted: false };
    if (req.query.studentId) {
      filter.studentId = req.query.studentId;
    }

    const scopedStudentIds = await getScopedPaymentStudentIds(req);
    if (Array.isArray(scopedStudentIds)) {
      filter.studentId = { $in: scopedStudentIds };
    }

    const [payments, total] = await Promise.all([
      Payment.find(filter)
        .populate('studentId', 'firstName lastName studentId rollNo remainingBalance')
        .lean()
        .sort({ paymentDate: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Payment.countDocuments(filter)
    ]);

    res.json(createResponse(payments.map(serializePayment), '', { page, limit, total }));
  } catch (error) {
    next(error);
  }
});

router.post('/', authorize(['super_admin', 'admin', 'branch_manager']), validate(paymentSchema), async (req, res, next) => {
  try {
    const student = await Student.findOne({ _id: req.body.studentId, isDeleted: false }).lean<any>();
    if (!student) {
      return res.status(404).json(createError('Student not found'));
    }

    const payment = await Payment.create({
      ...req.body,
      studentId: student._id,
      branchId: req.body.branchId ?? student.branchId ?? req.user?.branchId ?? null,
      collectedBy: req.user?.userId ?? null,
      paymentDate: new Date()
    });

    const nextPaidAmount = Number(student.paidAmount || 0) + Number(req.body.amount);
    const nextRemainingBalance = Number(student.feeAmount || 0) - nextPaidAmount;

    await Student.updateOne(
      { _id: student._id },
      {
        $set: {
          paidAmount: nextPaidAmount,
          remainingBalance: nextRemainingBalance
        }
      }
    );

    await Expense.create({
      branchId: payment.branchId ?? null,
      title: `Student fee payment - ${student.firstName} ${student.lastName}`,
      amount: Number(req.body.amount),
      category: 'income',
      date: payment.paymentDate,
      createdBy: req.user?.userId ?? null,
      notes: req.body.notes ?? ''
    });

    const populatedPayment = await Payment.findById(payment._id)
      .populate('studentId', 'firstName lastName studentId rollNo remainingBalance')
      .lean();

    res.status(201).json(createResponse(serializePayment(populatedPayment), 'Payment recorded successfully'));
  } catch (error) {
    next(error);
  }
});

router.get('/:id/invoice', authorize(['super_admin', 'admin', 'branch_manager', 'owner', 'student', 'parent']), async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('studentId', 'firstName lastName studentId rollNo feeAmount paidAmount remainingBalance')
      .populate('collectedBy', 'name email')
      .lean<any>();

    if (!payment || payment.isDeleted) {
      return res.status(404).json(createError('Payment invoice not found'));
    }

    res.json(createResponse({
      ...serializePayment(payment),
      issuedAt: payment.paymentDate,
      collectedByName: (payment as any).collectedBy?.name ?? '',
      studentFeeAmount: Number((payment as any).studentId?.feeAmount ?? 0),
      totalPaidAmount: Number((payment as any).studentId?.paidAmount ?? 0)
    }));
  } catch (error) {
    next(error);
  }
});

export const paymentRouter = router;
