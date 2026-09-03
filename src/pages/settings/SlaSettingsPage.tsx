import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { SlaConfig } from '../../types';
import { Clock, Save, ArrowRight, Building2, Flame, AlertCircle } from 'lucide-react';

export const SlaSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { settings, handleUpdateSettings } = useData();
  const { success, error } = useToast();

  const [slaList, setSlaList] = useState<SlaConfig[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (settings?.sla) {
      setSlaList(settings.sla);
    }
  }, [settings]);

  const handleChange = (id: string, field: keyof SlaConfig, value: number) => {
    setSlaList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleSave = async () => {
    if (!settings) return;
    setIsLoading(true);
    try {
      await handleUpdateSettings({ sla: slaList });
      success('تم حفظ إعدادات مدد الإنجاز (SLA) بنجاح');
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
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">محددات مدد الإنجاز (SLA)</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              تحديد المدد الزمنية المستهدفة لكل جهة مع احتساب مدد الأولويات العاجلة
            </p>
          </div>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={handleSave}
          isLoading={isLoading}
          icon={<Save className="w-4 h-4" />}
        >
          حفظ التعديلات
        </Button>
      </div>

      <div className="space-y-4">
        {slaList.map((sla) => (
          <Card key={sla.id} className="p-5">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">{sla.ministryName}</h3>
                  <p className="text-xs text-slate-400">اتفاقية مستوى الخدمة المعتمدة</p>
                </div>
              </div>
              <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 border border-blue-200">
                الافتراضي: {sla.defaultDays} أيام
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">المدة العادية (أيام)</label>
                <input
                  type="number"
                  min={1}
                  value={sla.defaultDays}
                  onChange={(e) => handleChange(sla.id, 'defaultDays', Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 p-2 font-mono font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-amber-800 mb-1">أولوية مهم (أيام)</label>
                <input
                  type="number"
                  min={1}
                  value={sla.importantDays}
                  onChange={(e) => handleChange(sla.id, 'importantDays', Number(e.target.value))}
                  className="w-full rounded-lg border border-amber-300 p-2 font-mono font-bold text-amber-900 bg-amber-50/40"
                />
              </div>

              <div>
                <label className="block font-bold text-rose-800 mb-1">أولوية عاجلة (أيام)</label>
                <input
                  type="number"
                  min={1}
                  value={sla.urgentDays}
                  onChange={(e) => handleChange(sla.id, 'urgentDays', Number(e.target.value))}
                  className="w-full rounded-lg border border-rose-300 p-2 font-mono font-bold text-rose-900 bg-rose-50/40"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">تنبيه مبكر قبل (أيام)</label>
                <input
                  type="number"
                  min={1}
                  value={sla.autoAlertBeforeDays}
                  onChange={(e) => handleChange(sla.id, 'autoAlertBeforeDays', Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 p-2 font-mono font-bold text-slate-900"
                />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
