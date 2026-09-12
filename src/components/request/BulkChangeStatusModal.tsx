import React, { useState } from 'react';
import { RequestStatus } from '../../types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { CheckSquare, RefreshCw, AlertTriangle } from 'lucide-react';

interface BulkChangeStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCount: number;
  onSubmit: (newStatus: RequestStatus, note?: string) => Promise<void>;
}

const STATUS_OPTIONS: RequestStatus[] = [
  'استلام الطلب',
  'قيد المراجعة',
  'تم إرسال الطلب للجهة',
  'قيد المعالجة',
  'مطلوب مستندات',
  'موافقة',
  'مرفوض',
  'الإجابة جاهزة',
  'تم إشعار المراجع',
  'تم التسليم',
  'مغلق'
];

export const BulkChangeStatusModal: React.FC<BulkChangeStatusModalProps> = ({
  isOpen,
  onClose,
  selectedCount,
  onSubmit
}) => {
  const [status, setStatus] = useState<RequestStatus>('قيد المعالجة');
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!status) return;

    setIsLoading(true);
    setErrorMsg('');
    try {
      await onSubmit(status, note.trim() || undefined);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ أثناء تحديث حالة المعاملات المحددة');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`تحديث حالة (${selectedCount}) معاملات محددة`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4" dir="rtl">
        <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-xs text-blue-900">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-blue-600" />
            <span>
              سيتم تطبيق تغيير الحالة على <strong>{selectedCount}</strong> معاملات دفعة واحدة.
            </span>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-800 text-xs">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <Select
          label="الحالة الجديدة لكافة الطلبات المحددة"
          value={status}
          onChange={(e) => setStatus(e.target.value as RequestStatus)}
          required
        >
          {STATUS_OPTIONS.map((st) => (
            <option key={st} value={st}>
              {st}
            </option>
          ))}
        </Select>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            ملاحظة إجرائية مشتركة (اختياري)
          </label>
          <textarea
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="مثال: تم إحالة المعاملات إلى القسم المختص للمتابعة والإنجاز..."
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            إلغاء
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={isLoading}
            icon={<RefreshCw className="w-4 h-4" />}
          >
            تأكيد تغيير الحالة لـ ({selectedCount}) طلب
          </Button>
        </div>
      </form>
    </Modal>
  );
};
