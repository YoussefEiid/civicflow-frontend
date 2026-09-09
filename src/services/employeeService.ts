import { apiClient } from './apiClient';
import { Employee } from '../types';

export const employeeService = {
  getEmployees: async (): Promise<Employee[]> => {
    return apiClient.get<Employee[]>('/users');
  },

  getEmployeeById: async (id: string): Promise<Employee> => {
    return apiClient.get<Employee>(`/users/${id}`);
  },

  createEmployee: async (data: Partial<Employee>): Promise<Employee> => {
    return apiClient.post<Employee>('/users', data);
  },

  updateEmployee: async (id: string, updates: Partial<Employee>): Promise<Employee> => {
    return apiClient.patch<Employee>(`/users/${id}`, updates);
  },

  deleteEmployee: async (id: string): Promise<void> => {
    await apiClient.delete(`/users/${id}`);
  }
};