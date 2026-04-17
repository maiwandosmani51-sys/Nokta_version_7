import { NavLink } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { designSystem } from '@/constants/designSystem';
import { getMenuForRole } from '@/features/resources/config/modules';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

export function Sidebar({ collapsed, open, onClose, onToggle }: { collapsed: boolean; open: boolean; onClose: () => void; onToggle: () => void }) {
  const { t, i18n } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const isRtl = i18n.resolvedLanguage !== 'en';
  const sidebarSide = isRtl ? 'right-0' : 'left-0';
  const sidebarBorder = isRtl ? 'border-l' : 'border-r';
  const mobileSidebarSide = isRtl ? 'right-0' : 'left-0';
  const CollapseIcon = collapsed ? (isRtl ? ChevronLeft : ChevronRight) : (isRtl ? ChevronRight : ChevronLeft);
  const CloseIcon = isRtl ? ChevronRight : ChevronLeft;

  const visibleMenu = useMemo(() => getMenuForRole((user?.role as any) ?? null), [user?.role]);

  return (
    <>
      <aside className={`fixed inset-y-0 ${sidebarSide} z-40 hidden flex-col ${sidebarBorder} border-white/10 bg-white/5 backdrop-blur-xl shadow-glow lg:flex ${collapsed ? 'w-20' : 'w-[260px]'} transition-all duration-300`}>
        <div className="flex h-20 items-center justify-between gap-3 border-b border-white/10 px-4">
          <div className={`flex items-center gap-3 ${collapsed ? 'justify-center w-full' : ''}`}>
            <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-gradient-to-r from-primary via-secondary to-accent text-white shadow-[0_15px_40px_rgba(34,197,94,0.24)]">N</div>
            {!collapsed && (
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-slate-400">{t('common.home_brand')}</p>
                <p className="text-sm font-semibold text-white">{t('common.dashboard')}</p>
              </div>
            )}
          </div>
          <button type="button" onClick={onToggle} className={`inline-flex h-11 w-11 items-center justify-center ${designSystem.borderRadius} border border-white/10 bg-white/10 text-slate-100 transition duration-300 hover:bg-white/15`}>
            <CollapseIcon size={18} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
          <div className="space-y-2">
            {visibleMenu.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `group flex items-center gap-3 rounded-[24px] px-4 py-3 text-sm font-medium transition-all duration-300 ${
                    isActive
                      ? 'bg-gradient-to-r from-primary/80 via-secondary/40 to-accent/40 text-white shadow-[0_0_30px_rgba(79,70,229,0.28)] ring-1 ring-white/20'
                      : 'text-slate-300 hover:scale-[1.03] hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span>{t(item.label)}</span>}
              </NavLink>
            ))}
          </div>
        </nav>

        <div className={`border-t border-white/10 p-4 ${collapsed ? 'hidden' : 'block'}`}>
          <div className="glass-panel p-4 text-slate-300">
            <p className="text-xs uppercase tracking-wider text-slate-500">{t('dashboard.signed_in_as')}</p>
            <p className="mt-2 font-semibold text-white">{user?.name ?? t('common.guest')}</p>
            <p className="text-xs text-slate-400">{user?.role ? t(`common.${user.role}`) : t('common.no_role')}</p>
          </div>
        </div>
      </aside>

      <div className={`fixed inset-0 z-50 ${open ? 'block' : 'hidden'} lg:hidden`}>
        <div className="absolute inset-0 bg-black/60" onClick={onClose}></div>
        <aside className={`absolute inset-y-0 ${mobileSidebarSide} z-50 w-72 overflow-y-auto ${sidebarBorder} border-white/10 bg-white/5 p-5 shadow-glow backdrop-blur-xl`}>
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-cyan-300">{t('common.home_brand')}</p>
              <h1 className="text-xl font-semibold text-white">{t('common.dashboard')}</h1>
            </div>
            <button type="button" onClick={onClose} className="text-slate-300 hover:text-white">
              <CloseIcon size={20} />
            </button>
          </div>

          <nav className="space-y-2">
            {visibleMenu.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-[24px] px-4 py-3 text-sm font-medium transition-all duration-300 ${
                    isActive
                      ? 'bg-gradient-to-r from-primary/80 via-secondary/40 to-accent/40 text-white shadow-[0_0_30px_rgba(79,70,229,0.28)] ring-1 ring-white/20'
                      : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  }`
                }
                onClick={onClose}
              >
                <item.icon className="h-5 w-5" />
                <span>{t(item.label)}</span>
              </NavLink>
            ))}
          </nav>
        </aside>
      </div>
    </>
  );
}
