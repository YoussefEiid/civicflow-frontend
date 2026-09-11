import React, { useState } from 'react';
import { RequestItem, RequestStatus } from '../../types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { StatusBadge } from '../ui/StatusBadge';
import { MessageSquare, AlertCircle, Upload, CheckCircle2, FileText, AlertTriangle, X, Plus } from 'lucide-react';

interface ChangeStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: RequestItem;
  onSubmit: (newStatus: RequestStatus, note?: string, file?: File, rejectionReason?: string, additionalFiles?: File[]) => Promise<void>;
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
  const [rejectionReason, setRejectionReason] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [notifyCustomer, setNotifyCustomer] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState('');

  // Check requirement based on selected status
  const requiresSendingDoc = status === 'تم إرسال الطلب للجهة';
  const requiresApprovalDoc = status === 'موافقة';
  const requiresRejectionReason = status === 'مرفوض';
  const requiresFinalDoc = status === 'الإجابة جاهزة';
  const requiresDeliveryDoc = status === 'تم التسليم';

  const handleAddFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (!status) return;

    if (requiresSendingDoc && files.length === 0) {
      setValidationError('يلزم إرفاق مستند الإرسال / الخطاب الصادر للانتقال إلى حالة "تم إرسال الطلب للجهة"');
      return;
    }

    if (requiresApprovalDoc && files.length === 0) {
      setValidationError('يلزم إرفاق مستند الموافقة الرسمية للانتقال إلى حالة "موافقة"');
      return;
    }

    if (requiresDeliveryDoc && files.length === 0) {
      setValidationError('يلزم إرفاق مستند إثبات التسليم والتوقيع للانتقال إلى حالة "تم التسليم"');
      return;
    }

    if (requiresRejectionReason && !rejectionReason.trim()) {
      setValidationError('يلزم تحديد سبب الرفض للانتقال إلى حالة "مرفوض"');
      return;
    }

    setIsLoading(true);
    try {
      const primaryFile = files[0] || undefined;
      const additionalFiles = files.slice(1);
      await onSubmit(status, note.trim() || undefined, primaryFile, rejectionReason.trim() || undefined, additionalFiles);
      onClose();
    } catch (err: any) {
      setValidationError(err.message || 'حدث خطأ أثناء تحديث حالة المعاملة');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="تحديث حالة المعاملة" maxWidth="md">
      <form onSubmit={handleSubmit} className="space-y-4" dir="rtl">
        <div className="bg-slate-50 dark:bg-gray-750 p-3.5 rounded-xl border border-slate-200 dark:border-gray-700 flex items-center justify-between">
          <div className="text-xs text-slate-500 dark:text-gray-400">
            الحالة الحالية: <span className="font-bold text-slate-800 dark:text-gray-200 mr-1">{request.status}</span>
          </div>
          <StatusBadge status={request.status} size="sm" />
        </div>

        {validationError && (
          <div className="p-3 bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center gap-2 text-rose-800 dark:text-rose-300 text-xs">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        <Select
          label="الحالة الجديدة المطلوبة"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as RequestStatus);
            setValidationError('');
          }}
          required
        >
          {STATUS_OPTIONS.map((st) => (
            <option key={st} value={st}>
              {st}
            </option>
          ))}
        </Select>

        {/* Rejection Reason (Mandatory when rejected) */}
        {requiresRejectionReason && (
          <div className="p-3.5 bg-rose-50/70 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl space-y-2">
            <label className="block text-xs font-bold text-rose-900 dark:text-rose-300">
              سبب الرفض <span className="text-rose-600">*</span>
            </label>
            <textarea
              rows={2}
              required
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="اكتب سبب رفض المعاملة بوضوح..."
              className="w-full rounded-lg border border-rose-300 dark:border-rose-700 px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white dark:bg-gray-800"
            />
          </div>
        )}

        {/* Document Upload for mandatory transitions */}
        {(requiresSendingDoc || requiresApprovalDoc || requiresDeliveryDoc || requiresFinalDoc || requiresRejectionReason) && (
          <div className="p-3.5 bg-blue-50/70 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl space-y-2">
            <label className="block text-xs font-bold text-blue-900 dark:text-blue-300 flex items-center justify-between">
              <span>
                {requiresSendingDoc && 'مستند الإرسال / الخطاب الصادر للجهة *'}
                {requiresApprovalDoc && 'مستند الموافقة الرسمية *'}
                {requiresDeliveryDoc && 'مستند إثبات التسليم والتوقيع *'}
                {requiresFinalDoc && 'مستند الإجابة والقرار النهائي (اختياري)'}
                {requiresRejectionReason && 'مستند قرار الرفض (اختياري)'}
              </span>
              {(requiresSendingDoc || requiresApprovalDoc || requiresDeliveryDoc) && (
                <span className="text-[10px] text-rose-600 font-normal">إلزامي لاعتماد الحالة</span>
              )}
            </label>
            <input
              type="file"
              multiple
              accept=".pdf,.doc,.docx,image/*"
              required={(requiresSendingDoc || requiresApprovalDoc || requiresDeliveryDoc) && files.length === 0}
              onChange={handleAddFiles}
              className="text-xs text-slate-600 dark:text-gray-400 file:ml-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-100 file:text-blue-800 hover:file:bg-blue-200"
            />

            {files.length > 0 && (
              <div className="space-y-1.5 pt-1">
                {files.map((f, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-white dark:bg-gray-800 p-2 rounded-lg border border-slate-200 dark:border-gray-700 text-xs">
                    <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-medium truncate">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      {f.name} ({(f.size / 1024).toFixed(0)} KB)
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(idx)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1.5">
            ملاحظات وتفاصيل الإجراء
          </label>
          <textarea
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="اكتب توضيحاً بسبب تغيير الحالة أو رقم الصادر/الوارد أو المستندات المطلوبة..."
            className="w-full rounded-lg border border-slate-300 dark:border-gray-600 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 bg-white dark:bg-gray-700"
          />
        </div>

        <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-gray-700">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            إلغاء
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            تأكيد تحديث الحالة
          </Button>
        </div>
      </form>
    </Modal>
  );
};
