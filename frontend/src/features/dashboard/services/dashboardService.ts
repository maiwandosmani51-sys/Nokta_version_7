import { api } from '@/services/apiClient';

export interface DashboardSummary {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  totalSubjects: number;
  totalUsers: number;
  totalFamilies: number;
  totalBooks: number;
  totalAuditLogs: number;
  totalNotifications: number;
  expenseTotal: number;
  incomeTotal: number;
  outstandingBalance: number;
  enrollmentTrend: Array<{ year: number; month: number; students: number; teachers: number }>;
  monthlyFinances: Array<{ year: number; month: number; income: number; expenses: number }>;
  expenseCategoryBreakdown: Array<{ category: string; total: number }>;
}

export interface MasterDashboardSummary {
  users: number;
  students: number;
  teachers: number;
  classes: number;
  subjects: number;
  attendance: number;
  exams: number;
  results: number;
  payments: number;
  finance: number;
  expenses: number;
  reports: number;
  branches: number;
  notifications: number;
  audit: number;
  roles: number;
}

export const dashboardService = {
  summary: () =>
    api.get('/dashboard/summary').then((res) => {
      const data = res.data.data ?? {};
      return {
        totalStudents: data.totalStudents ?? 0,
        totalTeachers: data.totalTeachers ?? 0,
        totalClasses: data.totalClasses ?? 0,
        totalSubjects: data.totalSubjects ?? 0,
        totalUsers: data.totalUsers ?? 0,
        totalFamilies: data.totalFamilies ?? 0,
        totalBooks: data.totalBooks ?? 0,
        totalAuditLogs: data.totalAuditLogs ?? 0,
        totalNotifications: data.totalNotifications ?? 0,
        expenseTotal: data.expenseTotal ?? 0,
        incomeTotal: data.incomeTotal ?? 0,
        outstandingBalance: data.outstandingBalance ?? 0,
        enrollmentTrend: Array.isArray(data.enrollmentTrend) ? data.enrollmentTrend : [],
        monthlyFinances: Array.isArray(data.monthlyFinances) ? data.monthlyFinances : [],
        expenseCategoryBreakdown: Array.isArray(data.expenseCategoryBreakdown) ? data.expenseCategoryBreakdown : []
      } satisfies DashboardSummary;
    }),
  masterSummary: () =>
    api.get('/dashboard/master-summary').then((res) => {
      const data = res.data.data ?? {};
      return {
        users: data.users ?? 0,
        students: data.students ?? 0,
        teachers: data.teachers ?? 0,
        classes: data.classes ?? 0,
        subjects: data.subjects ?? 0,
        attendance: data.attendance ?? 0,
        exams: data.exams ?? 0,
        results: data.results ?? 0,
        payments: data.payments ?? 0,
        finance: data.finance ?? 0,
        expenses: data.expenses ?? 0,
        reports: data.reports ?? 0,
        branches: data.branches ?? 0,
        notifications: data.notifications ?? 0,
        audit: data.audit ?? 0,
        roles: data.roles ?? 0
      } satisfies MasterDashboardSummary;
    })
};
