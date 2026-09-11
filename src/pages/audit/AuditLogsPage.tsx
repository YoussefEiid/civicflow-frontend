import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { EmptyState } from '../../components/ui/EmptyState';
import { History, Search, Filter, ShieldCheck, User, Calendar, Clock, Activity, FileText, Download } from 'lucide-react';
import { auditService } from '../../services/auditService';
import { AuditLogDetailsModal } from '../../components/audit/AuditLogDetailsModal';
import { AuditLog } from '../../types';

export const AuditLogsPage: React.FC = () => {
  const navigate = useNavigate();
  const { auditLogs, employees } = useData();

  const [search, setSearch] = useState('');
  const [userFilter, setUserFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      if (userFilter !== 'all' && log.userName !== userFilter) return false;
      if (actionFilter !== 'all' && log.action !== actionFilter) return false;
      if (dateFilter && log.date !== dateFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        return (
          log.details.toLowerCase().includes(q) ||
          log.userName.toLowerCase().includes(q) ||
          (log.requestNumber && log.requestNumber.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [auditLogs, userFilter, actionFilter, dateFilter, search]);

  const uniqueActions = Array.from(new Set(auditLogs.map((l) => l.action)));

  const handleExportPdf = async () => {
    try {
      setIsExporting(true);
      await auditService.exportPdf(
        {
          search: search.trim() || undefined,
          user: userFilter !== 'all' ? userFilter : undefined,
          action: actionFilter !== 'all' ? actionFilter : undefined,
          date: dateFilter || undefined
        },
        filteredLogs
      );
    } catch (err) {
      console.error('Export PDF error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-gray-700">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">سجل العمليات والرقابة الإدارية</h1>
          <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
            سجل غير قابل للتعديل يوثق كافة التعديلات، الحركات، وتغييرات الحالات الصادرة والواردة مع تتبع الفروقات
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportPdf}
            disabled={isExporting || filteredLogs.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition shadow-sm disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            {isExporting ? 'جاري تصدير PDF...' : 'تصدير السجل PDF'}
          </button>
          <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            التدقيق الأمني مفعل ونشط
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-slate-200 dark:border-gray-700 shadow-subtle grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث بالتفاصيل أو رقم الطلب أو الموظف..."
            className="w-full pl-4 pr-10 py-2 bg-slate-50 dark:bg-gray-700 rounded-lg border border-slate-200 dark:border-gray-600 text-xs text-slate-900 dark:text-white focus:bg-white focus:outline-none"
          />
        </div>

        <div>
          <select
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            className="w-full text-xs rounded-lg border border-slate-300 dark:border-gray-600 p-2 bg-white dark:bg-gray-700 text-slate-900 dark:text-white"
          >
            <option value="all">كافة المستخدمين</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.name}>
                {emp.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="w-full text-xs rounded-lg border border-slate-300 dark:border-gray-600 p-2 bg-white dark:bg-gray-700 text-slate-900 dark:text-white"
          >
            <option value="all">كافة أنواع العمليات</option>
            {uniqueActions.map((act) => (
              <option key={act} value={act}>
                {act}
              </option>
            ))}
          </select>
        </div>

        <div>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full text-xs rounded-lg border border-slate-300 dark:border-gray-600 p-2 bg-white dark:bg-gray-700 text-slate-900 dark:text-white"
          />
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 shadow-subtle overflow-hidden">
        {filteredLogs.length === 0 ? (
          <EmptyState
            title="لم يتم العثور على سجلات"
            description="جرب إعادة ضبط خيارات البحث والتصفية."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 dark:bg-gray-750 text-slate-700 dark:text-gray-300 border-b border-slate-200 dark:border-gray-700 font-bold">
                <tr>
                  <th className="py-3.5 px-4">المستخدم</th>
                  <th className="py-3.5 px-4">نوع العملية</th>
                  <th className="py-3.5 px-4">رقم المعاملة</th>
                  <th className="py-3.5 px-4">التفاصيل والبيان</th>
                  <th className="py-3.5 px-4">عنوان IP</th>
                  <th className="py-3.5 px-4">التاريخ</th>
                  <th className="py-3.5 px-4">الوقت</th>
                  <th className="py-3.5 px-4 text-center">التفاصيل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-gray-700">
                {filteredLogs.map((log) => (
                  <tr
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className="hover:bg-slate-50/80 dark:hover:bg-gray-700/50 transition cursor-pointer group"
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-[10px]">
                          {log.userName[0]}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white group-hover:text-brand-600 transition-colors">{log.userName}</p>
                          <p className="text-[10px] text-slate-400">{log.userRole}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-gray-700 text-slate-800 dark:text-gray-300 border border-slate-200 dark:border-gray-600">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                      {log.requestNumber ? (
                        <span>#{log.requestNumber}</span>
                      ) : (
                        <span className="text-slate-400 font-normal">عام للنظام</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 dark:text-gray-300 max-w-md font-medium leading-relaxed truncate">
                      {log.details}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px]">{log.ipAddress}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-gray-400">{log.date}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-500 dark:text-gray-400 font-bold">{log.time}</td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLog(log);
                        }}
                        className="px-2 py-1 text-[11px] font-semibold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/30 hover:bg-brand-100 rounded-md transition"
                      >
                        معاينة الفروقات
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Operation Inspection Modal */}
      <AuditLogDetailsModal
        log={selectedLog}
        onClose={() => setSelectedLog(null)}
        onViewRequest={(reqNum) => {
          setSelectedLog(null);
          navigate(`/requests/${reqNum.toLowerCase()}`);
        }}
      />
    </div>
  );
};
