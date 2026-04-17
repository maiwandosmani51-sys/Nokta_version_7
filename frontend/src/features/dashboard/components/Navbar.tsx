import { useQuery } from '@tanstack/react-query';
import { Bell, Menu, ChevronDown, LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { authService } from '@/features/auth/services/authService';
import { useAuthStore } from '@/store/authStore';
import { designSystem } from '@/constants/designSystem';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '@/services/apiClient';
import { getStoredAuthValue } from '@/features/auth/utils/authStorage';

export function Navbar({ title, onMenu }: { title: string; onMenu: () => void }) {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const location = useLocation();

  const canAccessNotifications = Boolean(
    user?.role && ['super_admin', 'admin', 'teacher', 'student', 'parent', 'owner', 'branch_manager', 'system_automation'].includes(user.role)
  );

  const notificationsActive = location.pathname === '/notifications';

  const { data: unreadCountData } = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: () => api.get('/notifications/unread-count').then((res) => res.data.data as { unreadCount: number }),
    enabled: canAccessNotifications,
    refetchInterval: 30000
  });

  const handleLogout = async () => {
    try {
      await authService.logout(getStoredAuthValue('refreshToken'));
    } catch {
      // Local logout still guarantees client-side cleanup.
    } finally {
      logout();
      navigate('/login');
    }
  };

  const handleNotificationClick = () => {
    if (!canAccessNotifications) {
      navigate('/forbidden');
      return;
    }

    navigate('/notifications');
  };

  const unreadCount = unreadCountData?.unreadCount ?? 0;

  return (
    <header className={`sticky top-0 z-30 border-b border-white/10 bg-white/5 px-4 py-4 shadow-glow backdrop-blur-xl lg:px-6 ${designSystem.transitions}`}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <button type="button" onClick={onMenu} className="inline-flex h-11 w-11 items-center justify-center rounded-3xl border border-white/10 bg-white/10 text-slate-100 transition duration-300 hover:bg-white/15 lg:hidden">
            <Menu size={20} />
          </button>
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">{title}</p>
            <h1 className="text-2xl font-semibold text-white">{title}</h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleNotificationClick}
            aria-label={t('common.notifications')}
            className={`relative inline-flex h-11 w-11 items-center justify-center rounded-3xl border text-slate-100 transition duration-300 hover:scale-105 ${
              notificationsActive
                ? 'border-sky-400/60 bg-sky-500/20 text-sky-200 shadow-[0_0_30px_rgba(56,189,248,0.25)]'
                : 'border-white/10 bg-white/10 hover:bg-white/15'
            }`}
          >
            {unreadCount > 0 && (
              <span className="absolute -end-2 -top-2 min-w-[1.35rem] rounded-full bg-rose-500 px-1.5 py-0.5 text-center text-[10px] font-semibold leading-none text-white shadow-[0_0_20px_rgba(244,63,94,0.4)]">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
            <Bell size={20} />
          </button>
          <ThemeToggle />
          <LanguageSwitcher />
          <details className="relative">
            <summary className="flex cursor-pointer items-center gap-3 rounded-[28px] border border-white/10 bg-white/10 px-4 py-3 text-slate-100 transition duration-300 hover:bg-white/15">
              <div className="flex h-11 w-11 items-center justify-center rounded-3xl bg-gradient-to-r from-primary via-secondary to-accent text-white shadow-[0_15px_40px_rgba(34,197,94,0.24)]">
                {user?.name?.charAt(0) ?? 'G'}
              </div>
              <div className="hidden min-w-[120px] flex-col sm:flex">
                <span className="font-semibold text-white">{user?.name ?? t('common.guest')}</span>
                <span className="text-xs text-slate-400">{user?.role ? t(`common.${user.role}`) : t('common.no_role')}</span>
              </div>
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </summary>
            <div className="absolute end-0 z-20 mt-3 w-48 rounded-[28px] border border-white/10 bg-white/5 p-3 shadow-glow backdrop-blur-xl">
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center justify-between rounded-2xl border border-transparent px-3 py-2 text-sm text-slate-100 transition duration-300 hover:scale-[1.03] hover:border-rose-400/40 hover:bg-rose-500/20 hover:text-rose-100 hover:shadow-[0_16px_40px_rgba(239,68,68,0.28)]"
              >
                <span>{t('common.logout')}</span>
                <LogOut size={16} />
              </button>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
