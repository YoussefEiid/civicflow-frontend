import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { StatusConfig, RequestStatus } from '../../types';
import {
  Sliders,
  Plus,
  ArrowRight,
  Save,
  ArrowUp,
  ArrowDown,
  Trash2,
  CheckCircle2,
  Edit2
} from 'lucide-react';

export const StatusesSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { settings, handleUpdateSettings } = useData();
  const { success, error } = useToast();

  const [statuses, setStatuses] = useState<StatusConfig[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [modalName, setModalName] = useState('');
  const [modalColor, setModalColor] = useState('blue');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (settings?.statuses) {
      setStatuses([...settings.statuses].sort((a, b) => a.order - b.order));
    }
  }, [settings]);

  const handleToggleActive = (id: string) => {
    setStatuses((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isActive: !s.isActive } : s))
    );
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === statuses.length - 1)
    ) {
      return;
    }
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const newStatuses = [...statuses];
    const temp = newStatuses[index];
    newStatuses[index] = newStatuses[targetIndex];
    newStatuses[targetIndex] = temp;

    // re-assign orders
    const reordered = newStatuses.map((s, idx) => ({ ...s, order: idx + 1 }));
    setStatuses(reordered);
  };

  const openAddModal = () => {
    setEditingId(null);
    setModalName('');
    setModalColor('blue');
    setIsModalOpen(true);
  };

  const openEditModal = (st: StatusConfig) => {
    setEditingId(st.id);
    setModalName(st.name);
    setModalColor(st.color);
    setIsModalOpen(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalName.trim()) return;

    if (editingId) {
      setStatuses((prev) =>
        prev.map((s) =>
          s.id === editingId
            ? { ...s, name: modalName as RequestStatus, color: modalColor }
            : s
        )
      );
      success('تم تعديل الحالة');
    } else {
      const newStatus: StatusConfig = {
        id: `st-${Date.now()}`,
        name: modalName as RequestStatus,
        color: modalColor,
        order: statuses.length + 1,
        isActive: true
      };
      setStatuses([...statuses, newStatus]);
      success('تمت إضافة الحالة الجديدة');
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    setStatuses((prev) => prev.filter((s) => s.id !== id));
    success('تم حذف الحالة');
  };

  const handleSaveAll = async () => {
    if (!settings) return;
    setIsLoading(true);
    try {
      await handleUpdateSettings({ statuses });
      success('تم حفظ ترتيب وإعدادات الحالات بنجاح');
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
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">تهيئة حالات الطلبات</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              ترتيب المسار الإجرائي للمعاملات، وتفعيل أو تعطيل الحالات
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={openAddModal}
            icon={<Plus className="w-4 h-4" />}
          >
            + إضافة حالة
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSaveAll}
            isLoading={isLoading}
            icon={<Save className="w-4 h-4" />}
          >
            حفظ الترتيب
          </Button>
        </div>
      </div>

      {/* Statuses List */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-blue-600" />
            <CardTitle className="text-base">المسار الزمني لمراحل المعاملات</CardTitle>
          </div>
        </CardHeader>
        <div className="divide-y divide-slate-100">
          {statuses.map((st, idx) => (
            <div
              key={st.id}
              className={`p-4 flex items-center justify-between gap-4 transition ${
                !st.isActive ? 'bg-slate-50 opacity-60' : 'bg-white hover:bg-slate-50/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center font-mono">
                  {idx + 1}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={st.name} size="md" />
                    {st.isInitial && (
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold">
                        أولية
                      </span>
                    )}
                    {st.isTerminal && (
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold">
                        نهائية
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Reorder Buttons */}
                <button
                  type="button"
                  onClick={() => handleMove(idx, 'up')}
                  disabled={idx === 0}
                  className="p-1 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30"
                  title="تحريك لأعلى"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleMove(idx, 'down')}
                  disabled={idx === statuses.length - 1}
                  className="p-1 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30"
                  title="تحريك لأسفل"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>

                {/* Toggle Active */}
                <button
                  type="button"
                  onClick={() => handleToggleActive(st.id)}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold transition border ${
                    st.isActive
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                      : 'bg-slate-100 border-slate-300 text-slate-500'
                  }`}
                >
                  {st.isActive ? 'مفعلة' : 'معطلة'}
                </button>

                {/* Edit */}
                <button
                  type="button"
                  onClick={() => openEditModal(st)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition"
                  title="تعديل"
                >
                  <Edit2 className="w-4 h-4" />
                </button>

                {/* Delete */}
                {!st.isInitial && !st.isTerminal && (
                  <button
                    type="button"
                    onClick={() => handleDelete(st.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                    title="حذف"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Add / Edit Status Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'تعديل الحالة' : 'إضافة حالة جديدة'}
        maxWidth="sm"
      >
        <form onSubmit={handleSaveModal} className="space-y-4">
          <Input
            label="اسم الحالة"
            value={modalName}
            onChange={(e) => setModalName(e.target.value)}
            placeholder="مثال: قيد التدقيق القانوني"
            required
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              إلغاء
            </Button>
            <Button type="submit" variant="primary">
              حفظ
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
