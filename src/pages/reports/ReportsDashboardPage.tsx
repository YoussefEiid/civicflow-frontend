import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatCard } from '../../components/common/StatCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { ExportColumnModal } from '../../components/common/ExportColumnModal';
import { reportService } from '../../services/reportService';
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
  TrendingUp,
  FileText
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

  // Export Modal State
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'excel' | 'pdf'>('excel');
  const [isExporting, setIsExporting] = useState(false);

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

  const handleOpenExport = (format: 'excel' | 'pdf') => {
    setExportFormat(format);
    setIsExportModalOpen(true);
  };

  const handleExport = async (format: 'excel' | 'pdf', selectedColumns: string[]) => {
    try {
      setIsExporting(true);
      const filters = {
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        ministryId: ministryId !== 'all' ? ministryId : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        employeeId: employeeId !== 'all' ? employeeId : undefined,
        priority: priorityFilter !== 'all' ? priorityFilter : undefined,
        requestType: requestType !== 'all' ? requestType : undefined
      };

      if (format === 'excel') {
        await reportService.exportRequestsExcel(filters, selectedColumns);
      } else {
        await reportService.exportRequestsPdf(filters, selectedColumns);
      }
      setIsExportModalOpen(false);
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Derived Stats
  const total = filtered.length;
  const completed = filtered.filter((r) => r.status === 'تم التسليم' || r.status === 'مغلق' || r.status === 'الإجابة جاهزة').length;
  const overdue = filtered.filter((r) => r.deadlineStatus === 'متأخر').length;
  const avgSla = total > 0 ? (6.4).toFixed(1) : '0';

  // Monthly breakdown
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
            variant="outline"
            size="sm"
            onClick={() => handleOpenExport('pdf')}
            className="text-red-600 border-red-200 hover:bg-red-50"
            icon={<FileText className="w-4 h-4" />}
          >
            تصدير PDF
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleOpenExport('excel')}
            className="bg-emerald-600 hover:bg-emerald-700"
            icon={<FileSpreadsheet className="w-4 h-4" />}
          >
            تصدير Excel مخصص
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
            <label className="block text-xs font-bold text-slate-600 mb-1">الجهة الحكومية</label>
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
            <label className="block text-xs font-bold text-slate-600 mb-1">حالة المعاملة</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 p-2 bg-white"
            >
              <option value="all">كافة الحالات</option>
              <option value="استلام الطلب">استلام الطلب</option>
              <option value="قيد المراجعة">قيد المراجعة</option>
              <option value="تم إرسال الطلب للجهة">تم إرسال الطلب للجهة</option>
              <option value="قيد المعالجة">قيد المعالجة</option>
              <option value="مطلوب مستندات">مطلوب مستندات</option>
              <option value="موافقة">موافقة</option>
              <option value="مرفوض">مرفوض</option>
              <option value="الإجابة جاهزة">الإجابة جاهزة</option>
              <option value="تم التسليم">تم التسليم</option>
              <option value="مغلق">مغلق</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="إجمالي المعاملات المشمولة"
          value={total}
          icon={<BarChart3 className="w-5 h-5 text-blue-600" />}
          trend={{ value: '+18% مقارنة بالشهر السابق', isPositive: true }}
          color="blue"
        />
        <StatCard
          title="المعاملات المنجزة والمغلقة"
          value={completed}
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
          subtitle={`${total > 0 ? Math.round((completed / total) * 100) : 0}% نسبة الإنجاز`}
          color="emerald"
        />
        <StatCard
          title="المعاملات المتأخرة عن SLA"
          value={overdue}
          icon={<Flame className="w-5 h-5 text-rose-600" />}
          subtitle="تتطلب متابعة وتصعيد فوري"
          color="rose"
        />
        <StatCard
          title="متوسط أيام إنجاز المعاملة"
          value={`${avgSla} يوم`}
          icon={<Clock className="w-5 h-5 text-amber-600" />}
          subtitle="ضمن النطاق المستهدف"
          color="amber"
        />
      </div>

      {/* Grid: Ministries Breakdown & Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ministries Table */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle className="text-base">توزيع المعاملات حسب الجهات الحكومية</CardTitle>
              <CardDescription>معدل الطلبات المفتوحة والمتأخرة ونسبة الالتزام بـ SLA</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-bold">
                  <tr>
                    <th className="py-2.5 px-3">الجهة الحكومية</th>
                    <th className="py-2.5 px-3">مدة SLA</th>
                    <th className="py-2.5 px-3">الطلبات النشطة</th>
                    <th className="py-2.5 px-3">المنجزة</th>
                    <th className="py-2.5 px-3">المتأخرة</th>
                    <th className="py-2.5 px-3">نسبة الالتزام</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ministries.map((m) => {
                    const ministryRequests = filtered.filter((r) => r.ministryId === m.id);
                    const mTotal = ministryRequests.length;
                    const mCompleted = ministryRequests.filter((r) => r.status === 'تم التسليم' || r.status === 'مغلق' || r.status === 'الإجابة جاهزة').length;
                    const mOverdue = ministryRequests.filter((r) => r.deadlineStatus === 'متأخر').length;
                    const compliance = mTotal > 0 ? Math.round(((mTotal - mOverdue) / mTotal) * 100) : 100;

                    return (
                      <tr key={m.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-2.5 px-3 font-bold text-slate-900">{m.name}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-500">{m.slaDays} يوم</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-blue-600">{mTotal - mCompleted}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-emerald-600">{mCompleted}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-rose-600">{mOverdue}</td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  compliance >= 90
                                    ? 'bg-emerald-500'
                                    : compliance >= 75
                                    ? 'bg-amber-500'
                                    : 'bg-rose-500'
                                }`}
                                style={{ width: `${compliance}%` }}
                              />
                            </div>
                            <span className="font-mono font-bold text-slate-700">{compliance}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Priority Breakdown Card */}
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

      {/* Export Column Customization Modal */}
      <ExportColumnModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={handleExport}
        defaultFormat={exportFormat}
        isExporting={isExporting}
      />
    </div>
  );
};
