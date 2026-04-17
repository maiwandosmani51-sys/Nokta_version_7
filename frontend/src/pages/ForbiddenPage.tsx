import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/Card';

export function ForbiddenPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-20">
      <Card className="max-w-2xl p-10 text-center">
        <ShieldAlert className="mx-auto mb-6 h-16 w-16 text-rose-400" />
        <h1 className="text-4xl font-bold text-white">{t('errors.access_denied')}</h1>
        <p className="mt-4 text-slate-300">
          {t('errors.permission_view', { entity: t('common.dashboard') })}
        </p>
        <Link
          to="/home"
          className="mt-8 inline-flex rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-dark"
        >
          {t('common.go_home')}
        </Link>
      </Card>
    </div>
  );
}
