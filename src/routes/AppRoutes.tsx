import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '../layouts/AppLayout';
import { AuthLayout } from '../layouts/AuthLayout';
import { PublicLayout } from '../layouts/PublicLayout';

// Auth Pages
import { LoginPage } from '../pages/auth/LoginPage';
import { ForgotPasswordPage } from '../pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '../pages/auth/ResetPasswordPage';
import { ProfilePage } from '../pages/auth/ProfilePage';

// Dashboard Page
import { DashboardPage } from '../pages/dashboard/DashboardPage';

// Requests Pages
import { RequestsListPage } from '../pages/requests/RequestsListPage';
import { CreateRequestPage } from '../pages/requests/CreateRequestPage';
import { EditRequestPage } from '../pages/requests/EditRequestPage';
import { RequestDetailsPage } from '../pages/requests/RequestDetailsPage';

// Customers Pages
import { CustomersListPage } from '../pages/customers/CustomersListPage';
import { CreateCustomerPage } from '../pages/customers/CreateCustomerPage';
import { EditCustomerPage } from '../pages/customers/EditCustomerPage';
import { CustomerDetailsPage } from '../pages/customers/CustomerDetailsPage';

// Ministries Pages
import { MinistriesListPage } from '../pages/ministries/MinistriesListPage';
import { CreateMinistryPage } from '../pages/ministries/CreateMinistryPage';
import { EditMinistryPage } from '../pages/ministries/EditMinistryPage';
import { MinistryDetailsPage } from '../pages/ministries/MinistryDetailsPage';

// Employees Pages
import { EmployeesListPage } from '../pages/employees/EmployeesListPage';
import { CreateEmployeePage } from '../pages/employees/CreateEmployeePage';
import { EditEmployeePage } from '../pages/employees/EditEmployeePage';
import { EmployeeDetailsPage } from '../pages/employees/EmployeeDetailsPage';

// Roles Pages
import { RolesListPage } from '../pages/roles/RolesListPage';
import { RolePermissionsPage } from '../pages/roles/RolePermissionsPage';

// Notifications Pages
import { NotificationsListPage } from '../pages/notifications/NotificationsListPage';
import { NotificationDetailsPage } from '../pages/notifications/NotificationDetailsPage';

// Reports & Audit Pages
import { ReportsDashboardPage } from '../pages/reports/ReportsDashboardPage';
import { ReportResultsPage } from '../pages/reports/ReportResultsPage';
import { AuditLogsPage } from '../pages/audit/AuditLogsPage';

// Settings Pages
import { SettingsOverviewPage } from '../pages/settings/SettingsOverviewPage';
import { GeneralSettingsPage } from '../pages/settings/GeneralSettingsPage';
import { StatusesSettingsPage } from '../pages/settings/StatusesSettingsPage';
import { SlaSettingsPage } from '../pages/settings/SlaSettingsPage';
import { NotificationSettingsPage } from '../pages/settings/NotificationSettingsPage';
import { WhatsAppSettingsPage } from '../pages/settings/WhatsAppSettingsPage';
import { WhatsAppTemplatesPage } from '../pages/settings/WhatsAppTemplatesPage';

// Public Tracking Pages
import { PublicTrackPage } from '../pages/public/PublicTrackPage';
import { PublicTrackResultPage } from '../pages/public/PublicTrackResultPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Tracking Routes (No Auth Layout) */}
      <Route element={<PublicLayout />}>
        <Route path="/track" element={<PublicTrackPage />} />
        <Route path="/track/:requestNumber" element={<PublicTrackResultPage />} />
      </Route>

      {/* Auth Layout Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Route>

      {/* Authenticated Admin Management Layout */}
      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/profile" element={<ProfilePage />} />

        {/* Requests */}
        <Route path="/requests" element={<RequestsListPage />} />
        <Route path="/requests/new" element={<CreateRequestPage />} />
        <Route path="/requests/:id" element={<RequestDetailsPage />} />
        <Route path="/requests/:id/edit" element={<EditRequestPage />} />

        {/* Customers */}
        <Route path="/customers" element={<CustomersListPage />} />
        <Route path="/customers/new" element={<CreateCustomerPage />} />
        <Route path="/customers/:id" element={<CustomerDetailsPage />} />
        <Route path="/customers/:id/edit" element={<EditCustomerPage />} />

        {/* Ministries */}
        <Route path="/ministries" element={<MinistriesListPage />} />
        <Route path="/ministries/new" element={<CreateMinistryPage />} />
        <Route path="/ministries/:id" element={<MinistryDetailsPage />} />
        <Route path="/ministries/:id/edit" element={<EditMinistryPage />} />

        {/* Employees */}
        <Route path="/employees" element={<EmployeesListPage />} />
        <Route path="/employees/new" element={<CreateEmployeePage />} />
        <Route path="/employees/:id" element={<EmployeeDetailsPage />} />
        <Route path="/employees/:id/edit" element={<EditEmployeePage />} />

        {/* Roles & Permissions */}
        <Route path="/roles" element={<RolesListPage />} />
        <Route path="/roles/:id" element={<RolePermissionsPage />} />

        {/* Notifications */}
        <Route path="/notifications" element={<NotificationsListPage />} />
        <Route path="/notifications/:id" element={<NotificationDetailsPage />} />

        {/* Reports & Audit */}
        <Route path="/reports" element={<ReportsDashboardPage />} />
        <Route path="/reports/results" element={<ReportResultsPage />} />
        <Route path="/audit-logs" element={<AuditLogsPage />} />

        {/* Settings */}
        <Route path="/settings" element={<SettingsOverviewPage />} />
        <Route path="/settings/general" element={<GeneralSettingsPage />} />
        <Route path="/settings/statuses" element={<StatusesSettingsPage />} />
        <Route path="/settings/sla" element={<SlaSettingsPage />} />
        <Route path="/settings/notifications" element={<NotificationSettingsPage />} />
        <Route path="/settings/whatsapp" element={<WhatsAppSettingsPage />} />
        <Route path="/settings/whatsapp/templates" element={<WhatsAppTemplatesPage />} />
      </Route>

      {/* Root redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};
