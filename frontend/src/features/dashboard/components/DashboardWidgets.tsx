import { memo, type ReactNode } from 'react';
import { BarChart3, type LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/Card';
import { designSystem } from '@/constants/designSystem';

interface DashboardHeaderProps {
  title: string;
  subtitle: string;
  actions?: ReactNode;
}

function DashboardHeaderComponent({ title, subtitle, actions }: DashboardHeaderProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">{t('common.dashboard')}</p>
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-gray-100 sm:text-4xl">{title}</h1>
        <p className="mt-2 max-w-2xl text-gray-600 dark:text-gray-400">{subtitle}</p>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  iconClass?: string;
  highlight?: string;
}

function StatCardComponent({ title, value, description, icon: Icon, iconClass = 'text-primary', highlight }: StatCardProps) {
  return (
    <Card className={`group overflow-hidden ${designSystem.transitions} hover:shadow-hover hover:-translate-y-0.5`}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-wider text-text-secondary">{title}</p>
          <p className="mt-4 text-3xl font-semibold text-text">{value}</p>
        </div>
        <div className={`${designSystem.borderRadius} bg-primary/10 p-3 ${iconClass}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
      {description && <p className="mt-4 text-sm text-text-secondary">{description}</p>}
      {highlight && <p className="mt-3 text-xs uppercase tracking-wider text-primary">{highlight}</p>}
    </Card>
  );
}

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  action?: ReactNode;
}

function ChartCardComponent({ title, subtitle, children, action }: ChartCardProps) {
  return (
    <Card className="flex h-full flex-col gap-4 p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-wider text-gray-500 dark:text-gray-400">{title}</p>
          {subtitle && <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="min-h-[280px] w-full">{children}</div>
    </Card>
  );
}

interface ActionCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  iconClass?: string;
  onClick?: () => void;
}

function QuickActionCardComponent({ title, description, icon: Icon, iconClass = 'text-indigo-600', onClick }: ActionCardProps) {
  return (
    <Card className="group cursor-pointer p-6 transition hover:-translate-y-0.5 hover:shadow-lg" onClick={onClick}>
      <div className="flex items-center gap-4">
        <div className={`rounded-lg bg-indigo-50 dark:bg-indigo-900/50 p-3 ${iconClass}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="font-semibold text-gray-900 dark:text-gray-100">{title}</p>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{description}</p>
        </div>
      </div>
    </Card>
  );
}

function DashboardSkeletonComponent() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-12 w-3/5 rounded-lg bg-gray-200 dark:bg-gray-700" />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="h-32 rounded-lg bg-gray-200 dark:bg-gray-700" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-[420px] rounded-lg bg-gray-200 dark:bg-gray-700" />
        <div className="space-y-4">
          <div className="h-40 rounded-lg bg-gray-200 dark:bg-gray-700" />
          <div className="h-40 rounded-lg bg-gray-200 dark:bg-gray-700" />
        </div>
      </div>
    </div>
  );
}

interface EmptyStateCardProps {
  title: string;
  description: string;
  actionText?: string;
  action?: ReactNode;
}

function EmptyStateCardComponent({ title, description, actionText, action }: EmptyStateCardProps) {
  return (
    <Card className="border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 p-8 text-center text-gray-500 dark:text-gray-400">
      <div className="mx-auto max-w-md space-y-4">
        <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
          <BarChart3 className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
        <p>{description}</p>
        {actionText && action}
      </div>
    </Card>
  );
}

export const DashboardHeader = memo(DashboardHeaderComponent);
export const StatCard = memo(StatCardComponent);
export const ChartCard = memo(ChartCardComponent);
export const QuickActionCard = memo(QuickActionCardComponent);
export const DashboardSkeleton = memo(DashboardSkeletonComponent);
export const EmptyStateCard = memo(EmptyStateCardComponent);
