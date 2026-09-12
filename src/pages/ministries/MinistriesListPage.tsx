import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { usePermissions } from '../../hooks/usePermissions';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { EmptyState } from '../../components/ui/EmptyState';
import { Building2, Plus, Search, Eye, Edit, Clock, Flame, CheckCircle2 } from 'lucide-react';

export const MinistriesListPage: React.FC = () => {
  const navigate = useNavigate();
  const { ministries, requests } = useData();
  const { canCreateMinistry, canUpdateMinistry } = usePermissions();
  const [search, setSearch] = useState('');

  const filteredMinistries = useMemo(() => {
    if (!search.trim()) return ministries;
    const q = search.toLowerCase().trim();
    return ministries.filter(
      (m) => m.name.toLowerCase().includes(q) || m.code.toLowerCase().includes(q)
    );
  }, [ministries, search]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">الوزارات والجهات الحكومية</h1>
          <p className="text-xs text-slate-500 mt-1">
            إدارة الجهات الشريكة، محددات مدد الإنجاز (SLA)، ومتابعة كفاءة إنجاز المعاملات
          </p>
        </div>

        {canCreateMinistry && (
          <Button
            variant="primary"
            size="md"
            onClick={() => navigate('/ministries/new')}
            icon={<Plus className="w-4 h-4" />}
          >
            + إضافة جهة حكومية
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-subtle flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث باسم الوزارة أو الكود المختصر..."
            className="w-full pl-4 pr-10 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600 transition"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle overflow-hidden">
        {filteredMinistries.length === 0 ? (
          <EmptyState
            title="لم يتم العثور على جهات حكومية"
            description="جرب البحث بكلمات أخرى أو قم بإضافة جهة جديدة."
            actionText="+ إضافة جهة جديدة"
            onAction={() => navigate('/ministries/new')}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4 font-bold">اسم الجهة / الوزارة</th>
                  <th className="py-3.5 px-4 font-bold text-center">مدة الإنجاز (SLA)</th>
                  <th className="py-3.5 px-4 font-bold text-center">الطلبات الحالية</th>
                  <th className="py-3.5 px-4 font-bold text-center">المكتملة</th>
                  <th className="py-3.5 px-4 font-bold text-center">المتأخرة</th>
                  <th className="py-3.5 px-4 font-bold text-center">الحالة</th>
                  <th className="py-3.5 px-4 font-bold text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMinistries.map((min) => {
                  const reqsInMin = requests.filter((r) => r.ministryId === min.id);
                  const activeCount = reqsInMin.filter(
                    (r) => r.status !== 'تم التسليم' && r.status !== 'مغلق'
                  ).length;
                  const completedCount = reqsInMin.filter(
                    (r) => r.status === 'تم التسليم' || r.status === 'مغلق' || r.status === 'الإجابة جاهزة'
                  ).length;
                  const overdueCount = reqsInMin.filter((r) => r.deadlineStatus === 'متأخر').length;

                  return (
                    <tr
                      key={min.id}
                      onClick={(e) => {
                        if ((e.target as HTMLElement).closest('button')) return;
                        navigate(`/ministries/${min.id}`);
                      }}
                      className="hover:bg-blue-50/30 transition group cursor-pointer"
                    >
                      <td className="py-3.5 px-4 font-bold text-slate-900 group-hover:text-blue-600">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-sm text-slate-900">{min.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{min.code}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-bold font-mono px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 border border-slate-200">
                          {min.slaDays} أيام
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-bold font-mono px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                          {activeCount}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-bold font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {completedCount}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`font-bold font-mono px-2 py-0.5 rounded-full ${
                            overdueCount > 0
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {overdueCount}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <StatusBadge status={min.status} size="sm" />
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => navigate(`/ministries/${min.id}`)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition"
                            title="عرض التفاصيل"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {canUpdateMinistry && (
                            <button
                              onClick={() => navigate(`/ministries/${min.id}/edit`)}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition"
                              title="تعديل"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
