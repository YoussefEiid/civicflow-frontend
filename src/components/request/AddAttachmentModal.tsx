import React, { useState, useRef } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { UploadCloud, FileText, X, CheckCircle2, Plus, Trash2, Eye, Lock, File } from 'lucide-react';
import { RequestAttachment, DocumentType } from '../../types';

interface FileUploadItem {
  id: string;
  name: string;
  size: string;
  type: string;
  file?: File;
  documentType: DocumentType | string;
  isPublic: boolean;
}

interface AddAttachmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (attachments: Array<Omit<RequestAttachment, 'id' | 'uploadedAt'> & { file?: File }>) => Promise<void>;
}

export const AddAttachmentModal: React.FC<AddAttachmentModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [items, setItems] = useState<FileUploadItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = (fileList: FileList | File[]) => {
    const newItems: FileUploadItem[] = Array.from(fileList).map((f) => {
      const sizeStr =
        f.size > 1024 * 1024
          ? `${(f.size / (1024 * 1024)).toFixed(1)} MB`
          : `${(f.size / 1024).toFixed(1)} KB`;

      let typeStr = 'PDF';
      if (f.type.includes('image') || /\.(jpg|jpeg|png|webp)$/i.test(f.name)) typeStr = 'Image';
      else if (f.type.includes('sheet') || /\.(xls|xlsx)$/i.test(f.name)) typeStr = 'Excel';
      else if (f.type.includes('word') || /\.(doc|docx)$/i.test(f.name)) typeStr = 'Word';

      return {
        id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        name: f.name,
        size: sizeStr,
        type: typeStr,
        file: f,
        documentType: 'GENERAL',
        isPublic: false
      };
    });

    setItems((prev) => [...prev, ...newItems]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const handleRemove = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleUpdateName = (id: string, newName: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, name: newName } : item))
    );
  };

  const handleUpdateDocType = (id: string, docType: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, documentType: docType } : item))
    );
  };

  const handleTogglePublic = (id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isPublic: !item.isPublic } : item))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    setIsLoading(true);
    try {
      const payload = items.map((item) => ({
        name: item.name,
        size: item.size,
        type: item.type,
        documentType: item.documentType,
        isPublic: item.isPublic,
        uploadedBy: 'الموظف المسؤول',
        file: item.file
      }));

      await onSubmit(payload);
      setItems([]);
      onClose();
    } catch (err) {
      console.error('Error submitting attachments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="إرفاق مستندات ووثائق متعددة" maxWidth="lg">
      <form onSubmit={handleSubmit} className="space-y-5" dir="rtl">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          multiple
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
        />

        {/* Multi-file Upload Zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
              processFiles(e.dataTransfer.files);
            }
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer select-none ${
            isDragging
              ? 'border-blue-500 bg-blue-50/60 ring-4 ring-blue-100'
              : 'border-slate-300 hover:border-blue-400 bg-slate-50/70 hover:bg-blue-50/20'
          }`}
        >
          <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-3 shadow-xs">
            <UploadCloud className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-slate-800">
            اضغط لاختيار ملفات متعددة أو اسحبها وأفلتها هنا
          </p>
          <p className="text-xs text-slate-400 mt-1">
            يدعم رفع أكثر من ملف دفعة واحدة (PDF، صور، Word، Excel حتى 25 ميجابايت لكل ملف)
          </p>
        </div>

        {/* Selected Files List */}
        {items.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">
                الملفات المحددة للرفع ({items.length}):
              </span>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> إضافة ملفات أخرى
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2.5 pr-1 divide-y divide-slate-100">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => handleUpdateName(item.id, e.target.value)}
                        className="w-full text-xs font-bold text-slate-800 bg-transparent border-b border-transparent focus:border-blue-500 focus:outline-none truncate"
                        placeholder="اسم المستند..."
                      />
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                        <span>{item.size}</span>
                        <span>•</span>
                        <span className="font-mono">{item.type}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <select
                      value={item.documentType}
                      onChange={(e) => handleUpdateDocType(item.id, e.target.value)}
                      className="text-[11px] font-semibold px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
                    >
                      <option value="GENERAL">مستند عام</option>
                      <option value="IDENTITY">وثيقة هوية</option>
                      <option value="REQUEST_DOCUMENT">خطاب المعاملة</option>
                      <option value="SENDING_DOCUMENT">خطاب الإرسال للجهة</option>
                      <option value="APPROVAL_DOCUMENT">موافقة رسمية</option>
                      <option value="FINAL_RESPONSE">الإجابة والقرار النهائي</option>
                      <option value="DELIVERY_PROOF">إثبات التسليم</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => handleTogglePublic(item.id)}
                      className={`p-1.5 rounded-lg border text-xs transition ${
                        item.isPublic
                          ? 'bg-blue-50 border-blue-200 text-blue-700'
                          : 'bg-slate-50 border-slate-200 text-slate-400'
                      }`}
                      title={item.isPublic ? 'مرئي في صفحة المراجع العامة' : 'داخلي وسري'}
                    >
                      {item.isPublic ? <Eye className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRemove(item.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                      title="حذف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            إلغاء
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            disabled={items.length === 0}
            icon={<CheckCircle2 className="w-4 h-4" />}
          >
            {items.length > 1 ? `رفع كافة المستندات (${items.length})` : 'رفع المستند'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
