import { apiClient, setAccessToken } from './apiClient';
import { Employee } from '../types';

export interface LoginResponse {
  user: Employee;
  accessToken: string;
  permissions: string[];
}

export interface MeResponse {
  user: Employee;
  permissions: string[];
}

export const authService = {
  login: async (email: string, password?: string): Promise<LoginResponse> => {
    // If password is omitted or dummy dots, use default demo password for quick testing
    const actualPassword = password && password !== '••••••••' ? password : 'demo123456';
    const data = await apiClient.post<LoginResponse>('/auth/login', {
      email,
      password: actualPassword
    });
    setAccessToken(data.accessToken);
    return data;
  },

  getCurrentUser: async (): Promise<MeResponse> => {
    return apiClient.get<MeResponse>('/auth/me');
  },

  refreshToken: async (): Promise<LoginResponse> => {
    const data = await apiClient.post<LoginResponse>('/auth/refresh');
    setAccessToken(data.accessToken);
    return data;
  },

  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      setAccessToken(null);
    }
  },

  updateProfile: async (updates: Partial<Employee>): Promise<{ user: Employee }> => {
    return apiClient.patch<{ user: Employee }>('/auth/profile', updates);
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
  }
};