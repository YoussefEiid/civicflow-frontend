import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { StatCard } from '../../components/common/StatCard';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { PriorityBadge, DeadlineBadge } from '../../components/common/PriorityBadge';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Calendar,
  ArrowUpRight,
  TrendingUp,
  Plus,
  ArrowLeft,
  Activity,
  User,
  Flame,
  FileCheck2
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    requests,
    ministries,
    auditLogs,
    overdueRequestsCount,
    inProgressRequestsCount,
    completedRequestsCount,
    totalRequestsCount
  } = useData();

  // Highlight requests
  const overdueRequests = requests.filter((r) => r.deadlineStatus === 'متأخر');
  const upcomingRequests = requests.filter((r) => r.deadlineStatus === 'اقترب الموعد');
  const recentRequests = [...requests].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6);
  const recentLogs = auditLogs.slice(0, 5);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayRequestsCount = requests.filter(
    (r) => r.receiveDate?.startsWith(todayStr) || r.createdAt?.startsWith(todayStr)
  ).length;

  const needsReviewCount = requests.filter(
    (r) => r.status === 'مطلوب مستندات' || r.status === 'قيد المراجعة'
  ).length;

  const completionRate = requests.length > 0
    ? `${Math.round((completedRequestsCount / requests.length) * 100)}%`
    : '0%';

  // Status breakdown calculation
  const statusCounts: Record<string, number> = {
    'استلام الطلب': requests.filter((r) => r.status === 'استلام الطلب').length,
    'قيد المراجعة': requests.filter((r) => r.status === 'قيد المراجعة').length,
    'تم إرسال الطلب للجهة': requests.filter((r) => r.status === 'تم إرسال الطلب للجهة').length,
    'قيد المعالجة': requests.filter((r) => r.status === 'قيد المعالجة').length,
    'مطلوب مستندات': requests.filter((r) => r.status === 'مطلوب مستندات').length,
    'موافقة': requests.filter((r) => r.status === 'موافقة').length,
    'الإجابة جاهزة': requests.filter((r) => r.status === 'الإجابة جاهزة').length,
    'تم التسليم': requests.filter((r) => r.status === 'تم التسليم' || r.status === 'مغلق').length
  };

  return (
    <div className="space-y-6">
      {/* Top Welcome Banner with Quick Action */}
      <div className="bg-gradient-to-l from-slate-900 via-slate-800 to-blue-950 rounded-2xl p-6 text-white shadow-card flex flex-col md:flex-row items-center justify-between gap-6 border border-slate-700/50">
        <div className="space-y-1.5 text-center md:text-right">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-400/30">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
            منظومة متابعة المعاملات الحكومية
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            مرحباً بك في لوحة تحكم CivicFlow
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
            متابعة شاملة للصادر والوارد، مدد الإنجاز المحددة (SLA)، وتنبيهات المعاملات المتأخرة والجاهزة للتسليم.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate('/requests/new')}
            icon={<Plus className="w-5 h-5" />}
            className="shadow-lg shadow-blue-600/30"
          >
            + إضافة طلب جديد
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => navigate('/reports')}
            className="bg-slate-800 hover:bg-slate-700 text-white border-slate-700"
          >
            التقارير
          </Button>
        </div>
      </div>

      {/* 6 Key Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <StatCard
          title="إجمالي الطلبات"
          value={requests.length}
          subtitle="المسجلة بالنظام"
          icon={<FileText className="w-5 h-5" />}
          color="slate"
          onClick={() => navigate('/requests')}
        />
        <StatCard
          title="طلبات اليوم"
          value={todayRequestsCount}
          subtitle="تم تسجيلها اليوم"
          icon={<Calendar className="w-5 h-5" />}
          color="blue"
          onClick={() => navigate('/requests')}
        />
        <StatCard
          title="قيد المعالجة"
          value={inProgressRequestsCount}
          subtitle="لدى الجهات المعنية"
          icon={<Clock className="w-5 h-5" />}
          color="indigo"
          onClick={() => navigate('/requests?status=قيد+المعالجة')}
        />
        <StatCard
          title="طلبات متأخرة"
          value={overdueRequests.length}
          subtitle="تجاوزت SLA"
          icon={<Flame className="w-5 h-5" />}
          color="rose"
          trend={overdueRequests.length > 0 ? { value: 'تنبيه عاجل', isPositive: false } : undefined}
          onClick={() => navigate('/requests?overdue=true')}
          className={overdueRequests.length > 0 ? "border-rose-200 ring-2 ring-rose-100 bg-rose-50/30" : ""}
        />
        <StatCard
          title="مكتملة"
          value={completedRequestsCount}
          subtitle="تم تسليمها بنجاح"
          icon={<CheckCircle2 className="w-5 h-5" />}
          color="emerald"
          trend={{ value: completionRate, isPositive: true }}
          onClick={() => navigate('/requests?status=تم+التسليم')}
        />
        <StatCard
          title="تحتاج مراجعة"
          value={needsReviewCount}
          subtitle="مستندات أو استفسار"
          icon={<AlertTriangle className="w-5 h-5" />}
          color="amber"
          onClick={() => navigate('/requests?status=مطلوب+مستندات')}
        />
      </div>

      {/* Section 1: Overdue Urgent Alert Banner & Requests */}
      {overdueRequests.length > 0 && (
        <Card className="border-rose-200 bg-rose-50/20">
          <CardHeader className="bg-rose-50/60 border-rose-100">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-rose-100 text-rose-700 rounded-lg">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-rose-900">المعاملات المتأخرة وتجاوزت مدة الإنجاز (SLA Alert)</CardTitle>
                <CardDescription className="text-rose-700 font-medium">
                  يتطلب اتخاذ إجراء فوري والتواصل مع ممثل الجهة الحكومية
                </CardDescription>
              </div>
            </div>
            <Link
              to="/requests?overdue=true"
              className="text-xs font-bold text-rose-700 hover:underline flex items-center gap-1"
            >
              عرض كافة المتأخرات ({overdueRequests.length})
              <ArrowLeft className="w-3.5 h-3.5" />
            </Link>
          </CardHeader>
          <div className="divide-y divide-rose-100">
            {overdueRequests.map((req) => (
              <div
                key={req.id}
                onClick={() => navigate(`/requests/${req.id}`)}
                className="p-4 hover:bg-rose-50/60 transition cursor-pointer flex flex-col md:flex-row items-start md:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    {req.requestNumber}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{req.title}</span>
                      <PriorityBadge priority={req.priority} />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      المراجع: <strong className="text-slate-700">{req.customerName}</strong> ({req.customerPhone}) • الجهة:{' '}
                      <strong className="text-slate-700">{req.ministryName}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                  <div className="text-left md:text-right text-xs">
                    <p className="text-slate-400">تاريخ الاستحقاق المتوقع:</p>
                    <p className="font-bold text-slate-700">{req.expectedCompletionDate}</p>
                  </div>
                  <DeadlineBadge status="متأخر" daysRemainingOrOverdue={req.daysRemainingOrOverdue} />
                  <Button variant="outline" size="sm" className="hidden sm:inline-flex text-rose-700 border-rose-300">
                    متابعة الإجراء
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Grid: 1. Status Breakdown & 2. Requests by Ministry */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section: Status Breakdown */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>توزيع الطلبات حسب الحالة</CardTitle>
              <CardDescription>نظرة عامة على مراحل المعاملات في النظام</CardDescription>
            </div>
            <Link to="/requests" className="text-xs font-bold text-blue-600 hover:underline">
              عرض التفاصيل
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(statusCounts).map(([stName, count]) => {
              const pct = Math.round((count / (requests.length || 1)) * 100);
              return (
                <div
                  key={stName}
                  onClick={() => navigate(`/requests?status=${encodeURIComponent(stName)}`)}
                  className="p-2.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <StatusBadge status={stName} size="sm" />
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-28 sm:w-36 bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-600 h-full rounded-full transition-all"
                        style={{ width: `${Math.max(8, pct * 4)}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-700 w-8 text-left">{count}</span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Section: Requests by Ministry */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>الطلبات حسب الوزارة والجهة</CardTitle>
              <CardDescription>الطلبات النشطة ونسب الإنجاز ومدد SLA</CardDescription>
            </div>
            <Link to="/ministries" className="text-xs font-bold text-blue-600 hover:underline">
              إدارة الوزارات
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            {ministries.map((min) => {
              const reqsInMin = requests.filter((r) => r.ministryId === min.id);
              const activeInMin = reqsInMin.filter(
                (r) => r.status !== 'تم التسليم' && r.status !== 'مغلق'
              ).length;
              const completedInMin = reqsInMin.filter(
                (r) => r.status === 'تم التسليم' || r.status === 'مغلق' || r.status === 'الإجابة جاهزة'
              ).length;
              const overdueInMin = reqsInMin.filter((r) => r.deadlineStatus === 'متأخر').length;

              return (
                <div
                  key={min.id}
                  onClick={() => navigate(`/ministries/${min.id}`)}
                  className="p-3 rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-xs transition cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-blue-600" />
                      <h4 className="font-bold text-sm text-slate-900">{min.name}</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 font-mono">SLA: {min.slaDays} أيام</span>
                      {overdueInMin > 0 && (
                        <span className="text-[11px] font-bold bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded-md">
                          {overdueInMin} متأخر
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>
                      إجمالي الطلبات النشطة: <strong className="text-slate-800">{activeInMin}</strong>
                    </span>
                    <span>
                      مكتملة: <strong className="text-emerald-700">{completedInMin}</strong>
                    </span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Grid: 3. Recent Requests & 4. Recent Activity Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Requests Table (2 Columns) */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>أحدث المعاملات والطلبات المسجلة</CardTitle>
                <CardDescription>آخر الطلبات الواردة للمنظومة</CardDescription>
              </div>
              <Link to="/requests" className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
                عرض جميع الطلبات
                <ArrowLeft className="w-3.5 h-3.5" />
              </Link>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 font-bold">رقم الطلب</th>
                    <th className="py-3 px-4 font-bold">المراجع</th>
                    <th className="py-3 px-4 font-bold">الجهة</th>
                    <th className="py-3 px-4 font-bold">الحالة</th>
                    <th className="py-3 px-4 font-bold">الأولوية</th>
                    <th className="py-3 px-4 font-bold">الموعد</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentRequests.map((req) => (
                    <tr
                      key={req.id}
                      onClick={() => navigate(`/requests/${req.id}`)}
                      className="hover:bg-slate-50/80 transition cursor-pointer group"
                    >
                      <td className="py-3.5 px-4 font-bold text-blue-600 font-mono group-hover:underline">
                        {req.requestNumber}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">{req.customerName}</td>
                      <td className="py-3.5 px-4 text-slate-600">{req.ministryName}</td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={req.status} size="sm" />
                      </td>
                      <td className="py-3.5 px-4">
                        <PriorityBadge priority={req.priority} />
                      </td>
                      <td className="py-3.5 px-4">
                        <DeadlineBadge status={req.deadlineStatus} daysRemainingOrOverdue={req.daysRemainingOrOverdue} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Recent Activity Log (1 Column) */}
        <div>
          <Card>
            <CardHeader>
              <div>
                <CardTitle>سجل النشاط المباشر</CardTitle>
                <CardDescription>العمليات المنفذة مؤخراً</CardDescription>
              </div>
              <Link to="/audit-logs" className="text-xs font-bold text-blue-600 hover:underline">
                السجل كامل
              </Link>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 text-xs pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Activity className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">{log.userName}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{log.time}</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed">{log.details}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
