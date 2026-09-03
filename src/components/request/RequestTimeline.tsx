import React from 'react';
import { RequestTimelineEvent, RequestStatus } from '../../types';
import { CheckCircle2, Circle, Clock, User, FileText } from 'lucide-react';
import { StatusBadge } from '../ui/StatusBadge';

const ALL_STATUS_STEPS: RequestStatus[] = [
  'استلام الطلب',
  'قيد المراجعة',
  'تم إرسال الطلب للجهة',
  'قيد المعالجة',
  'مطلوب مستندات',
  'موافقة',
  'الإجابة جاهزة',
  'تم إشعار المراجع',
  'تم التسليم',
  'مغلق'
];

interface RequestTimelineProps {
  currentStatus: RequestStatus;
  events: RequestTimelineEvent[];
}

export const RequestTimeline: React.FC<RequestTimelineProps> = ({ currentStatus, events }) => {
  // Map events by status
  const eventMap = new Map<string, RequestTimelineEvent>();
  events.forEach((ev) => {
    eventMap.set(ev.status, ev);
  });

  const currentIndex = ALL_STATUS_STEPS.indexOf(currentStatus);

  return (
    <div className="space-y-6">
      {/* Visual step progression */}
      <div className="relative border-r-2 border-slate-200 pr-6 mr-3 space-y-6">
        {ALL_STATUS_STEPS.map((step, idx) => {
          const isPassed = currentIndex > idx;
          const isCurrent = currentStatus === step;
          const isUpcoming = currentIndex < idx && !isCurrent;
          const matchingEvent = eventMap.get(step);

          let nodeColor = 'bg-slate-100 border-slate-300 text-slate-400';
          if (isPassed) {
            nodeColor = 'bg-emerald-600 border-emerald-600 text-white shadow-sm';
          } else if (isCurrent) {
            nodeColor = 'bg-blue-600 border-blue-600 text-white shadow-md ring-4 ring-blue-100 animate-pulse';
          }

          return (
            <div key={step} className="relative group">
              {/* Timeline marker node */}
              <div
                className={`absolute -right-[35px] top-1.5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${nodeColor}`}
              >
                {isPassed ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : isCurrent ? (
                  <Circle className="w-2.5 h-2.5 fill-current" />
                ) : (
                  <Circle className="w-2 h-2" />
                )}
              </div>

              {/* Step info */}
              <div
                className={`p-4 rounded-xl border transition-all ${
                  isCurrent
                    ? 'bg-blue-50/50 border-blue-200 shadow-xs'
                    : matchingEvent
                    ? 'bg-white border-slate-200'
                    : 'bg-slate-50/60 border-slate-200/60 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={step} size="sm" />
                    {isCurrent && (
                      <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md">
                        الحالة الحالية
                      </span>
                    )}
                  </div>

                  {matchingEvent && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{matchingEvent.date}</span>
                      <span className="text-slate-300">|</span>
                      <span>{matchingEvent.time}</span>
                    </div>
                  )}
                </div>

                {matchingEvent ? (
                  <div className="mt-2 text-sm">
                    <p className="text-slate-700 leading-relaxed font-medium">{matchingEvent.note}</p>
                    <div className="flex items-center gap-1 mt-2 text-xs text-slate-400">
                      <User className="w-3 h-3" />
                      <span>المسؤول: </span>
                      <span className="font-semibold text-slate-600">{matchingEvent.employeeName}</span>
                    </div>
                  </div>
                ) : isUpcoming ? (
                  <p className="text-xs text-slate-400 mt-1">بانتظار وصول المعاملة لهذه المرحلة</p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
