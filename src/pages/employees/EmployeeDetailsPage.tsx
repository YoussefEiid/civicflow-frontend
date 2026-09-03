import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { PriorityBadge, DeadlineBadge } from '../../components/common/PriorityBadge';
import { StatCard } from '../../components/common/StatCard';
import {
  UserCheck,
  Mail,
  Phone,
  Shield,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Plus,
  Edit,
  ArrowRight,
  FileText
} from 'lucide-react';

export const EmployeeDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { employees, requests } = useData();

  const employee = employees.find((e) => e.id === id);

  if (!employee) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500 mb-4">الموظف غير موجود</p>
        <Button variant="primary" onClick={() => navigate('/employees')}>
          العودة للموظفين
        </Button>
      </div>
    );
  }

  // Assigned requests
  const assignedRequests = requests.filter(
    (r) => r.assignedEmployeeId === employee.id || r.assignedEmployeeName === employee.name
  );

  const completedCount = assignedRequests.filter(
    (r) => r.status === 'تم التسليم' || r.status === 'مغلق' || r.status === 'الإجابة جاهزة'
  ).length;

  const inProgressCount = assignedRequests.filter(
    (r) => r.status === 'قيد المعالجة' || r.status === 'قيد المراجعة' || r.status === 'تم إرسال الطلب للجهة'
  ).length;

  const overdueCount = assignedRequests.filter((r) => r.deadlineStatus === 'متأخر').length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/employees')}
            icon={<ArrowRight className="w-4 h-4" />}
          >
            العودة
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">{employee.name}</h1>
              <span className="font-bold text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                {employee.role}
              </span>
              <StatusBadge status={employee.status} size="sm" />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{employee.department}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/employees/${employee.id}/edit`)}
            icon={<Edit className="w-4 h-4" />}
          >
            تعديل بيانات الموظف
          </Button>
        </div>
      </div>

      {/* 4 Statistics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          title="الطلبات المسندة"
          value={assignedRequests.length}
          subtitle="كافة المعاملات"
          icon={<FileText className="w-5 h-5" />}
          color="slate"
        />
        <StatCard
          title="المكتملة بنجاح"
          value={completedCount}
          subtitle="تم إنجازها"
          icon={<CheckCircle2 className="w-5 h-5" />}
          color="emerald"
        />
        <StatCard
          title="قيد المتابعة"
          value={inProgressCount}
          subtitle="جاري العمل عليها"
          icon={<Clock className="w-5 h-5" />}
          color="blue"
        />
        <StatCard
          title="طلبات متأخرة"
          value={overdueCount}
          subtitle="تجاوزت SLA"
          icon={<Flame className="w-5 h-5" />}
          color="rose"
        />
      </div>

      {/* Employee Info Card */}
      <Card>
        <CardHeader className="bg-slate-50/70">
          <CardTitle className="text-base">البيانات الوظيفية والتواصل</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-slate-400 block mb-1">البريد الإلكتروني الوظيفي</span>
            <p className="font-bold text-slate-800 font-mono text-sm">{employee.email}</p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-slate-400 block mb-1">رقم الهاتف</span>
            <p className="font-bold text-slate-800 font-mono text-sm">{employee.phone}</p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-slate-400 block mb-1">القسم / الإدارة</span>
            <p className="font-bold text-slate-800 text-sm">{employee.department}</p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-slate-400 block mb-1">آخر تسجيل دخول</span>
            <p className="font-bold text-slate-800 font-mono text-sm">{employee.lastLogin}</p>
          </div>
        </CardContent>
      </Card>

      {/* Assigned Requests */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <div>
              <CardTitle>المعاملات المسندة للموظف ({assignedRequests.length})</CardTitle>
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

        {assignedRequests.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            لا توجد معاملات مسندة لهذا الموظف حالياً.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-bold">رقم الطلب</th>
                  <th className="py-3 px-4 font-bold">المراجع</th>
                  <th className="py-3 px-4 font-bold">عنوان المعاملة</th>
                  <th className="py-3 px-4 font-bold">الجهة</th>
                  <th className="py-3 px-4 font-bold">الحالة</th>
                  <th className="py-3 px-4 font-bold">الأولوية</th>
                  <th className="py-3 px-4 font-bold">تاريخ الاستلام</th>
                  <th className="py-3 px-4 font-bold">الموعد المتوقع</th>
                  <th className="py-3 px-4 font-bold">الحالة الزمنية</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {assignedRequests.map((req) => (
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
                    <td className="py-3.5 px-4 text-slate-600">{req.ministryName}</td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={req.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4">
                      <PriorityBadge priority={req.priority} />
                    </td>
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
