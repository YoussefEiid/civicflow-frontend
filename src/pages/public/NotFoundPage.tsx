import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileQuestion, Home, Search, PlusCircle, ArrowRight } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12" dir="rtl">
      <div className="max-w-lg w-full text-center space-y-8 bg-white p-8 sm:p-10 rounded-3xl shadow-xl border border-slate-100">
        {/* Visual Badge / Icon */}
        <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
          <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-25" />
          <div className="relative w-20 h-20 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner border border-blue-100">
            <FileQuestion className="w-10 h-10 stroke-[1.5]" />
          </div>
        </div>

        {/* Text Details */}
        <div className="space-y-3">
          <span className="inline-block px-3 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-full border border-amber-200">
            خطأ 404 - الصفحة غير موجودة
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
            عذراً، لم نتمكن من العثور على هذه الصفحة
          </h1>
          <p className="text-slate-600 text-sm max-w-md mx-auto leading-relaxed">
            الرابط الذي تحاول الوصول إليه غير صحيح، أو ربما تم نقله أو حذفه من النظام. يرجى التحقق من العنوان أو استخدام الروابط أدناه.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <Button
            variant="primary"
            onClick={() => navigate('/dashboard')}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-xl shadow-sm transition-all"
          >
            <Home className="w-4 h-4" />
            لوحة التحكم
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/track')}
            className="w-full flex items-center justify-center gap-2 border-slate-200 text-slate-700 hover:bg-slate-50 font-medium py-2.5 rounded-xl transition-all"
          >
            <Search className="w-4 h-4" />
            استعلام عن معاملة
          </Button>
        </div>

        {/* Quick Links */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-center gap-6 text-xs text-slate-500 font-medium">
          <Link to="/submit-request" className="hover:text-blue-600 flex items-center gap-1 transition-colors">
            <PlusCircle className="w-3.5 h-3.5" />
            تقديم طلب جديد
          </Link>
          <span className="text-slate-300">•</span>
          <Link to="/login" className="hover:text-blue-600 flex items-center gap-1 transition-colors">
            <ArrowRight className="w-3.5 h-3.5" />
            تسجيل الدخول للنظام
          </Link>
        </div>
      </div>
    </div>
  );
};
