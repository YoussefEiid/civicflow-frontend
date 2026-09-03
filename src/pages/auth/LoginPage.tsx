import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Lock, Mail, ArrowRight, Shield, CheckCircle2 } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { success } = useToast();

  const [email, setEmail] = useState('ahmed.ali@civicflow.gov');
  const [password, setPassword] = useState('••••••••');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(email, password);
      success('تم تسجيل الدخول بنجاح', 'مرحباً بك في منظومة CivicFlow');
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fillQuickDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('demo123456');
  };

  return (
    <div>
      <div className="mb-6 text-center">
        <h2 className="text-xl font-bold text-slate-900">تسجيل الدخول للنظام</h2>
        <p className="text-xs text-slate-500 mt-1">أدخل بيانات الاعتماد للوصول إلى لوحة الإدارة</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="البريد الإلكتروني"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@civicflow.gov.sa"
          required
          icon={<Mail className="w-4 h-4" />}
        />

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-semibold text-slate-700">كلمة المرور</label>
            <Link to="/forgot-password" className="text-xs text-blue-600 hover:underline">
              نسيت كلمة المرور؟
            </Link>
          </div>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            icon={<Lock className="w-4 h-4" />}
          />
        </div>

        <div className="pt-2">
          <Button type="submit" variant="primary" className="w-full" size="lg" isLoading={isLoading}>
            تسجيل الدخول
          </Button>
        </div>
      </form>

      {/* Demo Credentials Quick selector */}
      <div className="mt-8 pt-6 border-t border-slate-100">
        <p className="text-xs font-bold text-slate-500 mb-2.5 flex items-center gap-1">
          <Shield className="w-3.5 h-3.5 text-blue-600" />
          حسابات تجريبية سريعة للعرض (اضغط للاختيار):
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => fillQuickDemo('ahmed.ali@civicflow.gov')}
            className="p-2 text-right rounded-lg border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 text-xs transition"
          >
            <p className="font-bold text-slate-800">أحمد علي</p>
            <p className="text-[10px] text-slate-500">مدير النظام (كامل الصلاحيات)</p>
          </button>
          <button
            type="button"
            onClick={() => fillQuickDemo('m.hassan@civicflow.gov')}
            className="p-2 text-right rounded-lg border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 text-xs transition"
          >
            <p className="font-bold text-slate-800">محمد حسن</p>
            <p className="text-[10px] text-slate-500">مشرف المعاملات</p>
          </button>
          <button
            type="button"
            onClick={() => fillQuickDemo('sara.m@civicflow.gov')}
            className="p-2 text-right rounded-lg border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 text-xs transition"
          >
            <p className="font-bold text-slate-800">سارة محمود</p>
            <p className="text-[10px] text-slate-500">موظف متابعة (SLA)</p>
          </button>
          <button
            type="button"
            onClick={() => fillQuickDemo('khaled.i@civicflow.gov')}
            className="p-2 text-right rounded-lg border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 text-xs transition"
          >
            <p className="font-bold text-slate-800">خالد إبراهيم</p>
            <p className="text-[10px] text-slate-500">موظف استقبال</p>
          </button>
        </div>
      </div>
    </div>
  );
};
