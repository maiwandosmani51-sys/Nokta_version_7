import React, { Suspense, lazy, useEffect, type ComponentType } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import i18n, { applyDocumentLanguage } from '@/locales/i18n';
import { ProtectedRoute } from '@/middleware/ProtectedRoute';
import { allModuleConfigs } from '@/features/resources/config/modules';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/features/auth/services/authService';
import { Card } from '@/components/ui/Card';
import { clearAuthSession, getStoredAuthValue, isRememberedSession } from '@/features/auth/utils/authStorage';

function lazyNamedComponent<T extends Record<string, ComponentType<any>>, K extends keyof T>(
  loader: () => Promise<T>,
  exportName: K
) {
  return lazy(() => loader().then((module) => ({ default: module[exportName] as ComponentType<any> })));
}

const AppShell = lazyNamedComponent(() => import('@/layouts/AppShell'), 'AppShell');
const DashboardLayout = lazyNamedComponent(() => import('@/layouts/DashboardLayout'), 'DashboardLayout');
const LoginPage = lazyNamedComponent(() => import('@/features/auth/pages/LoginPage'), 'LoginPage');
const HomePage = lazyNamedComponent(() => import('@/pages/HomePage'), 'HomePage');
const NotFoundPage = lazyNamedComponent(() => import('@/pages/NotFoundPage'), 'NotFoundPage');
const ProfilePage = lazyNamedComponent(() => import('@/pages/ProfilePage'), 'ProfilePage');
const DashboardPage = lazyNamedComponent(() => import('@/features/dashboard/pages/DashboardPage'), 'DashboardPage');
const SuperAdminDashboard = lazyNamedComponent(() => import('@/features/dashboard/pages/SuperAdminDashboard'), 'SuperAdminDashboard');
const SuperAdminMasterDashboard = lazyNamedComponent(() => import('@/features/dashboard/pages/SuperAdminMasterDashboard'), 'SuperAdminMasterDashboard');
const ForbiddenPage = lazyNamedComponent(() => import('@/pages/ForbiddenPage'), 'ForbiddenPage');
const ManageUsersPage = lazyNamedComponent(() => import('@/features/dashboard/pages/ManageUsersPage'), 'ManageUsersPage');
const UsersPage = lazyNamedComponent(() => import('@/features/dashboard/pages/UsersPage'), 'UsersPage');
const AnalyticsPage = lazyNamedComponent(() => import('@/features/dashboard/pages/AnalyticsPage'), 'AnalyticsPage');
const CampaignPage = lazyNamedComponent(() => import('@/features/dashboard/pages/CampaignPage'), 'CampaignPage');
const EcommercePage = lazyNamedComponent(() => import('@/features/dashboard/pages/EcommercePage'), 'EcommercePage');
const SettingsPage = lazyNamedComponent(() => import('@/features/dashboard/pages/SettingsPage'), 'SettingsPage');
const CrudPage = lazyNamedComponent(() => import('@/features/resources/pages/CrudPage'), 'CrudPage');
const AttendancePage = lazyNamedComponent(() => import('@/features/attendance/pages/AttendancePage'), 'AttendancePage');
const FinancePage = lazyNamedComponent(() => import('@/features/finance/pages/FinancePage'), 'FinancePage');
const ExpensesPage = lazyNamedComponent(() => import('@/features/finance/pages/ExpensesPage'), 'ExpensesPage');
const ReportsPage = lazyNamedComponent(() => import('@/features/reports/pages/ReportsPage'), 'ReportsPage');
const RolesPage = lazyNamedComponent(() => import('@/features/roles/pages/RolesPage'), 'RolesPage');
const RegisterPage = lazyNamedComponent(() => import('@/features/auth/pages/RegisterPage'), 'RegisterPage');

class AppErrorBoundary extends React.Component<{ children: React.ReactNode; fallback: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error('Application render error', error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

function AppErrorFallback() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen grid place-items-center px-4">
      <Card className="max-w-lg p-8 text-center">
        <h1 className="text-2xl font-semibold text-white">{t('common.error')}</h1>
        <p className="mt-3 text-slate-300">{t('errors.unable_load_records')}</p>
      </Card>
    </div>
  );
}

function App() {
  const { t, i18n: translationI18n } = useTranslation();
  const authLoading = useAuthStore((state) => state.authLoading);
  const setAuth = useAuthStore((state) => state.setAuth);
  const setLoading = useAuthStore((state) => state.setLoading);

  const customModulePaths = new Set(['/attendance', '/expenses', '/finance', '/reports', '/roles', '/users']);

  useEffect(() => {
    const token = getStoredAuthValue('accessToken');
    const refreshToken = getStoredAuthValue('refreshToken');

    if (!token) {
      setLoading(false);
      return;
    }

    authService.profile()
      .then((result) => {
        setAuth(result.data, token, refreshToken, isRememberedSession());
      })
      .catch((error: any) => {
        const status = error?.response?.status;
        if (status === 401 || status === 403) {
          clearAuthSession();
          setAuth(null, null, null);
        }
      })
      .finally(() => setLoading(false));
  }, [setAuth, setLoading]);

  useEffect(() => {
    applyDocumentLanguage(translationI18n.resolvedLanguage || i18n.language);
  }, [translationI18n.resolvedLanguage]);

  if (authLoading) {
    return <div className="min-h-screen grid place-items-center text-slate-200">{t('common.checking_credentials')}</div>;
  }

  return (
    <AppErrorBoundary fallback={<AppErrorFallback />}>
      <Suspense fallback={<div className="min-h-screen grid place-items-center text-slate-200">{t('common.loading')}</div>}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/forbidden" element={<ForbiddenPage />} />
          <Route path="/" element={<Navigate to="/home" replace />} />

          <Route element={<DashboardLayout />}>
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'admin', 'teacher', 'student', 'parent', 'owner', 'branch_manager', 'system_automation']}>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route path="/dashboard/super-admin" element={<ProtectedRoute allowedRoles={['super_admin']}><SuperAdminDashboard /></ProtectedRoute>} />
            <Route path="/dashboard/super-admin/master" element={<ProtectedRoute allowedRoles={['super_admin']}><SuperAdminMasterDashboard /></ProtectedRoute>} />
            <Route path="/dashboard/manage-users" element={<ProtectedRoute allowedRoles={['super_admin']}><ManageUsersPage /></ProtectedRoute>} />
            <Route path="/dashboard/admin" element={<ProtectedRoute allowedRoles={['admin']}><DashboardPage /></ProtectedRoute>} />
            <Route path="/dashboard/teacher" element={<ProtectedRoute allowedRoles={['teacher']}><DashboardPage /></ProtectedRoute>} />
            <Route path="/dashboard/student" element={<ProtectedRoute allowedRoles={['student']}><DashboardPage /></ProtectedRoute>} />
            <Route path="/dashboard/parent" element={<ProtectedRoute allowedRoles={['parent']}><DashboardPage /></ProtectedRoute>} />
            <Route path="/dashboard/family" element={<ProtectedRoute allowedRoles={['parent']}><DashboardPage /></ProtectedRoute>} />
            <Route path="/dashboard/owner" element={<ProtectedRoute allowedRoles={['owner']}><DashboardPage /></ProtectedRoute>} />
            <Route path="/dashboard/branch-manager" element={<ProtectedRoute allowedRoles={['branch_manager']}><DashboardPage /></ProtectedRoute>} />
            <Route path="/users" element={<ProtectedRoute allowedRoles={['super_admin']}><UsersPage /></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'owner']}><AnalyticsPage /></ProtectedRoute>} />
            <Route path="/campaign" element={<ProtectedRoute allowedRoles={['admin', 'branch_manager']}><CampaignPage /></ProtectedRoute>} />
            <Route path="/ecommerce" element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'owner']}><EcommercePage /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'teacher', 'student', 'parent', 'owner', 'branch_manager']}><SettingsPage /></ProtectedRoute>} />
          </Route>

          <Route element={<AppShell />}>
            <Route path="/attendance" element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'branch_manager', 'teacher', 'student', 'parent', 'owner']}><AttendancePage /></ProtectedRoute>} />
            <Route path="/finance" element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'branch_manager', 'owner']}><FinancePage /></ProtectedRoute>} />
            <Route path="/expenses" element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'branch_manager', 'owner']}><ExpensesPage /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'branch_manager', 'owner']}><ReportsPage /></ProtectedRoute>} />
            <Route path="/roles" element={<ProtectedRoute allowedRoles={['super_admin', 'owner']}><RolesPage /></ProtectedRoute>} />
            {allModuleConfigs.filter((config) => !customModulePaths.has(config.path)).map((config) => (
              <Route
                key={config.path}
                path={config.path}
                element={
                  <ProtectedRoute allowedRoles={config.permissions.view}>
                    <CrudPage config={config} />
                  </ProtectedRoute>
                }
              />
            ))}
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>
    </AppErrorBoundary>
  );
}

export default App;
