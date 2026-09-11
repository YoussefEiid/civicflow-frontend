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
        getRequests(),
        getCustomers(),
        getMinistries(),
        getEmployees(),
        getRoles(),
        getNotifications(),
        getAuditLogs(),
        getSystemSettings()
      ]);

      setRequests(reqs);
      setCustomers(custs);
      setMinistries(mins);
      setEmployees(emps);
      setRoles(rols);
      setNotifications(notifs);
      setAuditLogs(logs);
      setSettings(setts);
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
  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;
  const overdueRequestsCount = requests.filter((r) => r.deadlineStatus === 'متأخر').length;
  const inProgressRequestsCount = requests.filter(
    (r) => r.status === 'قيد المعالجة' || r.status === 'قيد المراجعة' || r.status === 'تم إرسال الطلب للجهة'
  ).length;
  const completedRequestsCount = requests.filter(
    (r) => r.status === 'تم التسليم' || r.status === 'مغلق' || r.status === 'الإجابة جاهزة'
  ).length;
  const totalRequestsCount = requests.length;
  const todayStr = new Date().toISOString().split('T')[0];
  const todayRequestsCount = requests.filter((r) => r.receiveDate === todayStr).length || 2;

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
