import { Router } from 'express';
import {
  getRequestsReport,
  exportRequestsReportExcel,
  exportRequestsReportPdf
} from '../controllers/report.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requirePermission } from '../middlewares/rbac.middleware.js';

export const reportRouter = Router();

reportRouter.use(authenticate);

reportRouter.get('/', requirePermission('reports.view'), getRequestsReport);

// Requests Excel export
reportRouter.get('/requests/export', requirePermission('reports.export'), exportRequestsReportExcel);
reportRouter.post('/requests/export', requirePermission('reports.export'), exportRequestsReportExcel);
reportRouter.get('/requests/export-excel', requirePermission('reports.export'), exportRequestsReportExcel);
reportRouter.post('/requests/export-excel', requirePermission('reports.export'), exportRequestsReportExcel);
reportRouter.get('/export', requirePermission('reports.export'), exportRequestsReportExcel);
reportRouter.post('/export', requirePermission('reports.export'), exportRequestsReportExcel);
reportRouter.get('/export-excel', requirePermission('reports.export'), exportRequestsReportExcel);
reportRouter.post('/export-excel', requirePermission('reports.export'), exportRequestsReportExcel);

// Requests PDF export
reportRouter.get('/requests/export/pdf', requirePermission('reports.export_pdf'), exportRequestsReportPdf);
reportRouter.post('/requests/export/pdf', requirePermission('reports.export_pdf'), exportRequestsReportPdf);
reportRouter.get('/requests/export-pdf', requirePermission('reports.export_pdf'), exportRequestsReportPdf);
reportRouter.post('/requests/export-pdf', requirePermission('reports.export_pdf'), exportRequestsReportPdf);
reportRouter.get('/export/pdf', requirePermission('reports.export_pdf'), exportRequestsReportPdf);
reportRouter.post('/export/pdf', requirePermission('reports.export_pdf'), exportRequestsReportPdf);
reportRouter.get('/export-pdf', requirePermission('reports.export_pdf'), exportRequestsReportPdf);
reportRouter.post('/export-pdf', requirePermission('reports.export_pdf'), exportRequestsReportPdf);