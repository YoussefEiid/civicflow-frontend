import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Bell, Save, ArrowRight, ShieldCheck, Flame, MessageSquare } from 'lucide-react';

export const NotificationSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { settings, handleUpdateSettings } = useData();
  const { success, error } = useToast();

  const [prefs, setPrefs] = useState({
    enableInApp: true,
    enableOverdueAlerts: true,
    enableStatusAlerts: true,
    enableWhatsApp: true,
    autoNotifyCustomerOnStatusChange: true
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (settings?.notificationPreferences) {
      setPrefs(settings.notificationPreferences);
    }
  }, [settings]);

  const togglePref = (key: keyof typeof prefs) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    if (!settings) return;
    setIsLoading(true);
    try {
      await handleUpdateSettings({ notificationPreferences: prefs });
      success('تم حفظ تفضيلات الإشعارات');
    } catch (err) {
      error('حدث خطأ أثناء الحفظ');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
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
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">إعدادات الإشعارات والتنبيهات</h1>
            <p className="text-xs text-slate-500 mt-0.5">التحكم في قنوات الإشعار وأوقات التنبيه التلقائي</p>
          </div>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={handleSave}
          isLoading={isLoading}
          icon={<Save className="w-4 h-4" />}
        >
          حفظ التفضيلات
        </Button>
      </div>

      <Card>
        <CardHeader className="bg-slate-50/70">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-600" />
            <CardTitle className="text-base">تفضيلات الإرسال والتنبيهات الحية</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            onClick={() => togglePref('enableInApp')}
            className="p-4 rounded-xl border border-slate-200 hover:border-blue-300 transition cursor-pointer flex items-center justify-between"
          >
            <div>
              <p className="font-bold text-sm text-slate-900">إشعارات النظام الداخلية (In-App)</p>
              <p className="text-xs text-slate-500 mt-0.5">إظهار الإشعارات الحية في جرس التنبيهات بالمنظومة</p>
            </div>
            <input
              type="checkbox"
              checked={prefs.enableInApp}
              onChange={() => {}}
              className="w-5 h-5 text-blue-600 rounded"
            />
          </div>

          <div
            onClick={() => togglePref('enableOverdueAlerts')}
            className="p-4 rounded-xl border border-rose-200 bg-rose-50/20 hover:border-rose-300 transition cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-rose-100 text-rose-700 mt-0.5">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-sm text-rose-950">تنبيهات تجاوز مدد الإنجاز (Overdue SLA)</p>
                <p className="text-xs text-rose-700 mt-0.5">
                  إرسال إشعار فوري وتصعيد المعاملة عند تجاوز المدة الزمنية المحددة للوزارة
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={prefs.enableOverdueAlerts}
              onChange={() => {}}
              className="w-5 h-5 text-rose-600 rounded"
            />
          </div>

          <div
            onClick={() => togglePref('enableStatusAlerts')}
            className="p-4 rounded-xl border border-slate-200 hover:border-blue-300 transition cursor-pointer flex items-center justify-between"
          >
            <div>
              <p className="font-bold text-sm text-slate-900">تنبيهات تغيير حالة المعاملات</p>
              <p className="text-xs text-slate-500 mt-0.5">إشعار الموظفين المعنيين عند تحديث مراحل المعاملة</p>
            </div>
            <input
              type="checkbox"
              checked={prefs.enableStatusAlerts}
              onChange={() => {}}
              className="w-5 h-5 text-blue-600 rounded"
            />
          </div>

          <div
            onClick={() => togglePref('enableWhatsApp')}
            className="p-4 rounded-xl border border-teal-200 bg-teal-50/20 hover:border-teal-300 transition cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-teal-100 text-teal-700 mt-0.5">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-sm text-teal-950">تفعيل إشعارات WhatsApp التلقائية</p>
                <p className="text-xs text-teal-700 mt-0.5">إرسال رسائل التحديثات المباشرة إلى هواتف المراجعين</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={prefs.enableWhatsApp}
              onChange={() => {}}
              className="w-5 h-5 text-teal-600 rounded"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
