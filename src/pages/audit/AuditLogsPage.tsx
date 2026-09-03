import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { History, Search, Filter, ShieldCheck, User, Calendar, Clock, Activity } from 'lucide-react';

export const AuditLogsPage: React.FC = () => {
  const navigate = useNavigate();
  const { auditLogs, employees } = useData();

  const [search, setSearch] = useState('');
  const [userFilter, setUserFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">سجل العمليات والرقابة الإدارية</h1>
          <p className="text-xs text-slate-500 mt-1">
            سجل غير قابل للتعديل يوثق كافة التعديلات، الحركات، وتغييرات الحالات الصادرة والواردة
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            التدقيق الأمني مفعل ونشط
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-subtle grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث بالتفاصيل أو رقم الطلب..."
            className="w-full pl-4 pr-10 py-2 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-900 focus:bg-white focus:outline-none"
          />
        </div>

        <div>
          <select
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            className="w-full text-xs rounded-lg border border-slate-300 p-2 bg-white"
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
            className="w-full text-xs rounded-lg border border-slate-300 p-2 bg-white"
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
            className="w-full text-xs rounded-lg border border-slate-300 p-2 bg-white"
          />
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle overflow-hidden">
        {filteredLogs.length === 0 ? (
          <EmptyState
            title="لم يتم العثور على سجلات"
            description="جرب إعادة ضبط خيارات البحث والتصفية."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-bold">
                <tr>
                  <th className="py-3.5 px-4">المستخدم</th>
                  <th className="py-3.5 px-4">نوع العملية</th>
                  <th className="py-3.5 px-4">رقم المعاملة</th>
                  <th className="py-3.5 px-4">التفاصيل والبيان</th>
                  <th className="py-3.5 px-4">عنوان IP</th>
                  <th className="py-3.5 px-4">التاريخ</th>
                  <th className="py-3.5 px-4">الوقت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-[10px]">
                          {log.userName[0]}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{log.userName}</p>
                          <p className="text-[10px] text-slate-400">{log.userRole}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-600">
                      {log.requestNumber ? (
                        <button
                          onClick={() => navigate(`/requests/${log.requestNumber?.toLowerCase()}`)}
                          className="hover:underline"
                        >
                          #{log.requestNumber}
                        </button>
                      ) : (
                        <span className="text-slate-400 font-normal">عام للنظام</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 max-w-md font-medium leading-relaxed">
                      {log.details}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px]">{log.ipAddress}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">{log.date}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-500 font-bold">{log.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
