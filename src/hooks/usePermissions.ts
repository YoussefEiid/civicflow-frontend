import { useAuth } from '../context/AuthContext';
import {
  PERMISSIONS,
  PermissionKey,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  canAccessModule
} from '../utils/permissions';

export const usePermissions = () => {
  const { user } = useAuth();

  const isAdmin = user?.role === 'مدير النظام' || user?.roleId === 'role-1';
  const isSupervisor = user?.role === 'مشرف' || user?.roleId === 'role-2';
  const isFollowUp = user?.role === 'موظف متابعة' || user?.roleId === 'role-3';
  const isReceptionist = user?.role === 'موظف استقبال' || user?.roleId === 'role-4';

  const check = (permission: PermissionKey): boolean => hasPermission(user, permission);
  const checkAny = (permissions: PermissionKey[]): boolean => hasAnyPermission(user, permissions);
  const checkAll = (permissions: PermissionKey[]): boolean => hasAllPermissions(user, permissions);
  const canAccess = (moduleName: string): boolean => canAccessModule(user, moduleName);

  return {
    user,
    isAdmin,
    isSupervisor,
    isFollowUp,
    isReceptionist,
    hasPermission: check,
    hasAnyPermission: checkAny,
    hasAllPermissions: checkAll,
    canAccessModule: canAccess,

    // Specific helpers
    canCreateRequest: check(PERMISSIONS.REQUESTS_CREATE),
    canUpdateRequest: check(PERMISSIONS.REQUESTS_UPDATE),
    canDeleteRequest: check(PERMISSIONS.REQUESTS_DELETE),
    canChangeStatus: check(PERMISSIONS.REQUESTS_CHANGE_STATUS),
    canUploadAttachments: check(PERMISSIONS.REQUESTS_ATTACHMENTS),
    canFinalResponse: check(PERMISSIONS.REQUESTS_FINAL_RESPONSE),

    canCreateCustomer: check(PERMISSIONS.CUSTOMERS_CREATE),
    canUpdateCustomer: check(PERMISSIONS.CUSTOMERS_UPDATE),
    canDeleteCustomer: check(PERMISSIONS.CUSTOMERS_DELETE),

    canCreateMinistry: check(PERMISSIONS.MINISTRIES_CREATE),
    canUpdateMinistry: check(PERMISSIONS.MINISTRIES_UPDATE),
    canDeleteMinistry: check(PERMISSIONS.MINISTRIES_DELETE),

    canViewEmployees: check(PERMISSIONS.USERS_VIEW),
    canCreateEmployee: check(PERMISSIONS.USERS_CREATE),
    canUpdateEmployee: check(PERMISSIONS.USERS_UPDATE),
    canDeleteEmployee: check(PERMISSIONS.USERS_DELETE),

    canManageRoles: isAdmin || check(PERMISSIONS.ROLES_MANAGE),
    canViewReports: check(PERMISSIONS.REPORTS_VIEW),
    canExportReports: check(PERMISSIONS.REPORTS_EXPORT),
    canViewAuditLogs: check(PERMISSIONS.AUDIT_LOGS_VIEW),
    canManageSettings: check(PERMISSIONS.SETTINGS_MANAGE),
    canSendWhatsApp: check(PERMISSIONS.WHATSAPP_SEND)
  };
};
