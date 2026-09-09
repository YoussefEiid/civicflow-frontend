import { apiClient } from './apiClient';

export interface ReportColumnOption {
  key: string;
  label: string;
  defaultSelected: boolean;
}

export const REPORT_COLUMNS: ReportColumnOption[] = [
  { key: 'requestNumber', label: 'رقم المعاملة', defaultSelected: true },
  { key: 'customerNumber', label: 'رقم المراجع', defaultSelected: true },
  { key: 'nationalId', label: 'رقم الهوية', defaultSelected: false },
  { key: 'customerName', label: 'اسم المراجع', defaultSelected: true },
  { key: 'customerPhone', label: 'رقم الهاتف', defaultSelected: true },
  { key: 'cityName', label: 'المدينة', defaultSelected: true },
  { key: 'address', label: 'العنوان', defaultSelected: false },
  { key: 'ministryName', label: 'الجهة / الوزارة', defaultSelected: true },
  { key: 'requestType', label: 'نوع الطلب', defaultSelected: true },
  { key: 'title', label: 'عنوان الطلب', defaultSelected: false },
  { key: 'status', label: 'الحالة', defaultSelected: true },
  { key: 'priority', label: 'الأولوية', defaultSelected: false },
  { key: 'receiveDate', label: 'تاريخ الاستلام', defaultSelected: true },
  { key: 'expectedCompletionDate', label: 'الموعد المتوقع', defaultSelected: false },
  { key: 'completedDate', label: 'تاريخ الإنجاز', defaultSelected: false },
  { key: 'deadlineStatus', label: 'حالة SLA', defaultSelected: false },
  { key: 'assignedEmployeeName', label: 'الموظف المسؤول', defaultSelected: false },
  { key: 'details', label: 'تفاصيل المعاملة', defaultSelected: false }
];

export const reportService = {
  getRequestsReport: async (filters?: any) => {
    return apiClient.get('/reports/requests', { params: filters });
  },

  exportRequestsExcel: async (filters: any = {}, selectedColumns: string[] = []) => {
    const params: Record<string, any> = { ...filters };
    if (selectedColumns.length > 0) {
      params.columns = selectedColumns.join(',');
    }
    await apiClient.download('/reports/requests/export', 'تقرير_معاملات_CivicFlow.xlsx', params);
  },

  exportRequestsPdf: async (filters: any = {}, selectedColumns: string[] = []) => {
    const params: Record<string, any> = { ...filters };
    if (selectedColumns.length > 0) {
      params.columns = selectedColumns.join(',');
    }
    await apiClient.download('/reports/requests/export/pdf', 'تقرير_معاملات_CivicFlow.pdf', params);
  }
};