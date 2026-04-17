import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { BarChart3, CreditCard, DollarSign, TrendingUp, Users } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { chartTheme } from '@/constants/chartTheme';
import { ChartCard, EmptyStateCard } from '@/features/dashboard/components/DashboardWidgets';

const COLORS = ['#38bdf8', '#22c55e', '#f97316', '#a855f7', '#fb7185', '#0ea5e9'];

interface FinancialSummary {
  monthlyFinances?: Array<{ year: number; month: number; income: number; expenses: number }>;
  expenseCategoryBreakdown?: Array<{ category: string; total: number }>;
  enrollmentTrend?: Array<{ year: number; month: number; students: number; teachers: number }>;
}

interface DashboardAnalyticsProps {
  summary: FinancialSummary;
  loading?: boolean;
}

function monthLabel(year: number, month: number, locale: string) {
  return new Date(year, month - 1, 1).toLocaleString(locale, { month: 'short', year: 'numeric' });
}

function renderPieLabel({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  name,
  percent
}: {
  cx?: number;
  cy?: number;
  midAngle?: number;
  innerRadius?: number;
  outerRadius?: number;
  name?: string;
  percent?: number;
}) {
  if (
    cx === undefined ||
    cy === undefined ||
    midAngle === undefined ||
    innerRadius === undefined ||
    outerRadius === undefined ||
    percent === undefined
  ) {
    return null;
  }

  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos((-midAngle * Math.PI) / 180);
  const y = cy + radius * Math.sin((-midAngle * Math.PI) / 180);

  return (
    <text
      x={x}
      y={y}
      fill="var(--color-chart-axis)"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      fontSize="12"
      fontWeight="600"
    >
      {`${name}: ${Math.round(percent * 100)}%`}
    </text>
  );
}

export default function DashboardAnalytics({ summary, loading }: DashboardAnalyticsProps) {
  const { i18n, t } = useTranslation();

  const monthlyFinances = summary.monthlyFinances ?? [];
  const enrollmentTrend = summary.enrollmentTrend ?? [];
  const expenseCategoryBreakdown = summary.expenseCategoryBreakdown ?? [];

  const formattedMonthlyFinances = useMemo(
    () =>
      monthlyFinances.map((item) => ({
        ...item,
        monthLabel: monthLabel(item.year, item.month, i18n.language)
      })),
    [monthlyFinances, i18n.language]
  );

  const formattedEnrollmentTrend = useMemo(
    () =>
      enrollmentTrend.map((item) => ({
        ...item,
        month: monthLabel(item.year, item.month, i18n.language)
      })),
    [enrollmentTrend, i18n.language]
  );

  const totalIncome = useMemo(() => monthlyFinances.reduce((sum, item) => sum + item.income, 0), [monthlyFinances]);
  const totalExpenses = useMemo(() => monthlyFinances.reduce((sum, item) => sum + item.expenses, 0), [monthlyFinances]);

  if (loading) {
    return (
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="h-80 rounded-3xl bg-slate-800/70" />
        ))}
      </div>
    );
  }

  if (!monthlyFinances.length && !enrollmentTrend.length && !expenseCategoryBreakdown.length) {
    return (
      <div className="grid gap-4 xl:grid-cols-3">
        <EmptyStateCard
          title={t('common.no_data')}
          description={t('common.live_school_metrics')}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <ChartCard title={t('common.chart_monthly_finance')} action={<DollarSign className="h-5 w-5 text-green-400" />}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={formattedMonthlyFinances} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
              <XAxis dataKey="monthLabel" tick={{ fill: chartTheme.axis, fontSize: 12 }} />
              <YAxis tick={{ fill: chartTheme.axis, fontSize: 12 }} />
              <Tooltip contentStyle={chartTheme.tooltip} />
              <Line type="monotone" dataKey="income" stroke="#22c55e" strokeWidth={3} name={t('common.monthly_income')} />
              <Line type="monotone" dataKey="expenses" stroke="#f97316" strokeWidth={3} name={t('common.monthly_expenses')} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={t('common.chart_enrollment_trend')} action={<Users className="h-5 w-5 text-sky-500" />}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={formattedEnrollmentTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
              <XAxis dataKey="month" tick={{ fill: chartTheme.axis, fontSize: 12 }} />
              <YAxis tick={{ fill: chartTheme.axis, fontSize: 12 }} />
              <Tooltip contentStyle={chartTheme.tooltip} />
              <Bar dataKey="students" fill="#38bdf8" name={t('common.students')} />
              <Bar dataKey="teachers" fill="#a855f7" name={t('common.teachers')} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={t('common.chart_expense_breakdown')} action={<BarChart3 className="h-5 w-5 text-orange-400" />}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip contentStyle={chartTheme.tooltip} />
              <Legend verticalAlign="bottom" wrapperStyle={chartTheme.legend} />
              <Pie
                data={expenseCategoryBreakdown}
                dataKey="total"
                nameKey="category"
                innerRadius={54}
                outerRadius={104}
                paddingAngle={4}
                label={renderPieLabel}
              >
                {expenseCategoryBreakdown.map((entry, index) => (
                  <Cell key={entry.category} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-wider text-slate-400">{t('common.cash_flow')}</p>
              <h3 className="mt-3 text-3xl font-semibold text-white">${(totalIncome - totalExpenses).toLocaleString()}</h3>
            </div>
            <TrendingUp className="h-8 w-8 rounded-lg bg-blue-50 p-2 text-green-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-wider text-slate-400">{t('common.total_income')}</p>
              <h3 className="mt-3 text-3xl font-semibold text-white">${totalIncome.toLocaleString()}</h3>
            </div>
            <DollarSign className="h-8 w-8 rounded-lg bg-green-50 p-2 text-green-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-wider text-slate-400">{t('finance.total_expenses')}</p>
              <h3 className="mt-3 text-3xl font-semibold text-white">${totalExpenses.toLocaleString()}</h3>
            </div>
            <CreditCard className="h-8 w-8 rounded-lg bg-rose-50 p-2 text-rose-500" />
          </div>
        </Card>
      </div>
    </div>
  );
}
