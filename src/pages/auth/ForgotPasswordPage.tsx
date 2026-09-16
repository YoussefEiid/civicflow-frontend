import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { ArrowRight, ShieldCheck } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  return (
    <div dir="rtl" className="text-center py-4">
      <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-200">
        <ShieldCheck className="w-7 h-7" />
      </div>

      <h2 className="text-xl font-bold text-slate-900 mb-2">استعادة الحساب متوقفة مؤقتاً</h2>
      
      <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl text-slate-700 text-xs leading-relaxed mb-6">
        <p className="font-semibold text-amber-900 mb-1">تنبيه أمني وإداري</p>
        تم إيقاف خدمة استعادة وتغيير كلمات المرور مؤقتاً لدواعي أمنية وتحديث النظام. إذا كنت بحاجة لتسجيل الدخول أو تعيين كلمة المرور، يرجى التواصل مباشرة مع الإدارة العامة للنظام.
      </div>

      <Link to="/login">
        <Button variant="primary" className="w-full" size="lg">
          <ArrowRight className="w-4 h-4 ml-2" />
          العودة لتسجيل الدخول
        </Button>
      </Link>
    </div>
  );
};

