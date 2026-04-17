import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Bell,
  BookOpen,
  Building2,
  CalendarCheck,
  ClipboardList,
  CreditCard,
  DollarSign,
  FileText,
  GraduationCap,
  Layers,
  Receipt,
  ShieldCheck,
  UserCheck,
  Users
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/Card';
import { dashboardService } from '@/features/dashboard/services/dashboardService';

const moduleCards = [
  { key: 'users', label: 'Users', path: '/users', icon: Users, accent: 'from-sky-500/30 to-sky-200/10' },
  { key: 'students', label: 'Students', path: '/students', icon: GraduationCap, accent: 'from-blue-500/30 to-blue-200/10' },
  { key: 'teachers', label: 'Teachers', path: '/teachers', icon: UserCheck, accent: 'from-emerald-500/30 to-emerald-200/10' },
  { key: 'classes', label: 'Classes', path: '/classes', icon: Layers, accent: 'from-violet-500/30 to-violet-200/10' },
  { key: 'subjects', label: 'Subjects', path: '/subjects', icon: BookOpen, accent: 'from-amber-500/30 to-amber-200/10' },
  { key: 'attendance', label: 'Attendance', path: '/attendance', icon: ClipboardList, accent: 'from-cyan-500/30 to-cyan-200/10' },
  { key: 'exams', label: 'Exams', path: '/exams', icon: CalendarCheck, accent: 'from-yellow-500/30 to-yellow-200/10' },
  { key: 'results', label: 'Results', path: '/results', icon: FileText, accent: 'from-indigo-500/30 to-indigo-200/10' },
  { key: 'payments', label: 'Payments', path: '/payments', icon: Receipt, accent: 'from-green-500/30 to-green-200/10' },
  { key: 'finance', label: 'Finance', path: '/finance', icon: DollarSign, accent: 'from-teal-500/30 to-teal-200/10' },
  { key: 'expenses', label: 'Expenses', path: '/expenses', icon: CreditCard, accent: 'from-rose-500/30 to-rose-200/10' },
  { key: 'reports', label: 'Reports', path: '/reports', icon: FileText, accent: 'from-fuchsia-500/30 to-fuchsia-200/10' },
  { key: 'branches', label: 'Branches', path: '/branches', icon: Building2, accent: 'from-orange-500/30 to-orange-200/10' },
  { key: 'notifications', label: 'Notifications', path: '/notifications', icon: Bell, accent: 'from-slate-400/30 to-slate-100/10' },
  { key: 'audit', label: 'Audit', path: '/audit', icon: ShieldCheck, accent: 'from-lime-500/30 to-lime-200/10' },
  { key: 'roles', label: 'Roles', path: '/roles', icon: ShieldCheck, accent: 'from-red-500/30 to-red-200/10' }
] as const;

export function SuperAdminMasterDashboard() {
  const { t } = useTranslation();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard-master-summary'],
    queryFn: dashboardService.masterSummary
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 16 }).map((_, index) => (
          <Card key={index} className="min-h-[180px] animate-pulse p-6">
            <div className="h-10 w-10 rounded-2xl bg-slate-700" />
            <div className="mt-6 h-5 w-32 rounded bg-slate-700" />
            <div className="mt-3 h-10 w-20 rounded bg-slate-800" />
          </Card>
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return (
      <Card className="p-6 text-rose-200">
        {t('errors.unable_load_records', { defaultValue: 'Unable to load records' })}
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <div className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.14),transparent_32%),linear-gradient(135deg,rgba(15,23,42,0.96),rgba(30,41,59,0.92))] p-8 shadow-[0_30px_120px_rgba(15,23,42,0.35)]">
        <p className="text-sm uppercase tracking-[0.35em] text-sky-300">Super Admin Master Dashboard</p>
        <h1 className="mt-4 text-4xl font-semibold text-white">Module Control Center</h1>
        <p className="mt-3 max-w-3xl text-slate-300">
          One premium overview for every system module, with equal-sized entry cards and direct access to operational pages.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {moduleCards.map((item, index) => {
          const Icon = item.icon;
          const count = data[item.key as keyof typeof data] ?? 0;

          return (
            <motion.div
              key={item.key}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.24, delay: index * 0.02 }}
            >
              <Link to={item.path} className="block h-full">
                <Card className={`group flex h-full min-h-[180px] flex-col justify-between overflow-hidden border border-white/10 bg-gradient-to-br ${item.accent} p-6 backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-white/20 hover:shadow-[0_24px_60px_rgba(15,23,42,0.25)]`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-white">
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-slate-200">
                      Open
                    </span>
                  </div>
                  <div className="mt-8">
                    <div className="text-sm uppercase tracking-[0.25em] text-slate-300">{item.label}</div>
                    <div className="mt-3 text-4xl font-semibold text-white">{Number(count).toLocaleString()}</div>
                  </div>
                </Card>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
