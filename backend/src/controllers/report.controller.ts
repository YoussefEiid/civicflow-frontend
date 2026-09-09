import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database.js';
import { PriorityLevel } from '@prisma/client';
import { generateRequestsExcel } from '../services/excel.service.js';
import { generateRequestsPdf, ALL_REQUEST_COLUMNS } from '../services/pdf.service.js';
import { sendSuccess } from '../utils/apiResponse.js';

const priorityToAr = (p: PriorityLevel): 'عادي' | 'مهم' | 'عاجل' => {
  if (p === PriorityLevel.URGENT) return 'عاجل';
  if (p === PriorityLevel.IMPORTANT) return 'مهم';
  return 'عادي';
};

const buildReportWhere = (params: any) => {
  const {
    search,
    fromDate,
    toDate,
    ministryId,
    cityId,
    requestTypeId,
    requestType,
    status,
    employeeId,
    assignedEmployeeId,
    priority
  } = params;

  const where: any = {};

  if (search) {
    const q = (search as string).trim();
    where.OR = [
      { requestNumber: { contains: q, mode: 'insensitive' } },
      { title: { contains: q, mode: 'insensitive' } },
      { details: { contains: q, mode: 'insensitive' } },
      { customer: { name: { contains: q, mode: 'insensitive' } } },
      { customer: { phone: { contains: q } } },
      { customer: { altPhone: { contains: q } } },
      { customer: { nationalId: { contains: q } } },
      { customer: { customerNumber: { contains: q, mode: 'insensitive' } } },
      { ministry: { name: { contains: q, mode: 'insensitive' } } },
      { city: { name: { contains: q, mode: 'insensitive' } } }
    ];
  }

  if (fromDate) where.receiveDate = { ...(where.receiveDate || {}), gte: new Date(fromDate as string) };
  if (toDate) where.receiveDate = { ...(where.receiveDate || {}), lte: new Date(toDate as string) };
  if (ministryId && ministryId !== 'all') where.ministryId = ministryId as string;
  if (cityId && cityId !== 'all') {
    where.OR = [
      { cityId: cityId as string },
      { customer: { cityId: cityId as string } }
    ];
  }
  if (requestTypeId && requestTypeId !== 'all') {
    where.requestTypeId = requestTypeId as string;
  } else if (requestType && requestType !== 'all') {
    where.requestType = requestType as string;
  }

  if (status && status !== 'all') where.status = status as string;
  const targetEmp = employeeId || assignedEmployeeId;
  if (targetEmp && targetEmp !== 'all') where.assignedEmployeeId = targetEmp as string;
  if (priority && priority !== 'all') {
    if (priority === 'عاجل' || priority === 'URGENT') where.priority = PriorityLevel.URGENT;
    else if (priority === 'مهم' || priority === 'IMPORTANT') where.priority = PriorityLevel.IMPORTANT;
    else where.priority = PriorityLevel.NORMAL;
  }

  return where;
};

const mapRawRequestToExportItem = (r: any) => ({
  requestNumber: r.requestNumber,
  customerNumber: r.customer?.customerNumber || `CUST-${r.customerId.substring(0, 6)}`,
  nationalId: r.customer?.nationalId || '-',
  customerName: r.customer?.name || 'غير محدد',
  customerPhone: r.customer?.phone || '-',
  cityName: r.city?.name || r.customer?.city?.name || 'غير محدد',
  address: r.customer?.address || '-',
  ministryName: r.ministry?.name || '-',
  requestType: r.requestTypeRel?.name || r.requestType,
  title: r.title,
  details: r.details || '-',
  status: r.status,
  priority: priorityToAr(r.priority),
  assignedEmployeeName: r.assignedEmployee?.name || 'غير معين',
  receiveDate: new Date(r.receiveDate).toISOString().split('T')[0],
  expectedCompletionDate: new Date(r.expectedCompletionDate).toISOString().split('T')[0],
  completedDate: r.completedDate ? new Date(r.completedDate).toISOString().split('T')[0] : '-',
  deadlineStatus: r.deadlineStatus,
  daysRemainingOrOverdue: r.daysRemainingOrOverdue
});

export const getRequestsReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const where = buildReportWhere(req.query);

    const requests = await prisma.request.findMany({
      where,
      include: {
        customer: { include: { city: true } },
        ministry: true,
        city: true,
        requestTypeRel: true,
        assignedEmployee: true
      },
      orderBy: { receiveDate: 'desc' }
    });

    const total = requests.length;
    const completed = requests.filter((r) => ['تم التسليم', 'مغلق', 'الإجابة جاهزة'].includes(r.status)).length;
    const overdue = requests.filter((r) => r.deadlineStatus === 'متأخر').length;
    const inProgress = requests.filter((r) => !['تم التسليم', 'مغلق', 'الإجابة جاهزة'].includes(r.status)).length;

    const priorityCounts = {
      عاجل: requests.filter((r) => r.priority === PriorityLevel.URGENT).length,
      مهم: requests.filter((r) => r.priority === PriorityLevel.IMPORTANT).length,
      عادي: requests.filter((r) => r.priority === PriorityLevel.NORMAL).length
    };

    return sendSuccess(res, {
      total,
      completed,
      overdue,
      inProgress,
      priorityCounts,
      requestsCount: total
    });
  } catch (error) {
    next(error);
  }
};

export const exportRequestsReportExcel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const params = { ...req.query, ...req.body };
    const where = buildReportWhere(params);

    // Selected columns parsing
    let selectedColumns: string[] = [];
    if (Array.isArray(params.columns)) {
      selectedColumns = params.columns;
    } else if (typeof params.columns === 'string') {
      selectedColumns = params.columns.split(',').map((s: string) => s.trim());
    } else if (Array.isArray(params.selectedColumns)) {
      selectedColumns = params.selectedColumns;
    }

    if (selectedColumns.length === 0) {
      selectedColumns = ALL_REQUEST_COLUMNS.map((c) => c.key);
    }

    const rawRequests = await prisma.request.findMany({
      where,
      include: {
        customer: { include: { city: true } },
        ministry: true,
        city: true,
        requestTypeRel: true,
        assignedEmployee: true
      },
      orderBy: { receiveDate: 'desc' }
    });

    const exportItems = rawRequests.map(mapRawRequestToExportItem);

    await generateRequestsExcel(exportItems, selectedColumns, res, 'تقرير_معاملات_CivicFlow.xlsx');
  } catch (error) {
    next(error);
  }
};

export const exportRequestsReportPdf = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const params = { ...req.query, ...req.body };
    const where = buildReportWhere(params);

    let selectedColumns: string[] = [];
    if (Array.isArray(params.columns)) {
      selectedColumns = params.columns;
    } else if (typeof params.columns === 'string') {
      selectedColumns = params.columns.split(',').map((s: string) => s.trim());
    } else if (Array.isArray(params.selectedColumns)) {
      selectedColumns = params.selectedColumns;
    }

    if (selectedColumns.length === 0) {
      selectedColumns = ['requestNumber', 'customerName', 'customerPhone', 'cityName', 'ministryName', 'requestType', 'status', 'receiveDate'];
    }

    const rawRequests = await prisma.request.findMany({
      where,
      include: {
        customer: { include: { city: true } },
        ministry: true,
        city: true,
        requestTypeRel: true,
        assignedEmployee: true
      },
      orderBy: { receiveDate: 'desc' }
    });

    const exportItems = rawRequests.map(mapRawRequestToExportItem);

    const filtersSummary: Record<string, string> = {
      'من تاريخ': params.fromDate ? String(params.fromDate) : '',
      'إلى تاريخ': params.toDate ? String(params.toDate) : '',
      'الحالة': params.status ? String(params.status) : '',
      'الأولوية': params.priority ? String(params.priority) : ''
    };

    await generateRequestsPdf(exportItems, selectedColumns, filtersSummary, res, 'تقرير_معاملات_CivicFlow.pdf');
  } catch (error) {
    next(error);
  }
};