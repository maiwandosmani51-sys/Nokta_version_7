import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { authService } from '@/features/auth/services/authService';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import { useNavigate } from 'react-router-dom';
import { applyProfileImageFallback, resolveProfileImage } from '@/utils/profileImage';

export function ProfilePage() {
  const navigate = useNavigate();
  const { data, isLoading, error } = useQuery({
    queryKey: ['profile'],
    queryFn: authService.profile,
    retry: 1,
    refetchOnWindowFocus: false,
    staleTime: 0
  });
  const user = (data as any)?.data;
  const localUser = useAuthStore((state) => state.user);

  const { t } = useTranslation();
  const profile = user ?? localUser;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-slate-400 uppercase tracking-[0.3em] text-xs">{t('profile')}</p>
        <h1 className="text-3xl font-semibold">{t('my_settings')}</h1>
        <p className="mt-2 text-slate-400">{t('manage_account_details')}</p>
      </div>
      <Card className="grid gap-6 lg:grid-cols-[1.5fr_1fr] p-6">
        <div className="space-y-4">
          <img
            src={resolveProfileImage(profile?.profileImage, profile?.role)}
            alt={profile?.name ?? t('profile')}
            className="h-24 w-24 rounded-full object-cover"
            onError={(event) => applyProfileImageFallback(event.currentTarget, profile?.role)}
          />
          <div>
            <p className="text-sm text-slate-400">{t('full_name')}</p>
            <p className="mt-2 text-lg font-semibold text-slate-100">{profile?.name ?? t('not_available')}</p>
          </div>
          <div>
            <p className="text-sm text-slate-400">{t('email_address')}</p>
            <p className="mt-2 text-lg font-semibold text-slate-100">{profile?.email ?? t('not_available')}</p>
          </div>
          <div>
            <p className="text-sm text-slate-400">{t('role')}</p>
            <p className="mt-2 text-lg font-semibold text-slate-100">{profile?.role ? t(profile.role) : t('not_available')}</p>
          </div>
        </div>
        <div className="rounded-3xl border border-slate-800/80 bg-slate-950/80 p-6 text-slate-300">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">{t('account_status')}</p>
          <div className="mt-6 space-y-3 text-sm">
            <p>- {t('frontend_access')}</p>
            <p>- {t('backend_permissions')}</p>
            <p>- {t('use_sidebar')}</p>
          </div>
          <Button className="mt-6 w-full" onClick={() => navigate('/dashboard')}>{t('return_to_dashboard')}</Button>
        </div>
      </Card>
      {isLoading && <Card className="p-6 text-slate-400">{t('loading_profile')}</Card>}
      {error && <Card className="p-6 border border-rose-500/30 bg-rose-500/5 text-rose-200">{t('unable_retrieve_profile')}</Card>}
    </div>
  );
}
