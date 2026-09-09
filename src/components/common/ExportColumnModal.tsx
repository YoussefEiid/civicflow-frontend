import React, { useState, useEffect } from 'react';
import { X, Download, CheckSquare, Square, RotateCcw, Save, FileSpreadsheet, FileText } from 'lucide-react';
import { REPORT_COLUMNS, ReportColumnOption } from '../../services/reportService';

interface ExportColumnModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (format: 'excel' | 'pdf', selectedColumns: string[]) => void;
  title?: string;
  defaultFormat?: 'excel' | 'pdf';
  isExporting?: boolean;
}

const STORAGE_KEY = 'civicflow_custom_export_columns';

export const ExportColumnModal: React.FC<ExportColumnModalProps> = ({
  isOpen,
  onClose,
  onExport,
  title = 'تخصيص أعمدة التصدير',
  defaultFormat = 'excel',
  isExporting = false
}) => {
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [exportFormat, setExportFormat] = useState<'excel' | 'pdf'>(defaultFormat);

  useEffect(() => {
    if (isOpen) {
      setExportFormat(defaultFormat);
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setSelectedKeys(parsed);
            return;
          }
        } catch {
          // ignore
        }
      }
      setSelectedKeys(REPORT_COLUMNS.filter((c) => c.defaultSelected).map((c) => c.key));
    }
  }, [isOpen, defaultFormat]);

  if (!isOpen) return null;

  const toggleColumn = (key: string) => {
    setSelectedKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleSelectAll = () => {
    setSelectedKeys(REPORT_COLUMNS.map((c) => c.key));
  };

  const handleDeselectAll = () => {
    setSelectedKeys([]);
  };

  const handleResetDefault = () => {
    setSelectedKeys(REPORT_COLUMNS.filter((c) => c.defaultSelected).map((c) => c.key));
  };

  const handleSavePreferences = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedKeys));
  };

  const handleConfirmExport = () => {
    if (selectedKeys.length === 0) return;
    onExport(exportFormat, selectedKeys);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in" dir="rtl">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-100 dark:border-gray-700 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-xl">
              {exportFormat === 'excel' ? <FileSpreadsheet className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">حدد الحقول التي ترغب في تضمينها في الملف المستخرج</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Format Selector & Bulk Controls */}
        <div className="p-5 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">صيغة التصدير:</span>
              <div className="flex bg-gray-200 dark:bg-gray-700 rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => setExportFormat('excel')}
                  className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all ${
                    exportFormat === 'excel'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900'
                  }`}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  Excel (XLSX)
                </button>
                <button
                  type="button"
                  onClick={() => setExportFormat('pdf')}
                  className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all ${
                    exportFormat === 'pdf'
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  PDF (عربي RTL)
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={handleSelectAll}
                className="px-2.5 py-1 text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/30 rounded-md hover:bg-brand-100 transition-colors"
              >
                تحديد الكل
              </button>
              <button
                type="button"
                onClick={handleDeselectAll}
                className="px-2.5 py-1 text-gray-600 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 transition-colors"
              >
                إلغاء التحديد
              </button>
              <button
                type="button"
                onClick={handleResetDefault}
                className="flex items-center gap-1 px-2.5 py-1 text-gray-600 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                title="استعادة الحقول الافتراضية"
              >
                <RotateCcw className="w-3 h-3" />
                الافتراضي
              </button>
            </div>
          </div>
        </div>

        {/* Checkbox Grid */}
        <div className="p-5 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {REPORT_COLUMNS.map((col) => {
              const isChecked = selectedKeys.includes(col.key);
              return (
                <label
                  key={col.key}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                    isChecked
                      ? 'bg-brand-50/50 dark:bg-brand-900/20 border-brand-300 dark:border-brand-700 text-brand-900 dark:text-brand-100 shadow-sm'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleColumn(col.key)}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                    isChecked
                      ? 'bg-brand-600 border-brand-600 text-white'
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                  }`}>
                    {isChecked && <CheckSquare className="w-3.5 h-3.5" />}
                  </div>
                  <span className="text-sm font-medium">{col.label}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleSavePreferences}
            className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            حفظ اختياري كإعداد مفضل
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              إلغاء
            </button>
            <button
              type="button"
              disabled={selectedKeys.length === 0 || isExporting}
              onClick={handleConfirmExport}
              className={`flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white rounded-xl shadow-md transition-all ${
                selectedKeys.length === 0 || isExporting
                  ? 'bg-gray-400 cursor-not-allowed'
                  : exportFormat === 'excel'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              <Download className="w-4 h-4" />
              {isExporting ? 'جاري التصدير...' : `تصدير (${selectedKeys.length} حقول)`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
