import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { WhatsAppSettings, WhatsAppTrigger } from '../../types';
import {
  MessageSquare,
  CheckCircle2,
  Save,
  ArrowRight,
  RefreshCw,
  QrCode,
  ShieldCheck,
  FileCode2,
  PhoneCall
} from 'lucide-react';

export const WhatsAppSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { settings, handleUpdateSettings } = useData();
  const { success, error } = useToast();

  const [whatsapp, setWhatsapp] = useState<WhatsAppSettings>({
    isConnected: true,
    phoneNumber: '+966 50 123 9988',
    instanceName: 'CivicFlow-Gateway-01',
    lastSync: '2026-09-03 20:00',
    triggers: []
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (settings?.whatsapp) {
      setWhatsapp(settings.whatsapp);
    }
  }, [settings]);

  const toggleTrigger = (id: string) => {
    setWhatsapp((prev) => ({
      ...prev,
      triggers: prev.triggers.map((trg) =>
        trg.id === id ? { ...trg, enabled: !trg.enabled } : trg
      )
    }));
  };

  const handleToggleConnection = () => {
    setWhatsapp((prev) => ({
      ...prev,
      isConnected: !prev.isConnected,
      lastSync: new Date().toISOString().replace('T', ' ').substring(0, 16)
    }));
    success(
      whatsapp.isConnected ? 'تم قطع الاتصال بالبوابة (تجريبي)' : 'تم الاتصال بالبوابة بنجاح'
    );
  };

  const handleSave = async () => {
    if (!settings) return;
    setIsLoading(true);
    try {
      await handleUpdateSettings({ whatsapp });
      success('تم حفظ إعدادات وأحداث WhatsApp بنجاح');
    } catch (err) {
      error('حدث خطأ أثناء الحفظ');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/settings')}
            icon={<ArrowRight className="w-4 h-4" />}
          >
            العودة للإعدادات
          </Button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">إعدادات بوابة WhatsApp</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              إدارة الاتصال ببوابة المراسلة الفورية وضبط أحداث الإرسال التلقائي
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/settings/whatsapp/templates')}
            icon={<FileCode2 className="w-4 h-4" />}
          >
            قوالب الرسائل
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={handleSave}
            isLoading={isLoading}
            icon={<Save className="w-4 h-4" />}
          >
            حفظ الإعدادات
          </Button>
        </div>
      </div>

      {/* Gateway Status Card */}
      <Card>
        <CardHeader className="bg-slate-50/70">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-teal-600" />
              <CardTitle className="text-base">حالة الاتصال ببوابة المراسلة</CardTitle>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                whatsapp.isConnected
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-rose-100 text-rose-800'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  whatsapp.isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                }`}
              />
              {whatsapp.isConnected ? 'متصل وجاهز للإرسال' : 'غير متصل'}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-400 block mb-1">رقم الإرسال الرسمي</span>
              <p className="font-bold text-slate-900 font-mono text-sm">{whatsapp.phoneNumber}</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-400 block mb-1">اسم الخادم / Instance</span>
              <p className="font-bold text-slate-900 font-mono text-sm">{whatsapp.instanceName}</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-400 block mb-1">آخر مزامنة وفحص اتصال</span>
              <p className="font-bold text-slate-900 font-mono text-sm">{whatsapp.lastSync}</p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleConnection}
              className={whatsapp.isConnected ? 'text-rose-600' : 'text-emerald-700'}
            >
              {whatsapp.isConnected ? 'قطع الاتصال مؤقتاً' : 'إعادة الاتصال بالبوابة'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notification Triggers (8 triggers from prompt) */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle className="text-base">أحداث الإرسال التلقائي (Notification Triggers)</CardTitle>
            <CardDescription>
              حدد الحالات والمناسبات التي يتم فيها إرسال رسالة WhatsApp فورية للمراجع
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {whatsapp.triggers.map((trg) => (
            <div
              key={trg.id}
              onClick={() => toggleTrigger(trg.id)}
              className={`p-3.5 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                trg.enabled
                  ? 'bg-teal-50/40 border-teal-300 text-teal-950'
                  : 'bg-white border-slate-200 text-slate-500'
              }`}
            >
              <div className="flex items-center gap-3">
                <CheckCircle2
                  className={`w-4 h-4 ${trg.enabled ? 'text-teal-600' : 'text-slate-300'}`}
                />
                <div>
                  <p className="font-bold text-xs">{trg.title}</p>
                  <p className="text-[11px] opacity-70">الحدث البرمجي: {trg.event}</p>
                </div>
              </div>

              <input
                type="checkbox"
                checked={trg.enabled}
                onChange={() => {}}
                className="w-4 h-4 text-teal-600 rounded"
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};
