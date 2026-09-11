import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Download,
  Check,
  RotateCcw,
  FileSpreadsheet,
  FileText,
  Search,
  CheckCheck,
  Square,
  Sparkles
} from 'lucide-react';
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
  // Initialize from storage or defaults
  const [selectedKeys, setSelectedKeys] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // fallback
    }
    return REPORT_COLUMNS.filter((c) => c.defaultSelected).map((c) => c.key);
  });

  const [exportFormat, setExportFormat] = useState<'excel' | 'pdf'>(defaultFormat);
  const [searchQuery, setSearchQuery] = useState('');

  // Sync default format when modal opens without resetting column selection
  useEffect(() => {
    if (isOpen) {
      setExportFormat(defaultFormat);
      setSearchQuery('');
      // Refresh from storage if available
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setSelectedKeys(parsed);
          }
        }
      } catch {
        // ignore
      }
    }
  }, [isOpen, defaultFormat]);

  // Auto-persist column preferences on change
  const saveToStorage = (keys: string[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
    } catch {
      // ignore
    }
  };

  const toggleColumn = (key: string) => {
    setSelectedKeys((prev) => {
      const next = prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key];
      saveToStorage(next);
      return next;
    });
  };

  const handleSelectAll = () => {
    const allKeys = REPORT_COLUMNS.map((c) => c.key);
    setSelectedKeys(allKeys);
    saveToStorage(allKeys);
  };

  const handleDeselectAll = () => {
    setSelectedKeys([]);
    saveToStorage([]);
  };

  const handleResetDefault = () => {
    const defaultKeys = REPORT_COLUMNS.filter((c) => c.defaultSelected).map((c) => c.key);
    setSelectedKeys(defaultKeys);
    saveToStorage(defaultKeys);
  };

  const handleConfirmExport = () => {
    if (selectedKeys.length === 0 || isExporting) return;
    onExport(exportFormat, selectedKeys);
  };

  // Filter columns based on search query
  const filteredColumns = useMemo(() => {
    if (!searchQuery.trim()) return REPORT_COLUMNS;
    const q = searchQuery.trim().toLowerCase();
    return REPORT_COLUMNS.filter(
      (c) => c.label.toLowerCase().includes(q) || c.key.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-fade-in"
      dir="rtl"
    >
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 dark:border-gray-700 flex flex-col max-h-[92vh] animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl ${
                exportFormat === 'excel'
                  ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                  : 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400'
              }`}
            >
              {exportFormat === 'excel' ? (
                <FileSpreadsheet className="w-5 h-5" />
              ) : (
                <FileText className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">{title}</h3>
              <p className="text-xs text-slate-500 dark:text-gray-400">
                خصص وافرز الأعمدة المطلوب إدراجها في المستخرج النهائي
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-gray-200 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Format Selector Bar */}
        <div className="p-4 bg-slate-50/80 dark:bg-gray-800/60 border-b border-slate-100 dark:border-gray-700 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            {/* Format toggle buttons */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700 dark:text-gray-300">
                صيغة المستند:
              </span>
              <div className="flex bg-slate-200/80 dark:bg-gray-700 rounded-xl p-1 gap-1">
                <button
                  type="button"
                  onClick={() => setExportFormat('excel')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    exportFormat === 'excel'
                      ? 'bg-emerald-600 text-white shadow-sm scale-100'
                      : 'text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  Excel (XLSX)
                </button>
                <button
                  type="button"
                  onClick={() => setExportFormat('pdf')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    exportFormat === 'pdf'
                      ? 'bg-rose-600 text-white shadow-sm scale-100'
                      : 'text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  PDF (عربي RTL)
                </button>
              </div>
            </div>

            {/* Quick Bulk Action Buttons */}
            <div className="flex items-center gap-1.5 text-xs">
              <button
                type="button"
                onClick={handleSelectAll}
                className="flex items-center gap-1 px-2.5 py-1.5 font-bold text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-950/50 rounded-lg hover:bg-brand-100 transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                تحديد الكل
              </button>
              <button
                type="button"
                onClick={handleDeselectAll}
                className="flex items-center gap-1 px-2.5 py-1.5 font-bold text-slate-600 dark:text-gray-300 bg-slate-200/70 dark:bg-gray-700 rounded-lg hover:bg-slate-300 transition-colors"
              >
                <Square className="w-3.5 h-3.5" />
                إلغاء الكل
              </button>
              <button
                type="button"
                onClick={handleResetDefault}
                className="flex items-center gap-1 px-2.5 py-1.5 font-bold text-slate-600 dark:text-gray-300 bg-slate-200/70 dark:bg-gray-700 rounded-lg hover:bg-slate-300 transition-colors"
                title="استعادة التحديد الافتراضي"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                الافتراضي
              </button>
            </div>
          </div>

          {/* Search and summary line */}
          <div className="flex items-center justify-between gap-3 pt-1">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث عن حقل معين..."
                className="w-full pl-3 pr-9 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-slate-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="text-xs font-bold text-slate-500 dark:text-gray-400 whitespace-nowrap bg-white dark:bg-gray-700 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-gray-600">
              تم تحديد <span className="text-brand-600 dark:text-brand-400">{selectedKeys.length}</span> من أصل{' '}
              {REPORT_COLUMNS.length}
            </div>
          </div>
        </div>

        {/* Checkbox Grid */}
        <div className="p-5 overflow-y-auto flex-1 bg-slate-50/30 dark:bg-gray-800">
          {filteredColumns.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              لم يتم العثور على أي حقول مطابقة لبحثك
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {filteredColumns.map((col) => {
                const isChecked = selectedKeys.includes(col.key);
                return (
                  <button
                    key={col.key}
                    type="button"
                    onClick={() => toggleColumn(col.key)}
                    className={`flex items-center justify-between p-3 rounded-xl border text-right transition-all select-none ${
                      isChecked
                        ? 'bg-brand-50/70 dark:bg-brand-950/30 border-brand-500 dark:border-brand-600 text-brand-950 dark:text-brand-100 shadow-sm ring-1 ring-brand-500/20'
                        : 'bg-white dark:bg-gray-800 border-slate-200 dark:border-gray-700 text-slate-700 dark:text-gray-300 hover:border-slate-300 dark:hover:border-gray-600 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Checkbox custom icon box */}
                      <div
                        className={`w-5 h-5 rounded-lg flex items-center justify-center border transition-all ${
                          isChecked
                            ? 'bg-brand-600 border-brand-600 text-white shadow-sm'
                            : 'border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                        }`}
                      >
                        {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                      <span className="text-xs font-bold">{col.label}</span>
                    </div>

                    {col.defaultSelected && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-gray-700 text-slate-500 dark:text-gray-400 font-medium">
                        أساسي
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-500 dark:text-gray-400 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>يتم حفظ تفضيلات الحقول تلقائياً</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-gray-300 bg-slate-100 dark:bg-gray-700 rounded-xl hover:bg-slate-200 dark:hover:bg-gray-600 transition-colors"
            >
              إلغاء
            </button>
            <button
              type="button"
              disabled={selectedKeys.length === 0 || isExporting}
              onClick={handleConfirmExport}
              className={`flex items-center gap-2 px-5 py-2 text-xs font-black text-white rounded-xl shadow-md transition-all ${
                selectedKeys.length === 0 || isExporting
                  ? 'bg-slate-400 cursor-not-allowed opacity-60'
                  : exportFormat === 'excel'
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                  : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
              }`}
            >
              <Download className="w-4 h-4" />
              {isExporting
                ? 'جاري تجهيز التصدير...'
                : `تصدير ${exportFormat === 'excel' ? 'Excel' : 'PDF'} (${selectedKeys.length} حقل)`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
