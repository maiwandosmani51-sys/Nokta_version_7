import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, CartesianGrid, XAxis, YAxis } from 'recharts';
import { useTranslation } from 'react-i18next';
import { ArrowUpDown } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { PageHeader, SearchFilterBar } from '@/shared/components/Common';
import { expenseService } from '@/features/finance/services/expenseService';
import { useDebounce } from '@/hooks/useDebounce';
import { matchesSearch, sortCollection, type ListSortDirection, type ListSortField } from '@/utils/listSearchSort';

const COLORS = ['#f97316', '#ef4444', '#eab308', '#14b8a6', '#38bdf8', '#a855f7'];

export function ExpensesPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<ListSortField>('date');
  const [sortDirection, setSortDirection] = useState<ListSortDirection>('desc');
  const { data: summary, isError } = useQuery({
    queryKey: ['expense-summary'],
    queryFn: expenseService.summary
  });

  const { data: records, isLoading: recordsLoading } = useQuery({
    queryKey: ['expense-records'],
    queryFn: expenseService.list
  });
  const debouncedSearch = useDebounce(search, 300);
  const recordSortOptions = useMemo(
    () => [
      { value: 'name', label: t('common.sort_name', { defaultValue: 'Sort by Name' }) },
      { value: 'date', label: t('common.sort_date', { defaultValue: 'Sort by Date' }) }
    ],
    [t]
  );
  const visibleRecords = useMemo(() => {
    const filtered = (records ?? []).filter((record) => matchesSearch(record, debouncedSearch));
    return sortCollection(filtered, sortField, sortDirection);
  }, [debouncedSearch, records, sortDirection, sortField]);

  return (
    <div className="space-y-6">
      <PageHeader title="common.expenses" description="common.live_school_metrics" />

      {isError && <Card className="p-6 text-rose-200">{t('errors.unable_load_records', { defaultValue: 'Unable to load expense data.' })}</Card>}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card className="p-6"><p className="text-sm text-slate-400">{t('finance.operating_expenses', { defaultValue: 'Operating Expenses' })}</p><p className="mt-3 text-3xl font-semibold text-white">{summary?.totalExpenses?.toLocaleString?.() ?? 0}</p></Card>
        <Card className="p-6"><p className="text-sm text-slate-400">{t('finance.teacher_salaries', { defaultValue: 'Teacher Salaries' })}</p><p className="mt-3 text-3xl font-semibold text-white">{summary?.teacherSalaries?.toLocaleString?.() ?? 0}</p></Card>
        <Card className="p-6"><p className="text-sm text-slate-400">{t('finance.expense_categories', { defaultValue: 'Expense Categories' })}</p><p className="mt-3 text-3xl font-semibold text-white">{summary?.categories?.length ?? 0}</p></Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="p-6">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">{t('finance.expense_breakdown', { defaultValue: 'Expense Breakdown' })}</p>
          <div className="mt-6 h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={summary?.categories ?? []} dataKey="total" nameKey="category" outerRadius={110}>
                  {(summary?.categories ?? []).map((entry, index) => (
                    <Cell key={entry.category} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">{t('finance.monthly_expense_trend', { defaultValue: 'Monthly Expense Trend' })}</p>
          <div className="mt-6 h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary?.monthlyExpenses ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Bar dataKey="total" fill="#f97316" radius={[12, 12, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">{t('finance.recent_expenses', { defaultValue: 'Recent Expenses' })}</p>
          <div className="mt-4 space-y-4">
            <SearchFilterBar
              value={search}
              onChange={setSearch}
              placeholder={t('common.search_placeholder', { entity: t('finance.recent_expenses', { defaultValue: 'Recent Expenses' }) })}
              createVisible={false}
              extraActions={
                <>
                  <div className="w-full sm:w-56">
                    <Select
                      value={sortField}
                      options={recordSortOptions}
                      placeholder={t('common.sort', { defaultValue: 'Sort' })}
                      onChange={(value) => setSortField(String(value) as ListSortField)}
                    />
                  </div>
                  <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'))}>
                    <ArrowUpDown className="h-4 w-4" />
                    {t(sortDirection === 'asc' ? 'common.ascending' : 'common.descending', {
                      defaultValue: sortDirection === 'asc' ? 'ASC' : 'DESC'
                    })}
                  </Button>
                </>
              }
            />
            <div className="space-y-3">
              {visibleRecords.slice(0, 12).map((record) => (
              <div key={record._id} className="rounded-2xl border border-slate-800/80 bg-slate-950/70 p-4">
                <div className="font-medium text-white">{record.title}</div>
                <div className="mt-1 text-sm text-slate-400">{record.category}</div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-slate-300">{new Date(record.date).toLocaleDateString()}</span>
                  <span className="font-semibold text-rose-400">{record.amount.toLocaleString()}</span>
                </div>
              </div>
              ))}
              {recordsLoading && <div className="text-slate-400">{t('common.loading', { defaultValue: 'Loading...' })}</div>}
              {!recordsLoading && !visibleRecords.length && <div className="text-slate-400">{t('common.no_records_found', { defaultValue: 'No expense records found.' })}</div>}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
