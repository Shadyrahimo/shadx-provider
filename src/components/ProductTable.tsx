import React, { useState, useRef } from 'react';
import {
  Copy,
  Check,
  Code2,
  Layers,
  Wrench,
  AlertTriangle,
  LayoutGrid,
  Table as TableIcon,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  MoveHorizontal,
  TrendingDown,
  CheckCircle2,
  XCircle,
  Zap,
  ShieldCheck,
  Tag,
  SlidersHorizontal,
  DollarSign,
  Scale,
} from 'lucide-react';
import { CatalogProduct, NormalizedParam } from '../types';

interface ProductTableProps {
  products: CatalogProduct[];
  totalProductsCount?: number;
  selectedIds: Set<string | number>;
  onToggleSelect: (id: string | number) => void;
  onOpenProductDetail: (product: CatalogProduct, initialFixMode?: boolean) => void;
  providerBaseUrl: string;
  onGoToConnection?: () => void;
  onCompareProduct?: (product: CatalogProduct) => void;
}

export const ProductTable: React.FC<ProductTableProps> = ({
  products,
  totalProductsCount = 0,
  selectedIds,
  onToggleSelect,
  onOpenProductDetail,
  onGoToConnection,
  onCompareProduct,
}) => {
  const [copiedId, setCopiedId] = useState<string | number | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [expandedRowIds, setExpandedRowIds] = useState<Set<string | number>>(new Set());
  const tableScrollRef = useRef<HTMLDivElement | null>(null);

  const handleHorizontalScroll = (direction: 'right' | 'left') => {
    if (!tableScrollRef.current) return;
    const offset = direction === 'left' ? -240 : 240;
    tableScrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
  };

  const toggleExpandRow = (id: string | number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedRowIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleCopyId = (id: string | number, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(String(id));
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId(null);
    }, 1800);
  };

  const getParamColor = (cat: NormalizedParam['category']) => {
    switch (cat) {
      case 'player_id':
      case 'uid':
        return 'text-sky-400 bg-sky-950/50 border-sky-800/60';
      case 'server_id':
        return 'text-amber-400 bg-amber-950/50 border-amber-800/60';
      case 'email':
        return 'text-emerald-400 bg-emerald-950/50 border-emerald-800/60';
      case 'username':
        return 'text-purple-400 bg-purple-950/50 border-purple-800/60';
      case 'phone':
        return 'text-pink-400 bg-pink-950/50 border-pink-800/60';
      default:
        return 'text-slate-300 bg-slate-800 border-slate-700';
    }
  };

  if (products.length === 0) {
    if (totalProductsCount === 0) {
      return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 sm:p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-4 text-indigo-400">
            <Layers className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-white mb-1.5">
            النظام جاهز للربط المباشر مع المزود الحقيقي
          </h3>
          <p className="text-xs text-slate-400 max-w-lg mx-auto leading-relaxed mb-5">
            تم تفريغ جميع البيانات الوهمية. للبدء، أدخل{' '}
            <strong className="text-slate-200">عنوان الـ API (Base URL)</strong> و
            <strong className="text-slate-200">رمز التوثيق الحقيقي (API Token)</strong> في الشريط
            العلوي أو من قسم ربط المزود، ثم اضغط على زر{' '}
            <strong className="text-indigo-400">«جلب وتحديث المنتجات»</strong>.
          </p>
          {onGoToConnection && (
            <button
              type="button"
              onClick={onGoToConnection}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
            >
              الانتقال إلى إعدادات ربط المزود
            </button>
          )}
        </div>
      );
    }

    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 sm:p-12 text-center">
        <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-500">
          <Layers className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-slate-200 mb-1">
          لا توجد منتجات مطابقة للبحث أو الفلتر
        </h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          جرب تغيير عبارة البحث، اختيار فئة أخرى، أو إعادة تعيين الفلاتر لعرض جميع المنتجات.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* View Mode Switcher Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="text-slate-400">
          اضغط على أي صف <strong className="text-slate-200">لتوسيع التفاصيل الكاملة</strong>، أو اضغط على أيقونة <strong className="text-indigo-400">الربط</strong> لفتح الحاسبة وأكواد الـ API
        </span>
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl shrink-0">
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-bold transition-colors ${
              viewMode === 'table'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span>جدول متجاوب</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('cards')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-bold transition-colors ${
              viewMode === 'cards'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>بطاقات</span>
          </button>
        </div>
      </div>

      {/* Responsive Cards View (When user selects 'cards') */}
      <div
        className={
          viewMode === 'cards'
            ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3'
            : 'hidden'
        }
      >
        {products.map((product) => {
          const isSelected = selectedIds.has(product.id);
          const profitUsd = product.suggestedSellPriceUsd - product.costPriceUsd;
          const profitPercent =
            product.profitMarginPercent !== undefined
              ? product.profitMarginPercent
              : product.costPriceUsd > 0
              ? Number(((profitUsd / product.costPriceUsd) * 100).toFixed(1))
              : 0;

          return (
            <div
              key={product.id}
              onClick={() => onToggleSelect(product.id)}
              className={`bg-slate-900 border rounded-xl p-4 transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                product.isLowMargin
                  ? 'border-rose-500/60 bg-rose-950/20'
                  : product.isBelowThreshold
                  ? 'border-amber-500/50 bg-amber-950/15'
                  : isSelected
                  ? 'border-indigo-500 bg-indigo-950/25'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Card Header: ID +Checkbox + Status */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelect(product.id)}
                      className="rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-0 cursor-pointer"
                    />
                    <span className="font-mono-numbers text-xs font-bold text-slate-100 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      #{product.id}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handleCopyId(product.id, e)}
                      className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
                      title="نسخ المعرف"
                    >
                      {copiedId === product.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {product.isLowMargin && (
                      <span
                        className="text-[10px] font-bold text-rose-200 bg-rose-600/30 border border-rose-500/60 px-2 py-0.5 rounded flex items-center gap-1"
                        title={product.lowMarginReason || 'هامش الربح أقل من 5%'}
                      >
                        <TrendingDown className="w-3 h-3 text-rose-400" />
                        <span>Low Margin (&lt;5%)</span>
                      </span>
                    )}

                    {product.isAvailable ? (
                      <span className="text-[11px] font-medium text-emerald-400 bg-emerald-950/50 border border-emerald-500/20 px-2 py-0.5 rounded">
                        متاح
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium text-rose-400 bg-rose-950/50 border border-rose-500/20 px-2 py-0.5 rounded">
                        غير متوفر
                      </span>
                    )}

                    {product.integrationStatus === 'ready' && (
                      <span className="text-[10px] font-semibold text-emerald-300 bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 rounded">
                        ✓ ربط مكتمل
                      </span>
                    )}
                    {product.integrationStatus === 'needs_fix' && (
                      <span className="text-[10px] font-bold text-amber-300 bg-amber-950/80 border border-amber-500/50 px-2 py-0.5 rounded flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-amber-400" />
                        <span>معلمات ناقصة</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Product Name & Category */}
                <h4 className="text-sm font-bold text-white leading-snug mb-1">
                  {product.name}
                </h4>
                <div className="text-xs text-slate-400 flex items-center gap-2">
                  <span>{product.category}</span>
                  <span>·</span>
                  <span>{product.qtyDescriptionAr}</span>
                  <span>·</span>
                  <span className="font-mono-numbers">{product.limitsDisplay}</span>
                </div>
              </div>

              {/* Pricing Strip */}
              <div
                className={`grid grid-cols-2 gap-2 p-2.5 rounded-lg border text-xs font-mono-numbers ${
                  product.isLowMargin
                    ? 'bg-rose-950/40 border-rose-500/40'
                    : 'bg-slate-950 border-slate-800/80'
                }`}
              >
                <div>
                  <span className="text-[10px] text-slate-400 block font-sans">سعر التكلفة:</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-slate-200 text-sm">
                      ${product.costPriceUsd.toFixed(3)}
                    </span>
                    {product.hasCostIncreased && product.costIncreasePercent !== undefined && (
                      <span className="text-[10px] font-bold text-rose-400 bg-rose-950/80 border border-rose-500/40 px-1.5 py-0.2 rounded">
                        ▲ +{product.costIncreasePercent}%
                      </span>
                    )}
                  </div>
                  {product.hasCostIncreased && product.previousCostUsd !== undefined && (
                    <span className="text-[10px] text-slate-400 block">
                      السابق: ${product.previousCostUsd.toFixed(3)}
                    </span>
                  )}
                </div>
                <div className="text-left">
                  <span className="text-[10px] text-slate-400 block font-sans">سعر البيع المقترح:</span>
                  <span
                    className={`font-bold text-sm ${
                      product.isLowMargin ? 'text-rose-300' : 'text-emerald-400'
                    }`}
                  >
                    ${product.suggestedSellPriceUsd.toFixed(2)}{' '}
                    <span
                      className={`text-[11px] ${
                        product.isLowMargin ? 'text-rose-400 font-extrabold' : 'text-emerald-500'
                      }`}
                    >
                      ({profitPercent >= 0 ? `+${profitPercent}%` : `${profitPercent}%`})
                    </span>
                  </span>
                  {product.isLowMargin && (
                    <span className="text-[10px] text-rose-400 font-semibold block font-sans mt-0.5">
                      ⚠️ هامش منخفض (&lt;5%)
                    </span>
                  )}
                </div>
              </div>

              {/* Params & Actions Footer */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <div className="flex flex-wrap gap-1 min-w-0">
                  {product.normalizedParams.length > 0 ? (
                    product.normalizedParams.map((param, idx) => (
                      <span
                        key={idx}
                        className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${getParamColor(
                          param.category
                        )}`}
                      >
                        <span className="font-mono ml-1">[{param.normalizedKey}]</span>
                        <span>{param.labelAr.split('(')[0]}</span>
                      </span>
                    ))
                  ) : (
                    <span className="text-[11px] text-slate-500">كود فوري (بدون معلمات)</span>
                  )}
                </div>

                <div
                  className="flex items-center gap-1.5 shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  {product.integrationStatus === 'needs_fix' && (
                    <button
                      type="button"
                      onClick={() => onOpenProductDetail(product, true)}
                      className="px-2.5 py-1.5 bg-amber-500/20 hover:bg-amber-500 border border-amber-500/60 text-amber-300 hover:text-slate-950 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      <span>إصلاح</span>
                    </button>
                  )}
                  {onCompareProduct && (
                    <button
                      type="button"
                      onClick={() => onCompareProduct(product)}
                      className="px-2.5 py-1.5 bg-emerald-600/20 hover:bg-emerald-600 border border-emerald-500/40 text-emerald-300 hover:text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                      title="مقارنة سعر هذا المنتج مع مزود ثانٍ"
                    >
                      <Scale className="w-3.5 h-3.5" />
                      <span>مقارنة</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onOpenProductDetail(product, false)}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                  >
                    <Code2 className="w-3.5 h-3.5" />
                    <span>ربط وتفاصيل</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Responsive Expandable & Scrollable Table View */}
      <div
        className={
          viewMode === 'table'
            ? 'bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm block'
            : 'hidden'
        }
      >
        {/* Mobile Helper Bar: Tap Row to Expand + Optional Horizontal Scroll */}
        <div className="lg:hidden flex items-center justify-between gap-2 px-3 py-2 bg-slate-950/90 border-b border-slate-800 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5 min-w-0">
            <ChevronDown className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="truncate">
              اضغط على أي صف لتوسيع الفئة والمعلمات والحدود كاملة
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => {
                if (expandedRowIds.size === products.length) {
                  setExpandedRowIds(new Set());
                } else {
                  setExpandedRowIds(new Set(products.map((p) => p.id)));
                }
              }}
              className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-indigo-300 font-semibold text-[10px]"
            >
              {expandedRowIds.size === products.length ? 'طي الكل' : 'توسيع الكل'}
            </button>
            <button
              type="button"
              onClick={() => handleHorizontalScroll('right')}
              className="p-1 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 active:scale-95"
              title="تمرير الجدول لليمين"
              aria-label="تمرير لليمين"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleHorizontalScroll('left')}
              className="p-1 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 active:scale-95"
              title="تمرير الجدول لليسار"
              aria-label="تمرير لليسار"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div
          ref={tableScrollRef}
          className="overflow-x-auto overscroll-x-contain touch-pan-x scroll-smooth w-full"
        >
          <table className="w-full text-right text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold select-none">
                <th className="py-2.5 sm:py-3 px-2 sm:px-3.5 w-9 text-center">
                  <span className="sr-only">تحديد</span>
                </th>
                <th className="py-2.5 sm:py-3 px-2 sm:px-3 whitespace-nowrap">
                  <span className="sm:hidden">#ID</span>
                  <span className="hidden sm:inline">1. المعرف (ID)</span>
                </th>
                <th className="py-2.5 sm:py-3 px-2.5 sm:px-4 min-w-[140px] sm:min-w-[200px]">
                  <span className="sm:hidden">المنتج</span>
                  <span className="hidden sm:inline">2. اسم المنتج</span>
                </th>
                {/* Secondary Column 3: Hidden on Mobile (< md) */}
                <th className="hidden md:table-cell py-3 px-3.5 whitespace-nowrap">
                  3. الفئة / التصنيف
                </th>
                <th className="py-2.5 sm:py-3 px-2 sm:px-3.5 whitespace-nowrap text-left font-mono-numbers">
                  <span className="sm:hidden">التكلفة</span>
                  <span className="hidden sm:inline">4. سعر التكلفة (USD)</span>
                </th>
                <th className="py-2.5 sm:py-3 px-2 sm:px-3.5 whitespace-nowrap text-left font-mono-numbers">
                  <span className="sm:hidden">البيع</span>
                  <span className="hidden sm:inline">5. سعر البيع المقترح ($)</span>
                </th>
                {/* Secondary Column 6: Hidden on Mobile (< lg) */}
                <th className="hidden lg:table-cell py-3 px-3 whitespace-nowrap text-center">
                  6. الحالة والربط التلقائي
                </th>
                {/* Secondary Column 7: Hidden on Mobile/Tablet (< xl) */}
                <th className="hidden xl:table-cell py-3 px-3 whitespace-nowrap text-center">
                  7. نوع الكمية
                </th>
                {/* Secondary Column 8: Hidden on Mobile/Tablet (< xl) */}
                <th className="hidden xl:table-cell py-3 px-3 whitespace-nowrap text-center">
                  8. الحدود (Min-Max)
                </th>
                {/* Secondary Column 9: Hidden on Mobile (< lg) */}
                <th className="hidden lg:table-cell py-3 px-4 min-w-[180px]">
                  9. المعلمات المطلوبة (Params)
                </th>
                <th className="py-2.5 sm:py-3 px-2 sm:px-3.5 text-center whitespace-nowrap">
                  <span className="sm:hidden">إجراء</span>
                  <span className="hidden sm:inline">10. الإجراءات</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {products.map((product) => {
                const isSelected = selectedIds.has(product.id);
                const isExpanded = expandedRowIds.has(product.id);
                const profitUsd = product.suggestedSellPriceUsd - product.costPriceUsd;
                const profitPercent =
                  product.profitMarginPercent !== undefined
                    ? product.profitMarginPercent
                    : product.costPriceUsd > 0
                    ? Number(((profitUsd / product.costPriceUsd) * 100).toFixed(1))
                    : 0;

                return (
                  <React.Fragment key={product.id}>
                    <tr
                      onClick={() => toggleExpandRow(product.id)}
                      className={`transition-colors cursor-pointer ${
                        product.isLowMargin
                          ? 'bg-rose-950/25 hover:bg-rose-950/35 border-r-2 border-r-rose-500'
                          : product.isBelowThreshold
                          ? 'bg-amber-950/20 hover:bg-amber-950/30'
                          : isSelected
                          ? 'bg-indigo-950/30 hover:bg-indigo-950/40'
                          : isExpanded
                          ? 'bg-slate-800/60'
                          : 'hover:bg-slate-800/50'
                      }`}
                    >
                      {/* Checkbox Cell */}
                      <td
                        className="py-2.5 sm:py-3 px-2 sm:px-3.5 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => onToggleSelect(product.id)}
                          className="rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-0 cursor-pointer"
                        />
                      </td>

                      {/* 1. Product ID (Compact on Mobile) */}
                      <td className="py-2.5 sm:py-3 px-1.5 sm:px-3 whitespace-nowrap font-mono-numbers">
                        <div className="flex items-center gap-1">
                          <span className="font-semibold text-slate-100 bg-slate-950 px-1.5 sm:px-2 py-0.5 rounded border border-slate-800 text-[11px] sm:text-xs">
                            {product.id}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => handleCopyId(product.id, e)}
                            className="p-1 rounded hover:bg-slate-700/60 text-slate-400 hover:text-slate-200 transition-colors"
                            title="نسخ المعرف ID"
                          >
                            {copiedId === product.id ? (
                              <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* 2. Product Name + Compact Mobile Status Icons */}
                      <td className="py-2.5 sm:py-3 px-2 sm:px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {/* Compact Availability & Integration Icon on Mobile (< lg) */}
                          <span
                            className="lg:hidden inline-flex items-center shrink-0"
                            title={
                              product.isAvailable
                                ? 'متاح للطلب'
                                : 'غير متوفر حالياً'
                            }
                          >
                            {product.isAvailable ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5 text-rose-400" />
                            )}
                          </span>

                          <span className="font-semibold text-slate-100 hover:text-indigo-300 transition-colors text-xs leading-snug line-clamp-1 sm:line-clamp-none">
                            {product.name}
                          </span>

                          {/* Low Margin Badge: Icon + <5% on Mobile, Full Badge on Desktop */}
                          {product.isLowMargin && (
                            <span
                              className="shrink-0 inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded text-[10px] font-bold bg-rose-600 text-white shadow-xs"
                              title={
                                product.lowMarginReason ||
                                'تحذير: انخفض هامش الربح إلى أقل من 5% بسبب ارتفاع التكلفة'
                              }
                            >
                              <TrendingDown className="w-3 h-3 shrink-0" />
                              <span className="sm:hidden">Low &lt;5%</span>
                              <span className="hidden sm:inline">Low Margin • هامش منخفض (&lt;5%)</span>
                            </span>
                          )}

                          {/* Below Threshold Badge: Icon on Mobile, Text on Desktop */}
                          {product.isBelowThreshold && (
                            <span
                              className="shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-slate-950"
                              title="فرصة سعر أقل من الحد المستهدف"
                            >
                              <Zap className="w-3 h-3 shrink-0" />
                              <span className="hidden sm:inline">فرصة سعر!</span>
                            </span>
                          )}
                        </div>

                        {product.isLowMargin && product.lowMarginReason && (
                          <div className="hidden sm:block text-[11px] text-rose-400 font-medium mt-0.5">
                            {product.lowMarginReason}
                          </div>
                        )}
                      </td>

                      {/* 3. Category: Hidden on Mobile (< md) */}
                      <td className="hidden md:table-cell py-3 px-3.5 whitespace-nowrap">
                        <span className="text-slate-300 font-medium">
                          {product.category}
                        </span>
                      </td>

                      {/* 4. Cost Price (Compact on Mobile) */}
                      <td className="py-2.5 sm:py-3 px-2 sm:px-3.5 whitespace-nowrap text-left font-mono-numbers">
                        <div className="flex items-center gap-1 justify-start">
                          <span
                            className={`font-semibold text-xs sm:text-sm ${
                              product.isLowMargin
                                ? 'text-rose-300 font-bold bg-rose-950/60 border border-rose-500/40 px-1.5 py-0.5 rounded'
                                : product.isBelowThreshold
                                ? 'text-amber-300 font-bold bg-amber-950/60 border border-amber-500/40 px-1.5 py-0.5 rounded'
                                : 'text-slate-300'
                            }`}
                          >
                            ${product.costPriceUsd.toFixed(3)}
                          </span>
                          {product.hasCostIncreased && product.costIncreasePercent !== undefined && (
                            <span
                              className="inline-flex items-center bg-rose-500/20 text-rose-300 border border-rose-500/40 px-1 py-0.5 rounded text-[9px] sm:text-[10px] font-bold"
                              title={`ارتفعت التكلفة من $${product.previousCostUsd?.toFixed(3)} إلى $${product.costPriceUsd.toFixed(3)}`}
                            >
                              ▲+{product.costIncreasePercent}%
                            </span>
                          )}
                          {product.isBelowThreshold && (
                            <span
                              className="hidden sm:inline-flex items-center gap-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded text-[10px] font-bold"
                              title={`تنبيه: انخفضت التكلفة عن الحد المستهدف $${product.thresholdPrice}`}
                            >
                              <span>⚡ &lt; ${product.thresholdPrice}</span>
                            </span>
                          )}
                        </div>
                        {product.hasCostIncreased && product.previousCostUsd !== undefined && (
                          <div className="hidden sm:block text-[10px] text-rose-400/90 font-semibold mt-0.5">
                            السابق: ${product.previousCostUsd.toFixed(3)}
                          </div>
                        )}
                      </td>

                      {/* 5. Suggested Sell Price & Margin % */}
                      <td className="py-2.5 sm:py-3 px-2 sm:px-3.5 whitespace-nowrap text-left font-mono-numbers">
                        <div
                          className={`font-bold text-xs sm:text-sm ${
                            product.isLowMargin ? 'text-rose-400' : 'text-emerald-400'
                          }`}
                        >
                          ${product.suggestedSellPriceUsd.toFixed(2)}
                        </div>
                        <div
                          className={`text-[10px] font-medium flex items-center justify-end gap-0.5 ${
                            product.isLowMargin ? 'text-rose-400 font-bold' : 'text-emerald-500/80'
                          }`}
                        >
                          <span className="hidden sm:inline">
                            {profitUsd >= 0 ? `+${profitUsd.toFixed(2)}$` : `${profitUsd.toFixed(2)}$`}
                          </span>
                          <span>({profitPercent >= 0 ? `+${profitPercent}%` : `${profitPercent}%`})</span>
                        </div>
                      </td>

                      {/* 6. Availability & Auto-Integration Status: Hidden on Mobile (< lg) */}
                      <td className="hidden lg:table-cell py-3 px-3 whitespace-nowrap text-center">
                        <div className="flex flex-col items-center gap-1">
                          {product.isAvailable ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 px-2 py-0.5 rounded">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>متاح</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-400 bg-rose-950/40 border border-rose-500/20 px-2 py-0.5 rounded">
                              <XCircle className="w-3 h-3" />
                              <span>غير متوفر</span>
                            </span>
                          )}

                          {product.integrationStatus === 'ready' && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-300 bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 rounded">
                              <ShieldCheck className="w-3 h-3 text-emerald-400" />
                              <span>ربط مكتمل</span>
                            </span>
                          )}

                          {product.integrationStatus === 'needs_fix' && (
                            <span
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-300 bg-amber-950/80 border border-amber-500/50 px-2 py-0.5 rounded"
                              title={product.integrationDiagnostic?.fixReason || 'معلمات ناقصة تحتاج إلى إصلاح'}
                            >
                              <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                              <span>معلمات ناقصة</span>
                            </span>
                          )}

                          {product.integrationStatus === 'unmapped' && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-400 bg-slate-950 border border-slate-800 px-2 py-0.5 rounded">
                              غير مهيأ
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 7. Qty Type: Hidden on Mobile/Tablet (< xl) */}
                      <td className="hidden xl:table-cell py-3 px-3 whitespace-nowrap text-center">
                        <span className="text-[11px] font-medium text-slate-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                          {product.qtyDescriptionAr}
                        </span>
                      </td>

                      {/* 8. Limits (Min-Max): Hidden on Mobile/Tablet (< xl) */}
                      <td className="hidden xl:table-cell py-3 px-3 whitespace-nowrap text-center font-mono-numbers text-[11px] text-slate-400">
                        {product.limitsDisplay}
                      </td>

                      {/* 9. Required Params: Hidden on Mobile (< lg) */}
                      <td className="hidden lg:table-cell py-3 px-4">
                        {product.normalizedParams.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {product.normalizedParams.map((param, pIdx) => (
                              <span
                                key={pIdx}
                                className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium border ${getParamColor(
                                  param.category
                                )}`}
                                title={`المعنى الأصلي في API المزود: ${param.raw}`}
                              >
                                <span className="font-mono ml-1">[{param.normalizedKey}]</span>
                                <span>{param.labelAr.split('(')[0]}</span>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-500 text-[11px]">بدون معلمات (كود فوري)</span>
                        )}
                      </td>

                      {/* 10. Actions (Icon-Only Buttons on Mobile, Icon + Label on Desktop + Expand Toggle) */}
                      <td
                        className="py-2.5 sm:py-3 px-1.5 sm:px-3.5 whitespace-nowrap text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-center gap-1 sm:gap-1.5">
                          {product.integrationStatus === 'needs_fix' && (
                            <button
                              type="button"
                              onClick={() => onOpenProductDetail(product, true)}
                              className="p-1.5 sm:px-2.5 sm:py-1 bg-amber-500/20 hover:bg-amber-500 border border-amber-500/60 hover:border-amber-400 text-amber-300 hover:text-slate-950 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1"
                              title="إصلاح الربط: فتح تفاصيل المنتج والمقترحات الذكية لإكمال البيانات المفقودة"
                              aria-label="إصلاح الربط"
                            >
                              <Wrench className="w-3.5 h-3.5 shrink-0" />
                              <span className="hidden sm:inline">إصلاح</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => onOpenProductDetail(product, false)}
                            className="p-1.5 sm:px-2.5 sm:py-1 bg-indigo-600/20 hover:bg-indigo-600 border border-indigo-500/40 hover:border-indigo-500 text-indigo-300 hover:text-white rounded-lg text-[11px] font-medium transition-colors flex items-center gap-1"
                            title="فحص تفاصيل الربط وحاسبة الأرباح وتجربة استعلام الطلب"
                            aria-label="ربط وتفاصيل"
                          >
                            <Code2 className="w-3.5 h-3.5 shrink-0" />
                            <span className="hidden sm:inline">
                              {product.integrationStatus === 'needs_fix' ? 'تفاصيل' : 'ربط'}
                            </span>
                          </button>

                          {/* Expand/Collapse Row Details Button */}
                          <button
                            type="button"
                            onClick={(e) => toggleExpandRow(product.id, e)}
                            className={`p-1.5 rounded-lg border transition-colors flex items-center justify-center ${
                              isExpanded
                                ? 'bg-indigo-600 text-white border-indigo-500'
                                : 'bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-800'
                            }`}
                            title={isExpanded ? 'طي تفاصيل الصف' : 'توسيع الصف لعرض التفاصيل الكاملة'}
                            aria-label={isExpanded ? 'طي التفاصيل' : 'توسيع التفاصيل'}
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expandable Full Details Sub-Row (Shown when clicking the row or expand button) */}
                    {isExpanded && (
                      <tr className="bg-slate-950/90 border-b border-indigo-500/30">
                        <td colSpan={11} className="p-3 sm:p-4">
                          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 space-y-3 text-xs">
                            {/* Top Strip: Full Name, Category, Availability & Integration Status */}
                            <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono-numbers font-bold text-indigo-300 bg-indigo-950/60 border border-indigo-500/30 px-2 py-0.5 rounded">
                                  ID: #{product.id}
                                </span>
                                <h4 className="font-bold text-white text-xs sm:text-sm">
                                  {product.name}
                                </h4>
                              </div>

                              <div className="flex items-center gap-1.5 flex-wrap">
                                {product.isAvailable ? (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-950/50 border border-emerald-500/30 px-2 py-0.5 rounded">
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>متاح للطلب</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-400 bg-rose-950/50 border border-rose-500/30 px-2 py-0.5 rounded">
                                    <XCircle className="w-3 h-3" />
                                    <span>غير متوفر</span>
                                  </span>
                                )}

                                {product.integrationStatus === 'ready' ? (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-300 bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 rounded">
                                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                                    <span>ربط تلقائي مكتمل</span>
                                  </span>
                                ) : product.integrationStatus === 'needs_fix' ? (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 bg-amber-950/80 border border-amber-500/50 px-2 py-0.5 rounded">
                                    <AlertTriangle className="w-3 h-3 text-amber-400" />
                                    <span>معلمات ناقصة تحتاج إصلاح</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 bg-slate-950 border border-slate-800 px-2 py-0.5 rounded">
                                    غير مهيأ
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Secondary Details Grid: Category, Qty Type, Limits, Pricing Breakdown */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
                                <span className="text-[10px] text-slate-400 flex items-center gap-1 mb-1">
                                  <Tag className="w-3 h-3 text-indigo-400" />
                                  <span>الفئة / التصنيف:</span>
                                </span>
                                <span className="font-bold text-slate-200 block">
                                  {product.category}
                                </span>
                              </div>

                              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
                                <span className="text-[10px] text-slate-400 flex items-center gap-1 mb-1">
                                  <SlidersHorizontal className="w-3 h-3 text-amber-400" />
                                  <span>نوع الكمية والحدود:</span>
                                </span>
                                <span className="font-bold text-slate-200 block">
                                  {product.qtyDescriptionAr}
                                </span>
                                <span className="text-[10px] font-mono-numbers text-slate-400">
                                  الحدود: {product.limitsDisplay}
                                </span>
                              </div>

                              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 font-mono-numbers">
                                <span className="text-[10px] text-slate-400 flex items-center gap-1 mb-1 font-sans">
                                  <DollarSign className="w-3 h-3 text-sky-400" />
                                  <span>تفاصيل سعر التكلفة:</span>
                                </span>
                                <span className="font-bold text-slate-100 text-sm">
                                  ${product.costPriceUsd.toFixed(3)}
                                </span>
                                {product.hasCostIncreased && product.previousCostUsd !== undefined && (
                                  <span className="text-[10px] text-rose-400 block font-semibold">
                                    السابق: ${product.previousCostUsd.toFixed(3)} (+{product.costIncreasePercent}%)
                                  </span>
                                )}
                                {product.thresholdPrice !== undefined && (
                                  <span className="text-[10px] text-amber-400 block font-sans">
                                    حد التنبيه: ${product.thresholdPrice}
                                  </span>
                                )}
                              </div>

                              <div
                                className={`p-2.5 rounded-lg border font-mono-numbers ${
                                  product.isLowMargin
                                    ? 'bg-rose-950/40 border-rose-500/40'
                                    : 'bg-slate-950 border-slate-800/80'
                                }`}
                              >
                                <span className="text-[10px] text-slate-400 block mb-1 font-sans">
                                  سعر البيع وصافي الربح:
                                </span>
                                <div className="flex items-baseline gap-1.5">
                                  <span
                                    className={`font-bold text-sm ${
                                      product.isLowMargin ? 'text-rose-300' : 'text-emerald-400'
                                    }`}
                                  >
                                    ${product.suggestedSellPriceUsd.toFixed(2)}
                                  </span>
                                  <span
                                    className={`text-[11px] font-bold ${
                                      product.isLowMargin ? 'text-rose-400' : 'text-emerald-500'
                                    }`}
                                  >
                                    ({profitPercent >= 0 ? `+${profitPercent}%` : `${profitPercent}%`})
                                  </span>
                                </div>
                                <span className="text-[10px] text-slate-400 block">
                                  صافي الربح: {profitUsd >= 0 ? `+$${profitUsd.toFixed(3)}` : `$${profitUsd.toFixed(3)}`}
                                </span>
                              </div>
                            </div>

                            {/* Low Margin or Integration Diagnostic Alert Banner inside Expanded Row */}
                            {product.isLowMargin && product.lowMarginReason && (
                              <div className="p-2.5 rounded-lg bg-rose-950/50 border border-rose-500/40 text-rose-200 flex items-center gap-2 text-[11px]">
                                <TrendingDown className="w-4 h-4 text-rose-400 shrink-0" />
                                <span>{product.lowMarginReason}</span>
                              </div>
                            )}

                            {product.integrationStatus === 'needs_fix' &&
                              product.integrationDiagnostic?.fixReason && (
                                <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-500/40 text-amber-200 flex items-center justify-between gap-2 text-[11px]">
                                  <div className="flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                                    <span>{product.integrationDiagnostic.fixReason}</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => onOpenProductDetail(product, true)}
                                    className="px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 font-bold text-[11px] shrink-0"
                                  >
                                    إصلاح الآن
                                  </button>
                                </div>
                              )}

                            {/* Bottom Strip: Required Parameters + Full Action Buttons */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[11px] text-slate-400 font-semibold">
                                  المعلمات المطلوبة (Params):
                                </span>
                                {product.normalizedParams.length > 0 ? (
                                  product.normalizedParams.map((param, pIdx) => (
                                    <span
                                      key={pIdx}
                                      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${getParamColor(
                                        param.category
                                      )}`}
                                    >
                                      <span className="font-mono ml-1">[{param.normalizedKey}]</span>
                                      <span>{param.labelAr}</span>
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-[11px] text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                                    بدون معلمات إضافية (تسليم كود فوري)
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
                                <button
                                  type="button"
                                  onClick={(e) => handleCopyId(product.id, e)}
                                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium flex items-center gap-1 transition-colors"
                                >
                                  {copiedId === product.id ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                  <span>نسخ ID</span>
                                </button>

                                {onCompareProduct && (
                                  <button
                                    type="button"
                                    onClick={() => onCompareProduct(product)}
                                    className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 border border-emerald-500/40 text-emerald-300 hover:text-white text-[11px] font-bold flex items-center gap-1.5 transition-colors"
                                  >
                                    <Scale className="w-3.5 h-3.5" />
                                    <span>مقارنة مع مزود ثانٍ</span>
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => onOpenProductDetail(product, false)}
                                  className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                                >
                                  <Code2 className="w-3.5 h-3.5" />
                                  <span>فتح حاسبة الربح والـ API والسجل الزمني</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
