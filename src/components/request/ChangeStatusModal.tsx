import React, { useState } from 'react';
import { RequestItem, RequestStatus } from '../../types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { StatusBadge } from '../ui/StatusBadge';
import { MessageSquare, AlertCircle } from 'lucide-react';

interface ChangeStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: RequestItem;
  onSubmit: (newStatus: RequestStatus, note: string) => Promise<void>;
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

export const ChangeStatusModal: React.FC<ChangeStatusModalProps> = ({
  isOpen,
  onClose,
  request,
  onSubmit
}) => {
  const [status, setStatus] = useState<RequestStatus>(request.status);
  const [note, setNote] = useState('');
  const [notifyCustomer, setNotifyCustomer] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!status) return;

    setIsLoading(true);
    try {
      await onSubmit(status, note);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="تحديث حالة المعاملة" maxWidth="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            الحالة الحالية: <span className="font-bold text-slate-800 mr-1">{request.status}</span>
          </div>
          <StatusBadge status={request.status} size="sm" />
        </div>

        <Select
          label="الحالة الجديدة المطلوبة"
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
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            ملاحظات وتفاصيل الإجراء
          </label>
          <textarea
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="اكتب توضيحاً بسبب تغيير الحالة أو رقم الصادر/الوارد أو المستندات المطلوبة..."
            className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        {status === 'مطلوب مستندات' && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p>تنبيه: سيتم إرسال تنبيه للمراجع لتزويد المكتب بالمستندات المطلوبة فور حفظ الحالة.</p>
          </div>
        )}

        <div className="flex items-center gap-2 pt-2">
          <input
            type="checkbox"
            id="notify"
            checked={notifyCustomer}
            onChange={(e) => setNotifyCustomer(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
          />
          <label htmlFor="notify" className="text-xs font-semibold text-slate-700 select-none cursor-pointer">
            إرسال إشعار فوري عبر WhatsApp للمراجع ({request.customerPhone})
          </label>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            إلغاء
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            حفظ وتحديث الحالة
          </Button>
        </div>
      </form>
    </Modal>
  );
};
