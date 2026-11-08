import React, { useState } from 'react';
import {
  Copy,
  Check,
  Code2,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Layers,
  HelpCircle,
  TrendingUp,
  Wrench,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { CatalogProduct, NormalizedParam } from '../types';

interface ProductTableProps {
  products: CatalogProduct[];
  totalProductsCount?: number;
  selectedIds: Set<string | number>;
  onToggleSelect: (id: string | number) => void;
  onOpenProductDetail: (product: CatalogProduct, initialFixMode?: boolean) => void;
  providerBaseUrl: string;
}

export const ProductTable: React.FC<ProductTableProps> = ({
  products,
  totalProductsCount = 0,
  selectedIds,
  onToggleSelect,
  onOpenProductDetail,
  providerBaseUrl,
}) => {
  const [copiedId, setCopiedId] = useState<string | number | null>(null);

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
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-4 text-indigo-400">
            <Layers className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-white mb-1.5">
            النظام جاهز للربط المباشر مع المزود الحقيقي
          </h3>
          <p className="text-xs text-slate-400 max-w-lg mx-auto leading-relaxed">
            تم تفريغ جميع البيانات الوهمية. للبدء، أدخل <strong className="text-slate-200">عنوان الـ API (Base URL)</strong> و<strong className="text-slate-200">رمز التوثيق الحقيقي (API Token)</strong> في الشريط العلوي، ثم اضغط على زر <strong className="text-indigo-400">«جلب وتحديث المنتجات»</strong> لتحميل كتالوجك الفعلي.
          </p>
        </div>
      );
    }

    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
        <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-500">
          <Layers className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-slate-200 mb-1">
          لا توجد منتجات مطابقة للبحث أو الفلتر
        </h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          جرب تغيير عبارة البحث، اختيار فئة أخرى، أو إعادة تعيين الفلاتر من الشريط العلوي لعرض جميع المنتجات.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-right text-xs border-collapse">
          <thead>
            <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold select-none">
              <th className="py-3 px-3.5 w-10 text-center">
                <span className="sr-only">تحديد</span>
              </th>
              <th className="py-3 px-3 w-28 whitespace-nowrap">
                1. المعرف (ID)
              </th>
              <th className="py-3 px-4 min-w-[220px]">
                2. اسم المنتج
              </th>
              <th className="py-3 px-3.5 whitespace-nowrap">
                3. الفئة / التصنيف
              </th>
              <th className="py-3 px-3.5 whitespace-nowrap text-left font-mono-numbers">
                4. سعر التكلفة (USD)
              </th>
              <th className="py-3 px-3.5 whitespace-nowrap text-left font-mono-numbers">
                5. سعر البيع المقترح ($)
              </th>
              <th className="py-3 px-3 whitespace-nowrap text-center">
                6. الحالة والربط التلقائي
              </th>
              <th className="py-3 px-3 whitespace-nowrap text-center">
                7. نوع الكمية
              </th>
              <th className="py-3 px-3 whitespace-nowrap text-center">
                8. الحدود (Min-Max)
              </th>
              <th className="py-3 px-4 min-w-[200px]">
                9. المعلمات المطلوبة (Params)
              </th>
              <th className="py-3 px-3.5 w-36 text-center whitespace-nowrap">
                10. الإجراءات
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 text-slate-300">
            {products.map((product) => {
              const isSelected = selectedIds.has(product.id);
              const profitUsd = (product.suggestedSellPriceUsd - product.costPriceUsd);
              const profitPercent = product.costPriceUsd > 0
                ? Math.round((profitUsd / product.costPriceUsd) * 100)
                : 0;

              return (
                <tr
                  key={product.id}
                  onClick={() => onToggleSelect(product.id)}
                  className={`transition-colors cursor-pointer ${
                    product.isBelowThreshold
                      ? 'bg-amber-950/20 hover:bg-amber-950/30 border-r-2 border-r-amber-400'
                      : isSelected
                      ? 'bg-indigo-950/30 hover:bg-indigo-950/40'
                      : 'hover:bg-slate-800/50'
                  }`}
                >
                  {/* Select Checkbox */}
                  <td
                    className="py-3 px-3.5 text-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelect(product.id)}
                      className="rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-0 cursor-pointer"
                    />
                  </td>

                  {/* 1. المعرف (ID) */}
                  <td className="py-3 px-3 whitespace-nowrap font-mono-numbers">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-slate-100 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        {product.id}
                      </span>
                      <button
                        onClick={(e) => handleCopyId(product.id, e)}
                        className="p-1 rounded hover:bg-slate-700/60 text-slate-400 hover:text-slate-200 transition-colors"
                        title="نسخ المعرف ID"
                      >
                        {copiedId === product.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </td>

                  {/* 2. اسم المنتج */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-100 hover:text-indigo-300 transition-colors">
                        {product.name}
                      </span>
                      {product.isBelowThreshold && (
                        <span className="shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-slate-950 animate-pulse">
                          فرصة سعر!
                        </span>
                      )}
                    </div>
                    {product.basePriceUsd && product.basePriceUsd !== product.costPriceUsd && (
                      <div className="text-[11px] text-slate-500 font-mono-numbers">
                        السعر الأساسي: ${product.basePriceUsd}
                      </div>
                    )}
                  </td>

                  {/* 3. الفئة / التصنيف */}
                  <td className="py-3 px-3.5 whitespace-nowrap">
                    <span className="text-slate-300 font-medium">
                      {product.category}
                    </span>
                  </td>

                  {/* 4. سعر التكلفة (USD) with Visual Alert */}
                  <td className="py-3 px-3.5 whitespace-nowrap text-left font-mono-numbers">
                    <div className="flex items-center gap-1.5 justify-start">
                      <span
                        className={`font-semibold ${
                          product.isBelowThreshold
                            ? 'text-amber-300 font-bold text-sm bg-amber-950/60 border border-amber-500/40 px-1.5 py-0.5 rounded'
                            : 'text-slate-300'
                        }`}
                      >
                        ${product.costPriceUsd.toFixed(3)}
                      </span>
                      {product.isBelowThreshold && (
                        <span
                          className="inline-flex items-center gap-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded text-[10px] font-bold"
                          title={`تنبيه: انخفضت التكلفة عن الحد المستهدف $${product.thresholdPrice} بفارق توفير $${product.thresholdSavings}`}
                        >
                          <span>⚡ &lt; ${product.thresholdPrice}</span>
                        </span>
                      )}
                    </div>
                    {product.isBelowThreshold && product.thresholdSavings !== undefined && (
                      <div className="text-[10px] text-amber-400 font-semibold mt-0.5 flex items-center gap-1">
                        <span>وفّر: ${product.thresholdSavings}</span>
                      </div>
                    )}
                    {!product.isBelowThreshold && product.thresholdPrice !== undefined && (
                      <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                        حد التنبيه: ${product.thresholdPrice}
                      </div>
                    )}
                  </td>

                  {/* 5. سعر البيع المقترح ($) */}
                  <td className="py-3 px-3.5 whitespace-nowrap text-left font-mono-numbers">
                    <div className="font-bold text-emerald-400">
                      ${product.suggestedSellPriceUsd.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-emerald-500/80 font-medium flex items-center justify-end gap-1">
                      <span>+{profitUsd > 0 ? profitUsd.toFixed(2) : 0}$</span>
                      <span>({profitPercent}%)</span>
                    </div>
                  </td>

                  {/* 6. الحالة والربط التلقائي */}
                  <td className="py-3 px-3 whitespace-nowrap text-center">
                    <div className="flex flex-col items-center gap-1">
                      {/* Availability Badge */}
                      {product.isAvailable ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 px-2 py-0.5 rounded">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          متاح
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-400 bg-rose-950/40 border border-rose-500/20 px-2 py-0.5 rounded">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                          غير متوفر
                        </span>
                      )}

                      {/* Auto-Integration Visual Indicator (إشارة حالة الربط التلقائي) */}
                      {product.integrationStatus === 'ready' && (
                        <span
                          className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-300 bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 rounded-full"
                          title="ربط تلقائي مكتمل: جميع المعلمات مطابقة لمعايير المزود"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span>✓ ربط مكتمل</span>
                        </span>
                      )}

                      {product.integrationStatus === 'needs_fix' && (
                        <span
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-300 bg-amber-950/80 border border-amber-500/50 px-2 py-0.5 rounded-full shadow-xs shadow-amber-500/10"
                          title={product.integrationDiagnostic?.fixReason || 'معلمات ناقصة تحتاج إلى إصلاح'}
                        >
                          <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                          <span>⚠️ معلمات ناقصة</span>
                        </span>
                      )}

                      {product.integrationStatus === 'unmapped' && (
                        <span
                          className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-400 bg-slate-950 border border-slate-800 px-2 py-0.5 rounded-full"
                          title="غير متوفر أو غير مهيأ حالياً"
                        >
                          <span>✕ غير مهيأ</span>
                        </span>
                      )}
                    </div>
                  </td>

                  {/* 7. نوع الكمية */}
                  <td className="py-3 px-3 whitespace-nowrap text-center">
                    <span className="text-[11px] font-medium text-slate-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      {product.qtyDescriptionAr}
                    </span>
                  </td>

                  {/* 8. الحدود (Min-Max) */}
                  <td className="py-3 px-3 whitespace-nowrap text-center font-mono-numbers text-[11px] text-slate-400">
                    {product.limitsDisplay}
                  </td>

                  {/* 9. المعلمات المطلوبة (Params) */}
                  <td className="py-3 px-4">
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

                  {/* 10. الإجراءات مع زر إصلاح الربط */}
                  <td
                    className="py-3 px-3.5 whitespace-nowrap text-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      {product.integrationStatus === 'needs_fix' && (
                        <button
                          onClick={() => onOpenProductDetail(product, true)}
                          className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500 border border-amber-500/60 hover:border-amber-400 text-amber-300 hover:text-slate-950 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 shadow-sm shadow-amber-500/10 active:scale-95"
                          title="إصلاح الربط: فتح تفاصيل المنتج والمقترحات الذكية لإكمال البيانات المفقودة"
                        >
                          <Wrench className="w-3.5 h-3.5 shrink-0" />
                          <span>إصلاح الربط</span>
                        </button>
                      )}

                      <button
                        onClick={() => onOpenProductDetail(product, false)}
                        className="px-2 py-1 bg-indigo-600/20 hover:bg-indigo-600 border border-indigo-500/40 hover:border-indigo-500 text-indigo-300 hover:text-white rounded-lg text-[11px] font-medium transition-colors flex items-center gap-1"
                        title="فحص تفاصيل الربط وتجربة استعلام الطلب والأكواد"
                      >
                        <Code2 className="w-3.5 h-3.5" />
                        <span>{product.integrationStatus === 'needs_fix' ? 'تفاصيل' : 'ربط'}</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
