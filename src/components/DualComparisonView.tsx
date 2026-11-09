import React, { useState, useMemo, useEffect } from 'react';
import {
  Scale,
  Globe,
  KeyRound,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Trophy,
  ArrowLeftRight,
  Search,
  Sparkles,
  Download,
  Code2,
  AlertCircle,
  TrendingDown,
  Wallet,
  Layers,
  Link2,
  Plus,
  Trash2,
} from 'lucide-react';
import {
  CatalogProduct,
  MarginConfig,
  PriceThresholdConfig,
  ProviderPreset,
  RawProviderProduct,
} from '../types';
import { PROVIDER_PRESETS } from '../data/mockCatalog';
import { transformRawProduct, buildBackendUrl } from '../utils/normalizer';

interface DualComparisonViewProps {
  // Provider A (Primary Provider from main app state)
  providerAName: string;
  setProviderAName: (name: string) => void;
  baseUrlA: string;
  setBaseUrlA: (url: string) => void;
  apiTokenA: string;
  setApiTokenA: (token: string) => void;
  productsA: CatalogProduct[];
  isLiveConnectedA: boolean;
  userBalanceA: string | null;
  isLoadingA: boolean;
  onFetchProviderA: () => Promise<void>;
  // Shared Pricing Config
  marginConfig: MarginConfig;
  thresholdConfig: PriceThresholdConfig;
  // Pre-selected product from Catalog Table (optional)
  focusedProductAId?: string | number | null;
  onClearFocusedProduct?: () => void;
  // Open Product Detail Modal for winning provider
  onOpenProductDetail: (product: CatalogProduct, providerUrlOverride?: string) => void;
}

export interface ComparisonPair {
  pairId: string;
  productA: CatalogProduct;
  productB: CatalogProduct;
  matchType: 'exact_id' | 'smart_name' | 'manual';
  similarityScore: number;
  cheaperSide: 'A' | 'B' | 'equal';
  recommendedSide: 'A' | 'B' | 'equal' | 'none';
  priceDiffUsd: number; // abs(costA - costB)
  savingsPercent: number; // savings % relative to the more expensive provider
}

/**
 * Extracts normalized tokens and numeric denominations from product names
 * to automatically pair identical products across two different providers.
 */
function normalizeProductSignature(name: string): {
  cleanText: string;
  numbers: string[];
  tokens: string[];
} {
  const lower = (name || '')
    .toLowerCase()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[^\w\u0600-\u06FF\s\d.]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const numbers: string[] = lower.match(/\d+(\.\d+)?/g) || [];
  const stopWords = new Set([
    'بطاقه',
    'بطاقة',
    'شحن',
    'رصيد',
    'كود',
    'مباشر',
    'فوري',
    'حساب',
    'اشتراك',
    'باقه',
    'card',
    'code',
    'direct',
    'topup',
    'recharge',
  ]);

  const tokens = lower
    .split(' ')
    .filter((w) => w.length > 1 && !stopWords.has(w) && !/^\d+$/.test(w));

  return { cleanText: lower, numbers, tokens };
}

function calculateProductSimilarity(prodA: CatalogProduct, prodB: CatalogProduct): number {
  if (String(prodA.id) === String(prodB.id) && prodA.name.trim() === prodB.name.trim()) {
    return 1.0;
  }

  const sigA = normalizeProductSignature(prodA.name);
  const sigB = normalizeProductSignature(prodB.name);

  if (sigA.cleanText === sigB.cleanText && sigA.cleanText.length > 0) {
    return 0.98;
  }

  // Numeric denominations (e.g. 60 UC, $10, 325 diamonds) must match if both have numbers
  if (sigA.numbers.length > 0 && sigB.numbers.length > 0) {
    const numMatch = sigA.numbers.some((n) => sigB.numbers.includes(n));
    if (!numMatch) {
      return 0.1;
    }
  }

  if (sigA.tokens.length === 0 || sigB.tokens.length === 0) {
    return String(prodA.id) === String(prodB.id) ? 0.75 : 0;
  }

  const setB = new Set(sigB.tokens);
  let shared = 0;
  sigA.tokens.forEach((t) => {
    if (setB.has(t)) shared++;
  });

  const unionSize = new Set([...sigA.tokens, ...sigB.tokens]).size;
  const jaccard = unionSize > 0 ? shared / unionSize : 0;

  // Boost if numbers also matched
  const numberBonus =
    sigA.numbers.length > 0 &&
    sigB.numbers.length > 0 &&
    sigA.numbers.every((n) => sigB.numbers.includes(n))
      ? 0.25
      : 0;

  return Math.min(0.95, jaccard + numberBonus);
}

export const DualComparisonView: React.FC<DualComparisonViewProps> = ({
  providerAName,
  setProviderAName,
  baseUrlA,
  setBaseUrlA,
  apiTokenA,
  setApiTokenA,
  productsA,
  isLiveConnectedA,
  userBalanceA,
  isLoadingA,
  onFetchProviderA,
  marginConfig,
  thresholdConfig,
  focusedProductAId,
  onClearFocusedProduct,
  onOpenProductDetail,
}) => {
  // Provider B Credentials State (persisted in localStorage)
  const [selectedPresetB, setSelectedPresetB] = useState<ProviderPreset>(
    PROVIDER_PRESETS[1] || PROVIDER_PRESETS[0]
  );
  const [providerBName, setProviderBName] = useState<string>(
    () => localStorage.getItem('shadx_provider_b_name') || 'المزود الثاني (B)'
  );
  const [baseUrlB, setBaseUrlB] = useState<string>(
    () => localStorage.getItem('shadx_provider_b_url') || ''
  );
  const [apiTokenB, setApiTokenB] = useState<string>(
    () => localStorage.getItem('shadx_provider_b_token') || ''
  );

  const [showTokenA, setShowTokenA] = useState<boolean>(false);
  const [showTokenB, setShowTokenB] = useState<boolean>(false);
  const [showCredentialsPanel, setShowCredentialsPanel] = useState<boolean>(true);

  const [rawProductsB, setRawProductsB] = useState<RawProviderProduct[]>(() => {
    try {
      const saved = localStorage.getItem('shadx_provider_b_products');
      if (saved) return JSON.parse(saved);
    } catch {
      // Ignore parse error
    }
    return [];
  });
  const [isLiveConnectedB, setIsLiveConnectedB] = useState<boolean>(() => rawProductsB.length > 0);
  const [userBalanceB, setUserBalanceB] = useState<string | null>(null);
  const [isLoadingB, setIsLoadingB] = useState<boolean>(false);
  const [statusBanner, setStatusBanner] = useState<{
    text: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  // Manual product pairings (ProductA ID -> ProductB ID)
  const [manualPairings, setManualPairings] = useState<Record<string | number, string | number>>(
    () => {
      try {
        const saved = localStorage.getItem('shadx_dual_manual_pairings');
        if (saved) return JSON.parse(saved);
      } catch {
        // Ignore
      }
      return {};
    }
  );

  // Selected single product spotlight comparison
  const [spotlightProductAId, setSpotlightProductAId] = useState<string | number | ''>('');
  const [spotlightProductBId, setSpotlightProductBId] = useState<string | number | ''>('');

  // Table Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [winnerFilter, setWinnerFilter] = useState<'all' | 'A' | 'B' | 'equal'>('all');

  useEffect(() => {
    localStorage.setItem('shadx_provider_b_name', providerBName);
  }, [providerBName]);

  useEffect(() => {
    localStorage.setItem('shadx_provider_b_url', baseUrlB);
  }, [baseUrlB]);

  useEffect(() => {
    localStorage.setItem('shadx_provider_b_token', apiTokenB);
  }, [apiTokenB]);

  useEffect(() => {
    try {
      localStorage.setItem('shadx_dual_manual_pairings', JSON.stringify(manualPairings));
    } catch {
      // Ignore quota
    }
  }, [manualPairings]);

  // Transform rawProductsB into CatalogProduct[]
  const productsB = useMemo(() => {
    return rawProductsB.map((raw) => transformRawProduct(raw, marginConfig, thresholdConfig));
  }, [rawProductsB, marginConfig, thresholdConfig]);

  // If user clicked "Compare" on a specific product in Catalog Table, focus it in Spotlight
  useEffect(() => {
    if (focusedProductAId !== undefined && focusedProductAId !== null) {
      setSpotlightProductAId(focusedProductAId);
    } else if (!spotlightProductAId && productsA.length > 0) {
      setSpotlightProductAId(productsA[0].id);
    }
  }, [focusedProductAId, productsA]);

  // Fetch Provider B Catalog via Backend Proxy
  const handleFetchProviderB = async () => {
    if (!baseUrlB.trim() || !apiTokenB.trim()) {
      setStatusBanner({
        text: 'يرجى إدخال عنوان الـ API (Base URL) ورمز التوثيق (API Token) للمزود الثاني (B) أولاً.',
        type: 'error',
      });
      return;
    }

    setIsLoadingB(true);
    setStatusBanner(null);

    try {
      const prodRes = await fetch(buildBackendUrl('/api/proxy/products'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baseUrl: baseUrlB, apiToken: apiTokenB }),
      });

      const prodData = await prodRes.json();
      if (!prodData.success) {
        throw new Error(prodData.error || 'فشل في جلب منتجات المزود الثاني');
      }

      const receivedList: RawProviderProduct[] = Array.isArray(prodData.data)
        ? prodData.data
        : prodData.data?.products || [];

      setRawProductsB(receivedList);
      try {
        localStorage.setItem('shadx_provider_b_products', JSON.stringify(receivedList));
      } catch {
        // Ignore storage quota
      }
      setIsLiveConnectedB(true);

      // Fetch Provider B Balance
      try {
        const profRes = await fetch(buildBackendUrl('/api/proxy/profile'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ baseUrl: baseUrlB, apiToken: apiTokenB }),
        });
        const profData = await profRes.json();
        if (profData.success && profData.data?.balance !== undefined) {
          setUserBalanceB(String(profData.data.balance));
        }
      } catch {
        // Balance is optional
      }

      setStatusBanner({
        text: `✅ تم جلب ${receivedList.length} منتج من "${providerBName}" ومطابقتها للمقارنة المزدوجة بنجاح!`,
        type: 'success',
      });
    } catch (err: any) {
      setStatusBanner({
        text: `❌ تعذر الاتصال بالمزود الثاني (${err.message}). تأكد من صحة رابط Base URL ورمز التوثيق.`,
        type: 'error',
      });
    } finally {
      setIsLoadingB(false);
    }
  };

  // Fetch Both Providers Simultaneously
  const handleFetchBothProviders = async () => {
    setStatusBanner(null);
    await Promise.all([
      baseUrlA.trim() && apiTokenA.trim() ? onFetchProviderA() : Promise.resolve(),
      baseUrlB.trim() && apiTokenB.trim() ? handleFetchProviderB() : Promise.resolve(),
    ]);
  };

  // Build Unified Comparison Pairs (Smart Auto-Match + Manual Overrides)
  const comparisonPairs = useMemo<ComparisonPair[]>(() => {
    if (productsA.length === 0 || productsB.length === 0) return [];

    const mapBById = new Map<string, CatalogProduct>();
    productsB.forEach((pB) => mapBById.set(String(pB.id), pB));

    const pairs: ComparisonPair[] = [];

    productsA.forEach((pA) => {
      let matchedB: CatalogProduct | undefined = undefined;
      let matchType: ComparisonPair['matchType'] = 'smart_name';
      let bestScore = 0;

      // 1. Check user's manual pairing first
      const manualBId = manualPairings[pA.id];
      if (manualBId !== undefined && mapBById.has(String(manualBId))) {
        matchedB = mapBById.get(String(manualBId));
        matchType = 'manual';
        bestScore = 1;
      }

      // 2. Check exact ID match if names are also reasonably similar
      if (!matchedB && mapBById.has(String(pA.id))) {
        const candidate = mapBById.get(String(pA.id))!;
        const sim = calculateProductSimilarity(pA, candidate);
        if (sim >= 0.45) {
          matchedB = candidate;
          matchType = 'exact_id';
          bestScore = sim;
        }
      }

      // 3. Smart Name & Denomination Matching across Provider B catalog
      if (!matchedB) {
        for (const candB of productsB) {
          const score = calculateProductSimilarity(pA, candB);
          if (score > bestScore && score >= 0.45) {
            bestScore = score;
            matchedB = candB;
            matchType = 'smart_name';
          }
        }
      }

      if (matchedB) {
        const costA = pA.costPriceUsd;
        const costB = matchedB.costPriceUsd;
        const diff = Number(Math.abs(costA - costB).toFixed(4));
        const maxCost = Math.max(costA, costB);
        const savingsPct = maxCost > 0 ? Number(((diff / maxCost) * 100).toFixed(1)) : 0;

        const cheaperSide: 'A' | 'B' | 'equal' =
          Math.abs(costA - costB) < 0.0001 ? 'equal' : costA < costB ? 'A' : 'B';

        // Recommended provider accounts for availability as well as price
        let recommendedSide: 'A' | 'B' | 'equal' | 'none' = cheaperSide;
        if (pA.isAvailable && !matchedB.isAvailable) {
          recommendedSide = 'A';
        } else if (!pA.isAvailable && matchedB.isAvailable) {
          recommendedSide = 'B';
        } else if (!pA.isAvailable && !matchedB.isAvailable) {
          recommendedSide = 'none';
        }

        pairs.push({
          pairId: `${pA.id}__${matchedB.id}`,
          productA: pA,
          productB: matchedB,
          matchType,
          similarityScore: bestScore,
          cheaperSide,
          recommendedSide,
          priceDiffUsd: diff,
          savingsPercent: savingsPct,
        });
      }
    });

    return pairs;
  }, [productsA, productsB, manualPairings]);

  // Auto-sync spotlightProductBId when spotlightProductAId changes
  useEffect(() => {
    if (!spotlightProductAId) return;
    const existingPair = comparisonPairs.find(
      (pair) => String(pair.productA.id) === String(spotlightProductAId)
    );
    if (existingPair) {
      setSpotlightProductBId(existingPair.productB.id);
    } else if (productsB.length > 0 && !spotlightProductBId) {
      setSpotlightProductBId(productsB[0].id);
    }
  }, [spotlightProductAId, comparisonPairs, productsB]);

  // Currently selected Spotlight Products (Side-by-Side for a specific chosen product)
  const spotlightProductA = useMemo(
    () => productsA.find((p) => String(p.id) === String(spotlightProductAId)) || null,
    [productsA, spotlightProductAId]
  );

  const spotlightProductB = useMemo(
    () => productsB.find((p) => String(p.id) === String(spotlightProductBId)) || null,
    [productsB, spotlightProductBId]
  );

  // Filter unified comparison pairs
  const filteredPairs = useMemo(() => {
    return comparisonPairs.filter((pair) => {
      if (winnerFilter !== 'all' && pair.cheaperSide !== winnerFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchA =
          pair.productA.name.toLowerCase().includes(q) ||
          String(pair.productA.id).includes(q) ||
          pair.productA.category.toLowerCase().includes(q);
        const matchB =
          pair.productB.name.toLowerCase().includes(q) ||
          String(pair.productB.id).includes(q) ||
          pair.productB.category.toLowerCase().includes(q);
        if (!matchA && !matchB) return false;
      }
      return true;
    });
  }, [comparisonPairs, winnerFilter, searchQuery]);

  // Summary KPIs
  const stats = useMemo(() => {
    let aCheaper = 0;
    let bCheaper = 0;
    let equal = 0;
    let totalSavingsPct = 0;
    let savingsCount = 0;

    comparisonPairs.forEach((p) => {
      if (p.cheaperSide === 'A') {
        aCheaper++;
        totalSavingsPct += p.savingsPercent;
        savingsCount++;
      } else if (p.cheaperSide === 'B') {
        bCheaper++;
        totalSavingsPct += p.savingsPercent;
        savingsCount++;
      } else {
        equal++;
      }
    });

    return {
      totalMatched: comparisonPairs.length,
      aCheaper,
      bCheaper,
      equal,
      avgSavingsPercent: savingsCount > 0 ? Number((totalSavingsPct / savingsCount).toFixed(1)) : 0,
    };
  }, [comparisonPairs]);

  // Export Unified Comparison Table to CSV
  const handleExportComparisonCsv = () => {
    if (filteredPairs.length === 0) return;

    const headers = [
      `معرف ${providerAName}`,
      `اسم المنتج (${providerAName})`,
      `تكلفة ${providerAName} ($)`,
      `حالة ${providerAName}`,
      `معرف ${providerBName}`,
      `اسم المنتج (${providerBName})`,
      `تكلفة ${providerBName} ($)`,
      `حالة ${providerBName}`,
      'فارق السعر ($)',
      'نسبة التوفير (%)',
      'المزود الأرخص والأفضل',
    ];

    const rows = filteredPairs.map((pair) => {
      const winnerLabel =
        pair.cheaperSide === 'A'
          ? providerAName
          : pair.cheaperSide === 'B'
          ? providerBName
          : 'متساوي السعر';

      return [
        `"${pair.productA.id}"`,
        `"${pair.productA.name.replace(/"/g, '""')}"`,
        pair.productA.costPriceUsd.toFixed(3),
        pair.productA.isAvailable ? 'متاح' : 'غير متوفر',
        `"${pair.productB.id}"`,
        `"${pair.productB.name.replace(/"/g, '""')}"`,
        pair.productB.costPriceUsd.toFixed(3),
        pair.productB.isAvailable ? 'متاح' : 'غير متوفر',
        pair.priceDiffUsd.toFixed(3),
        `${pair.savingsPercent}%`,
        `"${winnerLabel}"`,
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `dual-provider-comparison-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5 text-xs">
      {/* Top Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-extrabold text-white">
                المقارنة المزدوجة للأسعار بين مزودين (Dual Provider Comparison)
              </h2>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                مقارنة حية وموحدة
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              أدخل بيانات اتصال مزودين مختلفين في نفس الوقت وقارن تكلفة وتوفر ومعلمات نفس المنتج لاختيار المزود الأعلى ربحية
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto justify-end">
          <button
            type="button"
            onClick={() => setShowCredentialsPanel(!showCredentialsPanel)}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition-colors border border-slate-700"
          >
            {showCredentialsPanel ? 'إخفاء حقول الاتصال' : 'إظهار بيانات اتصال المزودين'}
          </button>

          <button
            type="button"
            onClick={handleFetchBothProviders}
            disabled={isLoadingA || isLoadingB}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-2 transition-colors shadow-md shadow-indigo-600/20 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingA || isLoadingB ? 'animate-spin' : ''}`} />
            <span>جلب ومقارنة المزودين معاً</span>
          </button>
        </div>
      </div>

      {/* Status Notification */}
      {statusBanner && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between ${
            statusBanner.type === 'success'
              ? 'bg-emerald-950/70 border-emerald-500/30 text-emerald-300'
              : statusBanner.type === 'error'
              ? 'bg-rose-950/70 border-rose-500/30 text-rose-300'
              : 'bg-indigo-950/70 border-indigo-500/30 text-indigo-300'
          }`}
        >
          <span>{statusBanner.text}</span>
          <button
            type="button"
            onClick={() => setStatusBanner(null)}
            className="text-slate-400 hover:text-white px-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Dual Provider Connection Cards (Side-by-Side) */}
      {showCredentialsPanel && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {/* PROVIDER A CARD */}
          <div className="bg-slate-900 border border-indigo-500/30 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold font-mono-numbers flex items-center justify-center text-xs">
                  A
                </span>
                <div>
                  <input
                    type="text"
                    value={providerAName}
                    onChange={(e) => setProviderAName(e.target.value)}
                    className="bg-transparent font-bold text-sm text-white focus:outline-none border-b border-transparent focus:border-indigo-500"
                    placeholder="اسم المزود الأول (A)"
                  />
                  <span className="block text-[10px] text-slate-400">
                    المزود الأول (مرتبط بالكتالوج الأساسي)
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {userBalanceA !== null && (
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 font-mono-numbers font-bold text-[11px] flex items-center gap-1">
                    <Wallet className="w-3 h-3 text-emerald-400" />
                    <span>${parseFloat(userBalanceA).toFixed(2)}</span>
                  </span>
                )}
                <span
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] border ${
                    productsA.length > 0
                      ? 'bg-emerald-950/60 border-emerald-500/30 text-emerald-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  {productsA.length} منتج
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] text-slate-300 font-semibold block">
                  رابط الـ API للمزود الأول (Base URL A):
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-slate-500">
                    <Globe className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="text"
                    value={baseUrlA}
                    onChange={(e) => setBaseUrlA(e.target.value)}
                    placeholder="https://api.provider-a.com/"
                    dir="ltr"
                    className="w-full pl-3 pr-8 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono-numbers"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-300 font-semibold block">
                  رمز التوثيق للمزود الأول (API Token A):
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-slate-500">
                    <KeyRound className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type={showTokenA ? 'text' : 'password'}
                    value={apiTokenA}
                    onChange={(e) => setApiTokenA(e.target.value)}
                    placeholder="API Token A..."
                    dir="ltr"
                    className="w-full pl-12 pr-8 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono-numbers"
                  />
                  <button
                    type="button"
                    onClick={() => setShowTokenA(!showTokenA)}
                    className="absolute inset-y-0 left-0 pl-2.5 text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold"
                  >
                    {showTokenA ? 'إخفاء' : 'عرض'}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-400">
                {isLiveConnectedA
                  ? '✓ متصل وجاهز للمقارنة'
                  : 'أدخل بيانات المزود الأول واضغط جلب'}
              </span>
              <button
                type="button"
                onClick={onFetchProviderA}
                disabled={isLoadingA}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/40 font-semibold transition-colors flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingA ? 'animate-spin' : ''}`} />
                <span>{isLoadingA ? 'جارِ الجلب...' : 'تحديث المزود الأول (A)'}</span>
              </button>
            </div>
          </div>

          {/* PROVIDER B CARD */}
          <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-bold font-mono-numbers flex items-center justify-center text-xs">
                  B
                </span>
                <div>
                  <input
                    type="text"
                    value={providerBName}
                    onChange={(e) => setProviderBName(e.target.value)}
                    className="bg-transparent font-bold text-sm text-white focus:outline-none border-b border-transparent focus:border-emerald-500"
                    placeholder="اسم المزود الثاني (B)"
                  />
                  <span className="block text-[10px] text-slate-400">
                    المزود الثاني (المقارَن معه في الأسعار والتوفر)
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {userBalanceB !== null && (
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 font-mono-numbers font-bold text-[11px] flex items-center gap-1">
                    <Wallet className="w-3 h-3 text-emerald-400" />
                    <span>${parseFloat(userBalanceB).toFixed(2)}</span>
                  </span>
                )}
                <span
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] border ${
                    productsB.length > 0
                      ? 'bg-emerald-950/60 border-emerald-500/30 text-emerald-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  {productsB.length} منتج
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] text-slate-300 font-semibold block">
                  رابط الـ API للمزود الثاني (Base URL B):
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-slate-500">
                    <Globe className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="text"
                    value={baseUrlB}
                    onChange={(e) => setBaseUrlB(e.target.value)}
                    placeholder="https://api.provider-b.com/"
                    dir="ltr"
                    className="w-full pl-3 pr-8 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono-numbers"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-300 font-semibold block">
                  رمز التوثيق للمزود الثاني (API Token B):
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-slate-500">
                    <KeyRound className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type={showTokenB ? 'text' : 'password'}
                    value={apiTokenB}
                    onChange={(e) => setApiTokenB(e.target.value)}
                    placeholder="API Token B..."
                    dir="ltr"
                    className="w-full pl-12 pr-8 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono-numbers"
                  />
                  <button
                    type="button"
                    onClick={() => setShowTokenB(!showTokenB)}
                    className="absolute inset-y-0 left-0 pl-2.5 text-[10px] text-emerald-400 hover:text-emerald-300 font-semibold"
                  >
                    {showTokenB ? 'إخفاء' : 'عرض'}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-400">قالب سريع:</span>
                {PROVIDER_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setSelectedPresetB(preset);
                      if (preset.baseUrl) setBaseUrlB(preset.baseUrl);
                      setProviderBName(preset.name.split('(')[0].trim());
                    }}
                    className={`px-2 py-0.5 rounded text-[10px] border transition-colors ${
                      selectedPresetB.id === preset.id
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {preset.badge}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleFetchProviderB}
                disabled={isLoadingB}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 font-semibold transition-colors flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingB ? 'animate-spin' : ''}`} />
                <span>{isLoadingB ? 'جارِ الجلب...' : 'تحديث المزود الثاني (B)'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FOCUSED SINGLE-PRODUCT HEAD-TO-HEAD COMPARISON CARD */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">
              مقارنة مباشرة لمنتج مختار وجهاً لوجه (Selected Product Comparison)
            </h3>
          </div>
          {spotlightProductA && spotlightProductB && (
            <button
              type="button"
              onClick={() => {
                setManualPairings((prev) => ({
                  ...prev,
                  [spotlightProductA.id]: spotlightProductB.id,
                }));
                setStatusBanner({
                  text: `✓ تم تثبيت ربط ومقارنة المنتج "${spotlightProductA.name}" مع "${spotlightProductB.name}" في جدول المقارنة الموحد!`,
                  type: 'success',
                });
              }}
              className="px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/40 text-[11px] font-bold flex items-center gap-1.5 transition-colors self-start sm:self-auto"
            >
              <Link2 className="w-3.5 h-3.5" />
              <span>تثبيت مطابقة هذا المنتج في الجدول الموحد</span>
            </button>
          )}
        </div>

        {/* Product Selectors for Provider A and Provider B */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-indigo-300 block">
              اختر المنتج من {providerAName} (A):
            </label>
            <select
              value={spotlightProductAId}
              onChange={(e) => {
                setSpotlightProductAId(e.target.value);
                if (onClearFocusedProduct) onClearFocusedProduct();
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
            >
              <option value="">-- اختر منتجاً من {providerAName} --</option>
              {productsA.map((p) => (
                <option key={p.id} value={p.id}>
                  #{p.id} - {p.name} (${p.costPriceUsd.toFixed(3)})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-emerald-300 block">
              المنتج المقابل في {providerBName} (B):
            </label>
            <select
              value={spotlightProductBId}
              onChange={(e) => setSpotlightProductBId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
            >
              <option value="">-- اختر المنتج المقابل من {providerBName} --</option>
              {productsB.map((p) => (
                <option key={p.id} value={p.id}>
                  #{p.id} - {p.name} (${p.costPriceUsd.toFixed(3)})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Head-to-Head Comparison Result Card */}
        {spotlightProductA && spotlightProductB ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 pt-1">
            {/* Provider A Product Box */}
            <div
              className={`lg:col-span-5 rounded-xl p-4 border transition-all ${
                spotlightProductA.costPriceUsd < spotlightProductB.costPriceUsd
                  ? 'bg-indigo-950/30 border-indigo-500/60'
                  : 'bg-slate-950 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="px-2 py-0.5 rounded bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 font-bold text-[10px]">
                  {providerAName} (#{spotlightProductA.id})
                </span>
                {spotlightProductA.costPriceUsd < spotlightProductB.costPriceUsd && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500 text-slate-950 font-extrabold text-[10px]">
                    <Trophy className="w-3 h-3" />
                    <span>الأوفر سعراً!</span>
                  </span>
                )}
              </div>

              <h4 className="font-bold text-white text-sm mb-2">{spotlightProductA.name}</h4>

              <div className="grid grid-cols-2 gap-2 bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 font-mono-numbers mb-2.5">
                <div>
                  <span className="text-[10px] text-slate-400 block font-sans">سعر التكلفة:</span>
                  <span className="text-base font-extrabold text-white">
                    ${spotlightProductA.costPriceUsd.toFixed(3)}
                  </span>
                </div>
                <div className="text-left">
                  <span className="text-[10px] text-slate-400 block font-sans">البيع المقترح:</span>
                  <span className="text-sm font-bold text-emerald-400">
                    ${spotlightProductA.suggestedSellPriceUsd.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">
                  الحالة:{' '}
                  <strong
                    className={
                      spotlightProductA.isAvailable ? 'text-emerald-400' : 'text-rose-400'
                    }
                  >
                    {spotlightProductA.isAvailable ? 'متاح للطلب' : 'غير متوفر'}
                  </strong>
                </span>
                <button
                  type="button"
                  onClick={() => onOpenProductDetail(spotlightProductA, baseUrlA)}
                  className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-1"
                >
                  <Code2 className="w-3 h-3" />
                  <span>كود الربط (A)</span>
                </button>
              </div>
            </div>

            {/* Center Verdict Box */}
            <div className="lg:col-span-2 bg-slate-950 border border-slate-800 rounded-xl p-3 flex flex-col items-center justify-center text-center space-y-1.5">
              <span className="text-[10px] text-slate-400 font-semibold">فارق التكلفة</span>
              <span className="text-base font-extrabold font-mono-numbers text-amber-300">
                ${Math.abs(spotlightProductA.costPriceUsd - spotlightProductB.costPriceUsd).toFixed(3)}
              </span>
              {Math.abs(spotlightProductA.costPriceUsd - spotlightProductB.costPriceUsd) > 0.0001 ? (
                <>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono-numbers font-bold text-[11px]">
                    توفير{' '}
                    {(
                      (Math.abs(spotlightProductA.costPriceUsd - spotlightProductB.costPriceUsd) /
                        Math.max(spotlightProductA.costPriceUsd, spotlightProductB.costPriceUsd)) *
                      100
                    ).toFixed(1)}
                    %
                  </span>
                  <span className="text-[10px] text-slate-300 font-semibold">
                    لصالح{' '}
                    {spotlightProductA.costPriceUsd < spotlightProductB.costPriceUsd
                      ? providerAName
                      : providerBName}
                  </span>
                </>
              ) : (
                <span className="text-[11px] text-slate-400 font-semibold">السعر متطابق</span>
              )}
            </div>

            {/* Provider B Product Box */}
            <div
              className={`lg:col-span-5 rounded-xl p-4 border transition-all ${
                spotlightProductB.costPriceUsd < spotlightProductA.costPriceUsd
                  ? 'bg-emerald-950/30 border-emerald-500/60'
                  : 'bg-slate-950 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="px-2 py-0.5 rounded bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 font-bold text-[10px]">
                  {providerBName} (#{spotlightProductB.id})
                </span>
                {spotlightProductB.costPriceUsd < spotlightProductA.costPriceUsd && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500 text-slate-950 font-extrabold text-[10px]">
                    <Trophy className="w-3 h-3" />
                    <span>الأوفر سعراً!</span>
                  </span>
                )}
              </div>

              <h4 className="font-bold text-white text-sm mb-2">{spotlightProductB.name}</h4>

              <div className="grid grid-cols-2 gap-2 bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 font-mono-numbers mb-2.5">
                <div>
                  <span className="text-[10px] text-slate-400 block font-sans">سعر التكلفة:</span>
                  <span className="text-base font-extrabold text-white">
                    ${spotlightProductB.costPriceUsd.toFixed(3)}
                  </span>
                </div>
                <div className="text-left">
                  <span className="text-[10px] text-slate-400 block font-sans">البيع المقترح:</span>
                  <span className="text-sm font-bold text-emerald-400">
                    ${spotlightProductB.suggestedSellPriceUsd.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">
                  الحالة:{' '}
                  <strong
                    className={
                      spotlightProductB.isAvailable ? 'text-emerald-400' : 'text-rose-400'
                    }
                  >
                    {spotlightProductB.isAvailable ? 'متاح للطلب' : 'غير متوفر'}
                  </strong>
                </span>
                <button
                  type="button"
                  onClick={() => onOpenProductDetail(spotlightProductB, baseUrlB)}
                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1"
                >
                  <Code2 className="w-3 h-3" />
                  <span>كود الربط (B)</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center bg-slate-950/70 rounded-xl border border-slate-800 text-slate-400">
            قم بجلب منتجات كلا المزودين أعلاه، أو اختر منتجاً من القائمتين لعرض المقارنة الفورية وجهاً لوجه.
          </div>
        )}
      </div>

      {/* KPI STRIP FOR UNIFIED COMPARISON TABLE */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5">
          <span className="text-[11px] text-slate-400 block mb-0.5">منتجات متطابقة للمقارنة</span>
          <span className="text-base font-extrabold font-mono-numbers text-white">
            {stats.totalMatched}
          </span>
        </div>

        <div className="bg-slate-900 border border-indigo-500/30 rounded-2xl p-3.5">
          <span className="text-[11px] text-slate-400 block mb-0.5">
            {providerAName} أرخص في
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-base font-extrabold font-mono-numbers text-indigo-400">
              {stats.aCheaper}
            </span>
            <span className="text-[11px] text-slate-400">منتج</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-3.5">
          <span className="text-[11px] text-slate-400 block mb-0.5">
            {providerBName} أرخص في
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-base font-extrabold font-mono-numbers text-emerald-400">
              {stats.bCheaper}
            </span>
            <span className="text-[11px] text-slate-400">منتج</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-3.5">
          <span className="text-[11px] text-slate-400 block mb-0.5">متوسط نسبة التوفير</span>
          <span className="text-base font-extrabold font-mono-numbers text-amber-300">
            {stats.avgSavingsPercent}%
          </span>
        </div>
      </div>

      {/* UNIFIED DUAL PRICE COMPARISON TABLE */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {/* Table Filter & Search Header */}
        <div className="p-4 border-b border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative grow max-w-md">
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-500">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث باسم المنتج أو المعرف داخل جدول المقارنة الموحد..."
              className="w-full pl-3 pr-9 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              {[
                { id: 'all', label: `الكل (${comparisonPairs.length})` },
                { id: 'A', label: `${providerAName} أرخص (${stats.aCheaper})` },
                { id: 'B', label: `${providerBName} أرخص (${stats.bCheaper})` },
                { id: 'equal', label: `متساوي (${stats.equal})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setWinnerFilter(tab.id as any)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                    winnerFilter === tab.id
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {filteredPairs.length > 0 && (
              <button
                type="button"
                onClick={handleExportComparisonCsv}
                className="px-3 py-1.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-500/30 font-semibold flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>تصدير المقارنة (CSV)</span>
              </button>
            )}
          </div>
        </div>

        {/* Table Content */}
        {filteredPairs.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <Layers className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-white">
              {productsA.length === 0 || productsB.length === 0
                ? 'أدخل بيانات الاتصال للمزودين (A و B) واضغط «جلب ومقارنة المزودين معاً»'
                : 'لا توجد منتجات مطابقة لفلتر البحث الحالي'}
            </h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              يمكنك أيضاً اختيار أي منتج من المزود الأول ومطابقته يدوياً مع المنتج المقابل في المزود الثاني من البطاقة أعلاه.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto touch-pan-x scroll-smooth">
            <table className="w-full text-right text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold">
                  <th className="py-3 px-3.5 min-w-[200px]">المنتج الموحد والفئة</th>
                  <th className="py-3 px-3.5 whitespace-nowrap text-left font-mono-numbers">
                    سعر {providerAName} (A)
                  </th>
                  <th className="py-3 px-3.5 whitespace-nowrap text-left font-mono-numbers">
                    سعر {providerBName} (B)
                  </th>
                  <th className="py-3 px-3 whitespace-nowrap text-center">فارق التكلفة والوفر</th>
                  <th className="py-3 px-3 whitespace-nowrap text-center">المزود الأفضل</th>
                  <th className="py-3 px-3.5 whitespace-nowrap text-center">إجراء الربط</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-200">
                {filteredPairs.map((pair) => {
                  const isACheaper = pair.cheaperSide === 'A';
                  const isBCheaper = pair.cheaperSide === 'B';
                  const winningProduct = isBCheaper ? pair.productB : pair.productA;
                  const winningBaseUrl = isBCheaper ? baseUrlB : baseUrlA;

                  return (
                    <tr
                      key={pair.pairId}
                      onClick={() => {
                        setSpotlightProductAId(pair.productA.id);
                        setSpotlightProductBId(pair.productB.id);
                      }}
                      className="hover:bg-slate-800/50 transition-colors cursor-pointer"
                    >
                      {/* Unified Product Info */}
                      <td className="py-3 px-3.5">
                        <div className="font-bold text-white text-xs mb-0.5">
                          {pair.productA.name}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 flex-wrap">
                          <span className="font-mono-numbers text-indigo-300">
                            A: #{pair.productA.id}
                          </span>
                          <span>•</span>
                          <span className="font-mono-numbers text-emerald-300">
                            B: #{pair.productB.id} ({pair.productB.name})
                          </span>
                          {pair.matchType === 'manual' && (
                            <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold">
                              مطابقة مثبتة
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Provider A Price & Status */}
                      <td className="py-3 px-3.5 whitespace-nowrap text-left font-mono-numbers">
                        <div className="flex items-center gap-1.5 justify-start">
                          <span
                            className={`text-sm font-bold px-2 py-0.5 rounded ${
                              isACheaper
                                ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-500/40'
                                : 'text-slate-300'
                            }`}
                          >
                            ${pair.productA.costPriceUsd.toFixed(3)}
                          </span>
                          {pair.productA.isAvailable ? (
                            <span title="متاح لدى المزود A" className="inline-flex shrink-0">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            </span>
                          ) : (
                            <span title="غير متوفر لدى المزود A" className="inline-flex shrink-0">
                              <XCircle className="w-3.5 h-3.5 text-rose-400" />
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Provider B Price & Status */}
                      <td className="py-3 px-3.5 whitespace-nowrap text-left font-mono-numbers">
                        <div className="flex items-center gap-1.5 justify-start">
                          <span
                            className={`text-sm font-bold px-2 py-0.5 rounded ${
                              isBCheaper
                                ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-500/40'
                                : 'text-slate-300'
                            }`}
                          >
                            ${pair.productB.costPriceUsd.toFixed(3)}
                          </span>
                          {pair.productB.isAvailable ? (
                            <span title="متاح لدى المزود B" className="inline-flex shrink-0">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            </span>
                          ) : (
                            <span title="غير متوفر لدى المزود B" className="inline-flex shrink-0">
                              <XCircle className="w-3.5 h-3.5 text-rose-400" />
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Price Difference & Savings % */}
                      <td className="py-3 px-3 whitespace-nowrap text-center font-mono-numbers">
                        {pair.priceDiffUsd > 0 ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="font-bold text-amber-300">
                              -${pair.priceDiffUsd.toFixed(3)}
                            </span>
                            <span className="text-[10px] text-emerald-400 font-semibold">
                              وفر {pair.savingsPercent}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-500">0.00$</span>
                        )}
                      </td>

                      {/* Winner / Recommended Provider Badge */}
                      <td className="py-3 px-3 whitespace-nowrap text-center">
                        {isACheaper ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 font-bold text-[11px]">
                            <Trophy className="w-3 h-3 text-amber-400" />
                            <span>{providerAName}</span>
                          </span>
                        ) : isBCheaper ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 font-bold text-[11px]">
                            <Trophy className="w-3 h-3 text-amber-400" />
                            <span>{providerBName}</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[11px]">
                            متساوي
                          </span>
                        )}
                      </td>

                      {/* Quick Action: Open Winning Product Integration */}
                      <td
                        className="py-3 px-3.5 whitespace-nowrap text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => onOpenProductDetail(winningProduct, winningBaseUrl)}
                          className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold inline-flex items-center gap-1 transition-colors"
                          title="فتح حاسبة الربح وأكواد الربط للمزود الأرخص"
                        >
                          <Code2 className="w-3.5 h-3.5" />
                          <span>ربط الأرخص</span>
                        </button>
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
