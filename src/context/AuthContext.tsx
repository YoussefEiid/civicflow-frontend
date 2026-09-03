import React, { createContext, useContext, useState, useEffect } from 'react';
import { Employee } from '../types';
import { getStoredData, setStoredData } from '../services/mockStorage';
import { initialEmployees } from '../data/seedData';

interface AuthContextType {
  user: Employee | null;
  isAuthenticated: boolean;
  login: (email?: string, password?: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (updates: Partial<Employee>) => void;
  switchUser: (employeeId: string) => void;
}

const AUTH_USER_KEY = 'civicflow_auth_user';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Employee | null>(() => {
    return getStoredData<Employee | null>(AUTH_USER_KEY, initialEmployees[0]);
  });

  useEffect(() => {
    if (user) {
      setStoredData(AUTH_USER_KEY, user);
    } else {
      localStorage.removeItem(AUTH_USER_KEY);
    }
  }, [user]);

  const login = async (email?: string, _password?: string): Promise<boolean> => {
    const employees = getStoredData<Employee[]>('civicflow_employees', initialEmployees);
    let matchedUser = employees.find((e) => e.email === email);
    if (!matchedUser) {
      // default demo fallback
      matchedUser = employees[0] || initialEmployees[0];
    }

    const updatedUser = {
      ...matchedUser,
      lastLogin: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };

    setUser(updatedUser);
    return true;
  };

  const logout = () => {
    setUser(null);
  };

  const updateProfile = (updates: Partial<Employee>) => {
    if (!user) return;
    const updated = { ...user, ...updates };
    setUser(updated);
  };

  const switchUser = (employeeId: string) => {
    const employees = getStoredData<Employee[]>('civicflow_employees', initialEmployees);
    const target = employees.find((e) => e.id === employeeId);
    if (target) {
      setUser(target);
    }
  };

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
