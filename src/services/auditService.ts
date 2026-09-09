import { apiClient } from './apiClient';
import { AuditLog } from '../types';

export interface AuditLogDetail extends AuditLog {
  entity?: string;
  entityId?: string;
  beforeValue?: any;
  afterValue?: any;
  userEmail?: string;
  requestId?: string;
}

export const auditService = {
  getAuditLogs: async (filters?: {
    user?: string;
    action?: string;
    date?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  }): Promise<AuditLog[]> => {
    const data = await apiClient.get<{ auditLogs: AuditLog[]; total: number }>('/audit-logs', {
      params: filters
    });
    return data.auditLogs;
  },

  getAuditLogById: async (id: string): Promise<AuditLogDetail> => {
    return apiClient.get<AuditLogDetail>(`/audit-logs/${id}`);
  },

  exportPdf: async (filters?: any) => {
    await apiClient.download('/audit-logs/export/pdf', 'سجل_عمليات_CivicFlow.pdf', filters);
  }
};