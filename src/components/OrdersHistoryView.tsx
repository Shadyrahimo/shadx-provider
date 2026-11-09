import React, { useState, useMemo } from 'react';
import {
  History,
  RefreshCw,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  Package,
  DollarSign,
  ExternalLink,
  Calendar,
  Layers,
  Download,
  Filter,
} from 'lucide-react';
import { ProviderOrderRecord } from '../types';

interface OrdersHistoryViewProps {
  orders: ProviderOrderRecord[];
  isFetching: boolean;
  onRefreshOrders: () => void;
  providerBaseUrl: string;
}

export const OrdersHistoryView: React.FC<OrdersHistoryViewProps> = ({
  orders,
  isFetching,
  onRefreshOrders,
  providerBaseUrl,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'processing' | 'failed'>('all');

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (statusFilter !== 'all' && order.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = (order.productName || '').toLowerCase().includes(q);
        const matchId = String(order.id || '').toLowerCase().includes(q);
        const matchRecipient = (order.recipientInfo || '').toLowerCase().includes(q);
        if (!matchName && !matchId && !matchRecipient) return false;
      }
      return true;
    });
  }, [orders, statusFilter, searchQuery]);

  const stats = useMemo(() => {
    let completed = 0;
    let processing = 0;
    let totalSpent = 0;
    orders.forEach((o) => {
      if (o.status === 'completed') completed++;
      else if (o.status === 'processing' || o.status === 'pending') processing++;
      totalSpent += o.totalCostUsd || 0;
    });
    return {
      total: orders.length,
      completed,
      processing,
      totalSpent: totalSpent.toFixed(2),
    };
  }, [orders]);

  const handleExportCsv = () => {
    const headers = ['Order ID', 'Product Name', 'Quantity', 'Cost (USD)', 'Status', 'Date', 'Recipient'];
    const rows = filteredOrders.map((o) => [
      `"${o.id}"`,
      `"${o.productName.replace(/"/g, '""')}"`,
      o.quantity,
      o.totalCostUsd,
      o.status,
      `"${o.createdAt}"`,
      `"${(o.recipientInfo || '').replace(/"/g, '""')}"`,
    ].join(','));

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `orders-history-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12" dir="rtl">
      {/* Header Banner */}
      <div className="bg-gradient-to-l from-indigo-950/60 via-slate-900 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <History className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white mb-1">سجل الطلبات السابقة (Order History)</h2>
              <p className="text-xs text-slate-400">
                جلب وعرض وتتبع عمليات الشراء والطلبات المنفذة مباشرة من حسابك لدى المزود عبر الـ API.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={orders.length === 0}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تصدير CSV</span>
            </button>

            <button
              type="button"
              onClick={onRefreshOrders}
              disabled={isFetching}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
              <span>جلب السجل من المزود</span>
            </button>
          </div>
        </div>

        {/* Quick KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 text-xs">
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
            <span className="text-slate-400 block mb-1">إجمالي الطلبات</span>
            <span className="text-base font-extrabold text-white font-mono-numbers">{stats.total}</span>
          </div>
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
            <span className="text-slate-400 block mb-1">طلبات مكتملة</span>
            <span className="text-base font-extrabold text-emerald-400 font-mono-numbers">{stats.completed}</span>
          </div>
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
            <span className="text-slate-400 block mb-1">قيد المعالجة</span>
            <span className="text-base font-extrabold text-amber-400 font-mono-numbers">{stats.processing}</span>
          </div>
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
            <span className="text-slate-400 block mb-1">إجمالي المشتريات ($)</span>
            <span className="text-base font-extrabold text-indigo-300 font-mono-numbers">${stats.totalSpent}</span>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-4 text-xs">
        <div className="relative grow max-w-sm">
          <Search className="absolute right-3 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث برقم الطلب، اسم المنتج، أو بيانات المستلم..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-9 pl-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1 rounded-lg font-bold text-xs transition-colors ${
              statusFilter === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            الكل ({orders.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('completed')}
            className={`px-3 py-1 rounded-lg font-bold text-xs transition-colors ${
              statusFilter === 'completed' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            مكتملة
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('processing')}
            className={`px-3 py-1 rounded-lg font-bold text-xs transition-colors ${
              statusFilter === 'processing' ? 'bg-amber-600 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            قيد المعالجة
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-4 text-indigo-400">
              <History className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">لا توجد طلبات سابقة مطابقة</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
              لم يتم العثور على عمليات شراء سابقة، أو لم يتم الاتصال بحساب المزود لجلب السجل. انقر على زر "جلب السجل من المزود" أعلاه.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold">
                  <th className="py-3 px-4">رقم الطلب (ID)</th>
                  <th className="py-3 px-4">المنتج</th>
                  <th className="py-3 px-4 text-center">الكمية</th>
                  <th className="py-3 px-4 text-left font-mono-numbers">التكلفة الإجمالية</th>
                  <th className="py-3 px-4 text-center">حالة الطلب</th>
                  <th className="py-3 px-4">بيانات المستلم / المعرف</th>
                  <th className="py-3 px-4">تاريخ التنفيذ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                {filteredOrders.map((order, idx) => (
                  <tr key={order.id || idx} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-300">
                      #{order.id}
                    </td>
                    <td className="py-3 px-4 font-semibold text-white">
                      {order.productName}
                    </td>
                    <td className="py-3 px-4 text-center font-mono-numbers">
                      {order.quantity || 1}
                    </td>
                    <td className="py-3 px-4 text-left font-mono-numbers font-bold text-emerald-400">
                      ${Number(order.totalCostUsd || 0).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {order.status === 'completed' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-500/40">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>مكتمل</span>
                        </span>
                      ) : order.status === 'processing' || order.status === 'pending' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950/60 text-amber-300 border border-amber-500/40">
                          <Clock className="w-3 h-3 text-amber-400 animate-spin" />
                          <span>قيد المعالجة</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950/60 text-rose-300 border border-rose-500/40">
                          <XCircle className="w-3 h-3 text-rose-400" />
                          <span>فشل الطلب</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                      {order.recipientInfo || 'بدون معلمات إضافية'}
                    </td>
                    <td className="py-3 px-4 font-mono-numbers text-[11px] text-slate-400">
                      {order.createdAt ? new Date(order.createdAt).toLocaleString('ar-SA') : 'حديثاً'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
