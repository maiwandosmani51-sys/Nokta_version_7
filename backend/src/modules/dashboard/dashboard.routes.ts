import { Router } from 'express';
import { authenticate, authorize } from '../../middlewares/auth';
import { createResponse } from '../../helpers/response';
import { AuditLog } from '../../models/AuditLog';
import { Book } from '../../models/Book';
import { Branch } from '../../models/Branch';
import { ClassModel } from '../../models/Class';
import { Attendance } from '../../models/Attendance';
import { Expense } from '../../models/Expense';
import { Family } from '../../models/Family';
import { FinanceEntry } from '../../models/FinanceEntry';
import { Notification } from '../../models/Notification';
import { Payment } from '../../models/Payment';
import { Report } from '../../models/Report';
import { Result } from '../../models/Result';
import { Role } from '../../models/Role';
import { Subject } from '../../models/Subject';
import { Student } from '../../models/Student';
import { User } from '../../models/User';
import { Exam } from '../../models/Exam';

const router = Router();

router.use(authenticate, authorize(['super_admin', 'admin', 'branch_manager', 'teacher', 'accountant', 'librarian', 'student', 'family_student', 'parent', 'owner']));

function buildTrendMonths(start: Date, count: number) {
  return Array.from({ length: count }, (_, index) => {
    const monthDate = new Date(start.getFullYear(), start.getMonth() + index, 1);
    return {
      year: monthDate.getFullYear(),
      month: monthDate.getMonth() + 1
    };
  });
}

router.get('/summary', async (_req, res, next) => {
  try {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1, 0, 0, 0, 0);
    const months = buildTrendMonths(startDate, 6);

    const [
      totalStudents,
      totalTeachers,
      totalClasses,
      totalSubjects,
      totalBranches,
      totalBooks,
      totalNotifications,
      totalUsers,
      totalFamilies,
      paymentTotals,
      manualIncomeTotals,
      expenseTotals,
      studentBalance,
      totalAuditLogs,
      studentTrend,
      teacherTrend,
      monthlyPayments,
      monthlyManualIncome,
      monthlyExpenses,
      expenseCategoryBreakdown
    ] = await Promise.all([
      Student.countDocuments({ isDeleted: false }),
      User.countDocuments({ role: 'teacher', isDeleted: false }),
      ClassModel.countDocuments({ isDeleted: false }),
      Subject.countDocuments({ isDeleted: false }),
      Branch.countDocuments({ isDeleted: false }),
      Book.countDocuments({ isDeleted: false }),
      Notification.countDocuments({ isDeleted: false }),
      User.countDocuments({ isDeleted: false }),
      Family.countDocuments({ isDeleted: false }),
      Payment.aggregate([{ $match: { isDeleted: false } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      FinanceEntry.aggregate([{ $match: { isDeleted: false } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Expense.aggregate([{ $match: { isDeleted: false, category: { $ne: 'income' } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Student.aggregate([{ $match: { isDeleted: false } }, { $group: { _id: null, total: { $sum: '$remainingBalance' } } }]),
      AuditLog.countDocuments({ isDeleted: false }),
      Student.aggregate([
        { $match: { isDeleted: false, createdAt: { $gte: startDate } } },
        { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, total: { $sum: 1 } } },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]),
      User.aggregate([
        { $match: { role: 'teacher', isDeleted: false, createdAt: { $gte: startDate } } },
        { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, total: { $sum: 1 } } },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]),
      Payment.aggregate([
        { $match: { isDeleted: false, paymentDate: { $gte: startDate } } },
        { $group: { _id: { year: { $year: '$paymentDate' }, month: { $month: '$paymentDate' } }, total: { $sum: '$amount' } } },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]),
      FinanceEntry.aggregate([
        { $match: { isDeleted: false, date: { $gte: startDate } } },
        { $group: { _id: { year: { $year: '$date' }, month: { $month: '$date' } }, total: { $sum: '$amount' } } },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]),
      Expense.aggregate([
        { $match: { isDeleted: false, category: { $ne: 'income' }, date: { $gte: startDate } } },
        { $group: { _id: { year: { $year: '$date' }, month: { $month: '$date' } }, total: { $sum: '$amount' } } },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]),
      Expense.aggregate([
        { $match: { isDeleted: false, category: { $ne: 'income' } } },
        { $group: { _id: '$category', total: { $sum: '$amount' } } },
        { $sort: { total: -1 } },
        { $limit: 6 }
      ])
    ]);

    const enrollmentTrend = months.map((month) => ({
      year: month.year,
      month: month.month,
      students:
        studentTrend.find((entry: { _id: { year: number; month: number }; total: number }) => entry._id.year === month.year && entry._id.month === month.month)?.total ?? 0,
      teachers:
        teacherTrend.find((entry: { _id: { year: number; month: number }; total: number }) => entry._id.year === month.year && entry._id.month === month.month)?.total ?? 0
    }));

    const monthlyFinances = months.map((month) => ({
      year: month.year,
      month: month.month,
      income:
        (monthlyPayments.find((entry: { _id: { year: number; month: number }; total: number }) => entry._id.year === month.year && entry._id.month === month.month)?.total ?? 0) +
        (monthlyManualIncome.find((entry: { _id: { year: number; month: number }; total: number }) => entry._id.year === month.year && entry._id.month === month.month)?.total ?? 0),
      expenses:
        monthlyExpenses.find((entry: { _id: { year: number; month: number }; total: number }) => entry._id.year === month.year && entry._id.month === month.month)?.total ?? 0
    }));

    res.json(createResponse({
      totalStudents,
      totalTeachers,
      totalClasses,
      totalSubjects,
      totalBranches,
      totalBooks,
      totalNotifications,
      totalUsers,
      totalFamilies,
      incomeTotal: (paymentTotals[0]?.total ?? 0) + (manualIncomeTotals[0]?.total ?? 0),
      expenseTotal: expenseTotals[0]?.total ?? 0,
      outstandingBalance: studentBalance[0]?.total ?? 0,
      totalAuditLogs,
      enrollmentTrend,
      monthlyFinances,
      expenseCategoryBreakdown: expenseCategoryBreakdown.map((entry: { _id: string; total: number }) => ({
        category: entry._id,
        total: entry.total
      }))
    }));
  } catch (error) {
    next(error);
  }
});

router.get('/master-summary', authorize(['super_admin']), async (_req, res, next) => {
  try {
    const [
      users,
      students,
      teachers,
      classes,
      subjects,
      attendance,
      exams,
      results,
      payments,
      financeEntries,
      expenses,
      reports,
      branches,
      notifications,
      auditLogs,
      roles
    ] = await Promise.all([
      User.countDocuments({ isDeleted: false }),
      Student.countDocuments({ isDeleted: false }),
      User.countDocuments({ role: 'teacher', isDeleted: false }),
      ClassModel.countDocuments({ isDeleted: false }),
      Subject.countDocuments({ isDeleted: false }),
      Attendance.countDocuments({ isDeleted: false }),
      Exam.countDocuments({ isDeleted: false }),
      Result.countDocuments({ isDeleted: false }),
      Payment.countDocuments({ isDeleted: false }),
      FinanceEntry.countDocuments({ isDeleted: false }),
      Expense.countDocuments({ isDeleted: false, category: { $ne: 'income' } }),
      Report.countDocuments({ isDeleted: false }),
      Branch.countDocuments({ isDeleted: false }),
      Notification.countDocuments({ isDeleted: false }),
      AuditLog.countDocuments({ isDeleted: false }),
      Role.countDocuments({ isDeleted: false })
    ]);

    res.json(createResponse({
      users,
      students,
      teachers,
      classes,
      subjects,
      attendance,
      exams,
      results,
      payments,
      finance: financeEntries,
      expenses,
      reports,
      branches,
      notifications,
      audit: auditLogs,
      roles
    }));
  } catch (error) {
    next(error);
  }
});

export const dashboardRouter = router;
