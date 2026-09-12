import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  RequestItem,
  Customer,
  Ministry,
  Employee,
  Role,
  NotificationItem,
  AuditLog,
  SystemSettings
} from '../types';
import {
  getRequests,
  getCustomers,
  getMinistries,
  getEmployees,
  getRoles,
  getNotifications,
  getAuditLogs,
  getSystemSettings,
  changeRequestStatus,
  createRequest,
  updateRequest,
  deleteRequest,
  createCustomer,
  updateCustomer,
  createMinistry,
  updateMinistry,
  createEmployee,
  updateEmployee,
  updateRole,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  updateSystemSettings
} from '../services/api';
import { initStorage, resetToDefaults } from '../services/mockStorage';

interface DataContextType {
  requests: RequestItem[];
  customers: Customer[];
  ministries: Ministry[];
  employees: Employee[];
  roles: Role[];
  notifications: NotificationItem[];
  auditLogs: AuditLog[];
  settings: SystemSettings | null;
  loading: boolean;
  refreshData: () => Promise<void>;
  resetData: () => void;
  // Stats
  unreadNotificationsCount: number;
  overdueRequestsCount: number;
  inProgressRequestsCount: number;
  completedRequestsCount: number;
  totalRequestsCount: number;
  todayRequestsCount: number;
  // Actions
  handleCreateRequest: typeof createRequest;
  handleUpdateRequest: typeof updateRequest;
  handleDeleteRequest: typeof deleteRequest;
  handleChangeStatus: typeof changeRequestStatus;
  handleCreateCustomer: typeof createCustomer;
  handleUpdateCustomer: typeof updateCustomer;
  handleCreateMinistry: typeof createMinistry;
  handleUpdateMinistry: typeof updateMinistry;
  handleCreateEmployee: typeof createEmployee;
  handleUpdateEmployee: typeof updateEmployee;
  handleUpdateRole: typeof updateRole;
  handleMarkNotificationRead: typeof markNotificationAsRead;
  handleMarkAllNotificationsRead: typeof markAllNotificationsAsRead;
  handleUpdateSettings: typeof updateSystemSettings;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshData = useCallback(async () => {
    try {
      initStorage();
      const [reqs, custs, mins, emps, rols, notifs, logs, setts] = await Promise.all([
        getRequests().catch(() => []),
        getCustomers().catch(() => []),
        getMinistries().catch(() => []),
        getEmployees().catch(() => []),
        getRoles().catch(() => []),
        getNotifications().catch(() => []),
        getAuditLogs().catch(() => []),
        getSystemSettings().catch(() => null)
      ]);

      setRequests(Array.isArray(reqs) ? reqs : (reqs as any)?.requests || []);
      setCustomers(Array.isArray(custs) ? custs : (custs as any)?.customers || []);
      setMinistries(Array.isArray(mins) ? mins : (mins as any)?.ministries || []);
      setEmployees(Array.isArray(emps) ? emps : (emps as any)?.users || (emps as any)?.employees || []);
      setRoles(Array.isArray(rols) ? rols : (rols as any)?.roles || []);
      setNotifications(Array.isArray(notifs) ? notifs : (notifs as any)?.notifications || []);
      setAuditLogs(Array.isArray(logs) ? logs : (logs as any)?.auditLogs || []);
      setSettings(setts && typeof setts === 'object' ? setts : null);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();

    const handleStorageUpdate = () => {
      refreshData();
    };

    window.addEventListener('civicflow_data_updated', handleStorageUpdate);
    return () => {
      window.removeEventListener('civicflow_data_updated', handleStorageUpdate);
    };
  }, [refreshData]);

  const resetData = () => {
    resetToDefaults();
    refreshData();
  };

  // Derived metrics
  const unreadNotificationsCount = Array.isArray(notifications) ? notifications.filter((n) => n && !n.read).length : 0;
  const overdueRequestsCount = Array.isArray(requests) ? requests.filter((r) => r && r.deadlineStatus === 'متأخر').length : 0;
  const inProgressRequestsCount = Array.isArray(requests)
    ? requests.filter(
        (r) => r && (r.status === 'قيد المعالجة' || r.status === 'قيد المراجعة' || r.status === 'تم إرسال الطلب للجهة')
      ).length
    : 0;
  const completedRequestsCount = Array.isArray(requests)
    ? requests.filter((r) => r && (r.status === 'تم التسليم' || r.status === 'مغلق' || r.status === 'الإجابة جاهزة')).length
    : 0;
  const totalRequestsCount = Array.isArray(requests) ? requests.length : 0;
  const todayStr = new Date().toISOString().split('T')[0];
  const todayRequestsCount = Array.isArray(requests) ? requests.filter((r) => r && r.receiveDate === todayStr).length : 0;

  // Wrapped actions with auto-refresh
  const handleCreateRequest: typeof createRequest = async (data) => {
    const res = await createRequest(data);
    await refreshData();
    return res;
  };

  const handleUpdateRequest: typeof updateRequest = async (id, data) => {
    const res = await updateRequest(id, data);
    await refreshData();
    return res;
  };

  const handleDeleteRequest: typeof deleteRequest = async (id) => {
    const res = await deleteRequest(id);
    await refreshData();
    return res;
  };

  const handleChangeStatus: typeof changeRequestStatus = async (id, status, note, file, rejectionReason) => {
    const res = await changeRequestStatus(id, status, note, file, rejectionReason);
    await refreshData();
    return res;
  };

  const handleCreateCustomer: typeof createCustomer = async (data) => {
    const res = await createCustomer(data);
    await refreshData();
    return res;
  };

  const handleUpdateCustomer: typeof updateCustomer = async (id, data) => {
    const res = await updateCustomer(id, data);
    await refreshData();
    return res;
  };

  const handleCreateMinistry: typeof createMinistry = async (data) => {
    const res = await createMinistry(data);
    await refreshData();
    return res;
  };

  const handleUpdateMinistry: typeof updateMinistry = async (id, data) => {
    const res = await updateMinistry(id, data);
    await refreshData();
    return res;
  };

  const handleCreateEmployee: typeof createEmployee = async (data) => {
    const res = await createEmployee(data);
    await refreshData();
    return res;
  };

  const handleUpdateEmployee: typeof updateEmployee = async (id, data) => {
    const res = await updateEmployee(id, data);
    await refreshData();
    return res;
  };

  const handleUpdateRole: typeof updateRole = async (id, data) => {
    const res = await updateRole(id, data);
    await refreshData();
    return res;
  };

  const handleMarkNotificationRead: typeof markNotificationAsRead = async (id) => {
    await markNotificationAsRead(id);
    await refreshData();
  };

  const handleMarkAllNotificationsRead: typeof markAllNotificationsAsRead = async () => {
    await markAllNotificationsAsRead();
    await refreshData();
  };

  const handleUpdateSettings: typeof updateSystemSettings = async (data) => {
    const res = await updateSystemSettings(data);
    await refreshData();
    return res;
  };

  return (
    <DataContext.Provider
      value={{
        requests,
        customers,
        ministries,
        employees,
        roles,
        notifications,
        auditLogs,
        settings,
        loading,
        refreshData,
        resetData,
        unreadNotificationsCount,
        overdueRequestsCount,
        inProgressRequestsCount,
        completedRequestsCount,
        totalRequestsCount,
        todayRequestsCount,
        handleCreateRequest,
        handleUpdateRequest,
        handleDeleteRequest,
        handleChangeStatus,
        handleCreateCustomer,
        handleUpdateCustomer,
        handleCreateMinistry,
        handleUpdateMinistry,
        handleCreateEmployee,
        handleUpdateEmployee,
        handleUpdateRole,
        handleMarkNotificationRead,
        handleMarkAllNotificationsRead,
        handleUpdateSettings
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within DataProvider');
  return context;
};
