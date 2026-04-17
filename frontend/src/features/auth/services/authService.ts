import { api } from '@/services/apiClient';

export const authService = {
  login: (payload: { email: string; password: string }) => api.post('/auth/login', payload),
  registerStudent: (payload: FormData) =>
    api.post('/auth/register/student', payload, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }).then((res) => res.data),
  getRegistrationOptions: (params?: { classId?: string; subjectId?: string }) =>
    api.get('/auth/register/options', { params }).then((res) => res.data),
  refresh: (refreshToken: string) => api.post('/auth/refresh', { refreshToken }).then((res) => res.data),
  profile: () => api.get('/auth/profile').then((res) => res.data),
  logout: (refreshToken?: string | null) => api.post('/auth/logout', { refreshToken }).then((res) => res.data)
};
