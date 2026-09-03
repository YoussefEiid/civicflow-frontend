import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Building2, Clock, ArrowRight, Save } from 'lucide-react';

export const CreateMinistryPage: React.FC = () => {
  const navigate = useNavigate();
  const { handleCreateMinistry } = useData();
  const { success, warning } = useToast();

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [slaDays, setSlaDays] = useState(7);
  const [status, setStatus] = useState<'نشط' | 'غير نشط'>('نشط');
  const [contactPerson, setContactPerson] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      warning('حقل مطلوب', 'يرجى إدخال اسم الجهة أو الوزارة');
      return;
    }

    setIsLoading(true);
    try {
      const created = await handleCreateMinistry({
        name,
        code: code || `MIN-${Date.now().toString().slice(-3)}`,
        slaDays: Number(slaDays),
        status,
        contactPerson,
        contactPhone,
        contactEmail,
        notes
      });
      success('تم إضافة الجهة بنجاح', `تم تسجيل ${created.name} بمدة إنجاز ${created.slaDays} أيام`);
      navigate(`/ministries/${created.id}`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">إضافة جهة أو وزارة حكومية</h1>
          <p className="text-xs text-slate-500 mt-1">تعريف جهة شريكة وتحديد مدة SLA الافتراضية</p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/ministries')}
          icon={<ArrowRight className="w-4 h-4" />}
        >
          إلغاء والعودة
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              <CardTitle>بيانات الجهة ومحددات SLA</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Input
                  label="اسم الجهة أو الوزارة الرسمية"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: وزارة التجارة"
                  required
                />
              </div>

              <Input
                label="الرمز المختصر (Code)"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="مثال: MOC"
              />

              <Input
                label="مدة الإنجاز الافتراضية (SLA بالأيام)"
                type="number"
                min={1}
                max={90}
                value={slaDays}
                onChange={(e) => setSlaDays(Number(e.target.value))}
                required
              />

              <Select
                label="حالة الجهة"
                value={status}
                onChange={(e) => setStatus(e.target.value as 'نشط' | 'غير نشط')}
              >
                <option value="نشط">نشط</option>
                <option value="غير نشط">غير نشط</option>
              </Select>

              <Input
                label="مسؤول التنسيق والاتصال"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="أ. عبدالله المنصور"
              />

              <Input
                label="هاتف التواصل المباشر"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+966 11 000 0000"
              />

              <Input
                label="البريد الإلكتروني للجهة"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="contact@ministry.gov.sa"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                ملاحظات ونطاق المعاملات
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="أنواع المعاملات والتراخيص التي تختص بها هذه الجهة..."
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate('/ministries')}>
            إلغاء
          </Button>
          <Button type="submit" variant="primary" size="lg" isLoading={isLoading} icon={<Save className="w-4 h-4" />}>
            حفظ وإضافة الجهة
          </Button>
        </div>
      </form>
    </div>
  );
};
