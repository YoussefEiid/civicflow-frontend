import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { cityService } from '../../services/cityService';
import { City } from '../../types';
import { User, Phone, MapPin, ArrowRight, Save } from 'lucide-react';
import { IRAQI_GOVERNORATES } from '../../constants/iraqGovernorates';

export const CreateCustomerPage: React.FC = () => {
  const navigate = useNavigate();
  const { handleCreateCustomer } = useData();
  const { success, warning } = useToast();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [altPhone, setAltPhone] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [occupation, setOccupation] = useState<'موظف حكومي' | 'كاسب' | 'طالب' | 'عاطل عن العمل' | 'قطاع خاص' | 'أخرى' | string>('كاسب');
  const [birthYear, setBirthYear] = useState('');
  const [email, setEmail] = useState('');
  const [cityId, setCityId] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [cities, setCities] = useState<City[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    cityService.getActive().then(setCities).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      warning('حقول مطلوبة', 'يرجى إدخال اسم المراجع ورقم هاتف واتساب');
      return;
    }

    setIsLoading(true);
    try {
      const created = await handleCreateCustomer({
        name,
        phone,
        altPhone,
        nationalId,
        occupation,
        birthYear: birthYear.trim() || undefined,
        email,
        cityId: cityId || undefined,
        address,
        notes
      });
      success('تم إضافة المراجع بنجاح', `تم تسجيل ملف ${created.name}`);
      navigate(`/customers/${created.id}`);
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
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">إضافة مراجع جديد</h1>
          <p className="text-xs text-slate-500 mt-1">تسجيل مراجع جديد في قاعدة البيانات الإدارية</p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/customers')}
          icon={<ArrowRight className="w-4 h-4" />}
        >
          إلغاء والعودة
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              <CardTitle>البيانات الشخصية وبيانات الاتصال</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="الاسم الكامل"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: علي حسن كاظم"
                required
              />

              <Input
                label="رقم هاتف واتساب"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="077********"
                required
              />

              <Input
                label="رقم الهاتف اتصال"
                value={altPhone}
                onChange={(e) => setAltPhone(e.target.value)}
                placeholder="078********"
              />

              <Input
                label="رقم الهوية الوطنية / البطاقة الموحدة"
                value={nationalId}
                onChange={(e) => setNationalId(e.target.value)}
                placeholder="19xxxxxxxxxx"
              />

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  العمل / المهنة
                </label>
                <Select
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                >
                  <option value="موظف حكومي">موظف حكومي</option>
                  <option value="كاسب">كاسب</option>
                  <option value="طالب">طالب</option>
                  <option value="عاطل عن العمل">عاطل عن العمل</option>
                  <option value="قطاع خاص">قطاع خاص</option>
                  <option value="أخرى">أخرى</option>
                </Select>
              </div>

              <Input
                label="المواليد (سنة الميلاد)"
                type="text"
                value={birthYear}
                onChange={(e) => setBirthYear(e.target.value)}
                placeholder="مثال: 1995"
              />

              <div>
                <Input
                  label="البريد الإلكتروني"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ali.hassan@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  المحافظة
                </label>
                <Select
                  value={cityId}
                  onChange={(e) => setCityId(e.target.value)}
                >
                  <option value="">اختر المحافظة...</option>
                  {IRAQI_GOVERNORATES.map((gov, idx) => {
                    const matched = cities.find((c) => c.name === gov);
                    return (
                      <option key={gov} value={matched ? matched.id : gov}>
                        {idx + 1}. {gov}
                      </option>
                    );
                  })}
                </Select>
              </div>

              <div className="sm:col-span-2">
                <Input
                  label="عنوان السكن / أقرب نقطة دالة"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="المحافظة - الحي - أقرب نقطة دالة"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                ملاحظات وتفضيلات المراجع
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="أي ملاحظات خاصة بالمراجع أو تفضيل القنوات (مثل التواصل عبر WhatsApp فقط)..."
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate('/customers')}>
            إلغاء
          </Button>
          <Button type="submit" variant="primary" size="lg" isLoading={isLoading} icon={<Save className="w-4 h-4" />}>
            حفظ وإضافة المراجع
          </Button>
        </div>
      </form>
    </div>
  );
};
