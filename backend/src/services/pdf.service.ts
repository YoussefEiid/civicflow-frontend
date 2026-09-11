import { Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { TDocumentDefinitions } from 'pdfmake/interfaces.js';
import { processPdfMakeContent, fixArabicPdfText } from '../utils/arabicPdfHelper.js';

const require = createRequire(import.meta.url);
const pdfmake = require('pdfmake');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve fonts with priority on project-relative fonts, then system fallbacks
const getFontPaths = () => {
  const fontDirCandidates = [
    path.resolve(__dirname, '../../assets/fonts'),
    path.resolve(__dirname, '../assets/fonts'),
    path.resolve(process.cwd(), 'assets/fonts'),
    path.resolve(process.cwd(), 'backend/assets/fonts')
  ];

  let regularFont = '';
  let boldFont = '';

  for (const dir of fontDirCandidates) {
    const reg = path.join(dir, 'Cairo-Regular.ttf');
    const bld = path.join(dir, 'Cairo-Bold.ttf');
    if (fs.existsSync(reg) && fs.existsSync(bld)) {
      regularFont = reg;
      boldFont = bld;
      break;
    }
  }

  // Windows system font fallbacks
  if (!regularFont) {
    const winTahoma = 'C:\\Windows\\Fonts\\tahoma.ttf';
    const winTahomaBold = 'C:\\Windows\\Fonts\\tahomabd.ttf';
    if (fs.existsSync(winTahoma) && fs.existsSync(winTahomaBold)) {
      regularFont = winTahoma;
      boldFont = winTahomaBold;
    }
  }
  if (!regularFont) {
    const winArial = 'C:\\Windows\\Fonts\\arial.ttf';
    const winArialBold = 'C:\\Windows\\Fonts\\arialbd.ttf';
    if (fs.existsSync(winArial) && fs.existsSync(winArialBold)) {
      regularFont = winArial;
      boldFont = winArialBold;
    }
  }

  const primary = {
    normal: regularFont || 'Helvetica',
    bold: boldFont || regularFont || 'Helvetica-Bold',
    italics: regularFont || 'Helvetica-Oblique',
    bolditalics: boldFont || regularFont || 'Helvetica-BoldOblique'
  };

  return {
    Roboto: primary,
    Primary: primary
  };
};

export interface ColumnDefinition {
  key: string;
  label: string;
  width?: string | number;
}

export const ALL_REQUEST_COLUMNS: ColumnDefinition[] = [
  { key: 'requestNumber', label: 'رقم المعاملة', width: 'auto' },
  { key: 'customerNumber', label: 'رقم المراجع', width: 'auto' },
  { key: 'nationalId', label: 'رقم الهوية', width: 'auto' },
  { key: 'customerName', label: 'اسم المراجع', width: '*' },
  { key: 'customerPhone', label: 'رقم الهاتف', width: 'auto' },
  { key: 'cityName', label: 'المدينة', width: 'auto' },
  { key: 'address', label: 'العنوان', width: '*' },
  { key: 'ministryName', label: 'الجهة / الوزارة', width: '*' },
  { key: 'requestType', label: 'نوع الطلب', width: 'auto' },
  { key: 'title', label: 'عنوان الطلب', width: '*' },
  { key: 'status', label: 'الحالة', width: 'auto' },
  { key: 'priority', label: 'الأولوية', width: 'auto' },
  { key: 'receiveDate', label: 'تاريخ الاستلام', width: 'auto' },
  { key: 'expectedCompletionDate', label: 'الموعد المتوقع', width: 'auto' },
  { key: 'completedDate', label: 'تاريخ الإنجاز', width: 'auto' },
  { key: 'deadlineStatus', label: 'حالة SLA', width: 'auto' },
  { key: 'assignedEmployeeName', label: 'الموظف المسؤول', width: 'auto' },
  { key: 'details', label: 'تفاصيل المعاملة', width: '*' }
];

export async function generateRequestsPdf(
  requests: any[],
  selectedColumnKeys: string[],
  filtersSummary: Record<string, string>,
  res: Response,
  filename = 'تقرير_معاملات_CivicFlow.pdf'
) {
  const fonts = getFontPaths();

  // Filter columns based on user selection, keeping standard order or user preference
  const activeColumns = selectedColumnKeys
    .map((k) => ALL_REQUEST_COLUMNS.find((col) => col.key === k))
    .filter((col): col is ColumnDefinition => Boolean(col));
  const finalColumns = activeColumns.length > 0 ? activeColumns : ALL_REQUEST_COLUMNS.slice(0, 7);

  // Build table headers
  const tableHeaders = finalColumns.map((col) => ({
    text: col.label,
    style: 'tableHeader',
    alignment: 'center'
  }));

  // Build table rows
  const tableBody: any[] = [tableHeaders];

  requests.forEach((r, index) => {
    const row = finalColumns.map((col) => {
      let val = r[col.key] !== undefined && r[col.key] !== null ? r[col.key] : '-';
      if (typeof val === 'string' && val.length > 50) {
        val = val.substring(0, 47) + '...';
      }
      return {
        text: String(val),
        style: index % 2 === 0 ? 'tableCell' : 'tableCellAlt',
        alignment: 'center'
      };
    });
    tableBody.push(row);
  });

  // Filters text block
  const filterEntries = Object.entries(filtersSummary).filter(([_, v]) => v && v !== 'الكل' && v !== 'all');
  const filterText = filterEntries.length > 0
    ? filterEntries.map(([k, v]) => `${k}: ${v}`).join('  |  ')
    : 'كافة المعاملات والسجلات';

  const docDefinition: TDocumentDefinitions = {
    pageSize: 'A4',
    pageOrientation: finalColumns.length > 5 ? 'landscape' : 'portrait',
    pageMargins: [30, 40, 30, 40],
    defaultStyle: {
      font: 'Primary',
      fontSize: 9
    },
    header: (currentPage, pageCount) => ({
      margin: [30, 15, 30, 0],
      columns: [
        { text: fixArabicPdfText('CivicFlow — منظومة إدارة وتتبع المعاملات الحكومية'), fontSize: 8, color: '#64748b' },
        { text: fixArabicPdfText(`صفحة ${currentPage} من ${pageCount}`), fontSize: 8, alignment: 'left', color: '#64748b' }
      ]
    }),
    footer: () => ({
      margin: [30, 0, 30, 15],
      columns: [
        { text: fixArabicPdfText(`تاريخ التصدير: ${new Date().toISOString().split('T')[0]}`), fontSize: 8, color: '#94a3b8' },
        { text: fixArabicPdfText('نظام التدقيق والرقابة الإدارية المعتمد'), fontSize: 8, alignment: 'left', color: '#94a3b8' }
      ]
    }),
    content: [
      {
        text: 'تقرير المعاملات والطلبات الرسمية',
        style: 'docTitle'
      },
      {
        text: `المعايير المحددة: ${filterText}`,
        style: 'filterSubtitle'
      },
      {
        text: `إجمالي السجلات المضمنة في التقرير: ${requests.length} معاملة`,
        style: 'countNote'
      },
      {
        table: {
          headerRows: 1,
          widths: finalColumns.map(() => '*'),
          body: tableBody
        },
        layout: {
          hLineWidth: (i, node) => (i === 0 || i === 1 || i === node.table.body.length ? 1 : 0.5),
          vLineWidth: () => 0.5,
          hLineColor: (i) => (i === 1 ? '#0f172a' : '#e2e8f0'),
          vLineColor: () => '#e2e8f0',
          paddingTop: () => 5,
          paddingBottom: () => 5,
          paddingLeft: () => 4,
          paddingRight: () => 4
        }
      }
    ],
    styles: {
      docTitle: {
        fontSize: 15,
        bold: true,
        alignment: 'center',
        margin: [0, 0, 0, 4],
        color: '#0f172a'
      },
      filterSubtitle: {
        fontSize: 9,
        alignment: 'center',
        color: '#3b82f6',
        margin: [0, 0, 0, 2]
      },
      countNote: {
        fontSize: 8,
        alignment: 'center',
        color: '#64748b',
        margin: [0, 0, 0, 12]
      },
      tableHeader: {
        bold: true,
        fontSize: 8.5,
        color: '#ffffff',
        fillColor: '#1e293b'
      },
      tableCell: {
        fontSize: 8,
        color: '#1e293b'
      },
      tableCellAlt: {
        fontSize: 8,
        color: '#1e293b',
        fillColor: '#f8fafc'
      }
    }
  };

  const processedDocDef = processPdfMakeContent(docDefinition);

  pdfmake.fonts = fonts;
  const pdfDoc = pdfmake.createPdf(processedDocDef);
  const buffer = await pdfDoc.getBuffer();

  const encodedFilename = encodeURIComponent(filename);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${encodedFilename}"; filename*=UTF-8''${encodedFilename}`
  );

  res.send(buffer);
}

export async function generateAuditLogsPdf(
  auditLogs: any[],
  filtersSummary: Record<string, string>,
  res: Response,
  filename = 'سجل_العمليات_CivicFlow.pdf'
) {
  const fonts = getFontPaths();

  const tableHeaders = [
    { text: 'المستخدم', style: 'tableHeader', alignment: 'center' },
    { text: 'الرتبة/الدور', style: 'tableHeader', alignment: 'center' },
    { text: 'نوع العملية', style: 'tableHeader', alignment: 'center' },
    { text: 'رقم المعاملة', style: 'tableHeader', alignment: 'center' },
    { text: 'التفاصيل والبيان', style: 'tableHeader', alignment: 'center' },
    { text: 'عنوان IP', style: 'tableHeader', alignment: 'center' },
    { text: 'التاريخ والوقت', style: 'tableHeader', alignment: 'center' }
  ];

  const tableBody: any[] = [tableHeaders];

  auditLogs.forEach((log, index) => {
    let detailsStr = log.details || '-';
    if (detailsStr.length > 50) detailsStr = detailsStr.substring(0, 47) + '...';

    tableBody.push([
      { text: log.userName || 'النظام', style: index % 2 === 0 ? 'tableCell' : 'tableCellAlt', alignment: 'center' },
      { text: log.userRole || '-', style: index % 2 === 0 ? 'tableCell' : 'tableCellAlt', alignment: 'center' },
      { text: log.action || '-', style: index % 2 === 0 ? 'tableCell' : 'tableCellAlt', alignment: 'center' },
      { text: log.requestNumber || 'عام', style: index % 2 === 0 ? 'tableCell' : 'tableCellAlt', alignment: 'center' },
      { text: detailsStr, style: index % 2 === 0 ? 'tableCell' : 'tableCellAlt', alignment: 'right' },
      { text: log.ipAddress || '127.0.0.1', style: index % 2 === 0 ? 'tableCell' : 'tableCellAlt', alignment: 'center' },
      { text: `${log.date || ''} ${log.time || ''}`.trim() || '-', style: index % 2 === 0 ? 'tableCell' : 'tableCellAlt', alignment: 'center' }
    ]);
  });

  const filterEntries = Object.entries(filtersSummary).filter(([_, v]) => v && v !== 'الكل' && v !== 'all');
  const filterText = filterEntries.length > 0
    ? filterEntries.map(([k, v]) => `${k}: ${v}`).join('  |  ')
    : 'كافة سجلات الرقابة الإدارية';

  const docDefinition: TDocumentDefinitions = {
    pageSize: 'A4',
    pageOrientation: 'landscape',
    pageMargins: [30, 40, 30, 40],
    defaultStyle: {
      font: 'Primary',
      fontSize: 9
    },
    header: (currentPage, pageCount) => ({
      margin: [30, 15, 30, 0],
      columns: [
        { text: fixArabicPdfText('CivicFlow — سجل تدقيق العمليات الأمنية والإدارية'), fontSize: 8, color: '#64748b' },
        { text: fixArabicPdfText(`صفحة ${currentPage} من ${pageCount}`), fontSize: 8, alignment: 'left', color: '#64748b' }
      ]
    }),
    footer: () => ({
      margin: [30, 0, 30, 15],
      columns: [
        { text: fixArabicPdfText(`تاريخ التصدير: ${new Date().toISOString().split('T')[0]}`), fontSize: 8, color: '#94a3b8' },
        { text: fixArabicPdfText('سجل غير قابل للتعديل (Tamper-evident Audit Trail)'), fontSize: 8, alignment: 'left', color: '#94a3b8' }
      ]
    }),
    content: [
      {
        text: 'سجل العمليات والرقابة الإدارية المعتمد',
        style: 'docTitle'
      },
      {
        text: `المعايير المحددة: ${filterText}`,
        style: 'filterSubtitle'
      },
      {
        text: `إجمالي الحركات والعمليات: ${auditLogs.length} عملية`,
        style: 'countNote'
      },
      {
        table: {
          headerRows: 1,
          widths: ['12%', '10%', '13%', '12%', '30%', '11%', '12%'],
          body: tableBody
        },
        layout: {
          hLineWidth: (i, node) => (i === 0 || i === 1 || i === node.table.body.length ? 1 : 0.5),
          vLineWidth: () => 0.5,
          hLineColor: (i) => (i === 1 ? '#0f172a' : '#e2e8f0'),
          vLineColor: () => '#e2e8f0',
          paddingTop: () => 5,
          paddingBottom: () => 5,
          paddingLeft: () => 4,
          paddingRight: () => 4
        }
      }
    ],
    styles: {
      docTitle: {
        fontSize: 15,
        bold: true,
        alignment: 'center',
        margin: [0, 0, 0, 4],
        color: '#0f172a'
      },
      filterSubtitle: {
        fontSize: 9,
        alignment: 'center',
        color: '#3b82f6',
        margin: [0, 0, 0, 2]
      },
      countNote: {
        fontSize: 8,
        alignment: 'center',
        color: '#64748b',
        margin: [0, 0, 0, 12]
      },
      tableHeader: {
        bold: true,
        fontSize: 8.5,
        color: '#ffffff',
        fillColor: '#0f172a'
      },
      tableCell: {
        fontSize: 8,
        color: '#1e293b'
      },
      tableCellAlt: {
        fontSize: 8,
        color: '#1e293b',
        fillColor: '#f8fafc'
      }
    }
  };

  const processedDocDef = processPdfMakeContent(docDefinition);

  pdfmake.fonts = fonts;
  const pdfDoc = pdfmake.createPdf(processedDocDef);
  const buffer = await pdfDoc.getBuffer();

  const encodedFilename = encodeURIComponent(filename);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${encodedFilename}"; filename*=UTF-8''${encodedFilename}`
  );

  res.send(buffer);
}
