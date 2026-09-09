import React, { useState, useRef } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { FinalResponse, RequestItem } from '../../types';
import { CheckCircle2, ShieldCheck, FileCheck, Upload } from 'lucide-react';

interface AddFinalResponseModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: RequestItem;
  onSubmit: (response: Omit<FinalResponse, 'id' | 'issuedAt'> & { file?: File }) => Promise<void>;
}

export const AddFinalResponseModal: React.FC<AddFinalResponseModalProps> = ({
  isOpen,
  onClose,
  request,
  onSubmit
}) => {
  const [decision, setDecision] = useState<FinalResponse['decision']>('موافقة');
  const [summary, setSummary] = useState('');
  const [documentNumber, setDocumentNumber] = useState(`DOC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
  const [attachmentName, setAttachmentName] = useState('الوثيقة_الرسمية_المعتمدة.pdf');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [issuedBy, setIssuedBy] = useState('أحمد علي');
  const [deliveredToCustomer, setDeliveredToCustomer] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const f = e.target.files[0];
      setSelectedFile(f);
      setAttachmentName(f.name);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!summary) return;

    setIsLoading(true);
    try {
      await onSubmit({
        decision,
        summary,
        documentNumber,
        issuedBy,
        attachmentName: attachmentName ? attachmentName : undefined,
        deliveredToCustomer,
        file: selectedFile || undefined
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="تسجيل الإجابة والقرار النهائي للمعاملة" maxWidth="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
        />

        <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-blue-600 shrink-0" />
          <div className="text-xs text-blue-950">
            <p className="font-bold">المعاملة: #{request.requestNumber} - {request.title}</p>
            <p className="text-blue-800">إضافة الإجابة ستنقل المعاملة تلقائياً إلى حالة (الإجابة جاهزة) وتنشئ سجل قرار رسمي.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="القرار الصادر"
            value={decision}
            onChange={(e) => setDecision(e.target.value as FinalResponse['decision'])}
            required
          >
            <option value="موافقة">موافقة واعتماد</option>
            <option value="رفض">رفض مسبب</option>
            <option value="إنجاز المعاملة">إنجاز المعاملة وإصدار الوثيقة</option>
            <option value="إحالة لجهة أخرى">إحالة لجهة حكومية أخرى</option>
          </Select>

          <Input
            label="رقم الوثيقة / الصادر الرسمي"
            value={documentNumber}
            onChange={(e) => setDocumentNumber(e.target.value)}
            placeholder="مثال: MOJ-2026-9921"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            ملخص القرار والإجابة الصادرة <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={4}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="اكتب نص القرار المعتمد وتفاصيل التوجيه أو الوثيقة المسلمة..."
            required
            className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-semibold text-slate-700">المرفق الصادر</label>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-bold"
              >
                <Upload className="w-3 h-3" />
                اختيار ملف من الجهاز
              </button>
            </div>
            <Input
              value={attachmentName}
              onChange={(e) => setAttachmentName(e.target.value)}
              placeholder="الوثيقة_المعتمدة.pdf"
            />
          </div>

          <Input
            label="الموظف المعتمد"
            value={issuedBy}
            onChange={(e) => setIssuedBy(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 pt-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
          <input
            type="checkbox"
            id="delivered"
            checked={deliveredToCustomer}
            onChange={(e) => setDeliveredToCustomer(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
          />
          <label htmlFor="delivered" className="text-xs font-semibold text-slate-700 select-none cursor-pointer">
            تم تسليم الوثيقة أو الإجابة للمراجع مباشرة في المقر الآن
          </label>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            إلغاء
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading} disabled={!summary}>
            اعتماد وحفظ الإجابة النهائية
          </Button>
        </div>
      </form>
    </Modal>
  );
};