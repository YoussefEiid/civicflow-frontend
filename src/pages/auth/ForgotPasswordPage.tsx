import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Mail, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { success } = useToast();
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
      success('تم إرسال رابط الاستعادة', 'تفقد بريدك الإلكتروني لإعادة تعيين كلمة المرور');
    }, 600);
  };

  return (
    <div>
      <div className="mb-6 text-center">
        <h2 className="text-xl font-bold text-slate-900">استعادة كلمة المرور</h2>
        <p className="text-xs text-slate-500 mt-1">أدخل بريدك الإلكتروني وسنرسل لك رابطاً لتعيين كلمة مرور جديدة</p>
      </div>

      {isSubmitted ? (
        <div className="text-center py-4 space-y-4">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <p className="text-sm text-slate-700 leading-relaxed">
            تم إرسال تعليمات إعادة التعيين إلى <span className="font-bold text-slate-900">{email}</span>.
          </p>
          <div className="pt-4">
            <Button variant="primary" className="w-full" onClick={() => navigate('/reset-password')}>
              متابعة إلى شاشة التعيين (تجريبي)
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="البريد الإلكتروني المسجل"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@civicflow.gov.sa"
            required
            icon={<Mail className="w-4 h-4" />}
          />

          <div className="pt-2">
            <Button type="submit" variant="primary" className="w-full" size="lg" isLoading={isLoading}>
              إرسال رابط الاستعادة
            </Button>
          </div>
        </form>
      )}

      <div className="mt-6 text-center">
        <Link to="/login" className="text-xs font-semibold text-blue-600 hover:underline inline-flex items-center gap-1">
          <ArrowRight className="w-3.5 h-3.5" />
          العودة لتسجيل الدخول
        </Link>
      </div>
    </div>
  );
};
