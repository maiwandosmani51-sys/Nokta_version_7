import { api } from '@/services/apiClient';

export interface FinanceSummary {
  totalIncome: number;
  studentPayments: number;
  pendingPayments: number;
  paidInvoices: number;
  teacherSalaryPayments: number;
  manualIncome: number;
  monthlyRevenue: Array<{ year: number; month: number; revenue: number }>;
  monthlyPendingBalances: Array<{ year: number; month: number; total: number }>;
  salaryPayoutTrend: Array<{ year: number; month: number; total: number }>;
  branchIncome: Array<{ branch: string; total: number }>;
}

export interface FinanceRecord {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  source: string;
  notes?: string;
}

export const financeService = {
  summary: () => api.get('/finance/summary').then((res) => res.data.data as FinanceSummary),
  list: () => api.get('/finance', { params: { limit: 100 } }).then((res) => res.data.data as FinanceRecord[])
};
