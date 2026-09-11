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
  const { success, error: toastError } = useToast();

  const [email, setEmail] = useState('admin@civicflow.gov');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      toastError('كلمة المرور مطلوبة', 'يرجى إدخال كلمة المرور للمتابعة');
      return;
    }
    setIsLoading(true);

    try {
      await login(email, password);
      success('تم تسجيل الدخول بنجاح', 'مرحباً بك في منظومة CivicFlow');
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      toastError('فشل تسجيل الدخول', err?.message || 'البريد الإلكتروني أو كلمة المرور غير صحيحة');
    } finally {
      setIsLoading(false);
    }
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
          placeholder="admin@civicflow.gov"
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

      {/* Demo Accounts Quick Selection */}
      <div className="mt-6 pt-5 border-t border-slate-100">
        <p className="text-xs font-semibold text-slate-500 mb-2.5 text-center">
          حسابات تجريبية سريعة (اضغط للتعبئة التلقائية):
        </p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            type="button"
            onClick={() => {
              setEmail('admin@civicflow.gov');
              setPassword('CivicFlow@2026!');
            }}
            className="p-2 border border-slate-200 rounded-lg hover:border-blue-500 hover:bg-blue-50/50 text-right transition-colors"
          >
            <div className="font-bold text-slate-800">مدير النظام</div>
            <div className="text-[10px] text-slate-400 truncate">admin@civicflow.gov</div>
          </button>
          <button
            type="button"
            onClick={() => {
              setEmail('m.hassan@civicflow.gov');
              setPassword('CivicFlow@2026!');
            }}
            className="p-2 border border-slate-200 rounded-lg hover:border-blue-500 hover:bg-blue-50/50 text-right transition-colors"
          >
            <div className="font-bold text-slate-800">مشرف النظام</div>
            <div className="text-[10px] text-slate-400 truncate">m.hassan@civicflow.gov</div>
          </button>
          <button
            type="button"
            onClick={() => {
              setEmail('sara.m@civicflow.gov');
              setPassword('CivicFlow@2026!');
            }}
            className="p-2 border border-slate-200 rounded-lg hover:border-blue-500 hover:bg-blue-50/50 text-right transition-colors"
          >
            <div className="font-bold text-slate-800">موظف متابعة</div>
            <div className="text-[10px] text-slate-400 truncate">sara.m@civicflow.gov</div>
          </button>
          <button
            type="button"
            onClick={() => {
              setEmail('khaled.i@civicflow.gov');
              setPassword('CivicFlow@2026!');
            }}
            className="p-2 border border-slate-200 rounded-lg hover:border-blue-500 hover:bg-blue-50/50 text-right transition-colors"
          >
            <div className="font-bold text-slate-800">موظف استقبال</div>
            <div className="text-[10px] text-slate-400 truncate">khaled.i@civicflow.gov</div>
          </button>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-100 text-center">
        <p className="text-xs text-slate-500 flex items-center justify-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-blue-600" />
          منظومة آمنة ومخصصة للموظفين والمشرفين المصرح لهم فقط
        </p>
      </div>
    </div>
  );
};
