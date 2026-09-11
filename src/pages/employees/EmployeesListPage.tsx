import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { usePermissions } from '../../hooks/usePermissions';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { EmptyState } from '../../components/ui/EmptyState';
import { UserCheck, Plus, Search, Eye, Edit, Shield, Mail, Phone, Lock } from 'lucide-react';

export const EmployeesListPage: React.FC = () => {
  const navigate = useNavigate();
  const { employees, requests } = useData();
  const { isAdmin, canCreateEmployee, canUpdateEmployee } = usePermissions();
  const [search, setSearch] = useState('');

  const filteredEmployees = useMemo(() => {
    if (!search.trim()) return employees;
    const q = search.toLowerCase().trim();
    return employees.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q) ||
        e.phone.includes(q) ||
        e.role.toLowerCase().includes(q)
    );
  }, [employees, search]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">الموظفون والمستخدمون</h1>
          <p className="text-xs text-slate-500 mt-1">
            إدارة حسابات فريق العمل، تعيين الأدوار والصلاحيات، ومتابعة النشاط الإداري
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button
              variant="outline"
              size="md"
              onClick={() => navigate('/roles')}
              icon={<Lock className="w-4 h-4" />}
            >
              مصفوفة الأدوار والصلاحيات
            </Button>
          )}
          {canCreateEmployee && (
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate('/employees/new')}
              icon={<Plus className="w-4 h-4" />}
            >
              + إضافة موظف جديد
            </Button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-subtle flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث بالاسم، البريد الإلكتروني، رقم الهاتف، أو الدور..."
            className="w-full pl-4 pr-10 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600 transition"
          />
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle overflow-hidden">
        {filteredEmployees.length === 0 ? (
          <EmptyState
            title="لم يتم العثور على موظفين"
            description="جرب البحث بكلمات أخرى أو أضف حساب موظف جديد."
            actionText="+ إضافة موظف"
            onAction={() => navigate('/employees/new')}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4 font-bold">اسم الموظف</th>
                  <th className="py-3.5 px-4 font-bold">البريد الإلكتروني</th>
                  <th className="py-3.5 px-4 font-bold">رقم الهاتف</th>
                  <th className="py-3.5 px-4 font-bold">الدور الإداري</th>
                  <th className="py-3.5 px-4 font-bold text-center">الطلبات المسندة</th>
                  <th className="py-3.5 px-4 font-bold text-center">الحالة</th>
                  <th className="py-3.5 px-4 font-bold">آخر تسجيل دخول</th>
                  <th className="py-3.5 px-4 font-bold text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEmployees.map((emp) => {
                  const assignedCount = requests.filter(
                    (r) => r.assignedEmployeeId === emp.id
                  ).length;

                  return (
                    <tr
                      key={emp.id}
                      onClick={(e) => {
                        if ((e.target as HTMLElement).closest('button')) return;
                        navigate(`/employees/${emp.id}`);
                      }}
                      className="hover:bg-blue-50/30 transition group cursor-pointer"
                    >
                      <td className="py-3.5 px-4 font-bold text-slate-900 group-hover:text-blue-600">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-xs shrink-0">
                            {emp.name[0]}
                          </div>
                          <div>
                            <p className="font-bold text-sm text-slate-900">{emp.name}</p>
                            <p className="text-[10px] text-slate-400">{emp.department}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">{emp.email}</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-700">{emp.phone}</td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                          {emp.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-bold font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-800">
                          {assignedCount || emp.assignedRequestsCount}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <StatusBadge status={emp.status} size="sm" />
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                        {emp.lastLogin}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => navigate(`/employees/${emp.id}`)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition"
                            title="عرض الملف"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {canUpdateEmployee && (
                            <button
                              onClick={() => navigate(`/employees/${emp.id}/edit`)}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition"
                              title="تعديل"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
