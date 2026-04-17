import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Users, UserCheck, Layers, BookOpen, FileText,
  DollarSign, CreditCard, Bell, ClipboardList, Archive
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/Card';
import { dashboardService } from '@/features/dashboard/services/dashboardService';

type DashboardMetricKey =
  | 'totalStudents'
  | 'totalTeachers'
  | 'totalClasses'
  | 'totalSubjects'
  | 'totalFamilies'
  | 'totalBooks'
  | 'totalAuditLogs'
  | 'totalNotifications'
  | 'totalUsers'
  | 'incomeTotal'
  | 'expenseTotal'
  | 'outstandingBalance';

type ModuleCard = {
  key: DashboardMetricKey;
  labelKey: string;
  icon: typeof Users;
  path: string;
  color: string;
  currency?: boolean;
};

const moduleCards: ModuleCard[] = [
  { key: 'totalStudents', labelKey: 'common.students', icon: Users, path: '/students', color: 'text-blue-400' },
  { key: 'totalTeachers', labelKey: 'common.teachers', icon: UserCheck, path: '/teachers', color: 'text-green-400' },
  { key: 'totalClasses', labelKey: 'common.classes', icon: Layers, path: '/classes', color: 'text-purple-400' },
  { key: 'totalSubjects', labelKey: 'common.subjects', icon: BookOpen, path: '/subjects', color: 'text-orange-400' },
  { key: 'totalFamilies', labelKey: 'common.families', icon: Archive, path: '/families', color: 'text-pink-400' },
  { key: 'totalBooks', labelKey: 'common.books', icon: BookOpen, path: '/books', color: 'text-cyan-400' },
  { key: 'totalNotifications', labelKey: 'common.notifications', icon: Bell, path: '/notifications', color: 'text-slate-300' },
  { key: 'totalUsers', labelKey: 'common.users', icon: Users, path: '/users', color: 'text-emerald-400' },
  { key: 'incomeTotal', labelKey: 'common.total_income', icon: DollarSign, path: '/finance', color: 'text-yellow-400', currency: true },
  { key: 'expenseTotal', labelKey: 'finance.total_expenses', icon: CreditCard, path: '/expenses', color: 'text-rose-400', currency: true },
  { key: 'outstandingBalance', labelKey: 'common.reports', icon: FileText, path: '/reports', color: 'text-indigo-400', currency: true },
  { key: 'totalAuditLogs', labelKey: 'common.audit_logs', icon: ClipboardList, path: '/audit', color: 'text-teal-400' }
];

export function SuperAdminDashboard() {
  const { t, i18n } = useTranslation();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard-full'],
    queryFn: dashboardService.summary
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="mb-2 h-4 w-3/4 rounded bg-slate-700"></div>
              <div className="h-8 w-1/2 rounded bg-slate-700"></div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="py-12 text-center">
        <p className="text-slate-400">{t('errors.unable_load_records')}</p>
      </div>
    );
  }

  const chartData = data.enrollmentTrend.map((item: { year: number; month: number; students: number; teachers: number }) => ({
    month: new Date(item.year, item.month - 1, 1).toLocaleString(i18n.language, { month: 'short', year: 'numeric' }),
    students: item.students,
    teachers: item.teachers
  }));

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="mb-2 text-3xl font-bold text-slate-100">{t('dashboard.super_admin_dashboard')}</h1>
        <p className="text-slate-400">{t('common.live_school_metrics')}</p>
        <div className="mt-5">
          <Link
            to="/dashboard/super-admin/master"
            className="inline-flex items-center rounded-[28px] border border-sky-400/30 bg-sky-500/10 px-5 py-3 text-sm font-semibold text-sky-100 transition duration-300 hover:scale-[1.03] hover:bg-sky-500/20 hover:shadow-[0_18px_40px_rgba(14,165,233,0.24)]"
          >
            Open Master Dashboard
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {moduleCards.map((card) => {
          const Icon = card.icon;
          const count = data[card.key];
          const displayValue = card.currency ? `$${count.toLocaleString()}` : count.toLocaleString();

          return (
            <Link key={`${card.key}-${card.path}`} to={card.path}>
              <Card className="group cursor-pointer p-6 transition-colors hover:bg-slate-800/50">
                <div className="mb-4 flex items-center justify-between">
                  <Icon className={`h-8 w-8 ${card.color} transition-transform group-hover:scale-110`} />
                  <span className="text-xs uppercase tracking-[0.3em] text-slate-500">{t('common.module')}</span>
                </div>
                <h3 className="mb-2 text-lg font-semibold text-slate-100">{t(card.labelKey)}</h3>
                <p className="text-3xl font-bold text-slate-200">{displayValue}</p>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h3 className="mb-4 text-xl font-semibold text-slate-100">{t('common.chart_enrollment_trend')}</h3>
          <div className="space-y-3">
            {chartData.map((item: { month: string; students: number; teachers: number }) => (
              <div key={item.month} className="grid grid-cols-3 gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                <span>{item.month}</span>
                <span>{t('common.students')}: {item.students}</span>
                <span>{t('common.teachers')}: {item.teachers}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="mb-4 text-xl font-semibold text-slate-100">{t('common.chart_school_growth')}</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm uppercase tracking-wider text-slate-400">{t('common.users')}</p>
              <p className="mt-3 text-3xl font-semibold text-white">{data.totalUsers.toLocaleString()}</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm uppercase tracking-wider text-slate-400">{t('common.students')}</p>
              <p className="mt-3 text-3xl font-semibold text-white">{data.totalStudents.toLocaleString()}</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm uppercase tracking-wider text-slate-400">{t('common.teachers')}</p>
              <p className="mt-3 text-3xl font-semibold text-white">{data.totalTeachers.toLocaleString()}</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm uppercase tracking-wider text-slate-400">{t('common.classes')}</p>
              <p className="mt-3 text-3xl font-semibold text-white">{data.totalClasses.toLocaleString()}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="mb-4 text-xl font-semibold text-slate-100">{t('common.actions')}</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Link to="/students">
            <button className="w-full rounded-lg bg-blue-600 px-4 py-3 text-white transition-colors hover:bg-blue-700">
              {t('common.students')}
            </button>
          </Link>
          <Link to="/teachers">
            <button className="w-full rounded-lg bg-green-600 px-4 py-3 text-white transition-colors hover:bg-green-700">
              {t('common.teachers')}
            </button>
          </Link>
          <Link to="/classes">
            <button className="w-full rounded-lg bg-purple-600 px-4 py-3 text-white transition-colors hover:bg-purple-700">
              {t('common.classes')}
            </button>
          </Link>
          <Link to="/dashboard/manage-users">
            <button className="w-full rounded-lg bg-orange-600 px-4 py-3 text-white transition-colors hover:bg-orange-700">
              {t('dashboard.manage_users')}
            </button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
