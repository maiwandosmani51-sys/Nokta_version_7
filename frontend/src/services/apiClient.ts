import axios, { AxiosError, type AxiosRequestConfig } from 'axios';
import { clearAuthSession, getCurrentAuthStorage, getStoredAuthValue, isRememberedSession, persistAuthSession } from '@/features/auth/utils/authStorage';

const defaultApiBaseUrl =
  typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.hostname}:8081/api`
    : 'http://127.0.0.1:8081/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || defaultApiBaseUrl;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken() {
  const storedRefreshToken = getStoredAuthValue('refreshToken');
  if (!storedRefreshToken) {
    return null;
  }

  if (!refreshPromise) {
    refreshPromise = apiClient
      .post('/auth/refresh', { refreshToken: storedRefreshToken })
      .then((response) => {
        const payload = response.data?.data ?? {};
        const nextAccessToken = payload.tokens?.accessToken ?? payload.accessToken ?? null;
        const nextRefreshToken = payload.tokens?.refreshToken ?? payload.refreshToken ?? storedRefreshToken;
        const nextUser = payload.user ?? null;

        persistAuthSession({
          accessToken: nextAccessToken,
          refreshToken: nextRefreshToken,
          user: nextUser,
          rememberMe: getCurrentAuthStorage() === window.localStorage || isRememberedSession()
        });

        return nextAccessToken;
      })
      .catch(() => {
        clearAuthSession();
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

apiClient.interceptors.request.use(
  (config) => {
    const url = config.url ?? '';
    if (!url.includes('/auth/login') && !url.includes('/auth/refresh')) {
      const token = getStoredAuthValue('accessToken');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
    const requestUrl = originalRequest?.url ?? '';
    const serverMessage =
      typeof error.response?.data === 'object' && error.response?.data && 'message' in error.response.data
        ? String((error.response.data as { message?: unknown }).message ?? '')
        : '';

    if (serverMessage) {
      error.message = serverMessage;
    }

    if (error.response?.status === 401 && !originalRequest?._retry && !requestUrl.includes('/auth/login') && !requestUrl.includes('/auth/refresh')) {
      originalRequest._retry = true;
      const nextAccessToken = await refreshAccessToken();
      if (nextAccessToken) {
        originalRequest.headers = {
          ...(originalRequest.headers ?? {}),
          Authorization: `Bearer ${nextAccessToken}`
        };
        return apiClient(originalRequest);
      }
    }

    if (error.response?.status === 401) {
      clearAuthSession();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const api = apiClient;
export default apiClient;

