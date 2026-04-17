import { create } from 'zustand';
import { normalizeRole, type Role } from '@/features/resources/config/modules';
import { clearAuthSession, getStoredAuthValue, getStoredUser, isRememberedSession, persistAuthSession } from '@/features/auth/utils/authStorage';

interface UserProfile {
  id: string;
  name: string;
  username?: string;
  email: string;
  role: Role;
  originalRole?: string;
  canonicalRole?: string;
  profileImage?: string | null;
}

interface AuthState {
  user: UserProfile | null;
  accessToken: string | null;
  refreshToken: string | null;
  authLoading: boolean;
  setAuth: (user: UserProfile | null, accessToken?: string | null, refreshToken?: string | null, rememberMe?: boolean) => void;
  setLoading: (value: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: getStoredUser<UserProfile>(),
  accessToken: getStoredAuthValue('accessToken'),
  refreshToken: getStoredAuthValue('refreshToken'),
  authLoading: true,
  setAuth: (user, accessToken, refreshToken, rememberMe = isRememberedSession()) => {
    const normalizedUser = user
      ? {
          ...user,
          role: (normalizeRole(user.role) ?? user.role) as Role,
          canonicalRole: normalizeRole(user.role) ?? user.role
        }
      : null;

    persistAuthSession({
      accessToken: accessToken ?? null,
      refreshToken: refreshToken ?? null,
      user: normalizedUser,
      rememberMe
    });

    set({ user: normalizedUser, accessToken: accessToken ?? null, refreshToken: refreshToken ?? null });
  },
  setLoading: (authLoading) => set({ authLoading }),
  logout: () => {
    clearAuthSession();
    set({ user: null, accessToken: null, refreshToken: null, authLoading: false });
  }
}));
