import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  FileText,
  User,
  Phone,
  CreditCard,
  MapPin,
  Building2,
  Layers,
  Upload,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  Copy,
  ExternalLink,
  Lock,
  ArrowRight
} from 'lucide-react';
import { publicService, PublicFormDataResponse, PublicSubmissionResult } from '../../services/publicService';
import { City, Ministry, RequestTypeEntity } from '../../types';

export const PublicSubmitRequestPage: React.FC = () => {
  const navigate = useNavigate();

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [cityId, setCityId] = useState('');
  const [address, setAddress] = useState('');
  const [ministryId, setMinistryId] = useState('');
  const [requestTypeId, setRequestTypeId] = useState('');
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');

  // Files
  const [identityFile, setIdentityFile] = useState<File | null>(null);
  const [requestFile, setRequestFile] = useState<File | null>(null);

  // Dynamic Options
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [requestTypes, setRequestTypes] = useState<RequestTypeEntity[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [result, setResult] = useState<PublicSubmissionResult | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const loadFormData = async () => {
      try {
        setLoadingData(true);
        const data = await publicService.getFormData();
        setMinistries(data.ministries || []);
        setCities(data.cities || []);
        setRequestTypes(data.requestTypes || []);
      } catch (err: any) {
        console.error('Error loading public form data:', err);
      } finally {
        setLoadingData(false);
      }
    };

    loadFormData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name.trim() || !phone.trim() || !title.trim() || !ministryId) {
      setErrorMessage('يرجى تعبئة كافة الحقول الإلزامية');
      return;
    }

    try {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('phone', phone.trim());
      if (nationalId.trim()) formData.append('nationalId', nationalId.trim());
      if (cityId) formData.append('cityId', cityId);
      if (address.trim()) formData.append('address', address.trim());
      formData.append('ministryId', ministryId);
      if (requestTypeId) formData.append('requestTypeId', requestTypeId);
      formData.append('title', title.trim());
      formData.append('details', details.trim());

      if (identityFile) {
        formData.append('identityFile', identityFile);
      }
      if (requestFile) {
        formData.append('requestFile', requestFile);
      }

      const res = await publicService.submitRequest(formData);
      setResult(res);
    } catch (err: any) {
      setErrorMessage(err.message || 'تعذر تقديم الطلب، يرجى المحاولة لاحقاً');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyTracking = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.requestNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  if (result) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-950 py-12 px-4 flex items-center justify-center" dir="rtl">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-slate-100 dark:border-gray-700 p-8 text-center animate-fade-in">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">تم تقديم طلبك بنجاح!</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
            تم استلام طلبك وقيده في المنظومة، يمكنك متابعة حالة الطلب في أي وقت باستخدام رقم المعاملة أدناه
          </p>

          {/* Request Card */}
          <div className="bg-slate-50 dark:bg-gray-750 p-5 rounded-2xl border border-slate-200 dark:border-gray-700 mb-6 text-right space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400">رقم المعاملة:</span>
              <span className="text-base font-bold font-mono text-brand-600 dark:text-brand-400">{result.requestNumber}</span>
            </div>
            {result.customerNumber && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 dark:text-gray-400">رقم المراجع:</span>
                <span className="text-xs font-bold font-mono text-gray-700 dark:text-gray-300">{result.customerNumber}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400">الحالة الحالية:</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                {result.status || 'استلام الطلب'}
              </span>
            </div>
          </div>

          {/* Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleCopyTracking}
              className="w-full flex items-center justify-center gap-2 py-3 bg-slate-100 dark:bg-gray-700 hover:bg-slate-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-xl text-xs font-semibold transition"
            >
              <Copy className="w-4 h-4" />
              {copied ? 'تم نسخ الرقم!' : 'نسخ رقم المعاملة'}
            </button>

            <Link
              to={`/track?q=${result.requestNumber}`}
              className="w-full flex items-center justify-center gap-2 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition shadow-md"
            >
              <ExternalLink className="w-4 h-4" />
              متابعة حالة الطلب الآن
            </Link>

            <button
              onClick={() => {
                setResult(null);
                setTitle('');
                setDetails('');
                setIdentityFile(null);
                setRequestFile(null);
              }}
              className="text-xs text-gray-500 hover:text-gray-800 dark:hover:text-gray-300 transition mt-2 block mx-auto"
            >
              تقديم طلب آخر
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900 py-10 px-4 sm:px-6 lg:px-8" dir="rtl">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Navigation & Brand */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-600 flex items-center justify-center text-white font-bold shadow-md shadow-brand-500/20">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">CivicFlow</h2>
              <p className="text-[11px] text-slate-500 dark:text-gray-400">بوابة تقديم ومتابعة المعاملات الحكومية</p>
            </div>
          </div>
          <Link
            to="/track"
            className="flex items-center gap-1.5 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline"
          >
            متابعة معاملة سابقة <ArrowRight className="w-3.5 h-3.5 rotate-180" />
          </Link>
        </div>

        {/* Hero Card */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-gray-700 shadow-sm">
          <div className="border-b border-slate-100 dark:border-gray-700 pb-5 mb-6">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">بوابة تقديم المعاملات والطلبات</h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-gray-400 mt-1.5 leading-relaxed">
              يرجى إدخال بياناتك بدقة وإرفاق المستندات المطلوبة لتسهيل معالجة طلبك لدى الجهات المختصة
            </p>
          </div>

          {errorMessage && (
            <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 rounded-2xl flex items-center gap-3 text-rose-800 dark:text-rose-300 text-xs font-medium">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Citizen Information */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <User className="w-4 h-4 text-brand-600" />
                بيانات مقدم الطلب (المراجع)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1.5">
                    الاسم الكامل <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="الاسم الرباعي أو الثلاثي"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-gray-600 bg-slate-50 dark:bg-gray-700 text-slate-900 dark:text-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1.5">
                    رقم الهاتف الجوال <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="05xxxxxxxx"
                    className="w-full px-3.5 py-2.5 text-xs font-mono rounded-xl border border-slate-200 dark:border-gray-600 bg-slate-50 dark:bg-gray-700 text-slate-900 dark:text-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition text-right"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1.5">
                    رقم الهوية الوطنية / الإقامة
                  </label>
                  <input
                    type="text"
                    value={nationalId}
                    onChange={(e) => setNationalId(e.target.value)}
                    placeholder="10xxxxxxxx / 20xxxxxxxx"
                    className="w-full px-3.5 py-2.5 text-xs font-mono rounded-xl border border-slate-200 dark:border-gray-600 bg-slate-50 dark:bg-gray-700 text-slate-900 dark:text-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition text-right"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1.5">
                    المدينة / المحافظة
                  </label>
                  <select
                    value={cityId}
                    onChange={(e) => setCityId(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-gray-600 bg-slate-50 dark:bg-gray-700 text-slate-900 dark:text-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                  >
                    <option value="">اختر المدينة...</option>
                    {cities.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1.5">
                    العنوان أو الحي
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="الحي، الشارع، أو العنوان التفصيلي"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-gray-600 bg-slate-50 dark:bg-gray-700 text-slate-900 dark:text-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                  />
                </div>
              </div>
            </div>

            {/* Request Details */}
            <div className="pt-4 border-t border-slate-100 dark:border-gray-700">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4 text-brand-600" />
                تفاصيل المعاملة والجهة
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1.5">
                    الجهة الحكومية / الوزارة المعنية <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={ministryId}
                    onChange={(e) => setMinistryId(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-gray-600 bg-slate-50 dark:bg-gray-700 text-slate-900 dark:text-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                  >
                    <option value="">اختر الجهة...</option>
                    {ministries.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1.5">
                    نوع الطلب / المعاملة
                  </label>
                  <select
                    value={requestTypeId}
                    onChange={(e) => setRequestTypeId(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-gray-600 bg-slate-50 dark:bg-gray-700 text-slate-900 dark:text-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                  >
                    <option value="">اختر نوع الطلب...</option>
                    {requestTypes.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1.5">
                    عنوان وموضوع الطلب <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="موجز واضح لعنوان المعاملة"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-gray-600 bg-slate-50 dark:bg-gray-700 text-slate-900 dark:text-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1.5">
                    شرح وتفاصيل الطلب
                  </label>
                  <textarea
                    rows={4}
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="تفاصيل المعاملة، التوضيحات، وأي أرقام سابقة..."
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-gray-600 bg-slate-50 dark:bg-gray-700 text-slate-900 dark:text-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                  />
                </div>
              </div>
            </div>

            {/* Attachments Section */}
            <div className="pt-4 border-t border-slate-100 dark:border-gray-700">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                <Upload className="w-4 h-4 text-brand-600" />
                المرفقات والمستندات
              </h3>

              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl mb-4 flex items-center gap-2.5 text-amber-800 dark:text-amber-300 text-xs">
                <Lock className="w-4 h-4 shrink-0 text-amber-600" />
                <span>حماية الخصوصية: وثائق الهوية مشفرة ولا تظهر في صفحة التتبع العامة للمراجعين</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Identity Document */}
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-750">
                  <label className="block text-xs font-bold text-slate-800 dark:text-gray-200 mb-1">
                    صورة الهوية الوطنية / الإقامة
                  </label>
                  <p className="text-[11px] text-slate-400 mb-2.5">ملف PDF أو صورة (سري ومحمي)</p>
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    onChange={(e) => setIdentityFile(e.target.files?.[0] || null)}
                    className="text-xs text-slate-600 dark:text-gray-400 file:ml-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
                  />
                  {identityFile && (
                    <p className="text-[11px] text-emerald-600 font-medium mt-1.5 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> تم اختيار: {identityFile.name}
                    </p>
                  )}
                </div>

                {/* Request Document */}
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-750">
                  <label className="block text-xs font-bold text-slate-800 dark:text-gray-200 mb-1">
                    مستندات وخطاب المعاملة
                  </label>
                  <p className="text-[11px] text-slate-400 mb-2.5">المستند الرئيسي أو الأوراق الثبوتية</p>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,image/*"
                    onChange={(e) => setRequestFile(e.target.files?.[0] || null)}
                    className="text-xs text-slate-600 dark:text-gray-400 file:ml-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
                  />
                  {requestFile && (
                    <p className="text-[11px] text-emerald-600 font-medium mt-1.5 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> تم اختيار: {requestFile.name}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-6 border-t border-slate-100 dark:border-gray-700 flex items-center justify-end gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-8 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-brand-500/20 disabled:opacity-50"
              >
                {isSubmitting ? 'جاري تسجيل الطلب...' : 'إرسال الطلب واعتماد المعاملة'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
