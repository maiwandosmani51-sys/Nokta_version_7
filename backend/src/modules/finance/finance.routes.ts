import { Router } from 'express';
import Joi from 'joi';
import { Branch } from '../../models/Branch';
import { FinanceEntry } from '../../models/FinanceEntry';
import { Payment } from '../../models/Payment';
import { Salary } from '../../models/Salary';
import { Student } from '../../models/Student';
import { authenticate, authorize } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import { createResponse } from '../../helpers/response';
import { paginationSchema } from '../../validators/pagination';

const router = Router();

const financeSchema = Joi.object({
  body: Joi.object({
    title: Joi.string().required(),
    amount: Joi.number().positive().required(),
    category: Joi.string().required(),
    date: Joi.date().optional(),
    notes: Joi.string().allow('', null),
    branchId: Joi.string().hex().length(24).allow(null).optional()
  })
});

function buildMonths(start: Date, count: number) {
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(start.getFullYear(), start.getMonth() + index, 1);
    return { year: date.getFullYear(), month: date.getMonth() + 1 };
  });
}

router.use(authenticate, authorize(['super_admin', 'admin', 'accountant', 'branch_manager', 'owner']));

router.get('/summary', async (_req, res, next) => {
  try {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1, 0, 0, 0, 0);

    const [paymentsTotal, manualIncomeTotal, pendingPayments, paidInvoices, salaryPayments, monthlyPayments, monthlyManualIncome, monthlyPendingBalancesRaw, salaryTrendRaw, branches] = await Promise.all([
      Payment.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      FinanceEntry.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Student.aggregate([
        { $match: { isDeleted: false, remainingBalance: { $gt: 0 } } },
        { $group: { _id: null, total: { $sum: '$remainingBalance' } } }
      ]),
      Payment.countDocuments({ isDeleted: false }),
      Salary.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: null, total: { $sum: '$netAmount' } } }
      ]),
      Payment.aggregate([
        { $match: { isDeleted: false, paymentDate: { $gte: startDate } } },
        {
          $group: {
            _id: {
              year: { $year: '$paymentDate' },
              month: { $month: '$paymentDate' }
            },
            total: { $sum: '$amount' }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]),
      FinanceEntry.aggregate([
        { $match: { isDeleted: false, date: { $gte: startDate } } },
        {
          $group: {
            _id: {
              year: { $year: '$date' },
              month: { $month: '$date' }
            },
            total: { $sum: '$amount' }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]),
      Student.aggregate([
        { $match: { isDeleted: false, remainingBalance: { $gt: 0 }, createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            total: { $sum: '$remainingBalance' }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]),
      Salary.aggregate([
        { $match: { isDeleted: false, createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            total: { $sum: '$netAmount' }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]),
      Branch.find({ isDeleted: false }).select('name').lean()
    ]);

    const months = buildMonths(startDate, 6);
    const monthlyRevenue = months.map((month) => ({
      year: month.year,
      month: month.month,
      revenue:
        (monthlyPayments.find((entry: any) => entry._id.year === month.year && entry._id.month === month.month)?.total ?? 0) +
        (monthlyManualIncome.find((entry: any) => entry._id.year === month.year && entry._id.month === month.month)?.total ?? 0)
    }));
    const monthlyPendingBalances = months.map((month) => ({
      year: month.year,
      month: month.month,
      total: monthlyPendingBalancesRaw.find((entry: any) => entry._id.year === month.year && entry._id.month === month.month)?.total ?? 0
    }));
    const salaryPayoutTrend = months.map((month) => ({
      year: month.year,
      month: month.month,
      total: salaryTrendRaw.find((entry: any) => entry._id.year === month.year && entry._id.month === month.month)?.total ?? 0
    }));

    const paymentsByBranch = await Payment.aggregate([
      { $match: { isDeleted: false, branchId: { $ne: null } } },
      { $group: { _id: '$branchId', total: { $sum: '$amount' } } }
    ]);

    const branchIncome = branches.map((branch: any) => ({
      branch: branch.name,
      total: paymentsByBranch.find((entry: any) => String(entry._id) === String(branch._id))?.total ?? 0
    }));

    res.json(createResponse({
      totalIncome: (paymentsTotal[0]?.total ?? 0) + (manualIncomeTotal[0]?.total ?? 0),
      studentPayments: paymentsTotal[0]?.total ?? 0,
      monthlyRevenue,
      monthlyPendingBalances,
      pendingPayments: pendingPayments[0]?.total ?? 0,
      paidInvoices,
      branchIncome,
      teacherSalaryPayments: salaryPayments[0]?.total ?? 0,
      salaryPayoutTrend,
      manualIncome: manualIncomeTotal[0]?.total ?? 0
    }));
  } catch (error) {
    next(error);
  }
});

router.post('/income', validate(financeSchema), async (req, res, next) => {
  try {
    const income = await FinanceEntry.create({
      ...req.body,
      branchId: req.body.branchId ?? req.user?.branchId ?? null,
      createdBy: req.user?.userId ?? null
    });

    res.status(201).json(createResponse(income, 'Income recorded'));
  } catch (error) {
    next(error);
  }
});

router.get('/', validate(paginationSchema), async (req, res, next) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);

    const [payments, financeEntries] = await Promise.all([
      Payment.find({ isDeleted: false })
        .populate('studentId', 'firstName lastName studentId')
        .lean(),
      FinanceEntry.find({ isDeleted: false }).lean()
    ]);

    const items = [
      ...payments.map((payment: any) => ({
        id: payment._id,
        title: `Student payment - ${payment.studentId?.firstName ?? ''} ${payment.studentId?.lastName ?? ''}`.trim(),
        amount: payment.amount,
        category: 'student_payment',
        date: payment.paymentDate,
        source: 'payment',
        referenceNumber: payment.referenceNumber ?? '',
        notes: payment.notes ?? ''
      })),
      ...financeEntries.map((entry: any) => ({
        id: entry._id,
        title: entry.title,
        amount: entry.amount,
        category: entry.category,
        date: entry.date,
        source: entry.source,
        notes: entry.notes ?? ''
      }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const paginatedItems = items.slice((page - 1) * limit, page * limit);

    res.json(createResponse(paginatedItems, '', { page, limit, total: items.length }));
  } catch (error) {
    next(error);
  }
});

export const financeRouter = router;
