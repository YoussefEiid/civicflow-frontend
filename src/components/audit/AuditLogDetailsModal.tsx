import React, { useEffect, useState } from 'react';
import { X, User, Clock, Calendar, Globe, FileText, ArrowRight, ShieldCheck, CheckCircle, Database } from 'lucide-react';
import { auditService, AuditLogDetail } from '../../services/auditService';
import { AuditLog } from '../../types';

interface AuditLogDetailsModalProps {
  log: AuditLog | null;
  onClose: () => void;
  onViewRequest?: (reqNumber: string) => void;
}

export const AuditLogDetailsModal: React.FC<AuditLogDetailsModalProps> = ({
  log,
  onClose,
  onViewRequest
}) => {
  const [detailedLog, setDetailedLog] = useState<AuditLogDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!log) {
      setDetailedLog(null);
      return;
    }

    const fetchDetails = async () => {
      setLoading(true);
      try {
        const full = await auditService.getAuditLogById(log.id);
        setDetailedLog(full);
      } catch {
        // Fallback to basic log data
        setDetailedLog(log as AuditLogDetail);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [log]);

  if (!log) return null;

  const currentLog = detailedLog || (log as AuditLogDetail);

  const renderJsonPretty = (data: any) => {
    if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) {
      return <span className="text-xs text-gray-400 italic">لا توجد بيانات سابقة مسجلة</span>;
    }

    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch {
        return <pre className="text-xs font-mono p-3 bg-gray-50 dark:bg-gray-900 rounded-lg whitespace-pre-wrap">{data}</pre>;
      }
    }

    return (
      <pre className="text-xs font-mono p-3 bg-gray-50 dark:bg-gray-900/90 text-gray-800 dark:text-gray-200 rounded-xl overflow-x-auto border border-gray-100 dark:border-gray-800 leading-relaxed text-left" dir="ltr">
        {JSON.stringify(data, null, 2)}
      </pre>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in" dir="rtl">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden border border-gray-100 dark:border-gray-700 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-gray-900 dark:text-white">تفاصيل العملية والتدقيق</h3>
                <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300">
                  {currentLog.action}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">معرف السجل: {currentLog.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Metadata Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* User Details */}
            <div className="p-3.5 bg-gray-50 dark:bg-gray-750 rounded-xl border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs mb-1">
                <User className="w-3.5 h-3.5 text-brand-600" />
                <span>المستخدم المنفذ</span>
              </div>
              <p className="text-sm font-bold text-gray-900 dark:text-white">{currentLog.userName}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{currentLog.userRole || 'موظف'}</p>
              {currentLog.userEmail && <p className="text-[11px] text-gray-400 font-mono mt-0.5">{currentLog.userEmail}</p>}
            </div>

            {/* Request Link */}
            <div className="p-3.5 bg-gray-50 dark:bg-gray-750 rounded-xl border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs mb-1">
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                <span>المعاملة المرتبطة</span>
              </div>
              {currentLog.requestNumber ? (
                <div>
                  <p className="text-sm font-bold font-mono text-blue-600 dark:text-blue-400">
                    #{currentLog.requestNumber}
                  </p>
                  {onViewRequest && (
                    <button
                      onClick={() => onViewRequest(currentLog.requestNumber!)}
                      className="text-xs text-blue-600 hover:underline mt-1 font-medium flex items-center gap-1"
                    >
                      فتح تفاصيل المعاملة <ArrowRight className="w-3 h-3 rotate-180" />
                    </button>
                  )}
                </div>
              ) : (
                <span className="text-xs text-gray-400">عملية عامة بالنظام</span>
              )}
            </div>

            {/* Timestamp & IP */}
            <div className="p-3.5 bg-gray-50 dark:bg-gray-750 rounded-xl border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs mb-1">
                <Globe className="w-3.5 h-3.5 text-emerald-600" />
                <span>الوقت وعنوان IP</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-gray-700 dark:text-gray-300">
                <Calendar className="w-3 h-3 text-gray-400" />
                <span>{currentLog.date}</span>
                <Clock className="w-3 h-3 text-gray-400 mr-1" />
                <span>{currentLog.time}</span>
              </div>
              <p className="text-xs font-mono text-gray-500 dark:text-gray-400 mt-1">IP: {currentLog.ipAddress || '127.0.0.1'}</p>
            </div>
          </div>

          {/* Statement / Details */}
          <div className="p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/30">
            <h4 className="text-xs font-bold text-blue-900 dark:text-blue-300 mb-1">البيان والشرح الكامل</h4>
            <p className="text-xs sm:text-sm text-gray-800 dark:text-gray-200 leading-relaxed font-medium">
              {currentLog.details}
            </p>
          </div>

          {/* Before & After Diff Sections */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-brand-600" />
              تتبع فروقات البيانات (Data Diff)
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Before */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    البيانات قبل التعديل
                  </span>
                </div>
                {renderJsonPretty(currentLog.beforeValue)}
              </div>

              {/* After */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    البيانات بعد التعديل
                  </span>
                </div>
                {renderJsonPretty(currentLog.afterValue)}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
