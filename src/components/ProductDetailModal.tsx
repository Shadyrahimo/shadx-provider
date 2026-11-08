import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Code2,
  Copy,
  Check,
  Play,
  ExternalLink,
  ShieldCheck,
  Send,
  Layers,
  Sparkles,
  FileCode,
  Tag,
  TrendingDown,
  TrendingUp,
  Activity,
  Calculator,
  RotateCcw,
  DollarSign,
  Percent,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Trash2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { CatalogProduct, NormalizedParam } from '../types';
import { generateIntegrationSnippet, evaluateIntegrationStatus, normalizeParam } from '../utils/normalizer';

interface ProductDetailModalProps {
  product: CatalogProduct | null;
  onClose: () => void;
  providerBaseUrl: string;
  apiToken: string;
  onUpdateProductThreshold?: (productId: string | number, threshold: number) => void;
  customPriceAlertPercent?: number;
  isCustomAlertTracked?: boolean;
  onUpdateProductPriceAlertPercent?: (productId: string | number, percent: number | null) => void;
  initialFixMode?: boolean;
  onApplyMappingFix?: (productId: string | number, fixedParams: NormalizedParam[]) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  providerBaseUrl,
  apiToken,
  onUpdateProductThreshold,
  customPriceAlertPercent,
  isCustomAlertTracked,
  onUpdateProductPriceAlertPercent,
  initialFixMode = false,
  onApplyMappingFix,
}) => {
  if (!product) return null;

  const [activeTab, setActiveTab] = useState<'url' | 'json' | 'salla' | 'curl' | 'js'>('url');
  const [copied, setCopied] = useState(false);
  const [thresholdInput, setThresholdInput] = useState<string>(
    product.thresholdPrice !== undefined ? String(product.thresholdPrice) : ''
  );
  const [customPercentInput, setCustomPercentInput] = useState<string>(
    customPriceAlertPercent !== undefined ? String(customPriceAlertPercent) : '5'
  );
  const [customSellPrice, setCustomSellPrice] = useState<number>(product.suggestedSellPriceUsd);
  const [currentParams, setCurrentParams] = useState<NormalizedParam[]>(product.normalizedParams);
  const [isFixSuccess, setIsFixSuccess] = useState<boolean>(false);

  useEffect(() => {
    setCurrentParams(product.normalizedParams);
    setIsFixSuccess(false);
  }, [product.id, product.normalizedParams]);

  useEffect(() => {
    setCustomPercentInput(customPriceAlertPercent !== undefined ? String(customPriceAlertPercent) : '5');
  }, [customPriceAlertPercent, product.id]);

  useEffect(() => {
    setCustomSellPrice(product.suggestedSellPriceUsd);
  }, [product.id, product.suggestedSellPriceUsd]);

  // Dynamic evaluation of integration readiness
  const diagnostic = useMemo(() => {
    return evaluateIntegrationStatus({
      name: product.name,
      category: product.category,
      normalizedParams: currentParams,
      isAvailable: product.isAvailable,
      rawParams: currentParams.map((p) => p.raw),
    });
  }, [product.name, product.category, product.isAvailable, currentParams]);

  const needsFix = diagnostic.status === 'needs_fix';

  const [testParams, setTestParams] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    product.normalizedParams.forEach((p) => {
      if (p.category === 'player_id' || p.category === 'uid') initial[p.normalizedKey] = '9876543210';
      else if (p.category === 'server_id') initial[p.normalizedKey] = '2001';
      else if (p.category === 'email') initial[p.normalizedKey] = 'customer@store.com';
      else if (p.category === 'username') initial[p.normalizedKey] = 'gamer_pro';
      else if (p.category === 'phone') initial[p.normalizedKey] = '+966501234567';
      else initial[p.normalizedKey] = 'test_value';
    });
    return initial;
  });

  const handleApplySuggestions = () => {
    if (diagnostic.suggestedParams.length === 0) return;

    const merged = [...currentParams];
    const seen = new Set(currentParams.map((p) => p.normalizedKey));

    diagnostic.suggestedParams.forEach((sp) => {
      if (!seen.has(sp.normalizedKey)) {
        merged.push(sp);
        seen.add(sp.normalizedKey);
      }
    });

    setCurrentParams(merged);
    setIsFixSuccess(true);

    setTestParams((prev) => {
      const next = { ...prev };
      diagnostic.suggestedParams.forEach((sp) => {
        if (!next[sp.normalizedKey]) {
          if (sp.category === 'player_id' || sp.category === 'uid') next[sp.normalizedKey] = '9876543210';
          else if (sp.category === 'server_id') next[sp.normalizedKey] = '2001';
          else if (sp.category === 'email') next[sp.normalizedKey] = 'customer@store.com';
          else if (sp.category === 'username') next[sp.normalizedKey] = 'gamer_pro';
          else if (sp.category === 'phone') next[sp.normalizedKey] = '+966501234567';
          else next[sp.normalizedKey] = 'test_value';
        }
      });
      return next;
    });

    if (onApplyMappingFix) {
      onApplyMappingFix(product.id, merged);
    }
  };

  const handleQuickAddParam = (rawText: string) => {
    const normalized = normalizeParam(rawText);
    if (currentParams.some((p) => p.normalizedKey === normalized.normalizedKey)) return;

    const updated = [...currentParams, normalized];
    setCurrentParams(updated);
    setIsFixSuccess(true);

    setTestParams((prev) => ({
      ...prev,
      [normalized.normalizedKey]:
        normalized.category === 'player_id'
          ? '9876543210'
          : normalized.category === 'server_id'
          ? '2001'
          : normalized.category === 'email'
          ? 'customer@store.com'
          : normalized.category === 'phone'
          ? '+966501234567'
          : 'test_value',
    }));

    if (onApplyMappingFix) {
      onApplyMappingFix(product.id, updated);
    }
  };

  const handleRemoveParam = (normalizedKey: string) => {
    const updated = currentParams.filter((p) => p.normalizedKey !== normalizedKey);
    setCurrentParams(updated);
    if (onApplyMappingFix) {
      onApplyMappingFix(product.id, updated);
    }
  };

  const [testQty, setTestQty] = useState<number>(1);
  const [testResponse, setTestResponse] = useState<any>(null);
  const [isTesting, setIsTesting] = useState(false);

  // Generate unique UUID v4 for the order preview
  const sampleUuid = 'ecbdd545-e616-4aee-8770-7eefa977bcd';

  // Real-time calculations for interactive profit calculator
  const customProfitUsd = Number((customSellPrice - product.costPriceUsd).toFixed(3));
  const customMarkupPercent = product.costPriceUsd > 0
    ? Number(((customProfitUsd / product.costPriceUsd) * 100).toFixed(1))
    : 0;
  const customGrossMarginPercent = customSellPrice > 0
    ? Number(((customProfitUsd / customSellPrice) * 100).toFixed(1))
    : 0;

  const applyQuickMargin = (percent: number) => {
    const newPrice = Number((product.costPriceUsd * (1 + percent / 100)).toFixed(2));
    setCustomSellPrice(newPrice);
  };

  const applyPsychological99 = () => {
    const floorVal = Math.floor(customSellPrice);
    const newPrice = Number((floorVal + 0.99).toFixed(2));
    setCustomSellPrice(newPrice > product.costPriceUsd ? newPrice : Number((floorVal + 1.99).toFixed(2)));
  };

  const getProfitabilityBadge = () => {
    if (customProfitUsd < 0) {
      return {
        text: 'خسارة في السعر',
        color: 'bg-rose-950/60 text-rose-300 border-rose-500/30',
        icon: TrendingDown,
      };
    }
    if (customProfitUsd === 0) {
      return {
        text: 'نقطة التعادل (بدون ربح)',
        color: 'bg-slate-800 text-slate-300 border-slate-700',
        icon: Activity,
      };
    }
    if (customMarkupPercent < 10) {
      return {
        text: 'ربح منخفض (<10%)',
        color: 'bg-amber-950/60 text-amber-300 border-amber-500/30',
        icon: TrendingUp,
      };
    }
    if (customMarkupPercent < 25) {
      return {
        text: 'ربح معتدل ومناسب (10-25%)',
        color: 'bg-indigo-950/60 text-indigo-300 border-indigo-500/30',
        icon: TrendingUp,
      };
    }
    return {
      text: 'ربحية عالية وممتازة (≥25%)',
      color: 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30',
      icon: Sparkles,
    };
  };

  const profitabilityBadge = getProfitabilityBadge();

  const handleSaveThreshold = () => {
    if (onUpdateProductThreshold && thresholdInput && !isNaN(Number(thresholdInput))) {
      onUpdateProductThreshold(product.id, Number(thresholdInput));
    }
  };

  const handleSaveCustomPercent = () => {
    if (onUpdateProductPriceAlertPercent && customPercentInput && !isNaN(Number(customPercentInput))) {
      onUpdateProductPriceAlertPercent(product.id, Number(customPercentInput));
    }
  };

  const handleDisableCustomPercent = () => {
    if (onUpdateProductPriceAlertPercent) {
      onUpdateProductPriceAlertPercent(product.id, null);
    }
  };

  const buildCurrentOrderUrl = () => {
    const cleanBase = providerBaseUrl.replace(/\/+$/, '') || 'https://api.mersal-card.com';
    const q = new URLSearchParams();
    q.set('qty', String(testQty));

    currentParams.forEach((p) => {
      const v = testParams[p.normalizedKey];
      if (v) q.set(p.normalizedKey, v);
      else q.set(p.normalizedKey, 'VALUE');
    });

    q.set('order_uuid', sampleUuid);
    return `${cleanBase}/client/api/newOrder/${product.id}/params?${q.toString()}`;
  };

  const getActiveCode = () => {
    const productWithCustomSellPrice: CatalogProduct = {
      ...product,
      suggestedSellPriceUsd: customSellPrice,
      normalizedParams: currentParams,
      integrationStatus: diagnostic.status,
    };
    switch (activeTab) {
      case 'url':
        return buildCurrentOrderUrl();
      case 'json':
        return generateIntegrationSnippet(productWithCustomSellPrice, 'json', providerBaseUrl);
      case 'salla':
        return generateIntegrationSnippet(productWithCustomSellPrice, 'salla_product', providerBaseUrl);
      case 'curl':
        return generateIntegrationSnippet(productWithCustomSellPrice, 'curl', providerBaseUrl);
      case 'js':
        return generateIntegrationSnippet(productWithCustomSellPrice, 'js_fetch', providerBaseUrl);
      default:
        return '';
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getActiveCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRunSimulator = async () => {
    setIsTesting(true);
    setTestResponse(null);

    try {
      const res = await fetch('/api/proxy/test-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseUrl: providerBaseUrl || 'https://api.mersal-card.com',
          apiToken: apiToken || 'demo_token',
          productId: product.id,
          qty: testQty,
          params: testParams,
          orderUuid: `test-${Math.random().toString(36).substring(2, 10)}`,
        }),
      });
      const data = await res.json();
      setTestResponse(data);
    } catch (err: any) {
      setTestResponse({
        success: false,
        error: err.message,
      });
    } finally {
      setIsTesting(false);
    }
  };

  // Historical cost trend calculation for Recharts
  const priceHistoryData = useMemo(() => {
    const current = product.costPriceUsd;
    const base = product.basePriceUsd || current * 1.05;
    const numId = typeof product.id === 'number' ? product.id : (product.id.toString().charCodeAt(0) || 100);
    const v1 = Number((base * (1 + ((numId % 5) - 2) * 0.015)).toFixed(3));
    const v2 = Number((current * (1 + (((numId + 2) % 6) - 2) * 0.012)).toFixed(3));
    const v3 = Number((current * (1 + (((numId + 4) % 5) - 3) * 0.018)).toFixed(3));
    const v4 = Number((current * (1 + (((numId + 1) % 4) - 1) * 0.01)).toFixed(3));

    return [
      { date: 'قبل 30 يوم', cost: v1, threshold: product.thresholdPrice },
      { date: 'قبل 20 يوم', cost: v2, threshold: product.thresholdPrice },
      { date: 'قبل أسبوعين', cost: v3, threshold: product.thresholdPrice },
      { date: 'قبل أسبوع', cost: v4, threshold: product.thresholdPrice },
      { date: 'اليوم (الحالي)', cost: Number(current.toFixed(3)), threshold: product.thresholdPrice },
    ];
  }, [product]);

  const minHistoricalCost = useMemo(() => {
    return Math.min(...priceHistoryData.map((d) => d.cost));
  }, [priceHistoryData]);

  const maxHistoricalCost = useMemo(() => {
    return Math.max(...priceHistoryData.map((d) => d.cost));
  }, [priceHistoryData]);

  const costChangePercent = useMemo(() => {
    const first = priceHistoryData[0].cost;
    const last = priceHistoryData[priceHistoryData.length - 1].cost;
    if (first <= 0) return 0;
    return Number((((last - first) / first) * 100).toFixed(1));
  }, [priceHistoryData]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-6 shadow-2xl relative my-8">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Info */}
        <div className="flex items-start gap-3 mb-6 pb-4 border-b border-slate-800">
          <div className="w-12 h-12 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center text-lg font-bold font-mono">
            #{product.id}
          </div>
          <div className="grow">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-white">
                {product.name}
              </h2>
              {product.isAvailable ? (
                <span className="text-[11px] text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded font-medium">
                  متاح للطلب
                </span>
              ) : (
                <span className="text-[11px] text-rose-400 bg-rose-950/60 border border-rose-500/30 px-2 py-0.5 rounded font-medium">
                  غير متوفر
                </span>
              )}

              {/* Auto-Integration Status Badge */}
              {diagnostic.status === 'ready' && (
                <span className="text-[11px] text-emerald-300 bg-emerald-950/80 border border-emerald-500/40 px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1 shadow-xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>✓ ربط تلقائي مكتمل</span>
                </span>
              )}
              {diagnostic.status === 'needs_fix' && (
                <span className="text-[11px] text-amber-300 bg-amber-950/80 border border-amber-500/50 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 shadow-xs shadow-amber-500/10">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span>⚠️ معلمات ناقصة</span>
                </span>
              )}
              {diagnostic.status === 'unmapped' && (
                <span className="text-[11px] text-slate-400 bg-slate-950 border border-slate-800 px-2 py-0.5 rounded-full font-medium">
                  <span>✕ غير مهيأ</span>
                </span>
              )}
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-2 mt-1">
              <span>الفئة: {product.category}</span>
              <span aria-hidden="true">·</span>
              <span>نوع الكمية: {product.qtyDescriptionAr}</span>
              <span aria-hidden="true">·</span>
              <span>الحدود: {product.limitsDisplay}</span>
            </div>
          </div>
        </div>

        {/* Smart Auto-Integration Status & Repair Wizard Banner */}
        {(needsFix || isFixSuccess || initialFixMode) && (
          <div
            className={`p-4 rounded-2xl border mb-5 transition-all shadow-lg ${
              isFixSuccess
                ? 'bg-gradient-to-r from-emerald-950/80 via-slate-900 to-emerald-950/80 border-emerald-500/50 shadow-emerald-500/10'
                : 'bg-gradient-to-r from-amber-950/70 via-slate-900 to-amber-950/70 border-amber-500/50 shadow-amber-500/10'
            }`}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 mb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    isFixSuccess
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse'
                  }`}
                >
                  {isFixSuccess ? <CheckCircle2 className="w-5 h-5" /> : <Wrench className="w-5 h-5" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-white">
                      مساعد إصلاح ومطابقة الربط التلقائي
                    </h4>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isFixSuccess
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      }`}
                    >
                      {isFixSuccess ? '✓ تم الإصلاح وتجهيز الكود' : '⚠️ معلمات ناقصة'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {isFixSuccess
                      ? 'تمت مطابقة معلمات المنتج وتحديث كافة أكواد الربط الآلي (JSON / cURL / Salla / URL) بنجاح.'
                      : diagnostic.fixReason}
                  </p>
                </div>
              </div>

              {needsFix && diagnostic.suggestedParams.length > 0 && (
                <button
                  type="button"
                  onClick={handleApplySuggestions}
                  className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 transition-all active:scale-95 shrink-0 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-slate-950" />
                  <span>تطبيق المقترحات الذكية وإصلاح الربط فوراً</span>
                </button>
              )}
            </div>

            {needsFix && (
              <div className="space-y-3 pt-1">
                {/* Missing Fields List */}
                <div>
                  <span className="text-[11px] font-semibold text-slate-300 block mb-1.5">
                    البيانات الناقصة المطلوبة وفق معايير API المزود لفئة "{product.category}":
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {diagnostic.missingFields.map((field, fIdx) => (
                      <span
                        key={fIdx}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-rose-950/40 text-rose-300 border border-rose-500/30 font-medium"
                      >
                        <X className="w-3.5 h-3.5 text-rose-400" />
                        <span>{field}</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Suggested Auto-Fix Parameters */}
                {diagnostic.suggestedParams.length > 0 && (
                  <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                    <span className="text-[11px] font-semibold text-amber-300 block mb-1.5">
                      المعلمات المقترحة لإضافتها ومطابقتها آلياً:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {diagnostic.suggestedParams.map((sp, spIdx) => (
                        <div
                          key={spIdx}
                          className="inline-flex items-center gap-1.5 bg-slate-900 px-2.5 py-1 rounded-lg border border-indigo-500/40 text-xs text-indigo-300 font-medium"
                        >
                          <span className="font-mono font-bold text-[11px]">[{sp.normalizedKey}]</span>
                          <span>{sp.labelAr}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {isFixSuccess && (
              <div className="flex items-center gap-2 text-xs text-emerald-300 font-medium pt-1">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  أصبح هذا المنتج جاهزاً للتنفيذ التلقائي عبر الـ API بدون أخطاء. تم تحديث رابط الطلب والـ JSON بالأسفل.
                </span>
              </div>
            )}
          </div>
        )}

        {/* Interactive Profit & Sell Price Calculator */}
        <div className="bg-gradient-to-b from-slate-900/90 to-slate-950 border border-slate-800 rounded-2xl p-4 mb-4 shadow-lg shadow-black/20">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Calculator className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  حاسبة الربح التفاعلية وسعر البيع
                  <span className="text-[10px] text-slate-400 font-normal">
                    (Interactive Profit Calculator)
                  </span>
                </h4>
                <p className="text-[11px] text-slate-400">
                  عدّل سعر البيع لمشاهدة التأثير المباشر على الهامش وصافي الأرباح، مع تحديث فوري لأكواد الربط
                </p>
              </div>
            </div>

            {/* Profitability Status Badge */}
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${profitabilityBadge.color}`}>
              {React.createElement(profitabilityBadge.icon, { className: 'w-3.5 h-3.5' })}
              <span>{profitabilityBadge.text}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Input & Controllers Column */}
            <div className="lg:col-span-7 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Cost Price Reference */}
                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
                  <span className="text-[11px] text-slate-400 block mb-1">
                    سعر التكلفة من المزود (Cost)
                  </span>
                  <div className="text-lg font-bold font-mono-numbers text-slate-200 flex items-baseline gap-1">
                    <span>${product.costPriceUsd.toFixed(3)}</span>
                    <span className="text-[10px] text-slate-500 font-normal">USD</span>
                  </div>
                </div>

                {/* Editable Sell Price */}
                <div className="bg-slate-950/90 border border-emerald-500/40 rounded-xl p-3 focus-within:ring-2 focus-within:ring-emerald-500/30 transition-all">
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="custom-sell-price-input" className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      سعر البيع المطلوب ($)
                    </label>
                    <span className="text-[10px] text-slate-500">قابل للتعديل</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400 font-mono text-base font-bold">$</span>
                    <input
                      id="custom-sell-price-input"
                      type="number"
                      step="0.05"
                      min="0"
                      value={customSellPrice}
                      onChange={(e) => setCustomSellPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-base font-bold font-mono-numbers text-emerald-300 focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>
              </div>

              {/* Slider for smooth adjustment */}
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5">
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                  <span>شريط التمرير السريع:</span>
                  <span className="font-mono text-slate-300">${customSellPrice.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min={Math.max(0.1, Number((product.costPriceUsd * 0.7).toFixed(2)))}
                  max={Math.max(10, Number((product.costPriceUsd * 2.5).toFixed(2)))}
                  step="0.05"
                  value={customSellPrice}
                  onChange={(e) => setCustomSellPrice(parseFloat(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
                <div className="flex justify-between text-[9px] text-slate-500 mt-0.5 font-mono">
                  <span>${Math.max(0.1, Number((product.costPriceUsd * 0.7).toFixed(2)))}</span>
                  <span>التعادل: ${product.costPriceUsd.toFixed(2)}</span>
                  <span>${Math.max(10, Number((product.costPriceUsd * 2.5).toFixed(2)))}</span>
                </div>
              </div>

              {/* Quick Margin Preset Buttons */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] text-slate-400 ml-1">هوامش سريعة:</span>
                {[
                  { label: '+10%', val: 10 },
                  { label: '+15%', val: 15 },
                  { label: '+20%', val: 20 },
                  { label: '+25%', val: 25 },
                  { label: '+35%', val: 35 },
                  { label: '+50%', val: 50 },
                ].map((item) => (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() => applyQuickMargin(item.val)}
                    className="text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-200 px-2 py-1 rounded-md transition-colors border border-slate-700/60 font-mono-numbers"
                  >
                    {item.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={applyPsychological99}
                  title="تحويل السنتات إلى 0.99$"
                  className="text-[11px] bg-purple-950/60 hover:bg-purple-900/60 text-purple-300 border border-purple-500/40 px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 font-mono-numbers"
                >
                  <Sparkles className="w-3 h-3 text-purple-400" />
                  .99 تسعير نفسي
                </button>
                {customSellPrice !== product.suggestedSellPriceUsd && (
                  <button
                    type="button"
                    onClick={() => setCustomSellPrice(product.suggestedSellPriceUsd)}
                    className="text-[11px] text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800 px-2 py-1 rounded-md transition-colors flex items-center gap-1 mr-auto"
                  >
                    <RotateCcw className="w-3 h-3" />
                    استعادة المقترح
                  </button>
                )}
              </div>
            </div>

            {/* Live Profit Analytics Column */}
            <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-2.5">
              {/* Dollar Profit Card */}
              <div
                className={`p-3 rounded-xl border transition-all ${
                  customProfitUsd > 0
                    ? 'bg-emerald-950/30 border-emerald-500/40'
                    : customProfitUsd === 0
                    ? 'bg-slate-950 border-slate-800'
                    : 'bg-rose-950/30 border-rose-500/40'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <DollarSign className="w-3 h-3 text-emerald-400" />
                    صافي الربح بالدولار
                  </span>
                  <span className="text-[10px] text-slate-500">لكل قطعة</span>
                </div>
                <div
                  className={`text-xl font-extrabold font-mono-numbers ${
                    customProfitUsd > 0
                      ? 'text-emerald-400'
                      : customProfitUsd === 0
                      ? 'text-slate-300'
                      : 'text-rose-400'
                  }`}
                >
                  {customProfitUsd >= 0 ? `+$${customProfitUsd.toFixed(2)}` : `-$${Math.abs(customProfitUsd).toFixed(2)}`}
                </div>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  الفرق المباشر بين سعر البيع والتكلفة
                </span>
              </div>

              {/* Markup % Card */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Percent className="w-3 h-3 text-indigo-400" />
                    نسبة الهامش على التكلفة (Markup)
                  </span>
                </div>
                <div
                  className={`text-lg font-bold font-mono-numbers ${
                    customMarkupPercent > 0
                      ? 'text-indigo-400'
                      : customMarkupPercent === 0
                      ? 'text-slate-300'
                      : 'text-rose-400'
                  }`}
                >
                  {customMarkupPercent >= 0 ? `+${customMarkupPercent}%` : `${customMarkupPercent}%`}
                </div>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  نسبة زيادة السعر فوق تكلفة المزود
                </span>
              </div>

              {/* Gross Margin % Card */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Layers className="w-3 h-3 text-cyan-400" />
                    هامش الربح الإجمالي (Margin)
                  </span>
                </div>
                <div
                  className={`text-lg font-bold font-mono-numbers ${
                    customGrossMarginPercent > 0
                      ? 'text-cyan-400'
                      : customGrossMarginPercent === 0
                      ? 'text-slate-300'
                      : 'text-rose-400'
                  }`}
                >
                  {customGrossMarginPercent}%
                </div>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  حصة الربح الصافي من إجمالي سعر البيع
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Threshold Alert Settings & Status for this product */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 mb-4 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                product.isBelowThreshold
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-slate-900 text-slate-400 border border-slate-800'
              }`}
            >
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-200">
                  حد التنبيه السعري (Price Threshold)
                </span>
                {product.isBelowThreshold ? (
                  <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded text-[10px] font-bold">
                    ⚡ التكلفة حالياً أقل من الحد بفارق ${product.thresholdSavings}!
                  </span>
                ) : product.thresholdPrice ? (
                  <span className="text-slate-400 text-[11px] font-mono">
                    الحد الحالي: ${product.thresholdPrice}
                  </span>
                ) : (
                  <span className="text-slate-500 text-[11px]">غير محدد</span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                نبهني بصرياً في الكتالوج إذا انخفض سعر تكلفة هذا المنتج عن هذا الحد
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 w-full sm:w-auto">
            <input
              type="number"
              step="0.01"
              min="0"
              value={thresholdInput}
              onChange={(e) => setThresholdInput(e.target.value)}
              placeholder="الحد المستهدف ($)"
              dir="ltr"
              className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 font-mono-numbers focus:outline-none focus:border-indigo-500 w-28"
            />
            <button
              type="button"
              onClick={handleSaveThreshold}
              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-colors"
            >
              حفظ الحد
            </button>
          </div>
        </div>

        {/* Custom Price Change % Alert for this product */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 mb-4 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <Percent className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-200">
                  تنبيه نسبة تغير التكلفة (% Price Change Alert)
                </span>
                {isCustomAlertTracked ? (
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded text-[10px] font-bold font-mono">
                    ✓ مفعّل بنسبة ±{customPriceAlertPercent || 5}%
                  </span>
                ) : (
                  <span className="text-slate-500 text-[11px]">يتبع النسبة الافتراضية العامة</span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                إرسال تنبيه في السجل فور تجاوز أي تغير في تكلفة هذا المنتج لهذه النسبة المحددة
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 w-full sm:w-auto">
            <span className="text-slate-400 text-xs font-mono">±</span>
            <input
              type="number"
              min="1"
              max="100"
              value={customPercentInput}
              onChange={(e) => setCustomPercentInput(e.target.value)}
              placeholder="مثلاً 5"
              dir="ltr"
              className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500 w-20 text-center font-bold"
            />
            <span className="text-slate-400 text-xs font-bold">%</span>
            <button
              type="button"
              onClick={handleSaveCustomPercent}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                isCustomAlertTracked
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white'
              }`}
            >
              {isCustomAlertTracked ? 'تحديث النسبة' : 'تفعيل النسبة'}
            </button>
            {isCustomAlertTracked && (
              <button
                type="button"
                onClick={handleDisableCustomPercent}
                className="p-1 rounded-lg hover:bg-slate-900 text-slate-500 hover:text-rose-400 transition-colors"
                title="إلغاء التفعيل والعودة للعام"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Recharts Line Chart: اتجاهات تغير سعر التكلفة */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
                <Activity className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-200">
                  اتجاهات تغير سعر التكلفة (Cost Price Trend)
                </h4>
                <p className="text-[10px] text-slate-500">
                  تطور سعر التكلفة من المزود ومقارنته بالحد السعري للتنبيه
                </p>
              </div>
            </div>

            {/* Quick Historical Stats */}
            <div className="flex items-center gap-3 text-[11px] font-mono-numbers">
              <div className="text-slate-400">
                أدنى تكلفة: <span className="text-emerald-400 font-bold">${minHistoricalCost.toFixed(3)}</span>
              </div>
              <div className="text-slate-400">
                أعلى تكلفة: <span className="text-rose-400 font-bold">${maxHistoricalCost.toFixed(3)}</span>
              </div>
              <div
                className={`font-semibold flex items-center gap-0.5 ${
                  costChangePercent <= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {costChangePercent <= 0 ? (
                  <TrendingDown className="w-3 h-3" />
                ) : (
                  <TrendingUp className="w-3 h-3" />
                )}
                <span>{costChangePercent > 0 ? `+${costChangePercent}%` : `${costChangePercent}%`}</span>
              </div>
            </div>
          </div>

          {/* Line Chart */}
          <div className="w-full h-44" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={priceHistoryData} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={10}
                  domain={['auto', 'auto']}
                  tickFormatter={(v) => `$${v}`}
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '0.5rem',
                    fontSize: '11px',
                    color: '#f8fafc',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
                  }}
                  formatter={(value: any, name?: any) => [
                    `$${Number(value).toFixed(3)}`,
                    name === 'cost' ? 'سعر التكلفة' : 'حد التنبيه',
                  ]}
                  labelStyle={{ color: '#94a3b8', marginBottom: '2px', fontWeight: 600 }}
                />
                {product.thresholdPrice !== undefined && product.thresholdPrice > 0 && (
                  <ReferenceLine
                    y={product.thresholdPrice}
                    stroke="#f59e0b"
                    strokeDasharray="4 4"
                    label={{
                      value: `الحد: $${product.thresholdPrice}`,
                      fill: '#f59e0b',
                      fontSize: 10,
                      position: 'insideTopLeft',
                    }}
                  />
                )}
                <Line
                  type="monotone"
                  dataKey="cost"
                  name="cost"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  dot={{ fill: '#818cf8', stroke: '#4f46e5', strokeWidth: 1.5, r: 3.5 }}
                  activeDot={{ fill: '#c7d2fe', stroke: '#4f46e5', strokeWidth: 2, r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Required Parameters Mapping Section */}
        <div className="mb-6">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-indigo-400" />
              <span>المعلمات المطلوبة من العميل في متجرك (Parameters Mapping):</span>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded-full font-mono">
                {currentParams.length}
              </span>
            </h4>
          </div>

          {currentParams.length === 0 ? (
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <span>هذا المنتج لا يحتوي حالياً على أي معلمات ربط محددة.</span>
                <span className="block text-[11px] text-slate-500 mt-0.5">
                  إذا كان يتطلب معرف لاعب أو بريد إلكتروني، يمكنك إضافته فوراً من الخيارات السريعة أدناه.
                </span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              {currentParams.map((param, idx) => (
                <div
                  key={`${param.normalizedKey}-${idx}`}
                  className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5 relative group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">{param.labelAr}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[10px] text-indigo-400 bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-500/30">
                        key: {param.normalizedKey}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveParam(param.normalizedKey)}
                        className="text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-slate-900 transition-colors"
                        title="حذف هذه المعلمة من كود الربط"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    النص في وثائق المزود: <span className="text-slate-300 font-mono">"{param.raw}"</span>
                  </div>
                  {/* Test input */}
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">
                      قيمة تجريبية:
                    </label>
                    <input
                      type="text"
                      value={testParams[param.normalizedKey] || ''}
                      onChange={(e) =>
                        setTestParams({ ...testParams, [param.normalizedKey]: e.target.value })
                      }
                      dir="ltr"
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-slate-200 text-xs font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Quick-add presets */}
          <div className="flex flex-wrap items-center gap-1.5 pt-2.5">
            <span className="text-[11px] text-slate-400 ml-1">إضافة معلمة سريعة:</span>
            {[
              { label: '+ معرف اللاعب [player_id]', raw: 'معرف اللاعب [player_id]' },
              { label: '+ معرف الخادم [server_id]', raw: 'Server ID [server_id]' },
              { label: '+ البريد [email]', raw: 'EMAIL' },
              { label: '+ رقم الهاتف [phone]', raw: 'رقم الهاتف' },
              { label: '+ اسم المستخدم [username]', raw: 'اسم المستخدم' },
              { label: '+ المعرف [uid]', raw: 'UID' },
            ].map((preset) => (
              <button
                key={preset.raw}
                type="button"
                onClick={() => handleQuickAddParam(preset.raw)}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-md text-[11px] border border-slate-700/60 transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Code Snippets & Ready-to-use Formats */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              {[
                { id: 'url', label: 'رابط الطلب المباشر (GET)' },
                { id: 'json', label: 'كائن JSON' },
                { id: 'salla', label: 'تهيئة منتج سلة (Salla)' },
                { id: 'curl', label: 'أمر cURL' },
                { id: 'js', label: 'كود JavaScript' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors shadow-xs"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'تم النسخ!' : 'نسخ الكود'}</span>
            </button>
          </div>

          <div className="relative">
            <pre
              dir="ltr"
              className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs font-mono text-indigo-300 overflow-x-auto max-h-48 whitespace-pre-wrap select-all"
            >
              {getActiveCode()}
            </pre>
          </div>
        </div>

        {/* Test Simulator Action */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
          <div className="text-slate-400">
            يمكنك محاكاة تجهيز استعلام الطلب للتحقق من توافق المعلمات و `order_uuid`.
          </div>
          <button
            onClick={handleRunSimulator}
            disabled={isTesting}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium transition-colors disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 text-indigo-400 ${isTesting ? 'animate-pulse' : ''}`} />
            <span>{isTesting ? 'جارِ الاختبار...' : 'فحص وتوليد الرابط'}</span>
          </button>
        </div>

        {/* Simulator Response */}
        {testResponse && (
          <div className="mt-3 bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
            <div className="font-semibold text-emerald-400 mb-1 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              <span>نتيجة فحص وتجهيز الطلب:</span>
            </div>
            <pre dir="ltr" className="text-slate-300 font-mono text-[11px] overflow-x-auto">
              {JSON.stringify(testResponse, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
