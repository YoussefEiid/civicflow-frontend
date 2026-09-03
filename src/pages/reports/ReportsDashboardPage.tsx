import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatCard } from '../../components/common/StatCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { exportRequestsToCsv } from '../../services/api';
import {
  BarChart3,
  Download,
  Printer,
  Calendar,
  Filter,
  CheckCircle2,
  Clock,
  Flame,
  Building2,
  Users,
  FileSpreadsheet,
  ArrowLeft,
  TrendingUp
} from 'lucide-react';

export const ReportsDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { requests, ministries, employees } = useData();

  // Filters State
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [ministryId, setMinistryId] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [employeeId, setEmployeeId] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [requestType, setRequestType] = useState('all');

  // Filter requests
  const filtered = useMemo(() => {
    return requests.filter((r) => {
      if (fromDate && r.receiveDate < fromDate) return false;
      if (toDate && r.receiveDate > toDate) return false;
      if (ministryId !== 'all' && r.ministryId !== ministryId) return false;
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (employeeId !== 'all' && r.assignedEmployeeId !== employeeId) return false;
      if (priorityFilter !== 'all' && r.priority !== priorityFilter) return false;
      if (requestType !== 'all' && r.requestType !== requestType) return false;
      return true;
    });
  }, [requests, fromDate, toDate, ministryId, statusFilter, employeeId, priorityFilter, requestType]);

  // Derived Stats
  const total = filtered.length;
  const completed = filtered.filter((r) => r.status === 'تم التسليم' || r.status === 'مغلق' || r.status === 'الإجابة جاهزة').length;
  const overdue = filtered.filter((r) => r.deadlineStatus === 'متأخر').length;
  const avgSla = total > 0 ? (6.4).toFixed(1) : '0';

  // Monthly breakdown mock
  const monthlyData = [
    { month: 'أبريل', count: 180 },
    { month: 'مايو', count: 215 },
    { month: 'يونيو', count: 240 },
    { month: 'يوليو', count: 290 },
    { month: 'أغسطس', count: 320 },
    { month: 'سبتمبر', count: 380 }
  ];
  const maxMonthCount = Math.max(...monthlyData.map((m) => m.count));

  // Priorities breakdown
  const priorityCounts = {
    عاجل: filtered.filter((r) => r.priority === 'عاجل').length,
    مهم: filtered.filter((r) => r.priority === 'مهم').length,
    عادي: filtered.filter((r) => r.priority === 'عادي').length
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">التقارير والإحصائيات الشاملة</h1>
          <p className="text-xs text-slate-500 mt-1">
            لوحة قياس مؤشرات الأداء، تقارير مدد الإنجاز (SLA)، وتوزيع المعاملات حسب الجهات
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            icon={<Printer className="w-4 h-4" />}
          >
            طباعة التقرير
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => exportRequestsToCsv(filtered, 'تقرير_الأداء_والإحصائيات_CivicFlow.csv')}
            icon={<Download className="w-4 h-4" />}
          >
            تصدير Excel (CSV)
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/reports/results')}
            icon={<FileSpreadsheet className="w-4 h-4" />}
          >
            جدول النتائج التفصيلي
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-subtle space-y-4 print:hidden">
        <div className="flex items-center gap-2 font-bold text-xs text-slate-700">
          <Filter className="w-4 h-4 text-blue-600" />
          <span>تحديد معايير وتصفية التقرير:</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">من تاريخ</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 p-2 bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">إلى تاريخ</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 p-2 bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">الجهة / الوزارة</label>
            <select
              value={ministryId}
              onChange={(e) => setMinistryId(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 p-2 bg-white"
            >
              <option value="all">كافة الوزارات والجهات</option>
              {ministries.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">الحالة</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 p-2 bg-white"
            >
              <option value="all">كافة الحالات</option>
              <option value="استلام الطلب">استلام الطلب</option>
              <option value="قيد المعالجة">قيد المعالجة</option>
              <option value="مطلوب مستندات">مطلوب مستندات</option>
              <option value="الإجابة جاهزة">الإجابة جاهزة</option>
              <option value="تم التسليم">تم التسليم</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">الموظف المسؤول</label>
            <select
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 p-2 bg-white"
            >
              <option value="all">كافة الموظفين</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">الأولوية</label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 p-2 bg-white"
            >
              <option value="all">كافة الأولويات</option>
              <option value="عاجل">عاجل</option>
              <option value="مهم">مهم</option>
              <option value="عادي">عادي</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4 Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          title="إجمالي المعاملات"
          value={total}
          subtitle="في النطاق المحدد"
          icon={<FileSpreadsheet className="w-5 h-5" />}
          color="slate"
        />
        <StatCard
          title="المعاملات المكتملة"
          value={completed}
          subtitle={`${total > 0 ? Math.round((completed / total) * 100) : 0}% نسبة الإنجاز`}
          icon={<CheckCircle2 className="w-5 h-5" />}
          color="emerald"
        />
        <StatCard
          title="المعاملات المتأخرة"
          value={overdue}
          subtitle="تجاوزت مدة SLA"
          icon={<Flame className="w-5 h-5" />}
          color="rose"
        />
        <StatCard
          title="متوسط مدة الإنجاز"
          value={`${avgSla} أيام`}
          subtitle="معدل سرعة إغلاق الطلب"
          icon={<Clock className="w-5 h-5" />}
          color="blue"
        />
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Monthly Trend Bar Chart */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle className="text-base">حجم المعاملات شهرياً (Monthly Volume)</CardTitle>
              <CardDescription>النمو والتطور في عدد المعاملات الواردة خلال الأشهر الماضية</CardDescription>
            </div>
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              +18.4% نمو
            </span>
          </CardHeader>
          <CardContent>
            <div className="h-56 flex items-end justify-between gap-3 pt-6 px-2">
              {monthlyData.map((item) => {
                const heightPct = Math.round((item.count / maxMonthCount) * 100);
                return (
                  <div key={item.month} className="flex-1 flex flex-col items-center gap-2 group">
                    <span className="text-[11px] font-bold text-slate-700 opacity-80 group-hover:opacity-100">
                      {item.count}
                    </span>
                    <div className="w-full max-w-[40px] bg-slate-100 rounded-t-xl h-40 flex items-end overflow-hidden">
                      <div
                        className="w-full bg-blue-600 rounded-t-xl transition-all group-hover:bg-blue-700"
                        style={{ height: `${heightPct}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-500">{item.month}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Chart 2: Requests by Ministry Distribution */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle className="text-base">توزيع المعاملات حسب الوزارة والجهة</CardTitle>
              <CardDescription>النسبة المئوية لحجم الطلبات المسندة لكل جهة</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {ministries.map((min) => {
              const count = requests.filter((r) => r.ministryId === min.id).length;
              const pct = Math.round((count / (requests.length || 1)) * 100);

              return (
                <div key={min.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">{min.name}</span>
                    <span className="text-slate-500 font-mono font-semibold">
                      {count} معاملة ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full rounded-full transition-all"
                      style={{ width: `${Math.max(5, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Chart 3: Employees Performance */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle className="text-base">أداء وإنتاجية الموظفين</CardTitle>
              <CardDescription>توزيع المعاملات المنجزة والمسندة لكل موظف متابعة</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {employees.map((emp) => {
              const empRequests = requests.filter((r) => r.assignedEmployeeId === emp.id);
              const doneCount = empRequests.filter(
                (r) => r.status === 'تم التسليم' || r.status === 'الإجابة جاهزة'
              ).length;

              return (
                <div key={emp.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                        {emp.name[0]}
                      </div>
                      <div>
                        <p className="font-bold text-xs text-slate-900">{emp.name}</p>
                        <p className="text-[10px] text-slate-500">{emp.role}</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-emerald-700 font-mono">
                      {doneCount} / {empRequests.length || emp.assignedRequestsCount} منجز
                    </span>
                  </div>

                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-600 h-full rounded-full"
                      style={{
                        width: `${empRequests.length > 0 ? (doneCount / empRequests.length) * 100 : 70}%`
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Chart 4: Priority & Urgency Distribution */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle className="text-base">توزيع الأولويات ودرجات الاستعجال</CardTitle>
              <CardDescription>نسبة الطلبات العاجلة والمهمة والعادية</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-600" />
                <span className="font-bold text-xs text-rose-900">طلبات عاجلة (أولوية قصوى)</span>
              </div>
              <span className="font-mono font-bold text-rose-800 text-sm">{priorityCounts.عاجل}</span>
            </div>

            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-600" />
                <span className="font-bold text-xs text-amber-900">طلبات مهمة (متابعة متقدمة)</span>
              </div>
              <span className="font-mono font-bold text-amber-800 text-sm">{priorityCounts.مهم}</span>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-slate-500" />
                <span className="font-bold text-xs text-slate-800">طلبات عادية (المدة النظامية)</span>
              </div>
              <span className="font-mono font-bold text-slate-700 text-sm">{priorityCounts.عادي}</span>
            </div>

            <div className="pt-2 text-center">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-blue-600"
                onClick={() => navigate('/reports/results')}
              >
                عرض سجل النتائج والبيانات الخام
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
