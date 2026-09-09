import ExcelJS from 'exceljs';
import { Response } from 'express';
import { ALL_REQUEST_COLUMNS } from './pdf.service.js';

export async function generateRequestsExcel(
  requests: any[],
  selectedColumnKeys: string[],
  res: Response,
  filename = 'تقرير_معاملات_CivicFlow.xlsx'
) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'CivicFlow Government Management System';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('تقرير المعاملات', {
    views: [{ rightToLeft: true }] // RTL Arabic layout
  });

  // Filter columns based on user selection, keeping standard order
  const activeColumns = ALL_REQUEST_COLUMNS.filter((col) => selectedColumnKeys.includes(col.key));
  const finalColumns = activeColumns.length > 0 ? activeColumns : ALL_REQUEST_COLUMNS.slice(0, 10);

  worksheet.columns = finalColumns.map((col) => ({
    header: col.label,
    key: col.key,
    width: col.key === 'title' || col.key === 'details' || col.key === 'address' ? 32 : 20
  }));

  // Header styling
  const headerRow = worksheet.getRow(1);
  headerRow.height = 30;
  headerRow.eachCell((cell) => {
    cell.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E293B' } // Slate 800
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      bottom: { style: 'medium', color: { argb: 'FF0F172A' } },
      left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
    };
  });

  // Add data rows
  requests.forEach((r, idx) => {
    const rowData: Record<string, any> = {};
    finalColumns.forEach((col) => {
      rowData[col.key] = r[col.key] !== undefined && r[col.key] !== null ? r[col.key] : '-';
    });

    const row = worksheet.addRow(rowData);
    row.height = 24;
    row.eachCell((cell) => {
      cell.font = { name: 'Segoe UI', size: 10 };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
      };

      // Zebra striping
      if (idx % 2 === 1) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF8FAFC' }
        };
      }
    });
  });

  const encodedFilename = encodeURIComponent(filename);
  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${encodedFilename}"; filename*=UTF-8''${encodedFilename}`
  );

  await workbook.xlsx.write(res);
  res.end();
}