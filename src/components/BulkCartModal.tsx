import React, { useState, useMemo } from 'react';
import {
  X,
  ShoppingCart,
  Send,
  Trash2,
  Plus,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Layers,
  DollarSign,
  Package,
  Code2,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { CatalogProduct, NormalizedParam } from '../types';
import { buildBackendUrl } from '../utils/normalizer';

interface BulkCartModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProducts: CatalogProduct[];
  allProducts: CatalogProduct[];
  providerBaseUrl: string;
  apiToken: string;
  onNotify: (text: string, type: 'success' | 'error' | 'info') => void;
  onClearSelection?: () => void;
}

interface CartItem {
  product: CatalogProduct;
  qty: number;
  params: Record<string, string>;
}

export const BulkCartModal: React.FC<BulkCartModalProps> = ({
  isOpen,
  onClose,
  selectedProducts,
  allProducts,
  providerBaseUrl,
  apiToken,
  onNotify,
  onClearSelection,
}) => {
  // Initialize cart items from selectedProducts
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [globalQty, setGlobalQty] = useState<number>(1);
  const [globalParams, setGlobalParams] = useState<Record<string, string>>({
    player_id: '9876543210',
    server_id: '2001',
    email: 'customer@store.com',
  });

  // Add product dropdown state
  const [selectedProductIdToAdd, setSelectedProductIdToAdd] = useState<string | number>('');

  // Bulk order execution state
  const [isExecuting, setIsExecuting] = useState(false);
  const [batchResult, setBatchResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'cart' | 'payload' | 'results'>('cart');
  const [copiedPayload, setCopiedPayload] = useState(false);

  // Sync cart items when modal opens or selectedProducts change
  React.useEffect(() => {
    if (isOpen) {
      const initial: CartItem[] = selectedProducts.map((p) => {
        const defaultParams: Record<string, string> = {};
        p.normalizedParams.forEach((np) => {
          defaultParams[np.normalizedKey] =
            np.category === 'player_id' || np.category === 'uid'
              ? '9876543210'
              : np.category === 'server_id'
              ? '2001'
              : np.category === 'email'
              ? 'customer@store.com'
              : 'default_val';
        });
        return {
          product: p,
          qty: 1,
          params: defaultParams,
        };
      });
      setCartItems(initial);
      setBatchResult(null);
      setActiveTab('cart');
    }
  }, [isOpen, selectedProducts]);

  const handleAddProductToCart = () => {
    if (!selectedProductIdToAdd) return;
    const prod = allProducts.find((p) => String(p.id) === String(selectedProductIdToAdd));
    if (!prod) return;

    if (cartItems.some((item) => String(item.product.id) === String(prod.id))) {
      onNotify('المنتج موجود مسبقاً في سلة الشراء التلقائية.', 'info');
      return;
    }

    const defaultParams: Record<string, string> = {};
    prod.normalizedParams.forEach((np) => {
      defaultParams[np.normalizedKey] = globalParams[np.normalizedKey] || '9876543210';
    });

    setCartItems((prev) => [
      ...prev,
      {
        product: prod,
        qty: globalQty,
        params: defaultParams,
      },
    ]);
    setSelectedProductIdToAdd('');
    onNotify(`تمت إضافة "${prod.name}" إلى سلة الطلبات المجمعة.`, 'success');
  };

  const handleRemoveItem = (id: string | number) => {
    setCartItems((prev) => prev.filter((item) => String(item.product.id) !== String(id)));
  };

  const handleUpdateItemQty = (id: string | number, qty: number) => {
    setCartItems((prev) =>
      prev.map((item) =>
        String(item.product.id) === String(id) ? { ...item, qty: Math.max(1, qty) } : item
      )
    );
  };

  const handleUpdateItemParam = (id: string | number, paramKey: string, value: string) => {
    setCartItems((prev) =>
      prev.map((item) =>
        String(item.product.id) === String(id)
          ? { ...item, params: { ...item.params, [paramKey]: value } }
          : item
      )
    );
  };

  const handleApplyGlobalQty = () => {
    setCartItems((prev) => prev.map((item) => ({ ...item, qty: globalQty })));
    onNotify(`تم تحديث الكمية إلى (${globalQty}) لجميع منتجات السلة.`, 'success');
  };

  // Financial Totals
  const totals = useMemo(() => {
    let totalCost = 0;
    let totalSell = 0;
    let totalItemsCount = 0;

    cartItems.forEach((item) => {
      totalCost += item.product.costPriceUsd * item.qty;
      totalSell += item.product.suggestedSellPriceUsd * item.qty;
      totalItemsCount += item.qty;
    });

    const netProfit = Number((totalSell - totalCost).toFixed(2));
    const profitMargin = totalSell > 0 ? Number(((netProfit / totalSell) * 100).toFixed(1)) : 0;

    return {
      totalCost: Number(totalCost.toFixed(2)),
      totalSell: Number(totalSell.toFixed(2)),
      netProfit,
      profitMargin,
      totalItemsCount,
    };
  }, [cartItems]);

  const generateBulkPayload = () => {
    return {
      baseUrl: providerBaseUrl || 'https://api.mersal-card.com',
      apiToken: apiToken ? '***KEY_CONFIGURED***' : 'MISSING_TOKEN',
      batchTimestamp: new Date().toISOString(),
      totalProducts: cartItems.length,
      totalUnits: totals.totalItemsCount,
      estimatedTotalCostUsd: totals.totalCost,
      orders: cartItems.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.qty,
        unitCostUsd: item.product.costPriceUsd,
        totalCostUsd: Number((item.product.costPriceUsd * item.qty).toFixed(2)),
        parameters: item.params,
        orderUuid: `bulk-${Date.now()}-${item.product.id}`,
      })),
    };
  };

  const handleCopyPayload = () => {
    navigator.clipboard.writeText(JSON.stringify(generateBulkPayload(), null, 2));
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  const handleExecuteBulkOrder = async () => {
    if (cartItems.length === 0) {
      onNotify('سلة الشراء فارغة. يرجى إضافة منتجات قبل إرسال الطلب المجمع.', 'error');
      return;
    }
    if (!apiToken.trim()) {
      onNotify('مفتاح الـ API Token مفقود. يرجى إدخاله في قسم ربط المزود.', 'error');
      return;
    }

    setIsExecuting(true);
    setBatchResult(null);

    try {
      const res = await fetch(buildBackendUrl('/api/proxy/bulk-order'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseUrl: providerBaseUrl,
          apiToken: apiToken,
          items: cartItems.map((item) => ({
            productId: item.product.id,
            productName: item.product.name,
            qty: item.qty,
            params: item.params,
            orderUuid: `order-batch-${Date.now()}-${item.product.id}`,
          })),
        }),
      });

      const data = await res.json();
      setBatchResult(data);
      setActiveTab('results');
      if (data.success) {
        onNotify('تم إرسال سلة الشراء التلقائية بنجاح إلى المزود عبر الـ API!', 'success');
      } else {
        onNotify(data.error || 'حدث خطأ أثناء تنفيذ الطلب المجمع.', 'error');
      }
    } catch (err: any) {
      setBatchResult({
        success: false,
        error: err.message || 'تعذر الاتصال بالخادم لتنفيذ الطلب المجمع.',
      });
      setActiveTab('results');
    } finally {
      setIsExecuting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-3 sm:p-4"
      dir="rtl"
    >
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl relative z-10 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-extrabold text-white">
                  سلة الشراء التلقائية (Bulk Order Cart)
                </h2>
                <span className="px-2.5 py-0.5 rounded-md bg-indigo-950/90 border border-indigo-500/30 text-indigo-300 text-[11px] font-mono-numbers font-bold">
                  {cartItems.length} منتج مضاف
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                تحديد المنتجات وإرسالها دفعة واحدة للمزود عبر الـ API مع معلمات الربط الموحدة
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent hover:border-slate-700 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="px-5 pt-3 border-b border-slate-800 bg-slate-900 flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('cart')}
            className={`pb-3 px-4 font-bold text-xs sm:text-sm border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'cart'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>منتجات السلة والكميات ({cartItems.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('payload')}
            className={`pb-3 px-4 font-bold text-xs sm:text-sm border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'payload'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>معاينة حمولة الـ API (Payload)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('results')}
            className={`pb-3 px-4 font-bold text-xs sm:text-sm border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'results'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>نتائج الإرسال وسجل التنفيذ</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto grow space-y-5 text-xs">
          {activeTab === 'cart' && (
            <>
              {/* Quick Add Bar & Global Controls */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 grow min-w-[240px]">
                    <select
                      value={selectedProductIdToAdd}
                      onChange={(e) => setSelectedProductIdToAdd(e.target.value)}
                      className="grow px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-indigo-500 text-xs"
                    >
                      <option value="">+ إضافة منتج آخر من الكتالوج إلى السلة...</option>
                      {allProducts.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (التكلفة: ${p.costPriceUsd})
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleAddProductToCart}
                      disabled={!selectedProductIdToAdd}
                      className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-colors disabled:opacity-50 shrink-0 cursor-pointer flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>إضافة</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">كمية موحدة:</span>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={globalQty}
                      onChange={(e) => setGlobalQty(Number(e.target.value))}
                      className="w-16 px-2.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-center text-slate-100 font-mono-numbers focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={handleApplyGlobalQty}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition-colors cursor-pointer"
                    >
                      تطبيق للكل
                    </button>
                  </div>
                </div>
              </div>

              {/* Cart Items List Table */}
              {cartItems.length === 0 ? (
                <div className="py-12 text-center space-y-3 bg-slate-950/50 border border-slate-800 rounded-2xl">
                  <ShoppingCart className="w-10 h-10 text-slate-600 mx-auto" />
                  <div className="text-slate-300 font-bold">سلة الشراء التلقائية فارغة حالياً</div>
                  <p className="text-slate-500 text-[11px] max-w-md mx-auto">
                    قم بتحديد المنتجات من كتالوج المنتجات أو أضفها عبر القائمة المنسدلة أعلاه لإرسالها
                    دفعة واحدة للمزود.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
                    <table className="w-full text-right border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 bg-slate-900/90 text-slate-400 text-[11px] font-bold">
                          <th className="p-3">المنتج والـ ID</th>
                          <th className="p-3">التكلفة والبيع</th>
                          <th className="p-3">الكمية</th>
                          <th className="p-3">معلمات الربط المطلوبة</th>
                          <th className="p-3 text-center">إجراء</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-slate-300">
                        {cartItems.map((item) => (
                          <tr key={item.product.id} className="hover:bg-slate-900/50 transition-colors">
                            <td className="p-3">
                              <div className="font-bold text-white">{item.product.name}</div>
                              <div className="text-[10px] text-slate-400 font-mono-numbers mt-0.5">
                                ID: #{item.product.id} • {item.product.category}
                              </div>
                            </td>
                            <td className="p-3 font-mono-numbers">
                              <div className="text-emerald-400 font-bold">
                                ${item.product.costPriceUsd} <span className="text-[10px] text-slate-400">للقطعة</span>
                              </div>
                              <div className="text-[10px] text-slate-400">
                                المجموع: ${(item.product.costPriceUsd * item.qty).toFixed(2)}
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateItemQty(item.product.id, item.qty - 1)}
                                  className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 flex items-center justify-center font-bold active:scale-95 transition-all text-sm cursor-pointer select-none"
                                  title="إنقاص الكمية"
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  min={1}
                                  max={999}
                                  value={item.qty}
                                  onChange={(e) => handleUpdateItemQty(item.product.id, Number(e.target.value))}
                                  className="w-14 h-8 px-1 bg-slate-900 border border-slate-800 rounded-lg text-center font-mono-numbers text-white font-bold text-xs focus:outline-none focus:border-indigo-500"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleUpdateItemQty(item.product.id, item.qty + 1)}
                                  className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 flex items-center justify-center font-bold active:scale-95 transition-all text-sm cursor-pointer select-none"
                                  title="زيادة الكمية"
                                >
                                  +
                                </button>
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="space-y-1.5 min-w-[200px]">
                                {item.product.normalizedParams.map((np) => (
                                  <div key={np.normalizedKey} className="flex items-center gap-1.5">
                                    <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                                      {np.normalizedKey}:
                                    </span>
                                    <input
                                      type="text"
                                      value={item.params[np.normalizedKey] || ''}
                                      onChange={(e) =>
                                        handleUpdateItemParam(item.product.id, np.normalizedKey, e.target.value)
                                      }
                                      placeholder={`أدخل ${np.labelAr || np.normalizedKey}...`}
                                      dir="ltr"
                                      className="grow px-2 py-1 bg-slate-900 border border-slate-800 rounded text-[11px] text-slate-100 font-mono-numbers focus:outline-none focus:border-indigo-500"
                                    />
                                  </div>
                                ))}
                              </div>
                            </td>
                            <td className="p-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(item.product.id)}
                                className="p-2 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-500/30 transition-colors cursor-pointer"
                                title="إزالة من السلة"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                </div>
              )}
            </>
          )}

          {activeTab === 'payload' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white">حمولة طلب الـ API المجمع (Batch Payload JSON)</h3>
                <button
                  type="button"
                  onClick={handleCopyPayload}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-1.5 transition-colors cursor-pointer text-xs"
                >
                  {copiedPayload ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedPayload ? 'تم النسخ!' : 'نسخ الحمولة'}</span>
                </button>
              </div>

              <pre
                dir="ltr"
                className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs font-mono text-emerald-400 overflow-x-auto max-h-[400px]"
              >
                {JSON.stringify(generateBulkPayload(), null, 2)}
              </pre>
            </div>
          )}

          {activeTab === 'results' && (
            <div className="space-y-4">
              {!batchResult ? (
                <div className="py-12 text-center space-y-3 bg-slate-950/50 border border-slate-800 rounded-2xl">
                  <Send className="w-10 h-10 text-slate-600 mx-auto" />
                  <div className="text-slate-300 font-bold">لم يتم إرسال الطلب المجمع بعد</div>
                  <p className="text-slate-500 text-[11px] max-w-md mx-auto">
                    قم بمراجعة منتجات السلة ثم اضغط على زر "إرسال سلة الشراء للمزود عبر الـ API" لعرض
                    نتائج التنفيذ وحالة كل طلب.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div
                    className={`p-4 rounded-xl border flex items-center gap-3 ${
                      batchResult.success
                        ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-200'
                        : 'bg-rose-950/50 border-rose-500/40 text-rose-200'
                    }`}
                  >
                    {batchResult.success ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-6 h-6 text-rose-400 shrink-0" />
                    )}
                    <div>
                      <h4 className="font-extrabold text-sm">
                        {batchResult.success ? 'تم تنفيذ سلة الشراء بنجاح تام!' : 'فشل إرسال الطلب المجمع'}
                      </h4>
                      <p className="text-xs opacity-90 mt-0.5">
                        {batchResult.message || batchResult.error}
                      </p>
                    </div>
                  </div>

                  {batchResult.results && (
                    <div className="space-y-2">
                      <h4 className="font-bold text-white text-xs">تفاصيل الطلبات المرسلة ({batchResult.results.length}):</h4>
                      <div className="space-y-2">
                        {batchResult.results.map((r: any, idx: number) => (
                          <div key={idx} className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between gap-3">
                            <div>
                              <div className="font-bold text-white">{r.productName} (الكمية: {r.qty})</div>
                              <div className="text-[10px] text-slate-400 font-mono truncate mt-0.5">
                                رابط الطلب: {r.endpoint}
                              </div>
                            </div>
                            <span className="px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold shrink-0 font-mono-numbers">
                              {r.status || 'SUCCESS'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sticky Pinned Footer Summary & Checkout Bar (Visible on 'cart' tab when items exist) */}
        {activeTab === 'cart' && cartItems.length > 0 && (
          <div className="shrink-0 border-t border-slate-800 bg-slate-950/95 backdrop-blur-md p-4 z-20 shadow-2xl flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-6 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">إجمالي القطع:</span>
                <span className="text-sm font-extrabold font-mono-numbers text-white">
                  {totals.totalItemsCount} قطعة
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">إجمالي التكلفة:</span>
                <span className="text-sm font-extrabold font-mono-numbers text-emerald-400">
                  ${totals.totalCost}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">الربح المتوقع:</span>
                <span className="text-sm font-extrabold font-mono-numbers text-indigo-400">
                  ${totals.netProfit} ({totals.profitMargin}%)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onClearSelection && (
                <button
                  type="button"
                  onClick={() => {
                    setCartItems([]);
                    onClearSelection();
                  }}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-colors cursor-pointer"
                >
                  تفريغ السلة
                </button>
              )}
              <button
                type="button"
                onClick={handleExecuteBulkOrder}
                disabled={isExecuting || cartItems.length === 0}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-extrabold flex items-center gap-2 transition-all shadow-lg shadow-emerald-600/25 disabled:opacity-50 cursor-pointer text-xs"
              >
                {isExecuting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span>{isExecuting ? 'جارِ الإرسال للمزود...' : 'إرسال سلة الشراء للمزود عبر الـ API'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
