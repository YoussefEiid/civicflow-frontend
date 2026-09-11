import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { REPORT_COLUMNS } from './reportService';

export interface ExportPdfOptions {
  title?: string;
  subtitle?: string;
  filename?: string;
  filtersSummary?: Record<string, string>;
  selectedColumns?: string[];
  orientation?: 'portrait' | 'landscape';
}

/**
 * Capture a DOM element and generate a high-resolution, paginated PDF via html2canvas & jsPDF.
 */
const renderElementToPdf = async (
  targetElement: HTMLElement,
  filename: string,
  isLandscape = true
): Promise<void> => {
  // Ensure fonts and DOM styles are completely painted
  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }
  await new Promise((resolve) => setTimeout(resolve, 300));

  const canvas = await html2canvas(targetElement, {
    scale: 2, // High resolution (Retina DPI)
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    windowWidth: isLandscape ? 1200 : 850
  });

  const imgData = canvas.toDataURL('image/jpeg', 0.98);
  const orientation = isLandscape ? 'landscape' : 'portrait';

  const pdf = new jsPDF({
    orientation,
    unit: 'mm',
    format: 'a4',
    compress: true
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const margin = 5; // mm
  const printWidth = pageWidth - margin * 2;
  const printHeight = (canvas.height * printWidth) / canvas.width;

  let heightLeft = printHeight;
  let position = margin;

  // Render first page
  pdf.addImage(imgData, 'JPEG', margin, position, printWidth, printHeight, undefined, 'FAST');
  heightLeft -= (pageHeight - margin * 2);

  // Render additional pages if content overflows single page
  while (heightLeft > 0) {
    position = position - (pageHeight - margin * 2);
    pdf.addPage();
    pdf.addImage(imgData, 'JPEG', margin, position, printWidth, printHeight, undefined, 'FAST');
    heightLeft -= (pageHeight - margin * 2);
  }

  pdf.save(filename);
};

export const htmlPdfExportService = {
  /**
   * Export an existing visible DOM element directly to PDF.
   */
  exportElementToPdf: async (
    element: HTMLElement,
    filename = 'civicflow-export.pdf',
    orientation: 'portrait' | 'landscape' = 'landscape'
  ): Promise<void> => {
    await renderElementToPdf(element, filename, orientation === 'landscape');
  },

  /**
   * Generate an official, styled RTL HTML report and export to PDF.
   */
  exportRequestsReportToPdf: async (
    requests: any[],
    selectedColumnKeys: string[] = [],
    filtersSummary: Record<string, string> = {},
    filename = 'تقرير_معاملات_CivicFlow.pdf'
  ): Promise<void> => {
    const activeColumns =
      selectedColumnKeys.length > 0
        ? selectedColumnKeys
            .map((k) => REPORT_COLUMNS.find((col) => col.key === k))
            .filter((col): col is typeof REPORT_COLUMNS[0] => Boolean(col))
        : REPORT_COLUMNS.filter((c) => c.defaultSelected);

    const isLandscape = activeColumns.length > 5;
    const now = new Date();
    const formattedDate = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`;
    const formattedTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // Filter labels
    const activeFilters = Object.entries(filtersSummary)
      .filter(([_, v]) => v && v !== 'all' && v !== 'الكل')
      .map(
        ([k, v]) =>
          `<span style="background:#f1f5f9; padding:3px 8px; border-radius:6px; margin-left:6px; display:inline-block; border:1px solid #e2e8f0; font-size:11px;"><strong>${k}:</strong> ${v}</span>`
      )
      .join(' ');

    // Create top overlay in the viewport to guarantee 100% visible DOM rendering for html2canvas
    const overlay = document.createElement('div');
    overlay.id = 'civicflow-pdf-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.backgroundColor = 'rgba(15, 23, 42, 0.65)';
    overlay.style.backdropFilter = 'blur(4px)';
    overlay.style.zIndex = '999999';
    overlay.style.display = 'flex';
    overlay.style.flexDirection = 'column';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'flex-start';
    overlay.style.padding = '30px 20px';
    overlay.style.overflowY = 'auto';
    overlay.style.boxSizing = 'border-box';

    // Report Card
    const reportCard = document.createElement('div');
    reportCard.id = 'civicflow-pdf-report-card';
    reportCard.setAttribute('dir', 'rtl');
    reportCard.style.width = isLandscape ? '1120px' : '820px';
    reportCard.style.backgroundColor = '#ffffff';
    reportCard.style.color = '#0f172a';
    reportCard.style.fontFamily = "'Cairo', 'Segoe UI', Tahoma, Arial, sans-serif";
    reportCard.style.padding = '28px';
    reportCard.style.boxSizing = 'border-box';
    reportCard.style.borderRadius = '12px';
    reportCard.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.25)';

    // Table rows
    const tableRowsHtml = requests
      .map((r, idx) => {
        const bg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
        return `
        <tr style="background-color: ${bg}; border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 7px 4px; border: 1px solid #e2e8f0; font-weight: bold; color: #64748b; font-size: 10px;">${idx + 1}</td>
          ${activeColumns
            .map((col) => {
              let val = r[col.key];
              if (val === undefined || val === null || val === '') {
                val = '-';
              }

              let cellContent = String(val);
              if (col.key === 'status') {
                let badgeColor = '#334155';
                let badgeBg = '#f1f5f9';
                if (['تم التسليم', 'مغلق', 'الإجابة جاهزة', 'موافقة'].includes(cellContent)) {
                  badgeColor = '#047857';
                  badgeBg = '#d1fae5';
                } else if (['قيد المعالجة', 'قيد المراجعة', 'تم إرسال الطلب للجهة'].includes(cellContent)) {
                  badgeColor = '#1d4ed8';
                  badgeBg = '#dbeafe';
                } else if (['مرفوض', 'متأخر'].includes(cellContent)) {
                  badgeColor = '#be123c';
                  badgeBg = '#ffe4e6';
                }
                cellContent = `<span style="background:${badgeBg}; color:${badgeColor}; font-weight:bold; padding:2px 8px; border-radius:4px; font-size:9.5px; display:inline-block;">${cellContent}</span>`;
              } else if (col.key === 'priority') {
                let pColor = '#334155';
                let pBg = '#f1f5f9';
                if (cellContent === 'عاجل' || cellContent === 'URGENT') {
                  pColor = '#be123c';
                  pBg = '#ffe4e6';
                } else if (cellContent === 'مهم' || cellContent === 'IMPORTANT') {
                  pColor = '#b45309';
                  pBg = '#fef3c7';
                }
                cellContent = `<span style="background:${pBg}; color:${pColor}; font-weight:bold; padding:2px 8px; border-radius:4px; font-size:9.5px; display:inline-block;">${cellContent}</span>`;
              }

              return `<td style="padding: 7px 6px; border: 1px solid #e2e8f0; word-break: break-word; vertical-align: middle; font-size: 10px;">${cellContent}</td>`;
            })
            .join('')}
        </tr>
      `;
      })
      .join('');

    reportCard.innerHTML = `
      <div style="font-family: 'Cairo', 'Segoe UI', Tahoma, Arial, sans-serif; direction: rtl; text-align: right; line-height: 1.4; width: 100%;">
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f172a; padding-bottom: 14px; margin-bottom: 16px;">
          <div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="background: #2563eb; color: #ffffff; font-weight: 900; font-size: 15px; padding: 3px 10px; border-radius: 6px; display: inline-block;">CivicFlow</span>
              <span style="font-size: 13px; font-weight: 700; color: #475569;">منظومة إدارة وتتبع المعاملات الحكومية</span>
            </div>
            <h1 style="margin: 8px 0 0 0; font-size: 20px; font-weight: 900; color: #0f172a;">تقرير المعاملات والطلبات الرسمية</h1>
          </div>
          <div style="text-align: left; font-size: 11px; color: #64748b; line-height: 1.6;">
            <div>تاريخ التصدير: <strong style="color: #0f172a;">${formattedDate}</strong></div>
            <div>الوقت: <strong style="color: #0f172a;">${formattedTime}</strong></div>
            <div>إجمالي السجلات: <strong style="color: #2563eb;">${requests.length} معاملة</strong></div>
          </div>
        </div>

        <!-- Filter Subtitle if any -->
        ${
          activeFilters
            ? `<div style="font-size: 11px; color: #334155; margin-bottom: 14px; padding: 8px 12px; background: #f8fafc; border-radius: 6px; border: 1px solid #e2e8f0; line-height: 1.6;">
                <span style="font-weight: bold; margin-left: 6px;">المعايير المطبقة:</span> ${activeFilters}
               </div>`
            : ''
        }

        <!-- Table -->
        <table style="width: 100%; border-collapse: collapse; font-size: 10px; text-align: center; margin-bottom: 16px; background-color: #ffffff;">
          <thead>
            <tr style="background-color: #0f172a; color: #ffffff;">
              <th style="padding: 8px 4px; border: 1px solid #0f172a; width: 32px; font-weight: 700;">#</th>
              ${activeColumns
                .map(
                  (col) =>
                    `<th style="padding: 8px 6px; border: 1px solid #0f172a; font-weight: 700; white-space: nowrap;">${col.label}</th>`
                )
                .join('')}
            </tr>
          </thead>
          <tbody>
            ${
              tableRowsHtml ||
              '<tr><td colspan="' +
                (activeColumns.length + 1) +
                '" style="padding: 16px; text-align: center; color: #94a3b8;">لا توجد معاملات مطابقة للمعايير المحددة</td></tr>'
            }
          </tbody>
        </table>

        <!-- Footer Note -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #e2e8f0; padding-top: 10px; font-size: 9px; color: #94a3b8;">
          <div>CivicFlow Government Management System — وثيقة رسمية معتمدة</div>
          <div>نظام التدقيق والرقابة الإدارية الموحد</div>
        </div>
      </div>
    `;

    // Progress Bar Indicator at top
    const loadingBanner = document.createElement('div');
    loadingBanner.style.background = '#ffffff';
    loadingBanner.style.padding = '10px 20px';
    loadingBanner.style.borderRadius = '10px';
    loadingBanner.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1)';
    loadingBanner.style.marginBottom = '16px';
    loadingBanner.style.fontSize = '12px';
    loadingBanner.style.fontWeight = 'bold';
    loadingBanner.style.color = '#0f172a';
    loadingBanner.style.fontFamily = "'Cairo', sans-serif";
    loadingBanner.innerHTML = '⚡ جاري إنشاء ملف الـ PDF عالي الدقة وتحميله...';

    overlay.appendChild(loadingBanner);
    overlay.appendChild(reportCard);
    document.body.appendChild(overlay);

    try {
      await renderElementToPdf(reportCard, filename, isLandscape);
    } finally {
      if (overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
    }
  },

  /**
   * Export Audit Logs Report to PDF
   */
  exportAuditLogsReportToPdf: async (
    auditLogs: any[],
    filtersSummary: Record<string, string> = {},
    filename = 'سجل_العمليات_CivicFlow.pdf'
  ): Promise<void> => {
    const now = new Date();
    const formattedDate = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`;
    const formattedTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const overlay = document.createElement('div');
    overlay.id = 'civicflow-audit-pdf-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.backgroundColor = 'rgba(15, 23, 42, 0.65)';
    overlay.style.backdropFilter = 'blur(4px)';
    overlay.style.zIndex = '999999';
    overlay.style.display = 'flex';
    overlay.style.flexDirection = 'column';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'flex-start';
    overlay.style.padding = '30px 20px';
    overlay.style.overflowY = 'auto';
    overlay.style.boxSizing = 'border-box';

    const reportCard = document.createElement('div');
    reportCard.id = 'civicflow-audit-report-card';
    reportCard.setAttribute('dir', 'rtl');
    reportCard.style.width = '1120px';
    reportCard.style.backgroundColor = '#ffffff';
    reportCard.style.color = '#0f172a';
    reportCard.style.fontFamily = "'Cairo', 'Segoe UI', Tahoma, Arial, sans-serif";
    reportCard.style.padding = '28px';
    reportCard.style.boxSizing = 'border-box';
    reportCard.style.borderRadius = '12px';
    reportCard.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.25)';

    const tableRowsHtml = auditLogs
      .map((log, idx) => {
        const bg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
        return `
        <tr style="background-color: ${bg}; border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 7px 4px; border: 1px solid #e2e8f0; font-weight: bold; color: #64748b; font-size: 9.5px;">${idx + 1}</td>
          <td style="padding: 7px 6px; border: 1px solid #e2e8f0; font-weight: bold; font-size: 9.5px;">${log.userName || 'النظام'}</td>
          <td style="padding: 7px 6px; border: 1px solid #e2e8f0; font-size: 9.5px;">${log.userRole || '-'}</td>
          <td style="padding: 7px 6px; border: 1px solid #e2e8f0;"><span style="background:#eff6ff; color:#1d4ed8; font-weight:bold; padding:2px 8px; border-radius:4px; font-size:9px; display:inline-block;">${log.action || '-'}</span></td>
          <td style="padding: 7px 6px; border: 1px solid #e2e8f0; font-family:monospace; font-weight:bold; font-size: 9.5px;">${log.requestNumber || 'عام'}</td>
          <td style="padding: 7px 8px; border: 1px solid #e2e8f0; text-align: right; font-size: 9.5px;">${log.details || '-'}</td>
          <td style="padding: 7px 6px; border: 1px solid #e2e8f0; font-family:monospace; font-size: 9px;">${log.ipAddress || '127.0.0.1'}</td>
          <td style="padding: 7px 6px; border: 1px solid #e2e8f0; font-family:monospace; font-size: 9px;">${log.date || ''} ${log.time || ''}</td>
        </tr>
      `;
      })
      .join('');

    reportCard.innerHTML = `
      <div style="font-family: 'Cairo', 'Segoe UI', Tahoma, Arial, sans-serif; direction: rtl; text-align: right; line-height: 1.4; width: 100%;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f172a; padding-bottom: 14px; margin-bottom: 16px;">
          <div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="background: #0f172a; color: #ffffff; font-weight: 900; font-size: 15px; padding: 3px 10px; border-radius: 6px; display: inline-block;">CivicFlow</span>
              <span style="font-size: 13px; font-weight: 700; color: #475569;">سجل الرقابة الإدارية وتدقيق العمليات</span>
            </div>
            <h1 style="margin: 8px 0 0 0; font-size: 20px; font-weight: 900; color: #0f172a;">سجل الحركات والعمليات الأمنية المعتمد</h1>
          </div>
          <div style="text-align: left; font-size: 11px; color: #64748b; line-height: 1.6;">
            <div>تاريخ التصدير: <strong style="color: #0f172a;">${formattedDate}</strong></div>
            <div>الوقت: <strong style="color: #0f172a;">${formattedTime}</strong></div>
            <div>إجمالي السجلات: <strong style="color: #0f172a;">${auditLogs.length} عملية</strong></div>
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 9.5px; text-align: center; margin-bottom: 16px; background-color: #ffffff;">
          <thead>
            <tr style="background-color: #0f172a; color: #ffffff;">
              <th style="padding: 8px 4px; border: 1px solid #0f172a; width: 32px;">#</th>
              <th style="padding: 8px 6px; border: 1px solid #0f172a;">المستخدم</th>
              <th style="padding: 8px 6px; border: 1px solid #0f172a;">الدور</th>
              <th style="padding: 8px 6px; border: 1px solid #0f172a;">نوع العملية</th>
              <th style="padding: 8px 6px; border: 1px solid #0f172a;">رقم المعاملة</th>
              <th style="padding: 8px 8px; border: 1px solid #0f172a; text-align: right;">التفاصيل والبيان</th>
              <th style="padding: 8px 6px; border: 1px solid #0f172a;">عنوان IP</th>
              <th style="padding: 8px 6px; border: 1px solid #0f172a;">التاريخ والوقت</th>
            </tr>
          </thead>
          <tbody>
            ${
              tableRowsHtml ||
              '<tr><td colspan="8" style="padding: 16px; text-align: center; color: #94a3b8;">لا توجد سجلات مطابقة</td></tr>'
            }
          </tbody>
        </table>

        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #e2e8f0; padding-top: 10px; font-size: 9px; color: #94a3b8;">
          <div>CivicFlow Security & Audit Trail — سجل غير قابل للتعديل</div>
          <div>سجل العمليات والرقابة الإدارية المعتمد</div>
        </div>
      </div>
    `;

    const loadingBanner = document.createElement('div');
    loadingBanner.style.background = '#ffffff';
    loadingBanner.style.padding = '10px 20px';
    loadingBanner.style.borderRadius = '10px';
    loadingBanner.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1)';
    loadingBanner.style.marginBottom = '16px';
    loadingBanner.style.fontSize = '12px';
    loadingBanner.style.fontWeight = 'bold';
    loadingBanner.style.color = '#0f172a';
    loadingBanner.style.fontFamily = "'Cairo', sans-serif";
    loadingBanner.innerHTML = '⚡ جاري إنشاء ملف سجل العمليات PDF وتحميله...';

    overlay.appendChild(loadingBanner);
    overlay.appendChild(reportCard);
    document.body.appendChild(overlay);

    try {
      await renderElementToPdf(reportCard, filename, true);
    } finally {
      if (overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
    }
  }
};
