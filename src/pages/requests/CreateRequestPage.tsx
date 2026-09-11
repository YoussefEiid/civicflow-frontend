import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { calculateExpectedDate } from '../../services/api';
import { cityService } from '../../services/cityService';
import { requestTypeService } from '../../services/requestTypeService';
import { requestService } from '../../services/requestService';
import { RequestPriority, RequestType, RequestAttachment, City, RequestTypeEntity } from '../../types';
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
  ShieldAlert,
  MapPin,
  Layers
} from 'lucide-react';

export const CreateRequestPage: React.FC = () => {
  const navigate = useNavigate();
  const { customers, ministries, employees, handleCreateRequest, handleCreateCustomer } = useData();
  const { success, warning } = useToast();

  // Dynamic lists from backend
  const [cities, setCities] = useState<City[]>([]);
  const [dbRequestTypes, setDbRequestTypes] = useState<RequestTypeEntity[]>([]);

  // Customer selection mode: 'existing' or 'new'
  const [customerMode, setCustomerMode] = useState<'existing' | 'new'>('existing');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(customers[0]?.id || '');

  // New Customer Fields
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custAltPhone, setCustAltPhone] = useState('');
  const [custNationalId, setCustNationalId] = useState('');
  const [custCityId, setCustCityId] = useState('');
  const [custAddress, setCustAddress] = useState('');
  const [custNotes, setCustNotes] = useState('');

  // Request Fields
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [requestType, setRequestType] = useState<RequestType>('إصدار تصريح');
  const [requestTypeId, setRequestTypeId] = useState<string>('');
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

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [cList, tList] = await Promise.all([
          cityService.getActive().catch(() => []),
          requestTypeService.getActive().catch(() => [])
        ]);
        if (cList.length > 0) setCities(cList);
        if (tList.length > 0) {
          setDbRequestTypes(tList);
          setRequestType(tList[0].name);
          setRequestTypeId(tList[0].id);
        }
      } catch (err) {
        console.warn('Could not load dynamic cities or request types:', err);
      }
    };
    fetchOptions();
  }, []);

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

  interface UploadItem {
    id: string;
    file: File;
    name: string;
    size: string;
    type: string;
    documentType: string;
    isPublic: boolean;
  }

  const [uploadFiles, setUploadFiles] = useState<UploadItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFilesSelected = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const newItems: UploadItem[] = Array.from(fileList).map((f) => {
      const sizeStr =
        f.size > 1024 * 1024
          ? `${(f.size / (1024 * 1024)).toFixed(1)} MB`
          : `${Math.max(1, Math.round(f.size / 1024))} KB`;
      const typeStr = f.type.includes('pdf')
        ? 'PDF'
        : f.type.includes('image')
        ? 'Image'
        : f.type.includes('sheet') || f.name.endsWith('.xlsx') || f.name.endsWith('.xls')
        ? 'Excel'
        : 'Word';

      let docType = 'GENERAL';
      if (f.name.includes('هوية') || f.name.includes('اقامة') || f.name.includes('إقامة')) {
        docType = 'IDENTITY';
      } else if (f.name.includes('طلب') || f.name.includes('معاملة')) {
        docType = 'REQUEST_DOCUMENT';
      }

      return {
        id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        file: f,
        name: f.name,
        size: sizeStr,
        type: typeStr,
        documentType: docType,
        isPublic: docType !== 'IDENTITY'
      };
    });

    setUploadFiles((prev) => [...prev, ...newItems]);
  };

  const handleRemoveUploadFile = (id: string) => {
    setUploadFiles((prev) => prev.filter((item) => item.id !== id));
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
          warning('بيانات المراجع ناقصة', 'يرجى إدخال اسم المراجع ورقم هاتف واتساب');
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

      // Upload all real selected files to the created request
      if (uploadFiles.length > 0) {
        try {
          await Promise.all(
            uploadFiles.map((item) =>
              requestService.addAttachment(created.id, {
                name: item.name,
                type: item.type,
                size: item.size,
                documentType: item.documentType,
                isPublic: item.isPublic,
                file: item.file
              })
            )
          );
        } catch (attErr) {
          console.warn('Error uploading attachments:', attErr);
        }
      }

      success('تم إنشاء الطلب بنجاح', `تم تسجيل المعاملة رقم ${created.requestNumber}`);

      if (stayOnPage) {
        setTitle('');
        setDetails('');
        setInternalNotes('');
        setAttachments([]);
        setUploadFiles([]);
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
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  المراجع المسجل <span className="text-rose-500">*</span>
                </label>
                <Select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} — {c.phone} {c.nationalId ? `(${c.nationalId})` : ''}
                    </option>
                  ))}
                </Select>

                {selectedCustomer && (
                  <div className="mt-3 p-3.5 rounded-xl bg-blue-50/60 border border-blue-200 text-xs text-blue-950 flex flex-wrap items-center gap-4">
                    <span>
                      الهاتف: <strong>{selectedCustomer.phone}</strong>
                    </span>
                    {selectedCustomer.nationalId && (
                      <span>
                        الهوية: <strong>{selectedCustomer.nationalId}</strong>
                      </span>
                    )}
                    {selectedCustomer.address && (
                      <span>
                        العنوان: <strong>{selectedCustomer.address}</strong>
                      </span>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="اسم المراجع الكامل"
                  required
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  placeholder="مثال: علي حسن كاظم"
                />

                <Input
                  label="رقم هاتف واتساب"
                  type="tel"
                  required
                  value={custPhone}
                  onChange={(e) => setCustPhone(e.target.value)}
                  placeholder="077********"
                />

                <Input
                  label="رقم الهاتف اتصال (اختياري)"
                  type="tel"
                  value={custAltPhone}
                  onChange={(e) => setCustAltPhone(e.target.value)}
                  placeholder="078********"
                />

                <Input
                  label="رقم الهوية الوطنية / البطاقة الموحدة"
                  value={custNationalId}
                  onChange={(e) => setCustNationalId(e.target.value)}
                  placeholder="19xxxxxxxxxx"
                />

                <Input
                  label="عنوان السكن / أقرب نقطة دالة"
                  value={custAddress}
                  onChange={(e) => setCustAddress(e.target.value)}
                  placeholder="المحافظة، الحي، أقرب نقطة دالة..."
                />

                <Input
                  label="ملاحظات المراجع"
                  value={custNotes}
                  onChange={(e) => setCustNotes(e.target.value)}
                  placeholder="أي تفاصيل خاصة بالمراجع..."
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* SECTION 2: Request Details */}
        <Card>
          <CardHeader className="bg-slate-50/70">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <CardTitle>2. بيانات وتفاصيل المعاملة</CardTitle>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Input
                  label="عنوان / موضوع المعاملة"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: طلب نقل كفالة، ترخيص مزاولة نشاط تجاري..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  نوع المعاملة <span className="text-rose-500">*</span>
                </label>
                <Select
                  value={requestTypeId || requestType}
                  onChange={(e) => {
                    const selectedVal = e.target.value;
                    const matchedType = dbRequestTypes.find((t) => t.id === selectedVal || t.name === selectedVal);
                    if (matchedType) {
                      setRequestTypeId(matchedType.id);
                      setRequestType(matchedType.name);
                    } else {
                      setRequestType(selectedVal as RequestType);
                    }
                  }}
                >
                  {dbRequestTypes.length > 0 ? (
                    dbRequestTypes.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="إصدار تصريح">إصدار تصريح</option>
                      <option value="تجديد رخصة">تجديد رخصة</option>
                      <option value="طلب شهادة رسمية">طلب شهادة رسمية</option>
                      <option value="شكوى وتظلم">شكوى وتظلم</option>
                      <option value="استعلام إداري">استعلام إداري</option>
                      <option value="طلب إعفاء">طلب إعفاء</option>
                      <option value="معاملة توثيق">معاملة توثيق</option>
                      <option value="أخرى">أخرى</option>
                    </>
                  )}
                </Select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  الجهة الحكومية المعنية <span className="text-rose-500">*</span>
                </label>
                <Select
                  value={ministryId}
                  onChange={(e) => setMinistryId(e.target.value)}
                >
                  {ministries.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.slaDays} أيام إنجاز)
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  أولوية المعاملة <span className="text-rose-500">*</span>
                </label>
                <Select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as RequestPriority)}
                >
                  <option value="عادي">عادي (المدة النظامية الكاملة)</option>
                  <option value="مهم">مهم (تسريع الإجراء 25%)</option>
                  <option value="عاجل">عاجل (أولوية قصوى 50%)</option>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  الموظف المسؤول عن المتابعة
                </label>
                <Select
                  value={assignedEmployeeId}
                  onChange={(e) => setAssignedEmployeeId(e.target.value)}
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
                  label="تاريخ استلام المعاملة"
                  type="date"
                  value={receiveDate}
                  onChange={(e) => setReceiveDate(e.target.value)}
                />
              </div>

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

        {/* SECTION 3: Real Attachments & Documents */}
        <Card>
          <CardHeader className="bg-slate-50/70">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-blue-600" />
                <CardTitle>3. المرفقات والمستندات الأولية</CardTitle>
              </div>
              <span className="text-xs text-slate-500">
                {uploadFiles.length > 0 ? `(${uploadFiles.length} ملفات محددة)` : 'اختياري'}
              </span>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <input
              type="file"
              ref={fileInputRef}
              multiple
              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif"
              onChange={(e) => {
                handleFilesSelected(e.target.files);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              className="hidden"
            />

            {/* Drag & Drop Area */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                handleFilesSelected(e.dataTransfer.files);
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
                isDragging
                  ? 'border-blue-500 bg-blue-50/60 shadow-inner'
                  : 'border-slate-300 hover:border-blue-500 hover:bg-slate-50/70 bg-slate-50/30'
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-3 shadow-xs">
                <UploadCloud className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800 mb-1">
                اسحب وأفلت الملفات هنا، أو <span className="text-blue-600 hover:underline">اضغط للاختيار من جهازك</span>
              </h4>
              <p className="text-xs text-slate-500">
                يدعم كافة المستندات: PDF, Word, Excel, وصور الهويات (PNG, JPG) حتى 10MB لكل ملف
              </p>
            </div>

            {/* Uploaded Files List */}
            {uploadFiles.length > 0 && (
              <div className="space-y-2.5 pt-2">
                <div className="text-xs font-bold text-slate-700">الملفات المرفقة الجاهزة للرفع:</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {uploadFiles.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl border border-slate-200 bg-white shadow-xs flex flex-col gap-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 truncate">
                          <File className="w-4 h-4 text-blue-600 shrink-0" />
                          <span className="font-bold text-xs text-slate-800 truncate" title={item.name}>
                            {item.name}
                          </span>
                          <span className="text-[11px] font-mono text-slate-400 shrink-0">({item.size})</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveUploadFile(item.id)}
                          className="text-slate-400 hover:text-rose-600 p-1 transition"
                          title="حذف المرفق"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* File Classification & Visibility */}
                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 text-[11px]">
                        <select
                          value={item.documentType}
                          onChange={(e) => {
                            const newDocType = e.target.value;
                            setUploadFiles((prev) =>
                              prev.map((f) =>
                                f.id === item.id
                                  ? {
                                      ...f,
                                      documentType: newDocType,
                                      isPublic: newDocType !== 'IDENTITY'
                                    }
                                  : f
                              )
                            );
                          }}
                          className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium text-[11px]"
                        >
                          <option value="GENERAL">مستند عام</option>
                          <option value="IDENTITY">صورة الهوية / الإقامة</option>
                          <option value="REQUEST_DOCUMENT">مستند الطلب الأساسي</option>
                          <option value="COMMERCIAL_REG">سجل تجاري / ترخيص</option>
                        </select>

                        <label className="flex items-center gap-1.5 text-slate-600 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={item.isPublic}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setUploadFiles((prev) =>
                                prev.map((f) => (f.id === item.id ? { ...f, isPublic: checked } : f))
                              );
                            }}
                            className="w-3.5 h-3.5 text-blue-600 rounded border-slate-300"
                          />
                          <span>متاح للمراجع</span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
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
