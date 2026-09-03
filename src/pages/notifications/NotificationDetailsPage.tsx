import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import {
  Bell,
  Clock,
  FileText,
  ArrowRight,
  ExternalLink,
  Flame,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const NotificationDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { notifications, requests } = useData();

  const notif = notifications.find((n) => n.id === id);

  if (!notif) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500 mb-4">الإشعار غير موجود</p>
        <Button variant="primary" onClick={() => navigate('/notifications')}>
          العودة للإشعارات
        </Button>
      </div>
    );
  }

  const relatedRequest = notif.requestId
    ? requests.find((r) => r.id === notif.requestId || r.requestNumber === notif.requestNumber)
    : null;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/notifications')}
          icon={<ArrowRight className="w-4 h-4" />}
        >
          العودة للإشعارات
        </Button>
      </div>

      <Card>
        <CardHeader className="bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 text-blue-700 rounded-xl">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-lg">{notif.title}</CardTitle>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5 font-mono">
                <Clock className="w-3.5 h-3.5" />
                <span>{notif.createdAt}</span>
                <span>({notif.timeAgo})</span>
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 py-6">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 text-sm text-slate-800 leading-relaxed font-medium">
            {notif.message}
          </div>

          {relatedRequest && (
            <div className="p-4 bg-blue-50/50 border border-blue-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-900 uppercase">المعاملة المرتبطة:</span>
                <span className="text-xs font-mono font-bold text-blue-700">
                  #{relatedRequest.requestNumber}
                </span>
              </div>
              <p className="text-sm font-bold text-slate-900">{relatedRequest.title}</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-slate-600">
                <div>
                  <span className="text-slate-400">المراجع:</span>
                  <p className="font-bold text-slate-800">{relatedRequest.customerName}</p>
                </div>
                <div>
                  <span className="text-slate-400">الجهة:</span>
                  <p className="font-bold text-slate-800">{relatedRequest.ministryName}</p>
                </div>
                <div>
                  <span className="text-slate-400">الحالة:</span>
                  <p className="font-bold text-blue-700">{relatedRequest.status}</p>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate(`/requests/${relatedRequest.id}`)}
                  icon={<ExternalLink className="w-4 h-4" />}
                >
                  فتح تفاصيل المعاملة كاملة
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
