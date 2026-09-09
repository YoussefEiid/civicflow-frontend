import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Employee } from '../types';
import { authService } from '../services/authService';

interface AuthContextType {
  user: Employee | null;
  isAuthenticated: boolean;
  login: (email?: string, password?: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (updates: Partial<Employee>) => Promise<void>;
  switchUser: (employeeId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo email map for quick switchUser
const DEMO_EMAILS: Record<string, string> = {
  'emp-1': 'ahmed.ali@civicflow.gov',
  'emp-2': 'm.hassan@civicflow.gov',
  'emp-3': 'sara.m@civicflow.gov',
  'emp-4': 'khaled.i@civicflow.gov'
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore session on initial load
  const initAuth = useCallback(async () => {
    try {
      // First try to refresh session via HTTP-only cookie
      const res = await authService.refreshToken();
      if (res?.user) {
        setUser(res.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
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
    const targetEmail = email || 'ahmed.ali@civicflow.gov';
    const targetPassword = password || 'demo123456';
    const res = await authService.login(targetEmail, targetPassword);
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

  const switchUser = async (employeeId: string) => {
    const email = DEMO_EMAILS[employeeId] || 'ahmed.ali@civicflow.gov';
    await login(email, 'demo123456');
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
        updateProfile,
        switchUser
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