import { apiClient } from './apiClient';
import { AuditLog } from '../types';
import { htmlPdfExportService } from './htmlPdfExportService';

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
    const data = await apiClient.get<any>('/audit-logs', {
      params: filters
    });
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.auditLogs)) return data.auditLogs;
    return [];
  },

  getAuditLogById: async (id: string): Promise<AuditLogDetail> => {
    return apiClient.get<AuditLogDetail>(`/audit-logs/${id}`);
  },

  exportPdf: async (filters: any = {}, preloadedData?: AuditLog[]) => {
    let logs: AuditLog[] = [];
    if (preloadedData && preloadedData.length > 0) {
      logs = preloadedData;
    } else {
      try {
        const res = await apiClient.get<{ auditLogs: AuditLog[]; total: number }>('/audit-logs', {
          params: { ...filters, limit: 500 }
        });
        logs = res.auditLogs || [];
      } catch {
        logs = [];
      }
    }

    const filtersSummary: Record<string, string> = {
      'المستخدم': filters.user || '',
      'نوع العملية': filters.action || '',
      'رقم المعاملة': filters.requestNumber || '',
      'التاريخ': filters.date || ''
    };

    await htmlPdfExportService.exportAuditLogsReportToPdf(
      logs,
      filtersSummary,
      'سجل_العمليات_CivicFlow.pdf'
    );
  }
};