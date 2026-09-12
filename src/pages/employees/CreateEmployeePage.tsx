import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { UserCheck, ArrowRight, Save } from 'lucide-react';

export const CreateEmployeePage: React.FC = () => {
  const navigate = useNavigate();
  const { roles, handleCreateEmployee } = useData();
  const { success, warning } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [roleId, setRoleId] = useState(roles[0]?.id || 'role-3');
  const [password, setPassword] = useState('');
  const [department, setDepartment] = useState('إدارة المتابعة والتنسيق');
  const [status, setStatus] = useState<'نشط' | 'غير نشط'>('نشط');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      warning('حقول مطلوبة', 'يرجى إدخال اسم الموظف والبريد الإلكتروني');
      return;
    }

    setIsLoading(true);
    try {
      const selectedRole = roles.find((r) => r.id === roleId);
      const created = await handleCreateEmployee({
        name,
        email: email.trim().toLowerCase(),
        phone,
        roleId,
        role: selectedRole?.name || 'موظف متابعة',
        department,
        status,
        ...(password.trim() ? { password: password.trim() } : { password: 'CivicFlow@2026!' })
      } as any);

      success('تم إضافة الموظف بنجاح', `تم إنشاء وتفعيل حساب ${created.name}`);
      navigate(`/employees/${created.id}`);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">إضافة موظف جديد</h1>
          <p className="text-xs text-slate-500 mt-1">إنشاء حساب جديد وتعيين الدور والصلاحيات</p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/employees')}
          icon={<ArrowRight className="w-4 h-4" />}
        >
          إلغاء والعودة
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-blue-600" />
              <CardTitle>بيانات الحساب والدور الوظيفي</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Input
                  label="الاسم الكامل للموظف"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: يوسف إبراهيم الحمدان"
                  required
                />
              </div>

              <Input
                label="البريد الإلكتروني الوظيفي"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
              />

              <Input
                label="رقم الهاتف الجوال"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="07XXXXXXXX"
                required
              />

              <Select
                label="الدور الإداري والصلاحيات"
                value={roleId}
                onChange={(e) => setRoleId(e.target.value)}
                required
              >
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </Select>

              <Select
                label="حالة الحساب"
                value={status}
                onChange={(e) => setStatus(e.target.value as 'نشط' | 'غير نشط')}
              >
                <option value="نشط">نشط (مفعل ومصرح له بالدخول)</option>
                <option value="غير نشط">غير نشط (معطل)</option>
              </Select>

              <div className="sm:col-span-2">
                <Input
                  label="كلمة المرور المبدئية (اختياري - افتراضياً: CivicFlow@2026!)"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="CivicFlow@2026!"
                />
              </div>

              <div className="sm:col-span-2">
                <Input
                  label="القسم / الإدارة"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="مثال: إدارة متابعة الصادر والوارد"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate('/employees')}>
            إلغاء
          </Button>
          <Button type="submit" variant="primary" size="lg" isLoading={isLoading} icon={<Save className="w-4 h-4" />}>
            إنشاء الحساب وحفظ الموظف
          </Button>
        </div>
      </form>
    </div>
  );
};
