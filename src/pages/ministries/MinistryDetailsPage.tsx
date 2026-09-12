import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { PriorityBadge, DeadlineBadge } from '../../components/common/PriorityBadge';
import { StatCard } from '../../components/common/StatCard';
import {
  Building2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Plus,
  Edit,
  ArrowRight,
  Phone,
  Mail,
  User,
  FileText
} from 'lucide-react';

export const MinistryDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { ministries, requests } = useData();

  const ministry = ministries.find((m) => m.id === id);

  if (!ministry) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500 mb-4">الجهة غير موجودة</p>
        <Button variant="primary" onClick={() => navigate('/ministries')}>
          العودة للوزارات
        </Button>
      </div>
    );
  }

  // Related requests
  const ministryRequests = requests.filter((r) => r.ministryId === ministry.id);

  const activeCount = ministryRequests.filter(
    (r) => r.status !== 'تم التسليم' && r.status !== 'مغلق'
  ).length;

  const completedCount = ministryRequests.filter(
    (r) => r.status === 'تم التسليم' || r.status === 'مغلق' || r.status === 'الإجابة جاهزة'
  ).length;

  const overdueCount = ministryRequests.filter((r) => r.deadlineStatus === 'متأخر').length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/ministries')}
            icon={<ArrowRight className="w-4 h-4" />}
          >
            العودة
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">{ministry.name}</h1>
              <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 font-bold">
                {ministry.code}
              </span>
              <StatusBadge status={ministry.status} size="sm" />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              مدة الإنجاز الافتراضية المحددة: <span className="font-bold text-slate-800">{ministry.slaDays} أيام عمل</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/ministries/${ministry.id}/edit`)}
            icon={<Edit className="w-4 h-4" />}
          >
            تعديل بيانات الجهة
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/requests/new')}
            icon={<Plus className="w-4 h-4" />}
          >
            + إضافة معاملة جديدة
          </Button>
        </div>
      </div>

      {/* 4 Statistics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          title="إجمالي الطلبات"
          value={ministryRequests.length}
          subtitle="كافة الطلبات المسندة"
          icon={<FileText className="w-5 h-5" />}
          color="slate"
        />
        <StatCard
          title="الطلبات النشطة"
          value={activeCount}
          subtitle="قيد المتابعة حالياً"
          icon={<Clock className="w-5 h-5" />}
          color="blue"
        />
        <StatCard
          title="المكتملة بنجاح"
          value={completedCount}
          subtitle="تم تسليمها للمراجعين"
          icon={<CheckCircle2 className="w-5 h-5" />}
          color="emerald"
        />
        <StatCard
          title="طلبات متأخرة"
          value={overdueCount}
          subtitle="تجاوزت مدة SLA"
          icon={<Flame className="w-5 h-5" />}
          color="rose"
        />
      </div>

      {/* Contact & SLA Card */}
      <Card>
        <CardHeader className="bg-slate-50/70">
          <CardTitle className="text-base">بيانات التنسيق والتواصل ومحددات SLA</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-slate-400 block mb-1">مسؤول التنسيق المباشر</span>
            <p className="font-bold text-slate-800 text-sm">{ministry.contactPerson || 'غير محدد'}</p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-slate-400 block mb-1">رقم الهاتف</span>
            <p className="font-bold text-slate-800 font-mono text-sm">{ministry.contactPhone || '---'}</p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-slate-400 block mb-1">البريد الإلكتروني</span>
            <p className="font-bold text-slate-800 font-mono text-sm">{ministry.contactEmail || '---'}</p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-slate-400 block mb-1">مدة الإنجاز الافتراضية</span>
            <p className="font-bold text-blue-700 text-sm">{ministry.slaDays} أيام</p>
          </div>

          <div className="sm:col-span-4 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-slate-400 block mb-1">وصف نطاق المعاملات والملاحظات</span>
            <p className="font-medium text-slate-800 leading-relaxed">{ministry.notes || 'لا توجد ملاحظات مسجلة.'}</p>
          </div>
        </CardContent>
      </Card>

      {/* Related Requests */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <div>
              <CardTitle>المعاملات المرتبطة بـ {ministry.name} ({ministryRequests.length})</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">اضغط على أي معاملة لعرض تفاصيلها ومسارها</p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/requests/new')}
              icon={<Plus className="w-4 h-4" />}
            >
              + إضافة معاملة
            </Button>
          </div>
        </CardHeader>

        {ministryRequests.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            لا توجد طلبات مسجلة لهذه الوزارة حالياً في النظام التجريبي.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-bold">رقم الطلب</th>
                  <th className="py-3 px-4 font-bold">المراجع</th>
                  <th className="py-3 px-4 font-bold">عنوان المعاملة</th>
                  <th className="py-3 px-4 font-bold">الحالة</th>
                  <th className="py-3 px-4 font-bold">الأولوية</th>
                  <th className="py-3 px-4 font-bold">الموظف</th>
                  <th className="py-3 px-4 font-bold">تاريخ الاستلام</th>
                  <th className="py-3 px-4 font-bold">الموعد المتوقع</th>
                  <th className="py-3 px-4 font-bold">الحالة الزمنية</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ministryRequests.map((req) => (
                  <tr
                    key={req.id}
                    onClick={() => navigate(`/requests/${req.id}`)}
                    className="hover:bg-blue-50/40 transition cursor-pointer group"
                  >
                    <td className="py-3.5 px-4 font-bold text-blue-600 font-mono group-hover:underline">
                      {req.requestNumber}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{req.customerName}</td>
                    <td className="py-3.5 px-4 max-w-xs truncate text-slate-700 font-medium">
                      {req.title}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={req.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4">
                      <PriorityBadge priority={req.priority} />
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{req.assignedEmployeeName}</td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono">{req.receiveDate}</td>
                    <td className="py-3.5 px-4 text-slate-800 font-bold font-mono">
                      {req.expectedCompletionDate}
                    </td>
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
        )}
      </Card>
    </div>
  );
};
