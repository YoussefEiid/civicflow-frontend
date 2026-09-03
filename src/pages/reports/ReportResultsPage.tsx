import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { PriorityBadge, DeadlineBadge } from '../../components/common/PriorityBadge';
import { exportRequestsToCsv } from '../../services/api';
import {
  FileSpreadsheet,
  Download,
  Printer,
  ArrowRight,
  Search,
  Building2,
  Calendar
} from 'lucide-react';

export const ReportResultsPage: React.FC = () => {
  const navigate = useNavigate();
  const { requests, ministries } = useData();

  const [search, setSearch] = useState('');
  const [selectedMinistry, setSelectedMinistry] = useState('all');

  const filtered = useMemo(() => {
    return requests.filter((r) => {
      if (selectedMinistry !== 'all' && r.ministryId !== selectedMinistry) return false;
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        return (
          r.requestNumber.toLowerCase().includes(q) ||
          r.customerName.toLowerCase().includes(q) ||
          r.title.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [requests, search, selectedMinistry]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/reports')}
            icon={<ArrowRight className="w-4 h-4" />}
          >
            العودة للوحة التقارير
          </Button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">جدول نتائج المعاملات التفصيلي</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              عرض تفصيلي لكافة بيانات المعاملات وحالات المواعيد وتواريخ الإنجاز
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            icon={<Printer className="w-4 h-4" />}
          >
            طباعة
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => exportRequestsToCsv(filtered, 'سجل_نتائج_المعاملات_التفصيلي.csv')}
            icon={<Download className="w-4 h-4" />}
          >
            تصدير ملف Excel (CSV)
          </Button>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-subtle flex flex-col sm:flex-row items-center gap-3 print:hidden">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث برقم المعاملة أو المراجع..."
            className="w-full pl-4 pr-10 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-900 focus:bg-white focus:outline-none"
          />
        </div>

        <select
          value={selectedMinistry}
          onChange={(e) => setSelectedMinistry(e.target.value)}
          className="text-xs rounded-xl border border-slate-300 p-2.5 bg-white w-full sm:w-60"
        >
          <option value="all">كافة الوزارات والجهات</option>
          {ministries.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-bold">
              <tr>
                <th className="py-3.5 px-4">رقم الطلب</th>
                <th className="py-3.5 px-4">المراجع</th>
                <th className="py-3.5 px-4">الوزارة / الجهة</th>
                <th className="py-3.5 px-4">الحالة</th>
                <th className="py-3.5 px-4">الموظف</th>
                <th className="py-3.5 px-4">تاريخ الاستلام</th>
                <th className="py-3.5 px-4">تاريخ الإنجاز</th>
                <th className="py-3.5 px-4">الموعد المتوقع</th>
                <th className="py-3.5 px-4">حالة الموعد</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((req) => (
                <tr
                  key={req.id}
                  onClick={() => navigate(`/requests/${req.id}`)}
                  className="hover:bg-blue-50/40 transition cursor-pointer group"
                >
                  <td className="py-3.5 px-4 font-bold font-mono text-blue-600 group-hover:underline">
                    {req.requestNumber}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">{req.customerName}</td>
                  <td className="py-3.5 px-4 text-slate-700 font-semibold">{req.ministryName}</td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={req.status} size="sm" />
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">{req.assignedEmployeeName}</td>
                  <td className="py-3.5 px-4 font-mono text-slate-500">{req.receiveDate}</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">
                    {req.completedDate || '---'}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-800">{req.expectedCompletionDate}</td>
                  <td className="py-3.5 px-4">
                    <DeadlineBadge
                      status={req.deadlineStatus}
                      daysRemainingOrOverdue={req.daysRemainingOrOverdue}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
