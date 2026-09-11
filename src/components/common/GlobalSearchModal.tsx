import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { Search, X, FileText, User, Building2, ChevronLeft } from 'lucide-react';
import { StatusBadge } from '../ui/StatusBadge';

export const GlobalSearchModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose
}) => {
  const navigate = useNavigate();
  const { requests, customers, ministries } = useData();
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!isOpen) setQuery('');
  }, [isOpen]);

  const results = useMemo(() => {
    if (!query.trim()) return { reqs: [], custs: [], mins: [] };
    const q = query.toLowerCase().trim();

    const matchedReqs = requests
      .filter(
        (r) =>
          r.requestNumber.toLowerCase().includes(q) ||
          r.customerName.toLowerCase().includes(q) ||
          r.title.toLowerCase().includes(q) ||
          r.customerPhone.includes(q)
      )
      .slice(0, 5);

    const matchedCusts = customers
      .filter((c) => c.name.toLowerCase().includes(q) || c.phone.includes(q))
      .slice(0, 4);

    const matchedMins = ministries
      .filter((m) => m.name.toLowerCase().includes(q) || m.code.toLowerCase().includes(q))
      .slice(0, 3);

    return { reqs: matchedReqs, custs: matchedCusts, mins: matchedMins };
  }, [query, requests, customers, ministries]);

  const hasResults =
    results.reqs.length > 0 || results.custs.length > 0 || results.mins.length > 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-start justify-center p-4 sm:pt-20 animate-in fade-in duration-150">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={onClose} />

      <div
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all z-10 text-right"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="relative border-b border-slate-200 px-4 py-3.5 flex items-center gap-3">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث برقم المعاملة، اسم المراجع، رقم الهاتف، أو الوزارة..."
            className="w-full text-base bg-transparent text-slate-900 placeholder-slate-400 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="text-[11px] font-mono bg-slate-100 text-slate-500 px-2 py-0.5 rounded border border-slate-200">
            ESC
          </span>
        </div>

        {/* Results Body */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
          {!query.trim() && (
            <div className="text-center py-8 text-slate-400 text-xs">
              ابدأ بكتابة كلمة البحث أو رقم الطلب (مثال: REQ-1025 أو محمد أحمد)
            </div>
          )}

          {query.trim() && !hasResults && (
            <div className="text-center py-8 text-slate-400 text-sm">
              لم يتم العثور على نتائج تطابق &quot;{query}&quot;
            </div>
          )}

          {/* Requests results */}
          {results.reqs.length > 0 && (
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                الطلبات والمعاملات ({results.reqs.length})
              </p>
              <div className="space-y-1.5">
                {results.reqs.map((req) => (
                  <div
                    key={req.id}
                    onClick={() => {
                      navigate(`/requests/${req.id}`);
                      onClose();
                    }}
                    className="p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 cursor-pointer flex items-center justify-between transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900">
                            {req.requestNumber}
                          </span>
                          <span className="text-xs text-slate-500">• {req.customerName}</span>
                        </div>
                        <p className="text-xs text-slate-600 line-clamp-1">{req.title}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={req.status} size="sm" />
                      <ChevronLeft className="w-4 h-4 text-slate-300" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Customers results */}
          {results.custs.length > 0 && (
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                المراجعون ({results.custs.length})
              </p>
              <div className="space-y-1.5">
                {results.custs.map((cust) => (
                  <div
                    key={cust.id}
                    onClick={() => {
                      navigate(`/customers/${cust.id}`);
                      onClose();
                    }}
                    className="p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 cursor-pointer flex items-center justify-between transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-slate-900">{cust.name}</p>
                        <p className="text-xs text-slate-500 font-mono">{cust.phone}</p>
                      </div>
                    </div>
                    <ChevronLeft className="w-4 h-4 text-slate-300" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ministries results */}
          {results.mins.length > 0 && (
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                الوزارات والجهات ({results.mins.length})
              </p>
              <div className="space-y-1.5">
                {results.mins.map((min) => (
                  <div
                    key={min.id}
                    onClick={() => {
                      navigate(`/ministries/${min.id}`);
                      onClose();
                    }}
                    className="p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 cursor-pointer flex items-center justify-between transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-slate-900">{min.name}</p>
                        <p className="text-xs text-slate-500">مدة الإنجاز: {min.slaDays} أيام</p>
                      </div>
                    </div>
                    <ChevronLeft className="w-4 h-4 text-slate-300" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
