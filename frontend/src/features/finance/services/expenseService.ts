import { api } from '@/services/apiClient';

export interface ExpenseSummary {
  totalExpenses: number;
  teacherSalaries: number;
  monthlyExpenses: Array<{ year: number; month: number; total: number }>;
  categories: Array<{ category: string; total: number }>;
}

export interface ExpenseRecord {
  _id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  notes?: string;
}

export const expenseService = {
  summary: () => api.get('/expenses/summary').then((res) => res.data.data as ExpenseSummary),
  list: () => api.get('/expenses', { params: { limit: 100 } }).then((res) => res.data.data as ExpenseRecord[])
};
