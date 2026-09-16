import React, { useState } from 'react';
import { RequestStatus } from '../../types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { CheckSquare, RefreshCw, AlertTriangle, Upload, CheckCircle2, X } from 'lucide-react';

interface BulkChangeStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCount: number;
  onSubmit: (
    newStatus: RequestStatus,
    note?: string,
    file?: File,
    rejectionReason?: string,
    additionalFiles?: File[]
  ) => Promise<void>;
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
  const [status, setStatus] = useState<RequestStatus>('تم إرسال الطلب للجهة');
  const [note, setNote] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Check mandatory document requirements
  const requiresSendingDoc = status === 'تم إرسال الطلب للجهة';
  const requiresApprovalDoc = status === 'موافقة';
  const requiresFinalDoc = status === 'الإجابة جاهزة';
  const requiresDeliveryDoc = status === 'تم التسليم';
  const requiresRejectionReason = status === 'مرفوض';

  const hasDocRequirement =
    requiresSendingDoc ||
    requiresApprovalDoc ||
    requiresFinalDoc ||
    requiresDeliveryDoc ||
    requiresRejectionReason;

  const handleAddFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...newFiles]);
      setErrorMsg('');
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!status) return;
    setErrorMsg('');

    if (requiresSendingDoc && files.length === 0) {
      setErrorMsg('لا يمكن تغيير الحالة إلى "تم إرسال الطلب للجهة" بدون إرفاق مستند الإرسال الرسمي.');
      return;
    }

    if (requiresApprovalDoc && files.length === 0) {
      setErrorMsg('لا يمكن تغيير الحالة إلى "موافقة" بدون إرفاق مستند الموافقة الرسمي.');
      return;
    }

    if (requiresFinalDoc && files.length === 0) {
      setErrorMsg('لا يمكن تغيير الحالة إلى "الإجابة جاهزة" بدون إرفاق مستند الإجابة والقرار النهائي.');
      return;
    }

    if (requiresDeliveryDoc && files.length === 0) {
      setErrorMsg('لا يمكن تغيير الحالة إلى "تم التسليم" بدون إرفاق مستند إثبات التسليم والتوقيع.');
      return;
    }

    if (requiresRejectionReason && !rejectionReason.trim()) {
      setErrorMsg('سبب الرفض إلزامي عند تغيير حالة المعاملات إلى مرفوض.');
      return;
    }

    setIsLoading(true);
    try {
      const primaryFile = files[0] || undefined;
      const additionalFiles = files.slice(1);
      await onSubmit(
        status,
        note.trim() || undefined,
        primaryFile,
        rejectionReason.trim() || undefined,
        additionalFiles
      );
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
        <div className="p-3.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl flex items-center justify-between text-xs text-blue-900 dark:text-blue-300">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              سيتم تطبيق تغيير الحالة على <strong>{selectedCount}</strong> معاملات دفعة واحدة.
            </span>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center gap-2 text-rose-800 dark:text-rose-300 text-xs">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <Select
          label="الحالة الجديدة لكافة الطلبات المحددة"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as RequestStatus);
            setErrorMsg('');
          }}
          required
        >
          {STATUS_OPTIONS.map((st) => (
            <option key={st} value={st}>
              {st}
            </option>
          ))}
        </Select>

        {/* Rejection Reason Input */}
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
              placeholder="اكتب سبب رفض المعاملات بوضوح..."
              className="w-full rounded-lg border border-rose-300 dark:border-rose-700 px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white dark:bg-gray-800"
            />
          </div>
        )}

        {/* Document Upload Area for Mandatory Statuses */}
        {hasDocRequirement && (
          <div className="p-3.5 bg-blue-50/70 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl space-y-2">
            <label className="block text-xs font-bold text-blue-900 dark:text-blue-300 flex items-center justify-between">
              <span>
                {requiresSendingDoc && 'مستند الإرسال / الخطاب الصادر للجهة *'}
                {requiresApprovalDoc && 'مستند الموافقة الرسمية *'}
                {requiresFinalDoc && 'مستند الإجابة والقرار النهائي *'}
                {requiresDeliveryDoc && 'مستند إثبات التسليم والتوقيع *'}
                {requiresRejectionReason && 'مستند قرار الرفض (اختياري)'}
              </span>
              {!requiresRejectionReason && (
                <span className="text-[10px] text-rose-600 font-semibold">إلزامي لاعتماد الحالة</span>
              )}
            </label>
            
            <input
              type="file"
              multiple
              accept=".pdf,.doc,.docx,image/*"
              required={!requiresRejectionReason && files.length === 0}
              onChange={handleAddFiles}
              className="text-xs text-slate-600 dark:text-gray-400 file:ml-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-100 dark:file:bg-blue-900/50 file:text-blue-800 dark:file:text-blue-300 hover:file:bg-blue-200 cursor-pointer w-full"
            />

            {files.length > 0 && (
              <div className="space-y-1.5 pt-1">
                {files.map((f, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-white dark:bg-gray-800 p-2 rounded-lg border border-slate-200 dark:border-gray-700 text-xs"
                  >
                    <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-medium truncate">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      {f.name} ({(f.size / 1024).toFixed(0)} KB)
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(idx)}
                      className="text-slate-400 hover:text-rose-600 p-1 transition"
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
          <label className="block text-xs font-bold text-slate-700 dark:text-gray-300 mb-1">
            ملاحظة إجرائية مشتركة (اختياري)
          </label>
          <textarea
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="اكتب ملاحظة أو رقم الصادر أو تفاصيل الإجراء المطبق..."
            className="w-full rounded-xl border border-slate-300 dark:border-gray-600 px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-gray-700">
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

