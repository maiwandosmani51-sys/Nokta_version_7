import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Eye, EyeOff, LogIn } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/features/auth/services/authService';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { accounts, type AccountRole } from '@/features/auth/constants/accounts';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Select } from '@/components/ui/Select';
import { useTheme } from '@/app/providers/ThemeProvider';

export function LoginPage() {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<AccountRole | ''>('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRoleChange = (role: AccountRole) => {
    setSelectedRole(role);
    const account = accounts[role];
    if (account) {
      setEmail(account.email);
      setPassword(account.password);
    }
  };

  const selectedAccount = selectedRole ? accounts[selectedRole] : undefined;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const loginEmail = email || selectedAccount?.email || '';
      const loginPassword = password || selectedAccount?.password || '';
      const response = await authService.login({ email: loginEmail, password: loginPassword });

      const payload = response?.data;
      const accessToken = payload?.tokens?.accessToken ?? payload?.token;
      const refreshToken = payload?.tokens?.refreshToken ?? payload?.refreshToken ?? null;

      if (!payload || payload.success !== true || !accessToken || !payload.user) {
        throw new Error('Invalid login response');
      }

      setAuth(payload.user, accessToken, refreshToken, rememberMe);
      queryClient.clear();
      navigate('/dashboard', { replace: true });
    } catch (error: any) {
      setError(error.response?.data?.message || error.message || t('login_error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`relative min-h-screen overflow-hidden px-4 py-10 ${
      isDark
        ? 'bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.14),_transparent_34%),linear-gradient(135deg,rgba(15,23,42,0.98),rgba(30,41,59,0.92))]'
        : 'bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.16),_transparent_32%),linear-gradient(135deg,rgba(248,250,252,0.98),rgba(226,232,240,0.96))]'
    }`}>
      <div className={`absolute inset-0 [background-image:linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] [background-size:32px_32px] ${isDark ? 'opacity-40' : 'opacity-70'}`} />
      <div className="relative mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center justify-center">
        <Card className={`relative w-full max-w-md overflow-visible border p-8 backdrop-blur-xl ${
          isDark
            ? 'border-white/10 bg-slate-950/80 shadow-[0_30px_120px_rgba(15,23,42,0.5)]'
            : 'border-slate-200/80 bg-white/85 shadow-[0_24px_80px_rgba(15,23,42,0.12)]'
        }`}>
          <div className="mb-8 flex items-center justify-between">
            <div className={`inline-flex rounded-full border p-1 ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-100/80'}`}>
              <ThemeToggle />
              <LanguageSwitcher />
            </div>
            <Button type="button" variant="ghost" size="sm" className="gap-2" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4" />
              Back to Main
            </Button>
          </div>

          <div className="space-y-3 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-sky-300">{t('common.welcome')}</p>
            <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{t('common.login_title')}</h1>
            <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{t('common.login_description')}</p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div className="space-y-2">
              <label htmlFor="role" className={`block text-sm font-medium ${isDark ? 'text-slate-100' : 'text-slate-700'}`}>{t('common.select_role')}</label>
              <Select
                id="role"
                value={selectedRole}
                placeholder={t('common.choose_role')}
                options={Object.entries(accounts).map(([role, account]) => ({
                  value: role,
                  label: `${account.name} (${t(`common.${role}`)})`
                }))}
                onChange={(value) => handleRoleChange(value as AccountRole)}
              />
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('common.login_role_help')}</p>
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className={`block text-sm font-medium ${isDark ? 'text-slate-100' : 'text-slate-700'}`}>{t('common.email')}</label>
              <Input
                id="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                placeholder={t('common.login_placeholder_email')}
                className="bg-white/5"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className={`block text-sm font-medium ${isDark ? 'text-slate-100' : 'text-slate-700'}`}>{t('common.password')}</label>
              <div className="relative">
                <Input
                  id="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('common.login_placeholder_password')}
                  className="bg-white/5 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 transition hover:text-white"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <label className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm ${
              isDark ? 'border-white/10 bg-white/5 text-slate-200' : 'border-slate-200 bg-white/80 text-slate-700'
            }`}>
              <span className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                  className="h-4 w-4 rounded border-white/20 bg-slate-900 text-sky-400 focus:ring-sky-400"
                />
                <span>Remember Me</span>
              </span>
              <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{rememberMe ? 'Persistent login' : 'Session only'}</span>
            </label>

            {error && <p className="rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</p>}

            <Button type="submit" className="w-full justify-center gap-2" disabled={isSubmitting}>
              <LogIn className="h-5 w-5" /> {isSubmitting ? t('common.loading') : t('common.sign_in')}
            </Button>
          </form>

          <div className={`mt-6 text-center text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            <span>Don't have an account? </span>
            <Link to="/register" className="font-semibold text-sky-300 transition hover:text-sky-200">
              Register here
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
