import api from './client';
import type { User } from '../../types';

export const authApi = {
  register: (data: { username: string; email: string; password: string; role?: string }) =>
    api.post('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),

  logout: () =>
    api.post('/auth/logout'),

  refresh: () =>
    api.post('/auth/refresh'),

  getMe: () =>
    api.get<{ success: boolean; data: User }>('/users/me'),

  updateMe: (data: { username?: string; bio?: string; profilePicture?: string }) =>
    api.patch('/users/me', data),

  sendVerificationOtp: (email?: string) =>
    api.post<{ success: boolean; message: string; cooldownSeconds?: number }>('/auth/send-verification-otp', { email }),

  verifyEmailOtp: (data: { email: string; otp: string }) =>
    api.post<{ success: boolean; message: string; user: User }>('/auth/verify-email-otp', data),

  forgotPassword: (email: string) =>
    api.post<{ success: boolean; message: string; cooldownSeconds?: number }>('/auth/forgot-password', { email }),

  resetPassword: (data: { email: string; otp: string; newPassword: string }) =>
    api.post<{ success: boolean; message: string }>('/auth/reset-password', data),
};