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

// Helper to delay simulation (can be 0 or small for smooth UI)
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

  // Check SLA override settings
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
  await delay();
  let items = getStoredData<RequestItem[]>(STORAGE_KEYS.REQUESTS, []);

  if (!filters) return items;

  if (filters.search) {
    const q = filters.search.toLowerCase().trim();
    items = items.filter(
      (r) =>
        r.requestNumber.toLowerCase().includes(q) ||
        r.customerName.toLowerCase().includes(q) ||
        r.customerPhone.includes(q) ||
        r.title.toLowerCase().includes(q)
    );
  }

  if (filters.status && filters.status !== 'all') {
    items = items.filter((r) => r.status === filters.status);
  }

  if (filters.ministryId && filters.ministryId !== 'all') {
    items = items.filter((r) => r.ministryId === filters.ministryId);
  }

  if (filters.employeeId && filters.employeeId !== 'all') {
    items = items.filter((r) => r.assignedEmployeeId === filters.employeeId);
  }

  if (filters.priority && filters.priority !== 'all') {
    items = items.filter((r) => r.priority === filters.priority);
  }

  if (filters.isOverdue !== undefined) {
    if (filters.isOverdue) {
      items = items.filter((r) => r.deadlineStatus === 'متأخر');
    } else {
      items = items.filter((r) => r.deadlineStatus !== 'متأخر');
    }
  }

  if (filters.fromDate) {
    items = items.filter((r) => r.receiveDate >= filters.fromDate!);
  }

  if (filters.toDate) {
    items = items.filter((r) => r.receiveDate <= filters.toDate!);
  }

  return items;
};

export const getRequestById = async (id: string): Promise<RequestItem | null> => {
  await delay();
  const items = getStoredData<RequestItem[]>(STORAGE_KEYS.REQUESTS, []);
  return items.find((r) => r.id === id || r.requestNumber === id) || null;
};

export const createRequest = async (data: Partial<RequestItem>): Promise<RequestItem> => {
  await delay();
  const requests = getStoredData<RequestItem[]>(STORAGE_KEYS.REQUESTS, []);
  const ministries = getStoredData<Ministry[]>(STORAGE_KEYS.MINISTRIES, []);
  const customers = getStoredData<Customer[]>(STORAGE_KEYS.CUSTOMERS, []);

  const nextNumber = 1000 + requests.length + 1;
  const reqNum = `REQ-${nextNumber}`;
  const reqId = `req-${nextNumber}`;

  const customer = customers.find((c) => c.id === data.customerId);
  const ministry = ministries.find((m) => m.id === data.ministryId);

  const receiveDate = data.receiveDate || new Date().toISOString().split('T')[0];
  const expectedDate =
    data.expectedCompletionDate ||
    calculateExpectedDate(receiveDate, data.ministryId || '', data.priority || 'عادي');

  const newRequest: RequestItem = {
    id: reqId,
    requestNumber: reqNum,
    customerId: data.customerId || '',
    customerName: data.customerName || (customer ? customer.name : 'مراجع غير محدد'),
    customerPhone: data.customerPhone || (customer ? customer.phone : ''),
    customerAltPhone: customer?.altPhone,
    customerAddress: customer?.address,
    title: data.title || 'طلب بدون عنوان',
    details: data.details || '',
    requestType: data.requestType || 'إصدار تصريح',
    ministryId: data.ministryId || '',
    ministryName: data.ministryName || (ministry ? ministry.name : 'جهة غير محددة'),
    status: data.status || 'استلام الطلب',
    priority: data.priority || 'عادي',
    assignedEmployeeId: data.assignedEmployeeId || 'emp-4',
    assignedEmployeeName: data.assignedEmployeeName || 'خالد إبراهيم',
    receiveDate,
    expectedCompletionDate: expectedDate,
    deadlineStatus: 'ضمن المدة',
    daysRemainingOrOverdue: 7,
    attachments: data.attachments || [],
    timeline: [
      {
        id: `tl-${Date.now()}`,
        status: 'استلام الطلب',
        date: receiveDate,
        time: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
        employeeName: data.assignedEmployeeName || 'خالد إبراهيم',
        note: 'تم إنشاء الطلب واستلام الوثائق الأولية.',
        completed: true
      }
    ],
    internalNotes: data.internalNotes || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const updatedRequests = [newRequest, ...requests];
  setStoredData(STORAGE_KEYS.REQUESTS, updatedRequests);

  // Update customer count
  if (data.customerId) {
    const updatedCustomers = customers.map((c) =>
      c.id === data.customerId
        ? { ...c, requestsCount: c.requestsCount + 1, lastRequestDate: receiveDate }
        : c
    );
    setStoredData(STORAGE_KEYS.CUSTOMERS, updatedCustomers);
  }

  // Update ministry count
  if (data.ministryId) {
    const updatedMinistries = ministries.map((m) =>
      m.id === data.ministryId ? { ...m, activeRequestsCount: m.activeRequestsCount + 1 } : m
    );
    setStoredData(STORAGE_KEYS.MINISTRIES, updatedMinistries);
  }

  await logActivity('إضافة طلب', `إنشاء طلب جديد رقم ${reqNum} للمراجع ${newRequest.customerName}`, reqNum);
  await createNotification(
    'استلام طلب جديد',
    `تم تسجيل الطلب #${reqNum} بنجاح لدى ${newRequest.ministryName}`,
    'system',
    reqId,
    reqNum
  );

  return newRequest;
};

export const updateRequest = async (id: string, updates: Partial<RequestItem>): Promise<RequestItem> => {
  await delay();
  const requests = getStoredData<RequestItem[]>(STORAGE_KEYS.REQUESTS, []);
  const index = requests.findIndex((r) => r.id === id);
  if (index === -1) throw new Error('الطلب غير موجود');

  const current = requests[index];
  const updated: RequestItem = {
    ...current,
    ...updates,
    updatedAt: new Date().toISOString()
  };

  requests[index] = updated;
  setStoredData(STORAGE_KEYS.REQUESTS, requests);

  await logActivity('تعديل طلب', `تحديث بيانات الطلب ${current.requestNumber}`, current.requestNumber);
  return updated;
};

export const changeRequestStatus = async (
  id: string,
  newStatus: RequestStatus,
  note: string,
  employeeName = 'أحمد علي'
): Promise<RequestItem> => {
  await delay();
  const requests = getStoredData<RequestItem[]>(STORAGE_KEYS.REQUESTS, []);
  const index = requests.findIndex((r) => r.id === id);
  if (index === -1) throw new Error('الطلب غير موجود');

  const current = requests[index];
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });

  const newTimelineEvent = {
    id: `tl-${Date.now()}`,
    status: newStatus,
    date: dateStr,
    time: timeStr,
    employeeName,
    note: note || `تم تغيير الحالة إلى ${newStatus}`,
    completed: true
  };

  let completedDate = current.completedDate;
  if (newStatus === 'تم التسليم' || newStatus === 'مغلق' || newStatus === 'الإجابة جاهزة') {
    completedDate = dateStr;
  }

  const updated: RequestItem = {
    ...current,
    status: newStatus,
    completedDate,
    timeline: [...current.timeline, newTimelineEvent],
    updatedAt: now.toISOString()
  };

  requests[index] = updated;
  setStoredData(STORAGE_KEYS.REQUESTS, requests);

  await logActivity(
    'تغيير حالة',
    `تغيير حالة الطلب ${current.requestNumber} إلى (${newStatus}). ملاحظات: ${note || 'لا يوجد'}`,
    current.requestNumber
  );

  let notifType: NotificationItem['type'] = 'status_change';
  if (newStatus === 'مطلوب مستندات') notifType = 'docs_required';
  if (newStatus === 'الإجابة جاهزة') notifType = 'final_response';

  await createNotification(
    `تحديث حالة الطلب #${current.requestNumber}`,
    `أصبحت حالة الطلب الآن: ${newStatus}`,
    notifType,
    current.id,
    current.requestNumber
  );

  return updated;
};

export const addRequestAttachment = async (
  requestId: string,
  attachment: Omit<RequestAttachment, 'id' | 'uploadedAt'>
): Promise<RequestItem> => {
  await delay();
  const requests = getStoredData<RequestItem[]>(STORAGE_KEYS.REQUESTS, []);
  const index = requests.findIndex((r) => r.id === requestId);
  if (index === -1) throw new Error('الطلب غير موجود');

  const current = requests[index];
  const now = new Date();
  const dateStr = `${now.toISOString().split('T')[0]} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  const newAtt: RequestAttachment = {
    id: `att-${Date.now()}`,
    ...attachment,
    uploadedAt: dateStr
  };

  const updated: RequestItem = {
    ...current,
    attachments: [...current.attachments, newAtt],
    updatedAt: now.toISOString()
  };

  requests[index] = updated;
  setStoredData(STORAGE_KEYS.REQUESTS, requests);

  await logActivity('إضافة مرفق', `إرفاق مستند (${newAtt.name}) للطلب ${current.requestNumber}`, current.requestNumber);
  return updated;
};

export const addFinalResponse = async (
  requestId: string,
  response: Omit<FinalResponse, 'id' | 'issuedAt'>
): Promise<RequestItem> => {
  await delay();
  const requests = getStoredData<RequestItem[]>(STORAGE_KEYS.REQUESTS, []);
  const index = requests.findIndex((r) => r.id === requestId);
  if (index === -1) throw new Error('الطلب غير موجود');

  const current = requests[index];
  const now = new Date();
  const dateStr = `${now.toISOString().split('T')[0]} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  const finalResp: FinalResponse = {
    id: `fr-${Date.now()}`,
    ...response,
    issuedAt: dateStr
  };

  // Update request status to 'الإجابة جاهزة'
  const newTimelineEvent = {
    id: `tl-${Date.now()}`,
    status: 'الإجابة جاهزة' as RequestStatus,
    date: now.toISOString().split('T')[0],
    time: now.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
    employeeName: response.issuedBy,
    note: `تم اعتماد الإجابة النهائية (${response.decision}). ${response.summary}`,
    completed: true
  };

  const updated: RequestItem = {
    ...current,
    status: 'الإجابة جاهزة',
    finalResponse: finalResp,
    timeline: [...current.timeline, newTimelineEvent],
    updatedAt: now.toISOString()
  };

  requests[index] = updated;
  setStoredData(STORAGE_KEYS.REQUESTS, requests);

  await logActivity(
    'إضافة إجابة نهائية',
    `إضافة الإجابة النهائية والقرار (${response.decision}) للطلب ${current.requestNumber}`,
    current.requestNumber
  );

  await createNotification(
    `الإجابة جاهزة للطلب #${current.requestNumber}`,
    `صدرت الإجابة النهائية برقم وثيقة ${response.documentNumber || 'بدون رقم'}`,
    'final_response',
    current.id,
    current.requestNumber
  );

  return updated;
};

export const deleteRequest = async (id: string): Promise<boolean> => {
  await delay();
  const requests = getStoredData<RequestItem[]>(STORAGE_KEYS.REQUESTS, []);
  const target = requests.find((r) => r.id === id);
  if (!target) return false;

  const filtered = requests.filter((r) => r.id !== id);
  setStoredData(STORAGE_KEYS.REQUESTS, filtered);

  await logActivity('حذف طلب', `حذف الطلب ${target.requestNumber}`, target.requestNumber);
  return true;
};

// ==========================================
// CUSTOMERS API
// ==========================================

export const getCustomers = async (search?: string): Promise<Customer[]> => {
  await delay();
  let items = getStoredData<Customer[]>(STORAGE_KEYS.CUSTOMERS, []);
  if (search) {
    const q = search.toLowerCase().trim();
    items = items.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (c.nationalId && c.nationalId.includes(q)) ||
        c.address.toLowerCase().includes(q)
    );
  }
  return items;
};

export const getCustomerById = async (id: string): Promise<Customer | null> => {
  await delay();
  const items = getStoredData<Customer[]>(STORAGE_KEYS.CUSTOMERS, []);
  return items.find((c) => c.id === id) || null;
};

export const createCustomer = async (data: Partial<Customer>): Promise<Customer> => {
  await delay();
  const customers = getStoredData<Customer[]>(STORAGE_KEYS.CUSTOMERS, []);
  const newCust: Customer = {
    id: `cust-${Date.now()}`,
    name: data.name || '',
    phone: data.phone || '',
    altPhone: data.altPhone,
    nationalId: data.nationalId,
    email: data.email,
    address: data.address || '',
    notes: data.notes || '',
    requestsCount: 0,
    lastRequestDate: new Date().toISOString().split('T')[0],
    createdAt: new Date().toISOString().split('T')[0],
    status: 'نشط'
  };

  setStoredData(STORAGE_KEYS.CUSTOMERS, [newCust, ...customers]);
  await logActivity('إضافة مراجع', `تسجيل مراجع جديد: ${newCust.name} - هاتف: ${newCust.phone}`);
  return newCust;
};

export const updateCustomer = async (id: string, updates: Partial<Customer>): Promise<Customer> => {
  await delay();
  const customers = getStoredData<Customer[]>(STORAGE_KEYS.CUSTOMERS, []);
  const index = customers.findIndex((c) => c.id === id);
  if (index === -1) throw new Error('المراجع غير موجود');

  const updated: Customer = { ...customers[index], ...updates };
  customers[index] = updated;
  setStoredData(STORAGE_KEYS.CUSTOMERS, customers);

  await logActivity('تعديل مراجع', `تحديث بيانات المراجع: ${updated.name}`);
  return updated;
};

// ==========================================
// MINISTRIES API
// ==========================================

export const getMinistries = async (): Promise<Ministry[]> => {
  await delay();
  return getStoredData<Ministry[]>(STORAGE_KEYS.MINISTRIES, []);
};

export const getMinistryById = async (id: string): Promise<Ministry | null> => {
  await delay();
  const items = getStoredData<Ministry[]>(STORAGE_KEYS.MINISTRIES, []);
  return items.find((m) => m.id === id) || null;
};

export const createMinistry = async (data: Partial<Ministry>): Promise<Ministry> => {
  await delay();
  const ministries = getStoredData<Ministry[]>(STORAGE_KEYS.MINISTRIES, []);
  const newMin: Ministry = {
    id: `min-${Date.now()}`,
    name: data.name || '',
    code: data.code || `MIN-${ministries.length + 1}`,
    slaDays: Number(data.slaDays) || 7,
    activeRequestsCount: 0,
    completedRequestsCount: 0,
    overdueRequestsCount: 0,
    status: data.status || 'نشط',
    notes: data.notes || '',
    contactPerson: data.contactPerson,
    contactPhone: data.contactPhone,
    contactEmail: data.contactEmail
  };

  setStoredData(STORAGE_KEYS.MINISTRIES, [...ministries, newMin]);
  await logActivity('تعديل إعدادات', `إضافة جهة/وزارة جديدة: ${newMin.name} بمدة إنجاز ${newMin.slaDays} أيام`);
  return newMin;
};

export const updateMinistry = async (id: string, updates: Partial<Ministry>): Promise<Ministry> => {
  await delay();
  const ministries = getStoredData<Ministry[]>(STORAGE_KEYS.MINISTRIES, []);
  const index = ministries.findIndex((m) => m.id === id);
  if (index === -1) throw new Error('الجهة غير موجودة');

  const updated: Ministry = { ...ministries[index], ...updates };
  ministries[index] = updated;
  setStoredData(STORAGE_KEYS.MINISTRIES, ministries);

  await logActivity('تعديل إعدادات', `تحديث بيانات الوزارة/الجهة: ${updated.name}`);
  return updated;
};

// ==========================================
// EMPLOYEES & ROLES API
// ==========================================

export const getEmployees = async (): Promise<Employee[]> => {
  await delay();
  return getStoredData<Employee[]>(STORAGE_KEYS.EMPLOYEES, []);
};

export const getEmployeeById = async (id: string): Promise<Employee | null> => {
  await delay();
  const items = getStoredData<Employee[]>(STORAGE_KEYS.EMPLOYEES, []);
  return items.find((e) => e.id === id) || null;
};

export const createEmployee = async (data: Partial<Employee>): Promise<Employee> => {
  await delay();
  const employees = getStoredData<Employee[]>(STORAGE_KEYS.EMPLOYEES, []);
  const newEmp: Employee = {
    id: `emp-${Date.now()}`,
    name: data.name || '',
    email: data.email || '',
    phone: data.phone || '',
    roleId: data.roleId || 'role-3',
    role: data.role || 'موظف متابعة',
    department: data.department || 'إدارة المتابعة',
    assignedRequestsCount: 0,
    status: data.status || 'نشط',
    lastLogin: 'لم يسجل دخول بعد'
  };

  setStoredData(STORAGE_KEYS.EMPLOYEES, [...employees, newEmp]);
  await logActivity('تعديل إعدادات', `إضافة موظف جديد: ${newEmp.name} - الدور: ${newEmp.role}`);
  return newEmp;
};

export const updateEmployee = async (id: string, updates: Partial<Employee>): Promise<Employee> => {
  await delay();
  const employees = getStoredData<Employee[]>(STORAGE_KEYS.EMPLOYEES, []);
  const index = employees.findIndex((e) => e.id === id);
  if (index === -1) throw new Error('الموظف غير موجود');

  const updated: Employee = { ...employees[index], ...updates };
  employees[index] = updated;
  setStoredData(STORAGE_KEYS.EMPLOYEES, employees);

  await logActivity('تعديل إعدادات', `تحديث بيانات الموظف: ${updated.name}`);
  return updated;
};

export const getRoles = async (): Promise<Role[]> => {
  await delay();
  return getStoredData<Role[]>(STORAGE_KEYS.ROLES, []);
};

export const getRoleById = async (id: string): Promise<Role | null> => {
  await delay();
  const items = getStoredData<Role[]>(STORAGE_KEYS.ROLES, []);
  return items.find((r) => r.id === id) || null;
};

export const updateRole = async (id: string, updates: Partial<Role>): Promise<Role> => {
  await delay();
  const roles = getStoredData<Role[]>(STORAGE_KEYS.ROLES, []);
  const index = roles.findIndex((r) => r.id === id);
  if (index === -1) throw new Error('الدور غير موجود');

  const updated: Role = { ...roles[index], ...updates };
  roles[index] = updated;
  setStoredData(STORAGE_KEYS.ROLES, roles);

  await logActivity('تعديل إعدادات', `تحديث مصفوفة صلاحيات الدور: ${updated.name}`);
  return updated;
};

// ==========================================
// NOTIFICATIONS API
// ==========================================

export const getNotifications = async (): Promise<NotificationItem[]> => {
  await delay();
  return getStoredData<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, []);
};

export const markNotificationAsRead = async (id: string): Promise<void> => {
  await delay();
  const items = getStoredData<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, []);
  const updated = items.map((n) => (n.id === id ? { ...n, read: true } : n));
  setStoredData(STORAGE_KEYS.NOTIFICATIONS, updated);
};

export const markAllNotificationsAsRead = async (): Promise<void> => {
  await delay();
  const items = getStoredData<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, []);
  const updated = items.map((n) => ({ ...n, read: true }));
  setStoredData(STORAGE_KEYS.NOTIFICATIONS, updated);
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
  await delay();
  let logs = getStoredData<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, []);

  if (!filters) return logs;

  if (filters.user && filters.user !== 'all') {
    logs = logs.filter((l) => l.userName === filters.user);
  }
  if (filters.action && filters.action !== 'all') {
    logs = logs.filter((l) => l.action === filters.action);
  }
  if (filters.date) {
    logs = logs.filter((l) => l.date === filters.date);
  }
  if (filters.search) {
    const q = filters.search.toLowerCase();
    logs = logs.filter(
      (l) =>
        l.details.toLowerCase().includes(q) ||
        (l.requestNumber && l.requestNumber.toLowerCase().includes(q)) ||
        l.userName.toLowerCase().includes(q)
    );
  }

  return logs;
};

// ==========================================
// SETTINGS API
// ==========================================

export const getSystemSettings = async (): Promise<SystemSettings> => {
  await delay();
  return getStoredData<SystemSettings>(STORAGE_KEYS.SETTINGS, {} as SystemSettings);
};

export const updateSystemSettings = async (updates: Partial<SystemSettings>): Promise<SystemSettings> => {
  await delay();
  const current = getStoredData<SystemSettings>(STORAGE_KEYS.SETTINGS, {} as SystemSettings);
  const updated = { ...current, ...updates };
  setStoredData(STORAGE_KEYS.SETTINGS, updated);
  await logActivity('تعديل إعدادات', 'تحديث الإعدادات العامة للمنظومة');
  return updated;
};

// ==========================================
// CSV / EXCEL EXPORT SIMULATOR
// ==========================================

export const exportRequestsToCsv = (requests: RequestItem[], filename = 'تقرير_المعاملات_CivicFlow.csv') => {
  const headers = [
    'رقم الطلب',
    'المراجع',
    'الهاتف',
    'عنوان الطلب',
    'الجهة / الوزارة',
    'الحالة',
    'الأولوية',
    'الموظف المسؤول',
    'تاريخ الاستلام',
    'الموعد المتوقع',
    'تاريخ الإنجاز',
    'حالة الموعد'
  ];

  const rows = requests.map((r) => [
    `"${r.requestNumber}"`,
    `"${r.customerName}"`,
    `"${r.customerPhone}"`,
    `"${r.title.replace(/"/g, '""')}"`,
    `"${r.ministryName}"`,
    `"${r.status}"`,
    `"${r.priority}"`,
    `"${r.assignedEmployeeName}"`,
    `"${r.receiveDate}"`,
    `"${r.expectedCompletionDate}"`,
    `"${r.completedDate || '-'}"`,
    `"${r.deadlineStatus}"`
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
