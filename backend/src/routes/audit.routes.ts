import { Router } from 'express';
import {
  getAuditLogs,
  getAuditLogById,
  exportAuditLogsPdf
} from '../controllers/audit.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requirePermission } from '../middlewares/rbac.middleware.js';

export const auditRouter = Router();

auditRouter.use(authenticate);

// Export PDF (supports GET and POST)
auditRouter.get('/export/pdf', requirePermission('audit_logs.export_pdf'), exportAuditLogsPdf);
auditRouter.post('/export/pdf', requirePermission('audit_logs.export_pdf'), exportAuditLogsPdf);
auditRouter.get('/export-pdf', requirePermission('audit_logs.export_pdf'), exportAuditLogsPdf);
auditRouter.post('/export-pdf', requirePermission('audit_logs.export_pdf'), exportAuditLogsPdf);

// Standard logs listing and detail inspection
auditRouter.get('/', requirePermission('audit_logs.view'), getAuditLogs);
auditRouter.get('/:id', requirePermission('audit_logs.view'), getAuditLogById);