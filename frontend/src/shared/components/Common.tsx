import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import type { Role } from '@/features/resources/config/modules';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/store/authStore';

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  const { t, i18n } = useTranslation();
  const rtlClass = i18n.resolvedLanguage === 'en' ? 'md:flex-row' : 'md:flex-row-reverse';

  return (
    <div className={`flex flex-col gap-4 rounded-[2rem] border border-slate-800/80 bg-slate-950/90 p-6 shadow-xl shadow-slate-950/20 md:items-end md:justify-between ${rtlClass}`}>
      <div>
        <p className="text-sky-400 uppercase tracking-[0.3em] text-xs">{t(title)}</p>
        <h1 className="text-3xl font-semibold text-white">{t(title)}</h1>
        {description && <p className="mt-3 max-w-2xl text-slate-400">{t(description)}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-3">{actions}</div>
    </div>
  );
}

export function SearchFilterBar({ value, onChange, placeholder, createLabel, onCreate, createVisible, extraActions }: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  createLabel?: string;
  onCreate?: () => void;
  createVisible?: boolean;
  extraActions?: ReactNode;
}) {
  const { t, i18n } = useTranslation();

  return (
    <div className={`flex flex-col gap-3 lg:flex-row lg:items-center ${i18n.resolvedLanguage === 'en' ? '' : 'lg:flex-row-reverse'}`}>
      <div className="min-w-0 flex-1">
        <Input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
      </div>
      <div className={`flex flex-wrap items-center gap-3 ${i18n.resolvedLanguage === 'en' ? 'lg:justify-end' : 'lg:justify-start'}`}>
        {extraActions}
        {createVisible && onCreate && (
          <Button type="button" onClick={onCreate} className="w-full sm:w-auto">
            {createLabel ?? t('common.add')}
          </Button>
        )}
      </div>
    </div>
  );
}

export interface TableColumn<T> {
  key: string;
  label: string;
  width?: string;
  render?: (item: T) => ReactNode;
}

export interface TableAction<T> {
  label: string;
  onClick: (item: T) => void;
  variant?: 'solid' | 'outline' | 'destructive';
  disabled?: boolean;
}

export function DataTable<T>({
  columns,
  items,
  actions
}: {
  columns: TableColumn<T>[];
  items: T[];
  actions?: TableAction<T>[];
}) {
  const { t, i18n } = useTranslation();
  const textAlign = i18n.resolvedLanguage === 'en' ? 'text-left' : 'text-right';
  const fallbackText = t('common.not_available', { defaultValue: 'N/A' });

  const stringifyCell = (value: unknown) => {
    if (value === null || value === undefined) return fallbackText;
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed.length ? trimmed : fallbackText;
    }
    if (Array.isArray(value)) {
      return value.length ? value.map((item) => String(item ?? '')).filter(Boolean).join(', ') : fallbackText;
    }
    if (typeof value === 'object') return fallbackText;
    return String(value);
  };

  return (
    <div className="w-full overflow-x-auto rounded-3xl border border-slate-800/80 bg-slate-900/70">
      <table className={`min-w-full w-full table-auto border-separate border-spacing-0 ${textAlign}`}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} className={`border-b border-slate-800/80 px-4 py-3 text-sm uppercase tracking-[0.2em] text-slate-400 break-words ${column.width ?? 'w-auto'}`}>
                {column.label}
              </th>
            ))}
            {actions && <th className="border-b border-slate-800/80 px-4 py-3 text-sm uppercase tracking-[0.2em] text-slate-400">{t('common.actions')}</th>}
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={(item as { _id?: string; id?: string })._id ?? (item as { id?: string }).id ?? index} className="odd:bg-slate-950 even:bg-slate-900/80 last:border-b-0">
              {columns.map((column) => (
                <td key={column.key} className="border-b border-slate-800/80 px-4 py-3 align-top text-sm text-slate-200 break-words">
                  {column.render ? column.render(item) : stringifyCell((item as Record<string, unknown>)[column.key])}
                </td>
              ))}
              {actions && (
                <td className="border-b border-slate-800/80 px-4 py-3 align-top text-sm text-slate-200">
                  <div className="flex flex-wrap gap-2">
                    {actions.map((action) => (
                      <Button key={action.label} variant={action.variant ?? 'outline'} size="sm" onClick={() => action.onClick(item)} disabled={action.disabled}>
                        {action.label}
                      </Button>
                    ))}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function FormModal({
  open,
  title,
  children,
  onClose,
  onSubmit,
  submitLabel,
  loading
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  submitLabel: string;
  loading?: boolean;
}) {
  const { t, i18n } = useTranslation();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-2 sm:p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl bg-slate-900 shadow-xl"
      >
        <div className={`flex items-center justify-between border-b border-slate-700 p-4 ${i18n.resolvedLanguage === 'en' ? '' : 'flex-row-reverse'}`}>
          <h2 className="text-lg font-semibold text-slate-100">{title}</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="border-rose-400/30 text-rose-100 hover:scale-[1.03] hover:border-rose-400/60 hover:bg-rose-500/20 hover:shadow-[0_16px_40px_rgba(239,68,68,0.28)]"
          >
            x
          </Button>
        </div>

        <div className="custom-scrollbar flex-1 overflow-y-auto p-4 space-y-4">
          <form id="modal-form" onSubmit={onSubmit} className="space-y-4">
            {children}
          </form>
        </div>

        <div className={`sticky bottom-0 flex gap-2 border-t border-slate-700 bg-slate-900 p-4 ${i18n.resolvedLanguage === 'en' ? 'justify-end' : 'justify-start'}`}>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="border-rose-400/30 text-rose-100 hover:scale-[1.03] hover:border-rose-400/60 hover:bg-rose-500/20 hover:shadow-[0_16px_40px_rgba(239,68,68,0.28)]"
          >
            {t('common.cancel')}
          </Button>
          <Button type="submit" form="modal-form" disabled={loading}>
            {submitLabel}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

export function PermissionWrapper({
  allowedRoles,
  children,
  fallback = null
}: {
  allowedRoles: Role[];
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const user = useAuthStore((state) => state.user);
  if (!user) return null;
  if (!allowedRoles.includes(user.role as Role)) return <>{fallback}</>;
  return <>{children}</>;
}
