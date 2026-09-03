import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Lock, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { success, error } = useToast();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      error('خطأ في التطابق', 'كلمتا المرور غير متطابقتين');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      success('تم تعيين كلمة المرور بنجاح', 'يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة');
      navigate('/login');
    }, 600);
  };

  return (
    <div>
      <div className="mb-6 text-center">
        <h2 className="text-xl font-bold text-slate-900">تعيين كلمة المرور الجديدة</h2>
        <p className="text-xs text-slate-500 mt-1">أدخل كلمة المرور الجديدة لحسابك الإداري</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="كلمة المرور الجديدة"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          icon={<Lock className="w-4 h-4" />}
        />

        <Input
          label="تأكيد كلمة المرور"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="••••••••"
          required
          icon={<Lock className="w-4 h-4" />}
        />

        <div className="pt-2">
          <Button type="submit" variant="primary" className="w-full" size="lg" isLoading={isLoading}>
            حفظ كلمة المرور الجديدة
          </Button>
        </div>
      </form>

      <div className="mt-6 text-center">
        <Link to="/login" className="text-xs font-semibold text-blue-600 hover:underline inline-flex items-center gap-1">
          <ArrowRight className="w-3.5 h-3.5" />
          العودة لتسجيل الدخول
        </Link>
      </div>
    </div>
  );
};
