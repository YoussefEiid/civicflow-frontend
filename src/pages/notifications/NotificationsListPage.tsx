import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import {
  Bell,
  CheckCheck,
  Flame,
  FileCheck2,
  AlertCircle,
  MessageSquare,
  Clock,
  ArrowLeft,
  Filter
} from 'lucide-react';

export const NotificationsListPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    notifications,
    unreadNotificationsCount,
    handleMarkNotificationRead,
    handleMarkAllNotificationsRead
  } = useData();
  const { success } = useToast();

  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'overdue' | 'final_response'>('all');

  const filtered = notifications.filter((n) => {
    if (activeTab === 'unread') return !n.read;
    if (activeTab === 'overdue') return n.type === 'overdue';
    if (activeTab === 'final_response') return n.type === 'final_response';
    return true;
  });

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'overdue':
        return <Flame className="w-5 h-5 text-rose-600" />;
      case 'final_response':
        return <FileCheck2 className="w-5 h-5 text-emerald-600" />;
      case 'docs_required':
        return <AlertCircle className="w-5 h-5 text-amber-600" />;
      case 'whatsapp':
        return <MessageSquare className="w-5 h-5 text-teal-600" />;
      default:
        return <Bell className="w-5 h-5 text-blue-600" />;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">مركز الإشعارات والتنبيهات</h1>
            {unreadNotificationsCount > 0 && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                {unreadNotificationsCount} غير مقروء
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            تنبيهات تجاوز مدد الإنجاز (SLA)، تحديثات الحالات، وجاهزية الوثائق
          </p>
        </div>

        {unreadNotificationsCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              await handleMarkAllNotificationsRead();
              success('تم تحديد الكل كمقروء');
            }}
            icon={<CheckCheck className="w-4 h-4" />}
          >
            تحديد الكل كمقروء
          </Button>
        )}
      </div>

      {/* Tabs / Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3.5 py-2 rounded-xl font-bold transition whitespace-nowrap ${
            activeTab === 'all'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          كافة الإشعارات ({notifications.length})
        </button>

        <button
          onClick={() => setActiveTab('unread')}
          className={`px-3.5 py-2 rounded-xl font-bold transition whitespace-nowrap ${
            activeTab === 'unread'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          غير مقروء ({unreadNotificationsCount})
        </button>

        <button
          onClick={() => setActiveTab('overdue')}
          className={`px-3.5 py-2 rounded-xl font-bold transition whitespace-nowrap flex items-center gap-1 ${
            activeTab === 'overdue'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Flame className="w-3.5 h-3.5" />
          تنبيهات التأخر (SLA)
        </button>

        <button
          onClick={() => setActiveTab('final_response')}
          className={`px-3.5 py-2 rounded-xl font-bold transition whitespace-nowrap ${
            activeTab === 'final_response'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          الإجابات الجاهزة
        </button>
      </div>

      {/* Notifications List */}
      <Card>
        {filtered.length === 0 ? (
          <EmptyState
            title="لا توجد إشعارات في هذا القسم"
            description="جميع التنبيهات تمت مراجعتها ومتابعتها."
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((notif) => (
              <div
                key={notif.id}
                onClick={async () => {
                  if (!notif.read) {
                    await handleMarkNotificationRead(notif.id);
                  }
                  navigate(`/notifications/${notif.id}`);
                }}
                className={`p-4.5 sm:p-5 hover:bg-slate-50/80 transition cursor-pointer flex items-start justify-between gap-4 ${
                  !notif.read ? 'bg-blue-50/30' : ''
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 shrink-0 mt-0.5">
                    {getNotifIcon(notif.type)}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-slate-900">{notif.title}</h4>
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">{notif.message}</p>
                    <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{notif.createdAt}</span>
                      <span>•</span>
                      <span>{notif.timeAgo}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
                    عرض التفاصيل
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
