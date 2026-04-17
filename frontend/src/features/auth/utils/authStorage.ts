const AUTH_KEYS = ['accessToken', 'refreshToken', 'user', 'rememberMe'] as const;

type AuthKey = (typeof AUTH_KEYS)[number];

function getStorageByPreference(rememberMe: boolean) {
  return rememberMe ? window.localStorage : window.sessionStorage;
}

function readFromStorages(key: AuthKey) {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(key) ?? window.sessionStorage.getItem(key);
}

function clearFromStorages() {
  if (typeof window === 'undefined') return;
  AUTH_KEYS.forEach((key) => {
    window.localStorage.removeItem(key);
    window.sessionStorage.removeItem(key);
  });
}

export function getStoredAuthValue(key: AuthKey) {
  return readFromStorages(key);
}

export function getStoredUser<T>() {
  const raw = readFromStorages('user');
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    clearFromStorages();
    return null;
  }
}

export function isRememberedSession() {
  return readFromStorages('rememberMe') === 'true';
}

export function persistAuthSession(params: {
  accessToken?: string | null;
  refreshToken?: string | null;
  user?: unknown;
  rememberMe: boolean;
}) {
  if (typeof window === 'undefined') return;
  clearFromStorages();
  const storage = getStorageByPreference(params.rememberMe);

  if (params.accessToken) {
    storage.setItem('accessToken', params.accessToken);
  }

  if (params.refreshToken) {
    storage.setItem('refreshToken', params.refreshToken);
  }

  if (params.user) {
    storage.setItem('user', JSON.stringify(params.user));
  }

  storage.setItem('rememberMe', String(params.rememberMe));
}

export function clearAuthSession() {
  clearFromStorages();
}

export function getCurrentAuthStorage() {
  if (typeof window === 'undefined') return null;
  if (window.localStorage.getItem('accessToken')) return window.localStorage;
  if (window.sessionStorage.getItem('accessToken')) return window.sessionStorage;
  return null;
}
