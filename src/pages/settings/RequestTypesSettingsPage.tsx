import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Layers, Plus, Search, Edit2, Trash2, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { requestTypeService } from '../../services/requestTypeService';
import { RequestTypeEntity } from '../../types';
import { useToast } from '../../context/ToastContext';

export const RequestTypesSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const [types, setTypes] = useState<RequestTypeEntity[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<RequestTypeEntity | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchTypes = async () => {
    try {
      setLoading(true);
      const data = await requestTypeService.getAll();
      setTypes(data);
    } catch (err: any) {
      showError('خطأ', 'تعذر تحميل قائمة أنواع الطلبات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTypes();
  }, []);

  const handleOpenAdd = () => {
    setEditingType(null);
    setName('');
    setCode('');
    setDescription('');
    setIsActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (t: RequestTypeEntity) => {
    setEditingType(t);
    setName(t.name);
    setCode(t.code || '');
    setDescription(t.description || '');
    setIsActive(t.isActive);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showError('خطأ', 'اسم نوع الطلب مطلوب');
      return;
    }

    try {
      setIsSaving(true);
      if (editingType) {
        await requestTypeService.update(editingType.id, {
          name: name.trim(),
          code: code.trim() || undefined,
          description: description.trim() || undefined,
          isActive
        });
        success('تم التحديث', 'تم تعديل نوع الطلب بنجاح');
      } else {
        await requestTypeService.create({
          name: name.trim(),
          code: code.trim() || undefined,
          description: description.trim() || undefined,
          isActive
        });
        success('تمت الإضافة', 'تم إضافة نوع الطلب الجديد بنجاح');
      }
      setIsModalOpen(false);
      fetchTypes();
    } catch (err: any) {
      showError('خطأ', err.message || 'تعذر حفظ بيانات نوع الطلب');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (t: RequestTypeEntity) => {
    if (!window.confirm(`هل أنت متأكد من حذف نوع الطلب "${t.name}"؟`)) return;
    try {
      await requestTypeService.delete(t.id);
      success('تم الحذف', 'تم حذف نوع الطلب بنجاح');
      fetchTypes();
    } catch (err: any) {
      showError('خطأ', err.message || 'تعذر حذف نوع الطلب');
    }
  };

  const filteredTypes = (Array.isArray(types) ? types : []).filter((t) =>
    t && t.name && (
      t.name.toLowerCase().includes(search.toLowerCase().trim()) ||
      (t.code && t.code.toLowerCase().includes(search.toLowerCase().trim())) ||
      (t.description && t.description.toLowerCase().includes(search.toLowerCase().trim()))
    )
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-gray-700">
        <div>
          <button
            onClick={() => navigate('/settings')}
            className="flex items-center gap-1 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-brand-600 mb-1"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            العودة لمركز الإعدادات
          </button>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Layers className="w-6 h-6 text-brand-600" />
            إدارة أنواع وتصنيفات الطلبات
          </h1>
          <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
            تهيئة قائمة أنواع وتصنيفات المعاملات المعمول بها في النظام وبوابة التقديم العامة
          </p>
        </div>

        <Button onClick={handleOpenAdd} icon={<Plus className="w-4 h-4" />}>
          إضافة نوع طلب جديد
        </Button>
      </div>

      {/* Search & Stats */}
      <div className="flex items-center justify-between gap-4 bg-white dark:bg-gray-800 p-4 rounded-2xl border border-slate-200 dark:border-gray-700 shadow-subtle">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="البحث في أنواع الطلبات..."
            className="w-full pl-4 pr-10 py-2 bg-slate-50 dark:bg-gray-700 rounded-lg border border-slate-200 dark:border-gray-600 text-xs text-slate-900 dark:text-white focus:bg-white focus:outline-none"
          />
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          إجمالي الأنواع: <span className="font-bold text-gray-900 dark:text-white">{types.length}</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 shadow-subtle overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-gray-400">جاري تحميل أنواع الطلبات...</div>
        ) : filteredTypes.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-400">لا توجد أنواع طلبات تطابق البحث</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 dark:bg-gray-750 text-slate-700 dark:text-gray-300 border-b border-slate-200 dark:border-gray-700 font-bold">
                <tr>
                  <th className="py-3.5 px-4">نوع الطلب</th>
                  <th className="py-3.5 px-4">الرمز</th>
                  <th className="py-3.5 px-4">الوصف والتفاصيل</th>
                  <th className="py-3.5 px-4">الحالة</th>
                  <th className="py-3.5 px-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-gray-700">
                {filteredTypes.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/70 dark:hover:bg-gray-700/50 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Layers className="w-4 h-4 text-indigo-500" />
                      {t.name}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500 dark:text-gray-400">{t.code || '-'}</td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-gray-300 max-w-xs truncate">{t.description || '-'}</td>
                    <td className="py-3.5 px-4">
                      {t.isActive ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 className="w-3 h-3" /> نشط
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-800">
                          <XCircle className="w-3 h-3" /> معطل
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenEdit(t)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition"
                          title="تعديل نوع الطلب"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(t)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition"
                          title="حذف نوع الطلب"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in" dir="rtl">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 dark:border-gray-700">
            <div className="p-5 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                {editingType ? 'تعديل نوع الطلب' : 'إضافة نوع طلب جديد'}
              </h3>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  اسم نوع الطلب <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: إصدار تصريح، تجديد رخصة..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  الرمز التعريفي (اختياري)
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="مثال: PERMIT_ISSUE, LICENSE_RENEW..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  الوصف والتفاصيل
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="تفاصيل إضافية عن نوع المعاملة والمستندات المطلوبة..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="typeActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-brand-600 rounded border-gray-300"
                />
                <label htmlFor="typeActive" className="text-xs font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                  تفعيل نوع الطلب في استمارات الإنشاء وبوابة المراجعين
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 transition"
                >
                  إلغاء
                </button>
                <Button type="submit" size="sm" disabled={isSaving}>
                  {isSaving ? 'جاري الحفظ...' : editingType ? 'حفظ التعديلات' : 'إضافة نوع الطلب'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
