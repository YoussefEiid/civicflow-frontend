import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Modal } from '../../components/ui/Modal';
import { User, Mail, Phone, Shield, Clock, KeyRound, Edit, CheckCircle2 } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const { success } = useToast();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  // Edit state
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [department, setDepartment] = useState(user?.department || '');

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile({ name, email, phone, department });
      success('تم تحديث الملف الشخصي', 'تم حفظ التعديلات بنجاح');
      setIsEditModalOpen(false);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      return;
    }
    setIsChangingPassword(true);
    try {
      const { authService } = await import('../../services/authService');
      await authService.changePassword(currentPassword, newPassword);
      success('تم تغيير كلمة المرور بنجاح', 'تم تحديث كلمة المرور في قاعدة البيانات. يرجى استخدامها للدخول القادم.');
      setIsPasswordModalOpen(false);
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      console.error('Change password error:', err);
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Overview Card */}
      <Card>
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-8 text-white flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="w-24 h-24 rounded-2xl bg-blue-600 border-4 border-slate-700 text-white flex items-center justify-center font-black text-3xl shadow-xl">
            {user?.name ? user.name[0] : 'U'}
          </div>

          <div className="flex-1 text-center sm:text-right space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">{user?.name}</h2>
                <p className="text-slate-300 text-sm">{user?.department || 'الإدارة العامة والمتابعة'}</p>
              </div>
              <div className="flex items-center gap-2 justify-center sm:justify-end">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsEditModalOpen(true)}
                  icon={<Edit className="w-3.5 h-3.5" />}
                >
                  تعديل الملف الشخصي
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsPasswordModalOpen(true)}
                  icon={<KeyRound className="w-3.5 h-3.5" />}
                >
                  تغيير كلمة المرور
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-2 text-xs text-slate-300">
              <span className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-blue-400" />
                الدور: <strong className="text-white">{user?.role}</strong>
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-400" />
                آخر تسجيل دخول: <strong className="text-white">{user?.lastLogin}</strong>
              </span>
            </div>
          </div>
        </div>

        <CardContent>
          <h3 className="text-base font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">
            البيانات الشخصية والوظيفية
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-xs font-semibold text-slate-500 block mb-1">الاسم الكامل</span>
              <p className="font-bold text-slate-800">{user?.name}</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-xs font-semibold text-slate-500 block mb-1">البريد الإلكتروني</span>
              <p className="font-bold text-slate-800 font-mono">{user?.email}</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-xs font-semibold text-slate-500 block mb-1">رقم الهاتف الجوال</span>
              <p className="font-bold text-slate-800 font-mono">{user?.phone}</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-xs font-semibold text-slate-500 block mb-1">الدور الإداري</span>
              <p className="font-bold text-blue-600">{user?.role}</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-xs font-semibold text-slate-500 block mb-1">حالة الحساب</span>
              <div>
                <StatusBadge status="نشط" size="sm" />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-xs font-semibold text-slate-500 block mb-1">آخر جلسة عمل</span>
              <p className="font-bold text-slate-800">{user?.lastLogin}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Profile Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="تعديل بيانات الملف الشخصي"
        maxWidth="md"
      >
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <Input label="الاسم الكامل" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input label="البريد الإلكتروني" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input label="رقم الجوال" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          <Input label="القسم / الإدارة" value={department} onChange={(e) => setDepartment(e.target.value)} />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
              إلغاء
            </Button>
            <Button type="submit" variant="primary">
              حفظ التغييرات
            </Button>
          </div>
        </form>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        title="تغيير كلمة المرور"
        maxWidth="sm"
      >
        <form onSubmit={handleChangePassword} className="space-y-4">
          <Input
            label="كلمة المرور الحالية"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
          <Input
            label="كلمة المرور الجديدة"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="••••••••"
            required
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsPasswordModalOpen(false)}>
              إلغاء
            </Button>
            <Button type="submit" variant="primary" isLoading={isChangingPassword}>
              تحديث كلمة المرور
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
