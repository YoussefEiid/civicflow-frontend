import {
  RequestItem,
  Customer,
  Ministry,
  Employee,
  Role,
  NotificationItem,
  AuditLog,
  SystemSettings,
  RequestStatus,
  RequestPriority,
  FinalResponse,
  RequestAttachment
} from '../types';
import { getStoredData, setStoredData, STORAGE_KEYS } from './mockStorage';
import { requestService } from './requestService';
import { customerService } from './customerService';
import { ministryService } from './ministryService';
import { employeeService } from './employeeService';
import { roleService } from './roleService';
import { notificationService } from './notificationService';
import { settingsService } from './settingsService';
import { auditService } from './auditService';
import { reportService } from './reportService';
import { publicService } from './publicService';
import { cityService } from './cityService';
import { requestTypeService } from './requestTypeService';

// Helper to delay simulation
const delay = (ms = 30) => new Promise((resolve) => setTimeout(resolve, ms));

// Audit log helper
export const logActivity = async (
  action: AuditLog['action'],
  details: string,
  requestNumber?: string
): Promise<void> => {
  const logs = getStoredData<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, []);
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toTimeString().split(' ')[0];

  const newLog: AuditLog = {
    id: `log-${Date.now()}`,
    userId: 'emp-1',
    userName: 'أحمد علي',
    userRole: 'مدير النظام',
    action,
    requestNumber,
    details,
    ipAddress: '192.168.1.10',
    date: dateStr,
    time: timeStr
  };

  setStoredData(STORAGE_KEYS.AUDIT_LOGS, [newLog, ...logs]);
};

// Notification creator helper
export const createNotification = async (
  title: string,
  message: string,
  type: NotificationItem['type'],
  requestId?: string,
  requestNumber?: string
): Promise<NotificationItem> => {
  try {
    return await notificationService.createNotification(title, message, type, requestId, requestNumber);
  } catch (error) {
    console.warn('Backend createNotification error, using fallback:', error);
    const notifications = getStoredData<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, []);
    const now = new Date();
    const dateStr = `${now.toISOString().split('T')[0]} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title,
      message,
      requestId,
      requestNumber,
      type,
      read: false,
      createdAt: dateStr,
      timeAgo: 'الآن',
      link: requestId ? `/requests/${requestId}` : undefined
    };

    setStoredData(STORAGE_KEYS.NOTIFICATIONS, [newNotif, ...notifications]);
    return newNotif;
  }
};

// Calculate expected completion date based on Ministry SLA & Priority
export const calculateExpectedDate = (
  receiveDateStr: string,
  ministryId: string,
  priority: RequestPriority = 'عادي'
): string => {
  const ministries = getStoredData<Ministry[]>(STORAGE_KEYS.MINISTRIES, []);
  const settings = getStoredData<SystemSettings>(STORAGE_KEYS.SETTINGS, {} as SystemSettings);
  
  const ministry = ministries.find((m) => m.id === ministryId);
  let days = ministry ? ministry.slaDays : 7;

  if (settings.sla) {
    const slaOverride = settings.sla.find((s) => s.ministryId === ministryId);
    if (slaOverride) {
      if (priority === 'عاجل') days = slaOverride.urgentDays;
      else if (priority === 'مهم') days = slaOverride.importantDays;
      else days = slaOverride.defaultDays;
    }
  } else {
    if (priority === 'عاجل') days = Math.max(2, Math.floor(days / 2));
    else if (priority === 'مهم') days = Math.max(3, Math.floor(days * 0.75));
  }

  const baseDate = new Date(receiveDateStr || new Date());
  baseDate.setDate(baseDate.getDate() + days);
  return baseDate.toISOString().split('T')[0];
};

// ==========================================
// REQUESTS API
// ==========================================

export const getRequests = async (filters?: {
  search?: string;
  status?: string;
  ministryId?: string;
  employeeId?: string;
  priority?: string;
  isOverdue?: boolean;
  fromDate?: string;
  toDate?: string;
}): Promise<RequestItem[]> => {
  try {
    return await requestService.getRequests(filters);
  } catch (error) {
    console.warn('Backend getRequests error, using storage fallback:', error);
    return getStoredData<RequestItem[]>(STORAGE_KEYS.REQUESTS, []);
  }
};

export const getRequestById = async (id: string): Promise<RequestItem | null> => {
  try {
    return await requestService.getRequestById(id);
  } catch (error) {
    console.warn('Backend getRequestById error, using storage fallback:', error);
    const items = getStoredData<RequestItem[]>(STORAGE_KEYS.REQUESTS, []);
    return items.find((r) => r.id === id || r.requestNumber === id) || null;
  }
};

export const createRequest = async (data: Partial<RequestItem>): Promise<RequestItem> => {
  try {
    return await requestService.createRequest(data);
  } catch (error) {
    console.error('Create request error:', error);
    throw error;
  }
};

export const updateRequest = async (id: string, updates: Partial<RequestItem>): Promise<RequestItem> => {
  try {
    return await requestService.updateRequest(id, updates);
  } catch (error) {
    console.error('Update request error:', error);
    throw error;
  }
};

export const changeRequestStatus = async (
  id: string,
  newStatus: RequestStatus,
  note?: string,
  file?: File,
  rejectionReason?: string
): Promise<RequestItem> => {
  try {
    return await requestService.changeStatus(id, newStatus, note, file, rejectionReason);
  } catch (error) {
    console.error('Change status error:', error);
    throw error;
  }
};

export const addRequestAttachment = async (
  requestId: string,
  attachment: Omit<RequestAttachment, 'id' | 'uploadedAt'> & { file?: File }
): Promise<RequestItem> => {
  try {
    await requestService.addAttachment(requestId, attachment);
    return await requestService.getRequestById(requestId);
  } catch (error) {
    console.error('Add attachment error:', error);
    throw error;
  }
};

export const addFinalResponse = async (
  requestId: string,
  response: Omit<FinalResponse, 'id' | 'issuedAt'> & { file?: File }
): Promise<RequestItem> => {
  try {
    await requestService.addFinalResponse(requestId, response);
    return await requestService.getRequestById(requestId);
  } catch (error) {
    console.error('Add final response error:', error);
    throw error;
  }
};

export const deleteRequest = async (id: string): Promise<boolean> => {
  try {
    await requestService.deleteRequest(id);
    return true;
  } catch (error) {
    console.error('Delete request error:', error);
    throw error;
  }
};

// ==========================================
// CUSTOMERS API
// ==========================================

export const getCustomers = async (search?: string): Promise<Customer[]> => {
  try {
    return await customerService.getCustomers(search);
  } catch (error) {
    console.warn('Backend getCustomers error, using fallback:', error);
    return getStoredData<Customer[]>(STORAGE_KEYS.CUSTOMERS, []);
  }
};

export const getCustomerById = async (id: string): Promise<Customer | null> => {
  try {
    return await customerService.getCustomerById(id);
  } catch (error) {
    console.warn('Backend getCustomerById error, using fallback:', error);
    const items = getStoredData<Customer[]>(STORAGE_KEYS.CUSTOMERS, []);
    return items.find((c) => c.id === id) || null;
  }
};

export const createCustomer = async (data: Partial<Customer>): Promise<Customer> => {
  try {
    return await customerService.createCustomer(data);
  } catch (error) {
    console.error('Create customer error:', error);
    throw error;
  }
};

export const updateCustomer = async (id: string, updates: Partial<Customer>): Promise<Customer> => {
  try {
    return await customerService.updateCustomer(id, updates);
  } catch (error) {
    console.error('Update customer error:', error);
    throw error;
  }
};

// ==========================================
// MINISTRIES API
// ==========================================

export const getMinistries = async (): Promise<Ministry[]> => {
  try {
    return await ministryService.getMinistries();
  } catch (error) {
    console.warn('Backend getMinistries error, using fallback:', error);
    return getStoredData<Ministry[]>(STORAGE_KEYS.MINISTRIES, []);
  }
};

export const getMinistryById = async (id: string): Promise<Ministry | null> => {
  try {
    return await ministryService.getMinistryById(id);
  } catch (error) {
    console.warn('Backend getMinistryById error, using fallback:', error);
    const items = getStoredData<Ministry[]>(STORAGE_KEYS.MINISTRIES, []);
    return items.find((m) => m.id === id) || null;
  }
};

export const createMinistry = async (data: Partial<Ministry>): Promise<Ministry> => {
  try {
    return await ministryService.createMinistry(data);
  } catch (error) {
    console.error('Create ministry error:', error);
    throw error;
  }
};

export const updateMinistry = async (id: string, updates: Partial<Ministry>): Promise<Ministry> => {
  try {
    return await ministryService.updateMinistry(id, updates);
  } catch (error) {
    console.error('Update ministry error:', error);
    throw error;
  }
};

// ==========================================
// EMPLOYEES & ROLES API
// ==========================================

export const getEmployees = async (): Promise<Employee[]> => {
  try {
    return await employeeService.getEmployees();
  } catch (error) {
    console.warn('Backend getEmployees error, using fallback:', error);
    return getStoredData<Employee[]>(STORAGE_KEYS.EMPLOYEES, []);
  }
};

export const getEmployeeById = async (id: string): Promise<Employee | null> => {
  try {
    return await employeeService.getEmployeeById(id);
  } catch (error) {
    console.warn('Backend getEmployeeById error, using fallback:', error);
    const items = getStoredData<Employee[]>(STORAGE_KEYS.EMPLOYEES, []);
    return items.find((e) => e.id === id) || null;
  }
};

export const createEmployee = async (data: Partial<Employee>): Promise<Employee> => {
  try {
    return await employeeService.createEmployee(data);
  } catch (error) {
    console.error('Create employee error:', error);
    throw error;
  }
};

export const updateEmployee = async (id: string, updates: Partial<Employee>): Promise<Employee> => {
  try {
    return await employeeService.updateEmployee(id, updates);
  } catch (error) {
    console.error('Update employee error:', error);
    throw error;
  }
};

export const getRoles = async (): Promise<Role[]> => {
  try {
    return await roleService.getRoles();
  } catch (error) {
    console.warn('Backend getRoles error, using fallback:', error);
    return getStoredData<Role[]>(STORAGE_KEYS.ROLES, []);
  }
};

export const getRoleById = async (id: string): Promise<Role | null> => {
  try {
    return await roleService.getRoleById(id);
  } catch (error) {
    console.warn('Backend getRoleById error, using fallback:', error);
    const items = getStoredData<Role[]>(STORAGE_KEYS.ROLES, []);
    return items.find((r) => r.id === id) || null;
  }
};

export const updateRole = async (id: string, updates: Partial<Role>): Promise<Role> => {
  try {
    return await roleService.updateRole(id, updates);
  } catch (error) {
    console.error('Update role error:', error);
    throw error;
  }
};

// ==========================================
// NOTIFICATIONS API
// ==========================================

export const getNotifications = async (): Promise<NotificationItem[]> => {
  try {
    return await notificationService.getNotifications();
  } catch (error) {
    console.warn('Backend getNotifications error, using fallback:', error);
    return getStoredData<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, []);
  }
};

export const markNotificationAsRead = async (id: string): Promise<void> => {
  try {
    await notificationService.markAsRead(id);
  } catch (error) {
    console.error('Mark notification error:', error);
  }
};

export const markAllNotificationsAsRead = async (): Promise<void> => {
  try {
    await notificationService.markAllAsRead();
  } catch (error) {
    console.error('Mark all notifications error:', error);
  }
};

// ==========================================
// AUDIT LOGS API
// ==========================================

export const getAuditLogs = async (filters?: {
  user?: string;
  action?: string;
  date?: string;
  search?: string;
}): Promise<AuditLog[]> => {
  try {
    return await auditService.getAuditLogs(filters);
  } catch (error) {
    console.warn('Backend getAuditLogs error, using fallback:', error);
    return getStoredData<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, []);
  }
};

// ==========================================
// SETTINGS API
// ==========================================

export const getSystemSettings = async (): Promise<SystemSettings> => {
  try {
    return await settingsService.getSystemSettings();
  } catch (error) {
    console.warn('Backend getSystemSettings error, using fallback:', error);
    return getStoredData<SystemSettings>(STORAGE_KEYS.SETTINGS, {} as SystemSettings);
  }
};

export const updateSystemSettings = async (updates: Partial<SystemSettings>): Promise<SystemSettings> => {
  try {
    return await settingsService.updateSystemSettings(updates);
  } catch (error) {
    console.error('Update system settings error:', error);
    throw error;
  }
};

// ==========================================
// CSV / EXCEL EXPORT (EXCELJS STREAM)
// ==========================================

export const exportRequestsToCsv = (requests: RequestItem[], filename = 'تقرير_المعاملات_CivicFlow.xlsx') => {
  reportService.exportRequestsExcel();
};

export { publicService, cityService, requestTypeService };