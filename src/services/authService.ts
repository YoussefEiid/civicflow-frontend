import { apiClient, setAccessToken } from './apiClient';
import { Employee } from '../types';

export interface LoginResponse {
  user: Employee;
  accessToken: string;
  refreshToken?: string;
  permissions: string[];
}

export interface MeResponse {
  user: Employee;
  permissions: string[];
}

const isBrowser = typeof window !== 'undefined';

export const authService = {
  login: async (email: string, password?: string): Promise<LoginResponse> => {
    const data = await apiClient.post<LoginResponse>('/auth/login', {
      email,
      password
    });
    setAccessToken(data.accessToken);
    if (isBrowser) {
      if (data.user) localStorage.setItem('civicflow_user', JSON.stringify(data.user));
      if (data.refreshToken) localStorage.setItem('civicflow_refresh_token', data.refreshToken);
    }
    return data;
  },

  getCurrentUser: async (): Promise<MeResponse> => {
    const data = await apiClient.get<MeResponse>('/auth/me');
    if (isBrowser && data?.user) {
      localStorage.setItem('civicflow_user', JSON.stringify(data.user));
    }
    return data;
  },

  refreshToken: async (): Promise<LoginResponse> => {
    const storedRefreshToken = isBrowser ? localStorage.getItem('civicflow_refresh_token') : null;
    const data = await apiClient.post<LoginResponse>('/auth/refresh', {
      refreshToken: storedRefreshToken || undefined
    });
    setAccessToken(data.accessToken);
    if (isBrowser) {
      if (data.user) localStorage.setItem('civicflow_user', JSON.stringify(data.user));
      if (data.refreshToken) localStorage.setItem('civicflow_refresh_token', data.refreshToken);
    }
    return data;
  },

  logout: async (): Promise<void> => {
    try {
      const storedRefreshToken = isBrowser ? localStorage.getItem('civicflow_refresh_token') : null;
      await apiClient.post('/auth/logout', { refreshToken: storedRefreshToken || undefined });
    } finally {
      setAccessToken(null);
      if (isBrowser) {
        localStorage.removeItem('civicflow_user');
        localStorage.removeItem('civicflow_access_token');
        localStorage.removeItem('civicflow_refresh_token');
      }
    }
  },

  updateProfile: async (updates: Partial<Employee>): Promise<{ user: Employee }> => {
    const res = await apiClient.patch<{ user: Employee }>('/auth/profile', updates);
    if (isBrowser && res?.user) {
      localStorage.setItem('civicflow_user', JSON.stringify(res.user));
    }
    return res;
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    return apiClient.post('/auth/change-password', {
      currentPassword,
      newPassword
    });
  },

  requestPasswordResetOTP: async (email: string): Promise<{ email: string; otpHint?: string }> => {
    return apiClient.post('/auth/forgot-password-otp', { email });
  },

  verifyResetOTP: async (email: string, otp: string): Promise<{ verified: boolean }> => {
    return apiClient.post('/auth/verify-reset-otp', { email, otp });
  },

  resetPasswordWithOTP: async (email: string, otp: string, newPassword: string): Promise<void> => {
    return apiClient.post('/auth/reset-password-otp', { email, otp, newPassword });
  },

  sendVerificationOTP: async (email?: string): Promise<{ email: string; otpHint?: string }> => {
    return apiClient.post('/auth/send-verification-otp', { email });
  },

  verifyEmailOTP: async (email: string, otp: string): Promise<{ verified: boolean }> => {
    return apiClient.post('/auth/verify-email-otp', { email, otp });
  },

  // Secure email-OTP verification flow
  sendOtp: async (
    email: string
  ): Promise<{ email: string; expiresInMinutes: number; cooldownSeconds: number; otpHint?: string }> => {
    return apiClient.post('/auth/send-otp', { email });
  },

  verifyOtp: async (
    email: string,
    otp: string
  ): Promise<{ user: Employee; accessToken: string; permissions: string[]; emailVerified: boolean }> => {
    const data = await apiClient.post('/auth/verify-otp', { email, otp });
    setAccessToken(data.accessToken);
    if (isBrowser && data.user) {
      localStorage.setItem('civicflow_user', JSON.stringify(data.user));
    }
    return data;
  },

  resendOtp: async (
    email: string
  ): Promise<{ email: string; expiresInMinutes: number; cooldownSeconds: number; otpHint?: string }> => {
    return apiClient.post('/auth/resend-otp', { email });
  }
};