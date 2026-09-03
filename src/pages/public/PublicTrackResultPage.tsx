import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { PriorityBadge, DeadlineBadge } from '../../components/common/PriorityBadge';
import {
  Search,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Circle,
  Clock,
  Building2,
  Calendar,
  Download,
  Printer,
  FileCheck2,
  AlertTriangle
} from 'lucide-react';

const PUBLIC_STEPS = [
  'استلام الطلب',
  'قيد المراجعة',
  'تم إرسال الطلب للجهة',
  'قيد المعالجة',
  'موافقة',
  'الإجابة جاهزة',
  'تم التسليم'
];

export const PublicTrackResultPage: React.FC = () => {
  const { requestNumber } = useParams<{ requestNumber: string }>();
  const navigate = useNavigate();
  const { requests } = useData();

  // Search by request number (case-insensitive) or by ID
  const cleanQuery = (requestNumber || '').toUpperCase().replace('#', '').trim();
  const request = requests.find(
    (r) =>
      r.requestNumber.toUpperCase() === cleanQuery ||
      r.requestNumber.toUpperCase() === `REQ-${cleanQuery}` ||
      r.id === cleanQuery.toLowerCase()
  );

  if (!request) {
    return (
      <div className="text-center py-16 space-y-6">
        <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">لم يتم العثور على المعاملة</h2>
          <p className="text-sm text-slate-500 mt-1">
            لا توجد معاملة مسجلة برقم <span className="font-mono font-bold text-slate-800">{requestNumber}</span>.
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => navigate('/track')}
          icon={<Search className="w-4 h-4" />}
        >
          البحث برقم آخر
        </Button>
      </div>
    );
  }

  const currentIdx = PUBLIC_STEPS.indexOf(request.status);

  return (
    <div className="space-y-6 py-6 max-w-3xl mx-auto">
      {/* Top back action */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/track')}
          icon={<ArrowRight className="w-4 h-4" />}
        >
          بحث عن طلب آخر
        </Button>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => window.print()}
          icon={<Printer className="w-4 h-4" />}
        >
          طباعة بطاقة التتبع
        </Button>
      </div>

      {/* Main Status Banner */}
      <Card className="border-blue-200 overflow-hidden shadow-lg">
        <div className="bg-gradient-to-l from-slate-900 via-slate-800 to-blue-950 p-6 sm:p-8 text-white">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <span className="text-xl sm:text-2xl font-black font-mono text-blue-300">
              #{request.requestNumber}
            </span>
            <StatusBadge status={request.status} size="lg" />
          </div>

          <h2 className="text-lg sm:text-xl font-bold text-white mb-2">{request.title}</h2>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 pt-2 border-t border-slate-700/60">
            <span className="flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-blue-400" />
              الجهة المعنية: <strong className="text-white">{request.ministryName}</strong>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-emerald-400" />
              تاريخ التقديم: <strong className="text-white font-mono">{request.receiveDate}</strong>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-400" />
              الموعد المتوقع: <strong className="text-white font-mono">{request.expectedCompletionDate}</strong>
            </span>
          </div>
        </div>

        {/* Public Timeline */}
        <CardContent className="p-6 sm:p-8 space-y-6">
          <h3 className="font-bold text-base text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            المسار الإجرائي للمعاملة
          </h3>

          <div className="relative border-r-2 border-slate-200 pr-6 mr-3 space-y-6">
            {PUBLIC_STEPS.map((step, idx) => {
              const isPassed = currentIdx > idx;
              const isCurrent = request.status === step;
              const isUpcoming = currentIdx < idx && !isCurrent;

              let nodeColor = 'bg-slate-100 border-slate-300 text-slate-400';
              if (isPassed) {
                nodeColor = 'bg-emerald-600 border-emerald-600 text-white shadow-xs';
              } else if (isCurrent) {
                nodeColor = 'bg-blue-600 border-blue-600 text-white shadow-md ring-4 ring-blue-100';
              }

              return (
                <div key={step} className="relative">
                  <div
                    className={`absolute -right-[35px] top-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${nodeColor}`}
                  >
                    {isPassed ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : isCurrent ? (
                      <Circle className="w-2.5 h-2.5 fill-current" />
                    ) : (
                      <Circle className="w-2 h-2" />
                    )}
                  </div>

                  <div
                    className={`p-3.5 rounded-xl border transition ${
                      isCurrent
                        ? 'bg-blue-50/60 border-blue-200'
                        : isPassed
                        ? 'bg-slate-50 border-slate-200'
                        : 'bg-white border-slate-100 opacity-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-800">{step}</span>
                      {isCurrent && (
                        <span className="text-[11px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md">
                          المرحلة الحالية
                        </span>
                      )}
                      {isPassed && (
                        <span className="text-[11px] font-bold text-emerald-700">مكتمل ✓</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Decision Box (if ready) */}
          {request.finalResponse && (
            <div className="mt-8 p-5 bg-emerald-50 border-2 border-emerald-300 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileCheck2 className="w-5 h-5 text-emerald-700" />
                  <h4 className="font-bold text-emerald-950">القرار الرسمي الصادر</h4>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-200 text-emerald-900">
                  {request.finalResponse.decision}
                </span>
              </div>
              <p className="text-xs text-emerald-900 leading-relaxed font-medium">
                {request.finalResponse.summary}
              </p>
              {request.finalResponse.documentNumber && (
                <p className="text-xs text-emerald-800 font-mono">
                  رقم الوثيقة الرسمية: <strong>{request.finalResponse.documentNumber}</strong>
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
