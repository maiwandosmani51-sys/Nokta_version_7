import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, CartesianGrid, Legend, LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/shared/components/Common';
import { reportsService } from '@/features/reports/services/reportsService';

const COLORS = ['#38bdf8', '#22c55e', '#f97316', '#a855f7', '#fb7185', '#facc15'];

export function ReportsPage() {
  const { t } = useTranslation();
  const { data, isError } = useQuery({
    queryKey: ['reports-analytics'],
    queryFn: reportsService.analytics
  });

  const cards = data?.cards;
  const charts = data?.charts;

  return (
    <div className="space-y-6">
      <PageHeader title="common.reports" description="common.live_school_metrics" />

      {isError && <Card className="p-6 text-rose-200">{t('errors.unable_load_records', { defaultValue: 'Unable to load report analytics.' })}</Card>}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="p-6"><p className="text-sm text-slate-400">Total Students</p><p className="mt-3 text-3xl font-semibold text-white">{cards?.totalStudents?.toLocaleString?.() ?? 0}</p></Card>
        <Card className="p-6"><p className="text-sm text-slate-400">Total Teachers</p><p className="mt-3 text-3xl font-semibold text-white">{cards?.totalTeachers?.toLocaleString?.() ?? 0}</p></Card>
        <Card className="p-6"><p className="text-sm text-slate-400">Total Classes</p><p className="mt-3 text-3xl font-semibold text-white">{cards?.totalClasses?.toLocaleString?.() ?? 0}</p></Card>
        <Card className="p-6"><p className="text-sm text-slate-400">Total Exams</p><p className="mt-3 text-3xl font-semibold text-white">{cards?.totalExams?.toLocaleString?.() ?? 0}</p></Card>
        <Card className="p-6"><p className="text-sm text-slate-400">Total Results</p><p className="mt-3 text-3xl font-semibold text-white">{cards?.totalResults?.toLocaleString?.() ?? 0}</p></Card>
        <Card className="p-6"><p className="text-sm text-slate-400">Total Branches</p><p className="mt-3 text-3xl font-semibold text-white">{cards?.totalBranches?.toLocaleString?.() ?? 0}</p></Card>
        <Card className="p-6"><p className="text-sm text-slate-400">Total Income</p><p className="mt-3 text-3xl font-semibold text-white">{cards?.totalIncome?.toLocaleString?.() ?? 0}</p></Card>
        <Card className="p-6"><p className="text-sm text-slate-400">Monthly Revenue</p><p className="mt-3 text-3xl font-semibold text-white">{cards?.monthlyRevenue?.toLocaleString?.() ?? 0}</p></Card>
        <Card className="p-6"><p className="text-sm text-slate-400">Monthly Expenses</p><p className="mt-3 text-3xl font-semibold text-white">{cards?.monthlyExpenses?.toLocaleString?.() ?? 0}</p></Card>
        <Card className="p-6"><p className="text-sm text-slate-400">Attendance Summary</p><p className="mt-3 text-3xl font-semibold text-white">{((cards?.attendanceSummary?.present ?? 0) + (cards?.attendanceSummary?.absent ?? 0)).toLocaleString()}</p></Card>
        <Card className="p-6"><p className="text-sm text-slate-400">Payment Summary</p><p className="mt-3 text-3xl font-semibold text-white">{cards?.paymentSummary?.totalCollected?.toLocaleString?.() ?? 0}</p></Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="p-6">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Student Growth</p>
          <div className="mt-6 h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts?.studentGrowth ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                <XAxis dataKey="label" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Bar dataKey="total" fill="#38bdf8" radius={[12, 12, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Payment Growth</p>
          <div className="mt-6 h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={charts?.paymentGrowth ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                <XAxis dataKey="label" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Line type="monotone" dataKey="total" stroke="#22c55e" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Expense Comparison</p>
          <div className="mt-6 h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts?.expenseComparison ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                <XAxis dataKey="label" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Bar dataKey="total" fill="#f97316" radius={[12, 12, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Attendance Trend</p>
          <div className="mt-6 h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={charts?.attendanceTrend ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                <XAxis dataKey="label" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="present" stroke="#22c55e" strokeWidth={3} />
                <Line type="monotone" dataKey="absent" stroke="#ef4444" strokeWidth={3} />
                <Line type="monotone" dataKey="late" stroke="#facc15" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Expense Breakdown</p>
        <div className="mt-6 h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={charts?.expenseBreakdown ?? []} dataKey="total" nameKey="category" outerRadius={120}>
                {(charts?.expenseBreakdown ?? []).map((entry, index) => (
                  <Cell key={entry.category} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
