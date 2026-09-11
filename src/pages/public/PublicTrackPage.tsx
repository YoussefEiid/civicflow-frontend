import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Search, ShieldCheck, Clock, FileCheck, ArrowLeft, Sparkles } from 'lucide-react';

export const PublicTrackPage: React.FC = () => {
  const navigate = useNavigate();
  const { requests } = useData();
  const [requestNumber, setRequestNumber] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestNumber.trim()) return;

    const cleanNum = requestNumber.trim().toUpperCase().replace('#', '');
    navigate(`/track/${cleanNum}`);
  };

  const fillQuickTrack = (num: string) => {
    setRequestNumber(num);
    navigate(`/track/${num}`);
  };

  return (
    <div className="space-y-8 py-8">
      {/* Hero Box */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          البوابة الرسمية للاستعلام ومتابعة المعاملات
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          الاستعلام عن حالة الطلب والمعاملة
        </h1>
        <p className="text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
          أدخل رقم المعاملة، أو رقم الجوال، أو رقم الهوية الوطنية، أو اسم المراجع لمعرفة المرحلة الحالية والاطلاع على القرارات والمستندات الصادرة
        </p>
      </div>

      {/* Main Search Input Form */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-xl border border-slate-200 max-w-2xl mx-auto">
        <form onSubmit={handleSearch} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-2">
              رقم المعاملة / رقم الجوال / رقم الهوية / الاسم
            </label>
            <div className="relative">
              <input
                type="text"
                value={requestNumber}
                onChange={(e) => {
                  setRequestNumber(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="أدخل رقم الطلب (REQ-1025) أو رقم الجوال (050xxxxxxx) أو الهوية أو الاسم..."
                className="w-full text-base sm:text-lg px-4 py-3.5 bg-slate-50 border border-slate-300 rounded-2xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-600 transition"
              />
            </div>
            {errorMsg && <p className="mt-1 text-xs text-rose-600 font-bold">{errorMsg}</p>}
          </div>

          <Button type="submit" variant="primary" size="lg" className="w-full py-4 text-base rounded-2xl shadow-lg shadow-blue-600/30">
            <Search className="w-5 h-5 ml-2" />
            استعلام عن المعاملة
          </Button>
        </form>

        {/* Submit Request CTA Banner */}
        <div className="mt-6 p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 flex items-center justify-between gap-4">
          <div className="space-y-0.5 text-right">
            <h4 className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-blue-600" />
              هل تريد تقديم معاملة جديدة؟
            </h4>
            <p className="text-[11px] text-blue-700/90">
              يمكنك رفع طلبك مباشرة وإرفاق صورة الهوية والمستندات إلكترونياً
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/submit-request')}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-sm shrink-0 transition"
          >
            تقديم طلب الآن
          </button>
        </div>

        {/* Quick Demo Numbers */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <p className="text-xs font-bold text-slate-400 mb-3">أرقام معاملات تجريبية سريعة للاختبار:</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => fillQuickTrack('REQ-1025')}
              className="px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition"
            >
              #REQ-1025 (قيد المعالجة)
            </button>
            <button
              onClick={() => fillQuickTrack('REQ-1008')}
              className="px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-cyan-50 text-cyan-800 hover:bg-cyan-100 border border-cyan-200 transition"
            >
              #REQ-1008 (الإجابة جاهزة)
            </button>
            <button
              onClick={() => fillQuickTrack('REQ-1042')}
              className="px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200 transition"
            >
              #REQ-1042 (متأخر)
            </button>
            <button
              onClick={() => fillQuickTrack('REQ-1001')}
              className="px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 transition"
            >
              #REQ-1001 (تم التسليم)
            </button>
          </div>
        </div>
      </div>

      {/* Feature Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto pt-6 text-center">
        <div className="p-4 bg-white rounded-2xl border border-slate-200">
          <Clock className="w-6 h-6 text-blue-600 mx-auto mb-2" />
          <h4 className="font-bold text-sm text-slate-800">متابعة فورية على مدار الساعة</h4>
          <p className="text-xs text-slate-500 mt-1">تحديثات مستمرة لحالة طلبك لحظة بلحظة</p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200">
          <FileCheck className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
          <h4 className="font-bold text-sm text-slate-800">تحميل الوثائق المعتمدة</h4>
          <p className="text-xs text-slate-500 mt-1">الاطلاع على القرارات الصادرة فور اعتمادها</p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200">
          <ShieldCheck className="w-6 h-6 text-indigo-600 mx-auto mb-2" />
          <h4 className="font-bold text-sm text-slate-800">خصوصية وأمان تام</h4>
          <p className="text-xs text-slate-500 mt-1">حماية تامة لبيانات وسجلات المراجعين</p>
        </div>
      </div>
    </div>
  );
};
