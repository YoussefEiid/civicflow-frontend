import React from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { usePermissions } from '../../hooks/usePermissions';
import { ShieldAlert, ArrowRight, LayoutDashboard } from 'lucide-react';
import { Button } from '../ui/Button';

interface ProtectedRouteProps {
  children: React.ReactNode;
  permission?: string;
  module?: string;
  adminOnly?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  permission,
  module,
  adminOnly = false
}) => {
  const navigate = useNavigate();
  const { user, isAdmin, hasPermission, canAccessModule } = usePermissions();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Admin bypass
  if (isAdmin) {
    return <>{children}</>;
  }

  // Admin only check
  if (adminOnly && !isAdmin) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-rose-200 shadow-xl space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">صلاحية محصورة بمدير النظام</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            هذه الصفحة أو هذا القسم محصور بإدارة النظام العليا فقط، وليس لديك الصلاحية الكافية للوصول إليه.
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate('/dashboard')}
              icon={<LayoutDashboard className="w-4 h-4" />}
            >
              العودة للرئيسية
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Permission check
  if (permission && !hasPermission(permission)) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-rose-200 shadow-xl space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">غير مصرح لك بالوصول</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            عذراً، دورك الإداري الحالي ({user.role}) لا يمتلك الصلاحيات المحددة لعرض أو تعديل هذه الصفحة.
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate('/dashboard')}
              icon={<LayoutDashboard className="w-4 h-4" />}
            >
              العودة للرئيسية
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Module check
  if (module && !canAccessModule(module)) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-rose-200 shadow-xl space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">وحدة غير مفعلة لدورك</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            وحدة ({module}) غير مدرجة ضمن صلاحيات حسابك الإداري ({user.role}).
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate('/dashboard')}
              icon={<LayoutDashboard className="w-4 h-4" />}
            >
              العودة للرئيسية
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
