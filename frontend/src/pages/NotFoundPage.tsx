import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';

export function NotFoundPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen grid place-items-center p-4">
      <div className="glass-panel p-10 text-center max-w-md">
        <p className="text-sky-400 uppercase tracking-[0.3em] text-xs">404 error</p>
        <h1 className="mt-4 text-4xl font-semibold">{t('page_not_found')}</h1>
        <p className="mt-4 text-slate-400">{t('page_not_found_description')}</p>
        <Button className="mt-8" onClick={() => navigate('/home')}>{t('go_home')}</Button>
      </div>
    </div>
  );
}
