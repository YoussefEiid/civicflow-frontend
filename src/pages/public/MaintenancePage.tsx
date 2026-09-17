import React, { useState } from 'react';
import { Wrench, ShieldCheck, Clock, RefreshCw, Layers, Sparkles, CheckCircle2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useMaintenance } from '../../context/MaintenanceContext';

export const MaintenancePage: React.FC = () => {
  const { checkMaintenanceStatus } = useMaintenance();
  const [isChecking, setIsChecking] = useState(false);
  const [checkMessage, setCheckMessage] = useState<string | null>(null);

  const handleManualCheck = async () => {
    setIsChecking(true);
    setCheckMessage(null);
    try {
      const stillInMaintenance = await checkMaintenanceStatus();
      if (!stillInMaintenance) {
        setCheckMessage('تم انتهاء أعمال الصيانة! جاري تحويلك للمنظومة...');
        setTimeout(() => {
          window.location.href = '/login';
        }, 800);
      } else {
        setCheckMessage('أعمال الصيانة لا تزال جارية، يرجى المحاولة لاحقاً.');
      }
    } catch {
      setCheckMessage('أعمال الصيانة لا تزال جارية، يرجى المحاولة لاحقاً.');
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-950 text-white flex flex-col justify-between selection:bg-amber-500 selection:text-slate-950 font-sans p-4 sm:p-6 lg:p-8"
    >
      {/* Top Navbar */}
      <header className="max-w-5xl w-full mx-auto flex items-center justify-between py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-lg ring-2 ring-white/10">
            CF
          </div>
          <div>
            <h1 className="font-bold text-base sm:text-lg text-white tracking-wide">منظومة CivicFlow</h1>
            <p className="text-xs text-slate-400">نظام إدارة وتتبع المعاملات الحكومية</p>
          </div>
        </div>

        {/* Live Status Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-medium">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
          <span>وضع الصيانة المجدولة</span>
        </div>
      </header>

      {/* Main Content Card */}
      <main className="flex-1 flex items-center justify-center py-8 sm:py-12">
        <div className="max-w-xl w-full bg-slate-800/80 backdrop-blur-xl border border-slate-700/80 rounded-3xl p-6 sm:p-10 shadow-2xl text-center relative overflow-hidden">
          {/* Subtle Ambient Light Effect */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Icon Badge */}
          <div className="relative mx-auto mb-6 w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-amber-500/20 via-amber-500/10 to-transparent border border-amber-500/30 flex items-center justify-center shadow-inner">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center shadow-lg transform -rotate-3 transition-transform hover:rotate-0">
              <Wrench className="w-7 h-7 sm:w-8 sm:h-8 animate-pulse" />
            </div>
            <div className="absolute -bottom-2 -right-2 w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md border-2 border-slate-800">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Primary Required Headings */}
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-3">
            منظومة CivicFlow متوقفة مؤقتًا
          </h2>
          <p className="text-sm sm:text-base text-amber-200/90 font-medium mb-6 leading-relaxed">
            سيتم استئناف الخدمة بعد الانتهاء من أعمال الصيانة.
          </p>

          {/* Detailed Reassuring Explanation */}
          <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-4 sm:p-5 text-xs sm:text-sm text-slate-300 space-y-2.5 mb-8 leading-relaxed text-right">
            <div className="flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                تجري حالياً أعمال صيانة وتحديثات أمنية دورية على خوادم وقواعد بيانات المنظومة لرفع كفاءة وسرعة المعالجة.
              </span>
            </div>
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                جميع البيانات والسجلات والمعاملات محفوظة بأمان تام ولن تتأثر بهذه الأعمال الفنية.
              </span>
            </div>
          </div>

          {/* Check Status Action */}
          <div className="space-y-3">
            <Button
              variant="primary"
              size="lg"
              onClick={handleManualCheck}
              isLoading={isChecking}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold py-3 px-6 rounded-2xl shadow-lg shadow-amber-500/20 border border-amber-400/30 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
            >
              <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
              <span>إعادة التحقق من حالة المنظومة</span>
            </Button>

            {checkMessage && (
              <div className="p-3 bg-slate-900/80 border border-slate-700 rounded-xl text-xs text-amber-300 animate-in fade-in duration-200">
                {checkMessage}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-5xl w-full mx-auto py-4 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-800/80">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-slate-400" />
          <span>منظومة CivicFlow — الإدارة العامة للمتابعة والتطوير التقني</span>
        </div>
        <div>
          <span>جميع الحقوق محفوظة © {new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  );
};
