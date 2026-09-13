import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Employee } from '../types';
import { authService } from '../services/authService';

interface AuthContextType {
  user: Employee | null;
  isAuthenticated: boolean;
  login: (email?: string, password?: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (updates: Partial<Employee>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Employee | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem('civicflow_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const hasCachedUser = !!localStorage.getItem('civicflow_user');
    const isPublicPath =
      window.location.pathname.startsWith('/submit-request') ||
      window.location.pathname.startsWith('/track') ||
      window.location.pathname.startsWith('/login') ||
      window.location.pathname.startsWith('/forgot-password') ||
      window.location.pathname.startsWith('/reset-password') ||
      window.location.pathname.startsWith('/verify-otp');

    // If user is already cached or on public path, render immediately without blocking spinner
    return !hasCachedUser && !isPublicPath;
  });

  // Restore & sync session
  const initAuth = useCallback(async () => {
    const isPublicPath =
      typeof window !== 'undefined' &&
      (window.location.pathname.startsWith('/submit-request') ||
        window.location.pathname.startsWith('/track') ||
        window.location.pathname.startsWith('/login') ||
        window.location.pathname.startsWith('/forgot-password') ||
        window.location.pathname.startsWith('/reset-password') ||
        window.location.pathname.startsWith('/verify-otp'));

    try {
      // First try to refresh or get current user in background
      const res = await authService.getCurrentUser().catch(async () => {
        return await authService.refreshToken().catch(() => null);
      });

      if (res?.user) {
        setUser(res.user);
      }
    } catch {
      // If error is network or cold start, keep current session from localStorage
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    initAuth();

    const handleExpired = () => {
      setUser(null);
    };

    window.addEventListener('civicflow_auth_expired', handleExpired);
    return () => {
      window.removeEventListener('civicflow_auth_expired', handleExpired);
    };
  }, [initAuth]);

  const login = async (email?: string, password?: string): Promise<boolean> => {
    if (!email || !password) {
      throw new Error('يرجى إدخال البريد الإلكتروني وكلمة المرور');
    }
    const res = await authService.login(email.trim(), password);
    setUser(res.user);
    return true;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
    }
  };

  const updateProfile = async (updates: Partial<Employee>) => {
    if (!user) return;
    try {
      const res = await authService.updateProfile(updates);
      setUser(res.user);
    } catch (err) {
      console.error('Update profile error:', err);
      // Optimistic update fallback
      setUser({ ...user, ...updates });
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-bold text-slate-500">جاري التحقق من هوية المستخدم...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout,
        updateProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};