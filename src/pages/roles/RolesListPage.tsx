import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Shield, Lock, Users, ChevronLeft, Plus, CheckCircle2 } from 'lucide-react';

export const RolesListPage: React.FC = () => {
  const navigate = useNavigate();
  const { roles, employees } = useData();
  const { success } = useToast();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [roleName, setRoleName] = useState('');
  const [roleDesc, setRoleDesc] = useState('');

  const handleCreateRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleName) return;
    success('تم إضافة الدور بنجاح', `تم إنشاء دور (${roleName})، يمكنك الآن ضبط مصفوفة الصلاحيات`);
    setIsAddModalOpen(false);
    setRoleName('');
    setRoleDesc('');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">الأدوار والصلاحيات</h1>
          <p className="text-xs text-slate-500 mt-1">
            إدارة مستويات الأمان ومصفوفة صلاحيات الوصول للوحدات والعمليات الإدارية
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => setIsAddModalOpen(true)}
          icon={<Plus className="w-4 h-4" />}
        >
          + إضافة دور جديد
        </Button>
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {roles.map((role) => {
          const usersInRole = employees.filter((e) => e.roleId === role.id || e.role === role.name);

          return (
            <Card
              key={role.id}
              hover
              onClick={() => navigate(`/roles/${role.id}`)}
              className="cursor-pointer transition-all border-slate-200 hover:border-blue-300"
            >
              <CardHeader className="bg-slate-50/70">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{role.name}</CardTitle>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>{usersInRole.length} مستخدمين معينين</span>
                    </p>
                  </div>
                </div>

                <span className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition">
                  <ChevronLeft className="w-5 h-5" />
                </span>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed min-h-8">{role.description}</p>

                {/* Permissions Summary Tags */}
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    الوحدات المتاح الوصول لها:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {role.permissions
                      .filter((p) => p.view)
                      .map((p) => (
                        <span
                          key={p.module}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200"
                        >
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          {p.module}
                        </span>
                      ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add Role Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="إضافة دور إداري جديد"
        maxWidth="md"
      >
        <form onSubmit={handleCreateRole} className="space-y-4">
          <Input
            label="اسم الدور"
            value={roleName}
            onChange={(e) => setRoleName(e.target.value)}
            placeholder="مثال: مدقق جودة المعاملات"
            required
          />

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">وصف الدور</label>
            <textarea
              rows={3}
              value={roleDesc}
              onChange={(e) => setRoleDesc(e.target.value)}
              placeholder="وصف المهام والمسؤوليات الموكلة لهذا الدور..."
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
              إلغاء
            </Button>
            <Button type="submit" variant="primary">
              إنشاء الدور
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
