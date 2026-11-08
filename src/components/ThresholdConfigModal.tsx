import React, { useState } from 'react';
import {
  X,
  BellRing,
  DollarSign,
  AlertTriangle,
  Zap,
  TrendingDown,
  Check,
  Search,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { PriceThresholdConfig, CatalogProduct } from '../types';

interface ThresholdConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  thresholdConfig: PriceThresholdConfig;
  onSave: (newConfig: PriceThresholdConfig) => void;
  products: CatalogProduct[];
  onSimulateCostDrop?: (productId: string | number, newLowerCost: number) => void;
}

export const ThresholdConfigModal: React.FC<ThresholdConfigModalProps> = ({
  isOpen,
  onClose,
  thresholdConfig,
  onSave,
  products,
  onSimulateCostDrop,
}) => {
  const [enabled, setEnabled] = useState<boolean>(thresholdConfig.enabled);
  const [defaultThreshold, setDefaultThreshold] = useState<number | ''>(
    thresholdConfig.defaultThreshold
  );
  const [productThresholds, setProductThresholds] = useState<Record<string | number, number>>({
    ...thresholdConfig.productThresholds,
  });

  const [searchProductQuery, setSearchProductQuery] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string | number>('');
  const [customPriceInput, setCustomPriceInput] = useState<string>('');

  if (!isOpen) return null;

  const handleApply = () => {
    onSave({
      enabled,
      defaultThreshold: defaultThreshold === '' ? '' : Number(defaultThreshold),
      productThresholds,
    });
    onClose();
  };

  const handleAddProductThreshold = () => {
    if (!selectedProductId || !customPriceInput || isNaN(Number(customPriceInput))) return;
    setProductThresholds((prev) => ({
      ...prev,
      [selectedProductId]: Number(customPriceInput),
    }));
    setSelectedProductId('');
    setCustomPriceInput('');
  };

  const handleRemoveProductThreshold = (id: string | number) => {
    setProductThresholds((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const searchedProducts = products
    .filter(
      (p) =>
        searchProductQuery &&
        (p.name.toLowerCase().includes(searchProductQuery.toLowerCase()) ||
          String(p.id).includes(searchProductQuery))
    )
    .slice(0, 6);

  // Quick simulation helper
  const handleQuickSimulate = () => {
    if (products.length > 0 && onSimulateCostDrop) {
      // Find a product like PUBG 60 UC or first item
      const target = products.find((p) => p.name.includes('60') || p.name.includes('UC')) || products[0];
      const newDrop = Number((target.costPriceUsd * 0.45).toFixed(3)); // 55% price drop
      // Also ensure threshold is above this new drop
      setProductThresholds((prev) => ({
        ...prev,
        [target.id]: target.costPriceUsd,
      }));
      setEnabled(true);
      onSimulateCostDrop(target.id, newDrop);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative my-8">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800">
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
            <BellRing className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>إعداد الحد السعري وتنبيهات انخفاض التكلفة (Threshold Alerts)</span>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded font-mono">
                Price Drop Alert
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              تحديد سقف سعر مستهدف، وإظهار تنبيه بصري بارز في الجدول فور انخفاض سعر تكلفة المنتج عن هذا الحد
            </p>
          </div>
        </div>

        {/* Enable / Disable Master Toggle */}
        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-3 h-3 rounded-full ${
                enabled ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : 'bg-slate-600'
              }`}
            />
            <div>
              <span className="text-xs font-semibold text-slate-200 block">
                تفعيل نظام التنبيه البصري لانخفاض التكلفة
              </span>
              <span className="text-[11px] text-slate-400">
                عند التفعيل، ستومض المنتجات التي تقل تكلفتها عن الحد المحدد بشارة تنبيه مميزة
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setEnabled(!enabled)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              enabled ? 'bg-indigo-600' : 'bg-slate-800'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                enabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Global / Default Threshold */}
        <div className="space-y-4 mb-6 text-xs">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2.5">
            <label className="block text-slate-200 font-semibold">
              الحد السعري العام الافتراضي لكافة المنتجات ($):
            </label>
            <p className="text-[11px] text-slate-400">
              أي منتج في الكتالوج تقل تكلفته عن هذا الرقم سيظهر له تنبيه انخفاض التكلفة مباشرة (أو اتركه فارغاً لتحديد منتجات مخصصة فقط).
            </p>
            <div className="flex items-center gap-2">
              <div className="relative grow max-w-xs">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={defaultThreshold}
                  onChange={(e) =>
                    setDefaultThreshold(e.target.value === '' ? '' : parseFloat(e.target.value))
                  }
                  placeholder="مثال: 5.00"
                  dir="ltr"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-slate-100 font-mono-numbers text-xs focus:outline-none focus:border-indigo-500"
                />
                <span className="absolute inset-y-0 left-3 flex items-center text-slate-500 font-mono text-xs">
                  USD $
                </span>
              </div>

              {/* Quick Presets */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-slate-500">سقف سريع:</span>
                {[1.0, 2.0, 5.0, 10.0, 25.0].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setDefaultThreshold(val)}
                    className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-mono-numbers text-[11px]"
                  >
                    ${val}
                  </button>
                ))}
                {defaultThreshold !== '' && (
                  <button
                    type="button"
                    onClick={() => setDefaultThreshold('')}
                    className="px-2 py-1 text-slate-400 hover:text-rose-400 text-[10px]"
                  >
                    إلغاء السقف العام
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Per-Product Custom Thresholds */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-slate-200 font-semibold block">
                تخصيص حد سعري لمنتجات محددة (Custom Per-Product Alert):
              </label>
              <span className="text-[11px] text-indigo-400 font-mono-numbers">
                {Object.keys(productThresholds).length} منتج مخصص
              </span>
            </div>

            {/* Add Custom Threshold Form */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              <div className="relative sm:col-span-6">
                <input
                  type="text"
                  value={searchProductQuery}
                  onChange={(e) => setSearchProductQuery(e.target.value)}
                  placeholder="ابحث لاختيار منتج (مثال: ببجي، 365)..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />

                {/* Autocomplete Dropdown */}
                {searchedProducts.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-800 rounded-lg shadow-xl z-20 overflow-hidden divide-y divide-slate-800">
                    {searchedProducts.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => {
                          setSelectedProductId(p.id);
                          setSearchProductQuery(`${p.id} - ${p.name}`);
                          setCustomPriceInput(String(p.costPriceUsd));
                        }}
                        className="p-2 hover:bg-indigo-950/40 cursor-pointer flex items-center justify-between text-xs"
                      >
                        <div className="truncate">
                          <span className="font-mono text-indigo-400 ml-1">#{p.id}</span>
                          <span className="text-slate-200">{p.name}</span>
                        </div>
                        <span className="text-slate-400 font-mono-numbers shrink-0">
                          ${p.costPriceUsd}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="sm:col-span-4 relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={customPriceInput}
                  onChange={(e) => setCustomPriceInput(e.target.value)}
                  placeholder="حد التنبيه ($)"
                  dir="ltr"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono-numbers"
                />
              </div>

              <div className="sm:col-span-2">
                <button
                  type="button"
                  onClick={handleAddProductThreshold}
                  disabled={!selectedProductId || !customPriceInput}
                  className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-lg text-xs font-medium transition-colors"
                >
                  إضافة
                </button>
              </div>
            </div>

            {/* List of active custom thresholds */}
            {Object.keys(productThresholds).length > 0 && (
              <div className="divide-y divide-slate-800/60 max-h-40 overflow-y-auto mt-2 pr-1">
                {Object.entries(productThresholds).map(([pid, thresh]) => {
                  const prod = products.find((p) => String(p.id) === String(pid));
                  const cost = prod ? prod.costPriceUsd : 0;
                  const isBelow = cost < thresh;
                  const diff = (thresh - cost).toFixed(3);

                  return (
                    <div
                      key={pid}
                      className="py-2 flex items-center justify-between text-xs gap-2"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="font-mono text-indigo-400 shrink-0">#{pid}</span>
                        <span className="text-slate-300 truncate">
                          {prod ? prod.name : `منتج #${pid}`}
                        </span>
                        <span className="text-slate-500 text-[11px] font-mono-numbers shrink-0">
                          (التكلفة الحالية: ${cost})
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-mono-numbers text-slate-200 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                          حد التنبيه: ${thresh}
                        </span>

                        {isBelow ? (
                          <span className="text-amber-400 bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded text-[10px] font-bold">
                            ⚡ أقل بـ ${diff}
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[10px]">فوق الحد</span>
                        )}

                        <button
                          type="button"
                          onClick={() => handleRemoveProductThreshold(pid)}
                          className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                          title="حذف هذا الحد"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-medium transition-colors"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors shadow-md shadow-indigo-600/20"
          >
            حفظ وتفعيل الحدود السعرية
          </button>
        </div>
      </div>
    </div>
  );
};
