import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { calculateExpectedDate } from '../../services/api';
import { RequestPriority, RequestType, RequestAttachment } from '../../types';
import {
  User,
  UserPlus,
  FileText,
  Building2,
  Calendar,
  Clock,
  UploadCloud,
  File,
  X,
  ArrowRight,
  Sparkles,
  ShieldAlert
} from 'lucide-react';

export const CreateRequestPage: React.FC = () => {
  const navigate = useNavigate();
  const { customers, ministries, employees, handleCreateRequest, handleCreateCustomer } = useData();
  const { success, warning } = useToast();

  // Customer selection mode: 'existing' or 'new'
  const [customerMode, setCustomerMode] = useState<'existing' | 'new'>('existing');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(customers[0]?.id || '');

  // New Customer Fields
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custAltPhone, setCustAltPhone] = useState('');
  const [custNationalId, setCustNationalId] = useState('');
  const [custAddress, setCustAddress] = useState('');
  const [custNotes, setCustNotes] = useState('');

  // Request Fields
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [requestType, setRequestType] = useState<RequestType>('إصدار تصريح');
  const [ministryId, setMinistryId] = useState<string>(ministryDefault());
  const [priority, setPriority] = useState<RequestPriority>('عادي');
  const [assignedEmployeeId, setAssignedEmployeeId] = useState<string>(employees[0]?.id || 'emp-3');
  const [receiveDate, setReceiveDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [expectedDate, setExpectedDate] = useState<string>('');
  const [internalNotes, setInternalNotes] = useState('');

  // Attachments state
  const [attachments, setAttachments] = useState<RequestAttachment[]>([]);
  const [mockFileName, setMockFileName] = useState('');

  const [isLoading, setIsLoading] = useState(false);

  function ministryDefault() {
    return ministries[0]?.id || 'min-1';
  }

  // Recalculate SLA expected completion date whenever ministry, priority, or receiveDate changes
  useEffect(() => {
    if (ministryId && receiveDate) {
      const calculated = calculateExpectedDate(receiveDate, ministryId, priority);
      setExpectedDate(calculated);
    }
  }, [ministryId, priority, receiveDate, ministries]);

  // Selected existing customer helper
  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  const handleAddAttachment = () => {
    if (!mockFileName) return;
    const newAtt: RequestAttachment = {
      id: `att-${Date.now()}`,
      name: mockFileName.endsWith('.pdf') ? mockFileName : `${mockFileName}.pdf`,
      size: '1.8 MB',
      type: 'PDF',
      uploadedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      uploadedBy: 'أحمد علي'
    };
    setAttachments([...attachments, newAtt]);
    setMockFileName('');
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments(attachments.filter((a) => a.id !== id));
  };

  const handleSave = async (stayOnPage = false) => {
    if (!title.trim()) {
      warning('حقل مطلوب', 'يرجى إدخال عنوان المعاملة');
      return;
    }

    setIsLoading(true);

    try {
      let finalCustomerId = selectedCustomerId;
      let finalCustomerName = selectedCustomer?.name || '';
      let finalCustomerPhone = selectedCustomer?.phone || '';

      // If creating a new customer
      if (customerMode === 'new') {
        if (!custName.trim() || !custPhone.trim()) {
          warning('بيانات المراجع ناقصة', 'يرجى إدخال اسم المراجع ورقم الجوال');
          setIsLoading(false);
          return;
        }

        const newCust = await handleCreateCustomer({
          name: custName,
          phone: custPhone,
          altPhone: custAltPhone,
          nationalId: custNationalId,
          address: custAddress,
          notes: custNotes
        });

        finalCustomerId = newCust.id;
        finalCustomerName = newCust.name;
        finalCustomerPhone = newCust.phone;
      }

      const assignedEmp = employees.find((e) => e.id === assignedEmployeeId);
      const selectedMin = ministries.find((m) => m.id === ministryId);

      const created = await handleCreateRequest({
        customerId: finalCustomerId,
        customerName: finalCustomerName,
        customerPhone: finalCustomerPhone,
        title,
        details,
        requestType,
        ministryId,
        ministryName: selectedMin?.name || 'وزارة الصحة',
        priority,
        assignedEmployeeId,
        assignedEmployeeName: assignedEmp?.name || 'أحمد علي',
        receiveDate,
        expectedCompletionDate: expectedDate,
        attachments,
        internalNotes
      });

      success('تم إنشاء الطلب بنجاح', `تم تسجيل المعاملة رقم ${created.requestNumber}`);

      if (stayOnPage) {
        setTitle('');
        setDetails('');
        setInternalNotes('');
        setAttachments([]);
        setMockFileName('');
      } else {
        navigate(`/requests/${created.id}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const activeMinistry = ministries.find((m) => m.id === ministryId);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">إضافة معاملة وطلب جديد</h1>
          <p className="text-xs text-slate-500 mt-1">
            تسجيل بيانات المراجع، تحديد الجهة الحكومية، واحتساب موعد الإنجاز المعتمد آلياً
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={() => navigate('/requests')} icon={<ArrowRight className="w-4 h-4" />}>
          إلغاء والعودة
        </Button>
      </div>

      <div className="space-y-6">
        {/* SECTION 1: Customer Information */}
        <Card>
          <CardHeader className="bg-slate-50/70">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                <CardTitle>1. بيانات المراجع / صاحب المعاملة</CardTitle>
              </div>

              {/* Mode switch */}
              <div className="flex items-center p-1 bg-white border border-slate-200 rounded-xl text-xs">
                <button
                  type="button"
                  onClick={() => setCustomerMode('existing')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition ${
                    customerMode === 'existing'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  اختيار مراجع مسجل
                </button>
                <button
                  type="button"
                  onClick={() => setCustomerMode('new')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1 ${
                    customerMode === 'new'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  + مراجع جديد
                </button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {customerMode === 'existing' ? (
              <div className="space-y-3">
                <Select
                  label="اختر المراجع من السجل"
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  required
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} — هاتف: {c.phone} (عدد الطلبات: {c.requestsCount})
                    </option>
                  ))}
                </Select>

                {selectedCustomer && (
                  <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400">رقم الهاتف:</span>
                      <p className="font-bold text-slate-800 font-mono mt-0.5">{selectedCustomer.phone}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">العنوان:</span>
                      <p className="font-bold text-slate-800 mt-0.5">{selectedCustomer.address || 'غير محدد'}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">إجمالي المعاملات السابقة:</span>
                      <p className="font-bold text-blue-700 mt-0.5">{selectedCustomer.requestsCount} معاملة</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in duration-150">
                <Input
                  label="اسم المراجع الكامل"
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  placeholder="مثال: صالح عبدالله الغامدي"
                  required
                />
                <Input
                  label="رقم الجوال الأساسي"
                  value={custPhone}
                  onChange={(e) => setCustPhone(e.target.value)}
                  placeholder="0500000000"
                  required
                />
                <Input
                  label="الهاتف البديل / الأرضي"
                  value={custAltPhone}
                  onChange={(e) => setCustAltPhone(e.target.value)}
                  placeholder="0110000000"
                />
                <Input
                  label="رقم الهوية الوطنية / الإقامة"
                  value={custNationalId}
                  onChange={(e) => setCustNationalId(e.target.value)}
                  placeholder="10XXXXXXXX"
                />
                <div className="sm:col-span-2">
                  <Input
                    label="العنوان الوطني / السكن"
                    value={custAddress}
                    onChange={(e) => setCustAddress(e.target.value)}
                    placeholder="المدينة - الحي - الشارع"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* SECTION 2: Request Information & SLA auto-calc */}
        <Card>
          <CardHeader className="bg-slate-50/70">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <CardTitle>2. بيانات المعاملة والجهة ومحددات SLA</CardTitle>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Input
                  label="عنوان المعاملة / الطلب"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: طلب ترخيص منشأة طبية خاصة وتصديق الكادر"
                  required
                />
              </div>

              <div>
                <Select
                  label="نوع الطلب"
                  value={requestType}
                  onChange={(e) => setRequestType(e.target.value as RequestType)}
                  required
                >
                  <option value="إصدار تصريح">إصدار تصريح</option>
                  <option value="تجديد رخصة">تجديد رخصة</option>
                  <option value="طلب شهادة رسمية">طلب شهادة رسمية</option>
                  <option value="شكوى وتظلم">شكوى وتظلم</option>
                  <option value="استعلام إداري">استعلام إداري</option>
                  <option value="طلب إعفاء">طلب إعفاء</option>
                  <option value="معاملة توثيق">معاملة توثيق</option>
                  <option value="أخرى">أخرى</option>
                </Select>
              </div>

              <div>
                <Select
                  label="الجهة / الوزارة المعنية"
                  value={ministryId}
                  onChange={(e) => setMinistryId(e.target.value)}
                  required
                >
                  {ministries.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} (مدة الإنجاز الافتراضية: {m.slaDays} أيام)
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <Select
                  label="الأولوية ودرجة الاستعجال"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as RequestPriority)}
                  required
                >
                  <option value="عادي">عادي (المدة النظامية الكاملة)</option>
                  <option value="مهم">مهم (تسريع الإجراء 25%)</option>
                  <option value="عاجل">عاجل (أولوية قصوى 50%)</option>
                </Select>
              </div>

              <div>
                <Select
                  label="الموظف المسؤول عن المتابعة"
                  value={assignedEmployeeId}
                  onChange={(e) => setAssignedEmployeeId(e.target.value)}
                  required
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} — {emp.role}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <Input
                  label="تاريخ الاستلام"
                  type="date"
                  value={receiveDate}
                  onChange={(e) => setReceiveDate(e.target.value)}
                  required
                />
              </div>

              {/* Automatic SLA Expected Completion Date Card */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  الموعد المتوقع للإنجاز (محسوب آلياً بناءً على SLA)
                </label>
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-950 font-bold text-sm">
                  <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{expectedDate || '---'}</span>
                  <span className="text-xs text-emerald-700 font-normal mr-auto">
                    ({activeMinistry?.name} • مدة {activeMinistry?.slaDays} أيام)
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                تفاصيل ووصف المعاملة
              </label>
              <textarea
                rows={3}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="اكتب شرحاً وافياً عن المعاملة والمستندات المرفقة والتوجيه المطلوب..."
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                ملاحظات داخلية خاصة بالموظفين (سرية)
              </label>
              <textarea
                rows={2}
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                placeholder="ملاحظات لا تظهر للمراجع أو في بوابة الاستعلام العام..."
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </CardContent>
        </Card>

        {/* SECTION 3: Attachments Mock */}
        <Card>
          <CardHeader className="bg-slate-50/70">
            <div className="flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-blue-600" />
              <CardTitle>3. المرفقات والمستندات الأولية</CardTitle>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <Input
                placeholder="اكتب اسم المستند (مثال: صورة الهوية، السجل التجاري...)"
                value={mockFileName}
                onChange={(e) => setMockFileName(e.target.value)}
                className="flex-1"
              />
              <Button
                type="button"
                variant="secondary"
                onClick={handleAddAttachment}
                disabled={!mockFileName.trim()}
              >
                + إضافة المرفق
              </Button>
            </div>

            {attachments.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {attachments.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <File className="w-4 h-4 text-blue-600 shrink-0" />
                      <span className="font-bold text-slate-800 truncate">{att.name}</span>
                      <span className="text-slate-400 font-mono">({att.size})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(att.id)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-3">
                لم يتم إرفاق ملفات بعد. يمكنك إضافة المرفقات الآن أو لاحقاً من صفحة تفاصيل الطلب.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Submit Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/requests')}
            disabled={isLoading}
          >
            إلغاء
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => handleSave(true)}
            isLoading={isLoading}
          >
            حفظ وإضافة طلب آخر
          </Button>
          <Button
            type="button"
            variant="primary"
            size="lg"
            onClick={() => handleSave(false)}
            isLoading={isLoading}
          >
            حفظ وإنشاء الطلب
          </Button>
        </div>
      </div>
    </div>
  );
};
