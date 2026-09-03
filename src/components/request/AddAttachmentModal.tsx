import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { UploadCloud, File, X, Check } from 'lucide-react';
import { RequestAttachment } from '../../types';

interface AddAttachmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (att: Omit<RequestAttachment, 'id' | 'uploadedAt'>) => Promise<void>;
}

export const AddAttachmentModal: React.FC<AddAttachmentModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [fileName, setFileName] = useState('');
  const [fileType, setFileType] = useState('PDF');
  const [fileSize, setFileSize] = useState('1.5 MB');
  const [uploadedBy, setUploadedBy] = useState('أحمد علي');
  const [isDragging, setIsDragging] = useState(false);
  const [selectedMockFile, setSelectedMockFile] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSimulateSelect = (name: string, size: string, type: string) => {
    setSelectedMockFile(name);
    setFileName(name);
    setFileSize(size);
    setFileType(type);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileName) return;

    setIsLoading(true);
    try {
      await onSubmit({
        name: fileName.endsWith(`.${fileType.toLowerCase()}`) ? fileName : `${fileName}.${fileType.toLowerCase()}`,
        size: fileSize,
        type: fileType,
        uploadedBy
      });
      onClose();
      setSelectedMockFile(null);
      setFileName('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="إرفاق مستند أو وثيقة" maxWidth="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Upload dropzone mockup */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files?.[0]) {
              const f = e.dataTransfer.files[0];
              handleSimulateSelect(f.name, `${(f.size / (1024 * 1024)).toFixed(1)} MB`, f.type.includes('pdf') ? 'PDF' : 'Image');
            }
          }}
          className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
            isDragging ? 'border-blue-500 bg-blue-50/50' : 'border-slate-300 hover:border-blue-400 bg-slate-50/50'
          }`}
          onClick={() => {
            // Pick a preset mock document
            handleSimulateSelect('تقرير_معاينة_معتمد_2026.pdf', '2.8 MB', 'PDF');
          }}
        >
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
            <UploadCloud className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-slate-700">اسحب الملف هنا أو اضغط للاختيار</p>
          <p className="text-xs text-slate-400 mt-1">يدعم ملفات PDF، صور عالية الدقة، Excel حتى 25 ميجابايت</p>
        </div>

        {selectedMockFile && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                <File className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-emerald-900">{selectedMockFile}</p>
                <p className="text-[11px] text-emerald-600">{fileSize} • {fileType}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedMockFile(null)}
              className="text-emerald-700 hover:text-emerald-900 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <Input
          label="اسم المستند / الوصف"
          value={fileName}
          onChange={(e) => setFileName(e.target.value)}
          placeholder="مثال: إشعار سداد الرسوم، التقرير الطبي..."
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="نوع الملف"
            value={fileType}
            onChange={(e) => setFileType(e.target.value)}
          />
          <Input
            label="حجم الملف"
            value={fileSize}
            onChange={(e) => setFileSize(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            إلغاء
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading} disabled={!fileName}>
            رفع المستند
          </Button>
        </div>
      </form>
    </Modal>
  );
};
