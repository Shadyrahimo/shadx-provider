import React, { useState, useMemo, useEffect } from 'react';
import { Header } from './components/Header';
import { FilterBar } from './components/FilterBar';
import { ProductTable } from './components/ProductTable';
import { MarginConfigModal } from './components/MarginConfigModal';
import { ProductDetailModal } from './components/ProductDetailModal';
import { DocsDrawer } from './components/DocsDrawer';
import {
  ProviderPreset,
  MarginConfig,
  FilterState,
  CatalogProduct,
  RawProviderProduct,
} from './types';
import { PROVIDER_PRESETS, MOCK_PROVIDER_CATALOG } from './data/mockCatalog';
import {
  transformRawProduct,
  exportProductsToCsv,
} from './utils/normalizer';
import {
  Package,
  Layers,
  Sparkles,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  X,
  ChevronLeft,
  ChevronRight,
  Database,
} from 'lucide-react';

export default function App() {
  // Provider settings
  const [selectedPreset, setSelectedPreset] = useState<ProviderPreset>(PROVIDER_PRESETS[0]);
  const [baseUrl, setBaseUrl] = useState<string>(PROVIDER_PRESETS[0].baseUrl);
  const [apiToken, setApiToken] = useState<string>(PROVIDER_PRESETS[0].defaultToken || '');

  // Live state & balance
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(false);
  const [userBalance, setUserBalance] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Raw catalog products
  const [rawProducts, setRawProducts] = useState<RawProviderProduct[]>(MOCK_PROVIDER_CATALOG);

  // Profit Margin Config
  const [marginConfig, setMarginConfig] = useState<MarginConfig>({
    mode: 'percentage',
    value: 15,
    rounding: 'exact',
  });

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    selectedCategory: 'all',
    availability: 'all',
    productType: 'all',
    paramFilter: 'all',
    minCost: '',
    maxCost: '',
    sortBy: 'id_asc',
  });

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());
  const [isCopiedIds, setIsCopiedIds] = useState<boolean>(false);

  // Modals & Drawers
  const [activeModalProduct, setActiveModalProduct] = useState<CatalogProduct | null>(null);
  const [isMarginModalOpen, setIsMarginModalOpen] = useState<boolean>(false);
  const [isDocsDrawerOpen, setIsDocsDrawerOpen] = useState<boolean>(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(50);

  // Notification Banner
  const [notification, setNotification] = useState<{
    text: string;
    type: 'success' | 'error' | 'info';
  } | null>({
    text: 'تم تحميل كتالوج المنتجات بنجاح (420+ منتج مع كشف المعلمات الذكي). يمكنك تعديل هامش الربح، الربط، أو إدخال عنوان الـ API المباشر للمزود.',
    type: 'info',
  });

  // Auto-dismiss notification after 8 seconds
  useEffect(() => {
    if (notification) {
      const t = setTimeout(() => setNotification(null), 8000);
      return () => clearTimeout(t);
    }
  }, [notification]);

  // Handle Preset Switching
  const handleSelectPreset = (preset: ProviderPreset) => {
    setSelectedPreset(preset);
    setBaseUrl(preset.baseUrl);
    setApiToken(preset.defaultToken || '');
    setIsLiveConnected(false);
    setUserBalance(null);
    setUserEmail(null);
  };

  // Live Fetch Products & Profile via Server Proxy
  const handleFetchProducts = async () => {
    if (!baseUrl.trim()) {
      setNotification({
        text: 'يرجى إدخال عنوان الـ API (Base URL) للمزود.',
        type: 'error',
      });
      return;
    }

    setIsLoading(true);
    setNotification(null);

    try {
      // 1. Fetch Products
      const prodRes = await fetch('/api/proxy/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baseUrl, apiToken }),
      });

      const prodData = await prodRes.json();

      if (!prodData.success) {
        throw new Error(prodData.error || 'فشل في استرداد المنتجات من المزود');
      }

      const receivedList: RawProviderProduct[] = Array.isArray(prodData.data)
        ? prodData.data
        : prodData.data?.products || [];

      if (receivedList.length > 0) {
        setRawProducts(receivedList);
        setIsLiveConnected(true);
        setCurrentPage(1);
        setSelectedIds(new Set());
      }

      // 2. Fetch Profile Balance
      try {
        const profRes = await fetch('/api/proxy/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ baseUrl, apiToken }),
        });
        const profData = await profRes.json();
        if (profData.success && profData.data?.balance) {
          setUserBalance(String(profData.data.balance));
          if (profData.data.email) setUserEmail(String(profData.data.email));
        }
      } catch {
        // Balance fetch is secondary
      }

      setNotification({
        text: `تم الاتصال بنجاح وتحديث ${receivedList.length} منتج مباشرة من مزود الـ API.`,
        type: 'success',
      });
    } catch (err: any) {
      console.warn('API fetch issue:', err);
      setNotification({
        text: `تعذر الاتصال المباشر (${err.message}). يمكنك الاستمرار في استخدام وتجربة الكتالوج الشامل غير المتصل وحفظ وتصدير الإعدادات.`,
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Transform raw items into enriched CatalogProduct items using active marginConfig
  const catalogProducts = useMemo(() => {
    return rawProducts.map((raw) => transformRawProduct(raw, marginConfig));
  }, [rawProducts, marginConfig]);

  // Extract distinct categories with counts
  const categoriesWithCounts = useMemo(() => {
    const map = new Map<string, number>();
    catalogProducts.forEach((p) => {
      const cat = p.category || 'عام';
      map.set(cat, (map.get(cat) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [catalogProducts]);

  // Filter and sort catalog
  const filteredProducts = useMemo(() => {
    return catalogProducts
      .filter((p) => {
        // Search query (name or ID or category)
        if (filters.searchQuery) {
          const q = filters.searchQuery.toLowerCase().trim();
          const matchesName = p.name.toLowerCase().includes(q);
          const matchesId = String(p.id).includes(q);
          const matchesCategory = p.category.toLowerCase().includes(q);
          if (!matchesName && !matchesId && !matchesCategory) return false;
        }

        // Category filter
        if (filters.selectedCategory !== 'all' && p.category !== filters.selectedCategory) {
          return false;
        }

        // Availability filter
        if (filters.availability === 'available' && !p.isAvailable) return false;
        if (filters.availability === 'unavailable' && p.isAvailable) return false;

        // Product type filter
        if (filters.productType !== 'all' && p.productType !== filters.productType) {
          return false;
        }

        // Parameter category filter
        if (filters.paramFilter !== 'all') {
          const hasParam = p.normalizedParams.some((np) => np.category === filters.paramFilter);
          if (!hasParam) return false;
        }

        // Min Cost
        if (filters.minCost !== '' && p.costPriceUsd < filters.minCost) return false;

        // Max Cost
        if (filters.maxCost !== '' && p.costPriceUsd > filters.maxCost) return false;

        return true;
      })
      .sort((a, b) => {
        switch (filters.sortBy) {
          case 'cost_asc':
            return a.costPriceUsd - b.costPriceUsd;
          case 'cost_desc':
            return b.costPriceUsd - a.costPriceUsd;
          case 'name_asc':
            return a.name.localeCompare(b.name, 'ar');
          case 'margin_desc':
            return (
              b.suggestedSellPriceUsd - b.costPriceUsd -
              (a.suggestedSellPriceUsd - a.costPriceUsd)
            );
          case 'id_desc':
            return Number(b.id) - Number(a.id);
          case 'id_asc':
          default:
            return Number(a.id) - Number(b.id);
        }
      });
  }, [catalogProducts, filters]);

  // Paginated slice
  const paginatedProducts = useMemo(() => {
    if (pageSize >= 9999) return filteredProducts;
    const startIndex = (currentPage - 1) * pageSize;
    return filteredProducts.slice(startIndex, startIndex + pageSize);
  }, [filteredProducts, currentPage, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  // Bulk actions
  const handleToggleSelect = (id: string | number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === paginatedProducts.length && paginatedProducts.length > 0) {
      setSelectedIds(new Set());
    } else {
      const next = new Set(selectedIds);
      paginatedProducts.forEach((p) => next.add(p.id));
      setSelectedIds(next);
    }
  };

  const isAllSelected =
    paginatedProducts.length > 0 &&
    paginatedProducts.every((p) => selectedIds.has(p.id));

  const handleExportCsv = () => {
    const toExport =
      selectedIds.size > 0
        ? catalogProducts.filter((p) => selectedIds.has(p.id))
        : filteredProducts;

    exportProductsToCsv(toExport);
    setNotification({
      text: `تم تصدير ملف Excel (CSV) بنجاح لـ ${toExport.length} منتج.`,
      type: 'success',
    });
  };

  const handleExportJson = () => {
    const toExport =
      selectedIds.size > 0
        ? catalogProducts.filter((p) => selectedIds.has(p.id))
        : filteredProducts;

    const dataStr =
      'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(toExport, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `catalog-products-${Date.now()}.json`);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();

    setNotification({
      text: `تم تصدير ملف JSON متكامل لـ ${toExport.length} منتج.`,
      type: 'success',
    });
  };

  const handleCopySelectedIds = () => {
    const idsList = Array.from(selectedIds).join(',');
    navigator.clipboard.writeText(idsList);
    setIsCopiedIds(true);
    setTimeout(() => setIsCopiedIds(false), 2000);
    setNotification({
      text: `تم نسخ ${selectedIds.size} معرف بنجاح إلى الحافظة.`,
      type: 'success',
    });
  };

  const handleResetFilters = () => {
    setFilters({
      searchQuery: '',
      selectedCategory: 'all',
      availability: 'all',
      productType: 'all',
      paramFilter: 'all',
      minCost: '',
      maxCost: '',
      sortBy: 'id_asc',
    });
  };

  // High-level KPI metrics
  const availableCount = useMemo(() => {
    return catalogProducts.filter((p) => p.isAvailable).length;
  }, [catalogProducts]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header & Connection Bar */}
      <Header
        selectedPreset={selectedPreset}
        onSelectPreset={handleSelectPreset}
        baseUrl={baseUrl}
        setBaseUrl={setBaseUrl}
        apiToken={apiToken}
        setApiToken={setApiToken}
        onFetchProducts={handleFetchProducts}
        isLoading={isLoading}
        isLiveConnected={isLiveConnected}
        userBalance={userBalance}
        userEmail={userEmail}
        marginConfig={marginConfig}
        onOpenMarginModal={() => setIsMarginModalOpen(true)}
        onOpenDocsDrawer={() => setIsDocsDrawerOpen(true)}
        totalProductsCount={catalogProducts.length}
      />

      {/* Main Viewport */}
      <main className="grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5">
        {/* Floating Notification */}
        {notification && (
          <div
            className={`mb-4 p-3 rounded-xl border flex items-center justify-between text-xs transition-all ${
              notification.type === 'success'
                ? 'bg-emerald-950/70 border-emerald-500/30 text-emerald-300'
                : notification.type === 'error'
                ? 'bg-rose-950/70 border-rose-500/30 text-rose-300'
                : 'bg-indigo-950/70 border-indigo-500/30 text-indigo-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              ) : notification.type === 'error' ? (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              ) : (
                <Sparkles className="w-4 h-4 shrink-0 text-indigo-400" />
              )}
              <span>{notification.text}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Quick KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 text-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">إجمالي المنتجات</span>
              <span className="text-sm font-bold font-mono-numbers text-white">
                {catalogProducts.length}
              </span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">منتجات متوفرة للطلب</span>
              <span className="text-sm font-bold font-mono-numbers text-emerald-400">
                {availableCount}
              </span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">التصنيفات المتاحة</span>
              <span className="text-sm font-bold font-mono-numbers text-amber-300">
                {categoriesWithCounts.length} فئة
              </span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/20 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">هامش الربح النشط</span>
              <span className="text-sm font-bold font-mono-numbers text-violet-300">
                {marginConfig.mode === 'percentage' ? `+${marginConfig.value}%` : `+$${marginConfig.value}`}
              </span>
            </div>
          </div>
        </div>

        {/* Smart Filters Bar (Item 11 & Export Tools) */}
        <FilterBar
          filters={filters}
          setFilters={setFilters}
          categories={categoriesWithCounts}
          totalFilteredCount={filteredProducts.length}
          totalProductsCount={catalogProducts.length}
          onResetFilters={handleResetFilters}
          selectedIds={selectedIds}
          onExportCsv={handleExportCsv}
          onExportJson={handleExportJson}
          onCopySelectedIds={handleCopySelectedIds}
          isCopiedIds={isCopiedIds}
          onSelectAll={handleSelectAll}
          isAllSelected={isAllSelected}
        />

        {/* Catalog Table (The 11 Columns) */}
        <ProductTable
          products={paginatedProducts}
          selectedIds={selectedIds}
          onToggleSelect={handleToggleSelect}
          onOpenProductDetail={(prod) => setActiveModalProduct(prod)}
          providerBaseUrl={baseUrl}
        />

        {/* Pagination & Density Controls */}
        {filteredProducts.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span>عرض</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-slate-200 focus:outline-none"
              >
                <option value={25}>25 منتج</option>
                <option value={50}>50 منتج</option>
                <option value={100}>100 منتج</option>
                <option value={200}>200 منتج</option>
                <option value={9999}>الكل دفعة واحدة</option>
              </select>
              <span>في الصفحة (الصفحة {currentPage} من {totalPages})</span>
            </div>

            {pageSize < 9999 && totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum = i + 1;
                  if (totalPages > 5 && currentPage > 3) {
                    pageNum = currentPage - 2 + i;
                    if (pageNum > totalPages) pageNum = totalPages - 4 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-7 h-7 rounded-lg text-xs font-mono font-medium transition-colors ${
                        currentPage === pageNum
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Margin Configuration Modal */}
      <MarginConfigModal
        isOpen={isMarginModalOpen}
        onClose={() => setIsMarginModalOpen(false)}
        config={marginConfig}
        onSave={(newCfg) => {
          setMarginConfig(newCfg);
          setNotification({
            text: `تم تحديث هامش الربح (${newCfg.mode === 'percentage' ? `+${newCfg.value}%` : `+$${newCfg.value}`}) واحتساب سعر البيع المقترح لكافة المنتجات.`,
            type: 'success',
          });
        }}
      />

      {/* Integration & Request Simulator Modal */}
      <ProductDetailModal
        product={activeModalProduct}
        onClose={() => setActiveModalProduct(null)}
        providerBaseUrl={baseUrl}
        apiToken={apiToken}
      />

      {/* Built-in API Docs Reference Drawer */}
      <DocsDrawer
        isOpen={isDocsDrawerOpen}
        onClose={() => setIsDocsDrawerOpen(false)}
      />
    </div>
  );
}
