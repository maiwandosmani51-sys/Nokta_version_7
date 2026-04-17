import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { BarChart, Bar, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useTranslation } from 'react-i18next';
import { ArrowUpDown } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { PageHeader, SearchFilterBar } from '@/shared/components/Common';
import { financeService } from '@/features/finance/services/financeService';
import { useDebounce } from '@/hooks/useDebounce';
import { matchesSearch, sortCollection, type ListSortDirection, type ListSortField } from '@/utils/listSearchSort';

export function FinancePage() {
  const { t, i18n } = useTranslation();
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<ListSortField>('date');
  const [sortDirection, setSortDirection] = useState<ListSortDirection>('desc');
  const { data: summary, isError } = useQuery({
    queryKey: ['finance-summary'],
    queryFn: financeService.summary
  });

  const { data: records, isLoading: recordsLoading } = useQuery({
    queryKey: ['finance-records'],
    queryFn: financeService.list
  });

  const locale = useMemo(() => {
    if (i18n.resolvedLanguage === 'fa') return 'fa-AF';
    if (i18n.resolvedLanguage === 'ps') return 'ps-AF';
    return 'en-US';
  }, [i18n.resolvedLanguage]);
  const debouncedSearch = useDebounce(search, 300);

  const monthlyRevenue = useMemo(
    () => (summary?.monthlyRevenue ?? []).map((item) => ({
      ...item,
      monthLabel: new Date(item.year, item.month - 1, 1).toLocaleDateString(locale, { month: 'short' })
    })),
    [locale, summary?.monthlyRevenue]
  );

  const monthlyPendingBalances = useMemo(
    () => (summary?.monthlyPendingBalances ?? []).map((item) => ({
      ...item,
      monthLabel: new Date(item.year, item.month - 1, 1).toLocaleDateString(locale, { month: 'short' })
    })),
    [locale, summary?.monthlyPendingBalances]
  );

  const salaryPayoutTrend = useMemo(
    () => (summary?.salaryPayoutTrend ?? []).map((item) => ({
      ...item,
      monthLabel: new Date(item.year, item.month - 1, 1).toLocaleDateString(locale, { month: 'short' })
    })),
    [locale, summary?.salaryPayoutTrend]
  );

  const metricCards = [
    {
      key: 'total-income',
      label: t('finance.total_income', { defaultValue: 'Total Income' }),
      value: summary?.totalIncome?.toLocaleString?.() ?? '0',
      accent: 'from-emerald-400/30 via-emerald-500/10 to-transparent'
    },
    {
      key: 'student-payments',
      label: t('payments.student_payments', { defaultValue: 'Student Payments' }),
      value: summary?.studentPayments?.toLocaleString?.() ?? '0',
      accent: 'from-sky-400/30 via-sky-500/10 to-transparent'
    },
    {
      key: 'pending-payments',
      label: t('payments.pending_payments', { defaultValue: 'Pending Payments' }),
      value: summary?.pendingPayments?.toLocaleString?.() ?? '0',
      accent: 'from-amber-400/30 via-amber-500/10 to-transparent'
    },
    {
      key: 'salary-payments',
      label: t('finance.teacher_salary_payments', { defaultValue: 'Teacher Salary Payments' }),
      value: summary?.teacherSalaryPayments?.toLocaleString?.() ?? '0',
      accent: 'from-fuchsia-400/30 via-fuchsia-500/10 to-transparent'
    }
  ];

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
      <PageHeader title="common.finance" description="common.live_school_metrics" />

      {isError && <Card className="p-6 text-rose-200">{t('errors.unable_load_records', { defaultValue: 'Unable to load finance data.' })}</Card>}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((card) => (
          <Card key={card.key} className="group relative overflow-hidden p-6 transition duration-500 hover:-translate-y-1">
            <div className={`absolute inset-0 bg-gradient-to-br ${card.accent}`} />
            <div className="relative">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-400">{card.label}</p>
              <p className="mt-4 text-3xl font-semibold text-white">{card.value}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="p-6 transition duration-500 hover:-translate-y-1">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">{t('finance.monthly_revenue', { defaultValue: 'Monthly Revenue' })}</p>
          <div className="mt-6 h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                <XAxis dataKey="monthLabel" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Bar dataKey="revenue" fill="#22c55e" radius={[12, 12, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6 transition duration-500 hover:-translate-y-1">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">{t('finance.pending_balances', { defaultValue: 'Pending Balances' })}</p>
          <div className="mt-6 h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyPendingBalances}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                <XAxis dataKey="monthLabel" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Line type="monotone" dataKey="total" stroke="#f97316" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6 transition duration-500 hover:-translate-y-1">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">{t('finance.salary_payout_trend', { defaultValue: 'Teacher Salary Payout Trend' })}</p>
          <div className="mt-6 h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salaryPayoutTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                <XAxis dataKey="monthLabel" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Line type="monotone" dataKey="total" stroke="#38bdf8" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6 transition duration-500 hover:-translate-y-1">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">{t('finance.branch_income', { defaultValue: 'Branch Income' })}</p>
          <div className="mt-4 space-y-3">
            {(summary?.branchIncome ?? []).map((item) => (
              <div key={item.branch} className="rounded-2xl border border-slate-800/80 bg-slate-950/70 p-4">
                <div className="text-slate-200">{item.branch}</div>
                <div className="mt-2 text-2xl font-semibold text-white">{item.total.toLocaleString()}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <p className="text-sm uppercase tracking-[0.3em] text-slate-400">{t('finance.recent_activity', { defaultValue: 'Recent Finance Activity' })}</p>
        <div className="mt-4 space-y-4">
          <SearchFilterBar
            value={search}
            onChange={setSearch}
            placeholder={t('common.search_placeholder', { entity: t('finance.recent_activity', { defaultValue: 'Recent Finance Activity' }) })}
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
          <div className="grid gap-3">
            {visibleRecords.slice(0, 12).map((record) => (
            <div key={record.id} className="grid gap-2 rounded-2xl border border-slate-800/80 bg-slate-950/70 p-4 md:grid-cols-[1.5fr_auto_auto]">
              <div>
                <div className="font-medium text-white">{record.title}</div>
                <div className="text-sm text-slate-400">{record.category}</div>
              </div>
              <div className="text-slate-300">{new Date(record.date).toLocaleDateString(locale)}</div>
              <div className="font-semibold text-emerald-400">{record.amount.toLocaleString()}</div>
            </div>
            ))}
            {recordsLoading && <div className="text-slate-400">{t('common.loading', { defaultValue: 'Loading...' })}</div>}
            {!recordsLoading && !visibleRecords.length && <div className="text-slate-400">{t('common.no_records_found', { defaultValue: 'No finance records found.' })}</div>}
          </div>
        </div>
      </Card>
    </div>
  );
}
