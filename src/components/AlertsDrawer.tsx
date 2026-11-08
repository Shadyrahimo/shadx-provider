import React, { useState } from 'react';
import {
  X,
  BellRing,
  CheckCheck,
  Trash2,
  Sliders,
  TrendingDown,
  TrendingUp,
  PackageCheck,
  PackageX,
  Zap,
  ArrowRight,
  Sparkles,
  ExternalLink,
  Filter,
  CheckCircle2,
  Clock,
  Layers,
  Info,
  Play,
  RotateCcw,
  Mail,
  Send,
  Loader2,
  Target,
  Plus,
} from 'lucide-react';
import { AppAlertItem, AlertRuleConfig, AlertType, CatalogProduct } from '../types';

interface AlertsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: AppAlertItem[];
  unreadCount: number;
  onMarkAsRead: (alertId: string) => void;
  onMarkAllAsRead: () => void;
  onClearAlerts: () => void;
  ruleConfig: AlertRuleConfig;
  onUpdateRuleConfig: (newConfig: AlertRuleConfig) => void;
  onSimulateProviderChanges: () => void;
  onSelectProduct: (product: CatalogProduct) => void;
  productsMap: Map<string | number, CatalogProduct>;
}

export const AlertsDrawer: React.FC<AlertsDrawerProps> = ({
  isOpen,
  onClose,
  alerts,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAlerts,
  ruleConfig,
  onUpdateRuleConfig,
  onSimulateProviderChanges,
  onSelectProduct,
  productsMap,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'price' | 'availability' | 'threshold'>('all');
  const [showConfig, setShowConfig] = useState<boolean>(false);
  const [isSendingTestEmail, setIsSendingTestEmail] = useState<boolean>(false);
  const [testEmailStatus, setTestEmailStatus] = useState<string | null>(null);
  const [selectedProductIdToAdd, setSelectedProductIdToAdd] = useState<string | number | ''>('');

  const handleAddProductToCustomAlert = () => {
    if (!selectedProductIdToAdd) return;
    const currentEnabled = ruleConfig.enabledProductAlertIds || [];
    const prodId = isNaN(Number(selectedProductIdToAdd)) ? selectedProductIdToAdd : Number(selectedProductIdToAdd);
    if (!currentEnabled.includes(prodId)) {
      onUpdateRuleConfig({
        ...ruleConfig,
        enabledProductAlertIds: [...currentEnabled, prodId],
        customProductPercentages: {
          ...(ruleConfig.customProductPercentages || {}),
          [prodId]: 5, // Default 5% as requested by the user
        },
      });
    }
    setSelectedProductIdToAdd('');
  };

  const handleUpdateProductPercent = (productId: string | number, percent: number) => {
    onUpdateRuleConfig({
      ...ruleConfig,
      customProductPercentages: {
        ...(ruleConfig.customProductPercentages || {}),
        [productId]: Math.max(1, percent),
      },
    });
  };

  const handleRemoveProductFromCustomAlert = (productId: string | number) => {
    onUpdateRuleConfig({
      ...ruleConfig,
      enabledProductAlertIds: (ruleConfig.enabledProductAlertIds || []).filter((id) => String(id) !== String(productId)),
    });
  };

  const handleSendTestEmail = async () => {
    if (!ruleConfig.recipientEmail || !ruleConfig.recipientEmail.includes('@')) {
      setTestEmailStatus('⚠️ يرجى إدخال عنوان بريد إلكتروني صالح.');
      return;
    }

    setIsSendingTestEmail(true);
    setTestEmailStatus(null);

    try {
      const res = await fetch('/api/notifications/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientEmail: ruleConfig.recipientEmail,
          subject: 'اختبار تكامل إشعارات البريد - متجر البطاقات والخدمات الرقمية',
          productName: 'ببجي موبايل 60 شدة (PUBG 60 UC)',
          productId: 101,
          oldCost: '$1.05',
          newCost: '$0.88',
          changePercent: -16.2,
          profitTier: 'عالية الربحية (≥20%)',
          marginPercent: 25,
          isTest: true,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setTestEmailStatus(`✅ ${data.message}`);
      } else {
        setTestEmailStatus(`❌ ${data.error || 'فشل الإرسال'}`);
      }
    } catch (e: any) {
      setTestEmailStatus(`❌ خطأ في الإرسال: ${e.message}`);
    } finally {
      setIsSendingTestEmail(false);
    }
  };

  // Filter alerts based on activeTab
  const filteredAlerts = alerts.filter((alert) => {
    if (activeTab === 'unread') return !alert.isRead;
    if (activeTab === 'price') return alert.type === 'price_drop' || alert.type === 'price_hike';
    if (activeTab === 'availability') return alert.type === 'availability_oos' || alert.type === 'availability_back';
    if (activeTab === 'threshold') return alert.type === 'threshold_breach';
    return true;
  });

  const getAlertIcon = (type: AlertType) => {
    switch (type) {
      case 'price_drop':
        return <TrendingDown className="w-4 h-4 text-emerald-400" />;
      case 'price_hike':
        return <TrendingUp className="w-4 h-4 text-rose-400" />;
      case 'availability_back':
        return <PackageCheck className="w-4 h-4 text-emerald-400" />;
      case 'availability_oos':
        return <PackageX className="w-4 h-4 text-rose-400" />;
      case 'threshold_breach':
        return <Zap className="w-4 h-4 text-amber-400" />;
      default:
        return <Info className="w-4 h-4 text-indigo-400" />;
    }
  };

  const getSeverityStyle = (alert: AppAlertItem) => {
    if (!alert.isRead) {
      switch (alert.severity) {
        case 'success':
          return 'bg-emerald-950/40 border-emerald-500/40 shadow-sm shadow-emerald-500/10';
        case 'danger':
          return 'bg-rose-950/40 border-rose-500/40 shadow-sm shadow-rose-500/10';
        case 'warning':
          return 'bg-amber-950/40 border-amber-500/40 shadow-sm shadow-amber-500/10';
        default:
          return 'bg-indigo-950/40 border-indigo-500/40 shadow-sm shadow-indigo-500/10';
      }
    }
    return 'bg-slate-900/60 border-slate-800 text-slate-400';
  };

  const handleOpenProduct = (alert: AppAlertItem) => {
    const prod = productsMap.get(alert.productId);
    if (prod) {
      onMarkAsRead(alert.id);
      onSelectProduct(prod);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/80 backdrop-blur-sm transition-opacity" dir="rtl">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="fixed inset-y-0 left-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-screen max-w-xl bg-slate-900 border-r border-slate-800 shadow-2xl flex flex-col z-10">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900/95 sticky top-0 z-20">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner">
                  <BellRing className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">سجل ومركز التنبيهات الذكي</h3>
                    {unreadCount > 0 && (
                      <span className="bg-amber-500 text-slate-950 text-xs font-bold px-2 py-0.5 rounded-full font-mono-numbers">
                        {unreadCount} جديد
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">
                    رصد فوري لتغيرات التوفر وأسعار التكلفة وكسر حدود الربح من المزود
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                title="إغلاق النافذة"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-xs">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowConfig(!showConfig)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors ${
                    showConfig
                      ? 'bg-indigo-600 text-white border-indigo-500'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>شروط التنبيه</span>
                </button>

                <button
                  type="button"
                  onClick={onSimulateProviderChanges}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-500/40 text-xs font-medium transition-colors"
                  title="توليد ومحاكاة تغيرات فورية في أسعار وتوفر المنتجات لاختبار السجل والتنبيهات"
                >
                  <Play className="w-3 h-3 text-emerald-400" />
                  <span>محاكاة تغيرات المزود</span>
                </button>
              </div>

              <div className="flex items-center gap-1.5 mr-auto">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={onMarkAllAsRead}
                    className="flex items-center gap-1 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded-lg border border-slate-700 transition-colors"
                  >
                    <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>تحديد الكل كمقروء</span>
                  </button>
                )}

                {alerts.length > 0 && (
                  <button
                    type="button"
                    onClick={onClearAlerts}
                    className="flex items-center gap-1 text-rose-400 hover:text-rose-300 bg-rose-950/30 hover:bg-rose-900/40 px-2 py-1 rounded-lg border border-rose-500/30 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>مسح السجل</span>
                  </button>
                )}
              </div>
            </div>

            {/* Config Panel Dropdown */}
            {showConfig && (
              <div className="mt-3 p-3.5 rounded-xl bg-slate-950 border border-indigo-500/30 space-y-3 animate-fadeIn text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                    قواعد وشروط إطلاق التنبيهات
                  </span>
                  <span className="text-[10px] text-slate-500">حفظ تلقائي</span>
                </div>

                <div className="space-y-2.5">
                  {/* Availability Toggle */}
                  <label className="flex items-center justify-between cursor-pointer p-1.5 rounded hover:bg-slate-900/60">
                    <div>
                      <span className="text-slate-200 font-medium block">
                        تتبع تغيرات حالة التوفر (In Stock / Out of Stock)
                      </span>
                      <span className="text-[11px] text-slate-400">
                        تنبيه فوري عند نفاد المنتج من المزود أو عودته للتوفر مجدداً
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={ruleConfig.trackAvailabilityChanges}
                      onChange={(e) =>
                        onUpdateRuleConfig({
                          ...ruleConfig,
                          trackAvailabilityChanges: e.target.checked,
                        })
                      }
                      className="w-4 h-4 rounded accent-indigo-500 cursor-pointer"
                    />
                  </label>

                  {/* Price Changes Toggle */}
                  <label className="flex items-center justify-between cursor-pointer p-1.5 rounded hover:bg-slate-900/60">
                    <div>
                      <span className="text-slate-200 font-medium block">
                        تتبع تغيرات سعر التكلفة من المزود
                      </span>
                      <span className="text-[11px] text-slate-400">
                        تنبيه عند انخفاض أو ارتفاع سعر التكلفة فوق النسبة المحددة
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={ruleConfig.trackPriceChanges}
                      onChange={(e) =>
                        onUpdateRuleConfig({
                          ...ruleConfig,
                          trackPriceChanges: e.target.checked,
                        })
                      }
                      className="w-4 h-4 rounded accent-indigo-500 cursor-pointer"
                    />
                  </label>

                  {/* Price Change Threshold Percentage Controls */}
                  {ruleConfig.trackPriceChanges && (
                    <div className="mr-2 p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <span className="text-slate-200 font-semibold text-xs block">
                            نسبة التغير الافتراضية للتنبيه (Default %):
                          </span>
                          <span className="text-[10px] text-slate-400">
                            تُطبق تلقائياً على كافة المنتجات عند تغير سعر التكلفة
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-400 text-xs font-mono">±</span>
                          <input
                            type="number"
                            min="1"
                            max="100"
                            step="1"
                            value={ruleConfig.priceChangeThresholdPercent}
                            onChange={(e) =>
                              onUpdateRuleConfig({
                                ...ruleConfig,
                                priceChangeThresholdPercent: Math.max(1, Number(e.target.value) || 5),
                              })
                            }
                            className="w-16 bg-slate-950 border border-slate-700 text-indigo-300 font-bold px-2 py-1 rounded-lg text-center text-xs focus:outline-none focus:border-indigo-500 font-mono"
                          />
                          <span className="text-slate-300 font-bold text-xs">%</span>
                        </div>
                      </div>

                      {/* Quick percentage buttons */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[10px] text-slate-500 ml-1">نسب سريعة:</span>
                        {[3, 5, 8, 10, 15, 20].map((pct) => (
                          <button
                            key={pct}
                            type="button"
                            onClick={() =>
                              onUpdateRuleConfig({
                                ...ruleConfig,
                                priceChangeThresholdPercent: pct,
                              })
                            }
                            className={`text-[10px] px-2 py-0.5 rounded font-mono-numbers transition-colors border ${
                              ruleConfig.priceChangeThresholdPercent === pct
                                ? 'bg-indigo-600 text-white border-indigo-500 font-bold'
                                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border-slate-800'
                            }`}
                          >
                            ±{pct}%
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Section: Custom Per-Product Percentage Alerts */}
                  <div className="mr-2 p-3 bg-slate-900 rounded-xl border border-indigo-500/20 space-y-3">
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                      <div>
                        <span className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                          <Target className="w-3.5 h-3.5 text-indigo-400" />
                          تخصيص نسبة تغير مئوية لمنتجات معينة
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          حدد نسبة مئوية خاصة (مثلاً 5%) لأي منتج تفعله ليتم تنبيهك في السجل فور تجاوز تكلفته لهذه النسبة
                        </span>
                      </div>
                      <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded font-mono">
                        {(ruleConfig.enabledProductAlertIds || []).length} مفعل
                      </span>
                    </div>

                    {/* Quick Add Product Picker */}
                    <div className="flex items-center gap-2">
                      <select
                        value={selectedProductIdToAdd}
                        onChange={(e) => setSelectedProductIdToAdd(e.target.value)}
                        className="grow bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                      >
                        <option value="">-- اختر منتجاً لتفعيل تتبع نسبة خاصة له --</option>
                        {Array.from(productsMap.values()).map((p) => {
                          const isAlreadyAdded = (ruleConfig.enabledProductAlertIds || []).includes(p.id);
                          return (
                            <option key={p.id} value={p.id} disabled={isAlreadyAdded}>
                              #{p.id} - {p.name} (${p.costPriceUsd.toFixed(2)}) {isAlreadyAdded ? '✓ مفعل' : ''}
                            </option>
                          );
                        })}
                      </select>

                      <button
                        type="button"
                        onClick={handleAddProductToCustomAlert}
                        disabled={!selectedProductIdToAdd}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-medium text-xs whitespace-nowrap transition-colors flex items-center gap-1 shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>تفعيل المنتج</span>
                      </button>
                    </div>

                    {/* List of custom configured products */}
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {(!ruleConfig.enabledProductAlertIds || ruleConfig.enabledProductAlertIds.length === 0) ? (
                        <div className="p-3 text-center bg-slate-950/60 rounded-lg border border-slate-800 text-[11px] text-slate-400">
                          لم يتم تخصيص أي منتج بنسبة مستقلة بعد. اختر منتجاً من القائمة أعلاه لتحديد نسبته الخاصة.
                        </div>
                      ) : (
                        ruleConfig.enabledProductAlertIds.map((prodId) => {
                          const prod = productsMap.get(prodId);
                          const currentPercent = (ruleConfig.customProductPercentages && ruleConfig.customProductPercentages[prodId] !== undefined)
                            ? ruleConfig.customProductPercentages[prodId]
                            : ruleConfig.priceChangeThresholdPercent;

                          return (
                            <div
                              key={prodId}
                              className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-2 text-xs"
                            >
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-semibold text-slate-200 truncate">
                                    {prod?.name || `منتج #${prodId}`}
                                  </span>
                                  <span className="text-[10px] font-mono text-slate-400">
                                    ID: #{prodId}
                                  </span>
                                </div>
                                <span className="text-[10px] text-slate-400 block font-mono">
                                  التكلفة الحالية: ${prod?.costPriceUsd.toFixed(3) || '0.00'}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <div className="flex items-center gap-1 bg-slate-900 border border-indigo-500/30 rounded-lg px-2 py-0.5">
                                  <span className="text-[10px] text-slate-400">تنبيه عند:</span>
                                  <input
                                    type="number"
                                    min="1"
                                    max="100"
                                    value={currentPercent}
                                    onChange={(e) =>
                                      handleUpdateProductPercent(prodId, Number(e.target.value) || 5)
                                    }
                                    className="w-12 bg-transparent text-indigo-300 font-bold text-center text-xs focus:outline-none font-mono"
                                  />
                                  <span className="text-indigo-400 font-bold text-xs">%</span>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleRemoveProductFromCustomAlert(prodId)}
                                  className="text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-slate-900 transition-colors"
                                  title="إلغاء التخصيص والعودة للنسبة العامة"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Threshold Breach Toggle */}
                  <label className="flex items-center justify-between cursor-pointer p-1.5 rounded hover:bg-slate-900/60">
                    <div>
                      <span className="text-slate-200 font-medium block">
                        تتبع كسر حدود التكلفة المحددة (Threshold Breaches)
                      </span>
                      <span className="text-[11px] text-slate-400">
                        تنبيه عند هبوط تكلفة أي منتج دون حد الشراء المستهدف
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={ruleConfig.trackThresholdBreaches}
                      onChange={(e) =>
                        onUpdateRuleConfig({
                          ...ruleConfig,
                          trackThresholdBreaches: e.target.checked,
                        })
                      }
                      className="w-4 h-4 rounded accent-indigo-500 cursor-pointer"
                    />
                  </label>

                  {/* Email Notifications for High-Profit Products */}
                  <div className="pt-2.5 mt-1 border-t border-slate-800">
                    <label className="flex items-center justify-between cursor-pointer p-1.5 rounded hover:bg-slate-900/60">
                      <div>
                        <span className="text-slate-100 font-semibold flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-indigo-400" />
                          إرسال إشعارات عبر البريد الإلكتروني (Email Alerts)
                        </span>
                        <span className="text-[11px] text-slate-400">
                          إرسال رسالة فورية عند حدوث تغيرات كبيرة في أسعار المنتجات عالية الربحية
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={ruleConfig.emailNotificationsEnabled}
                        onChange={(e) =>
                          onUpdateRuleConfig({
                            ...ruleConfig,
                            emailNotificationsEnabled: e.target.checked,
                          })
                        }
                        className="w-4 h-4 rounded accent-indigo-500 cursor-pointer"
                      />
                    </label>

                    {ruleConfig.emailNotificationsEnabled && (
                      <div className="mt-2.5 mr-1 p-3 bg-slate-900 rounded-xl border border-indigo-500/20 space-y-3">
                        {/* Recipient Email Input */}
                        <div>
                          <label className="block text-[11px] font-medium text-slate-300 mb-1">
                            عنوان البريد الإلكتروني المستلم:
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="email"
                              value={ruleConfig.recipientEmail}
                              onChange={(e) =>
                                onUpdateRuleConfig({
                                  ...ruleConfig,
                                  recipientEmail: e.target.value,
                                })
                              }
                              placeholder="admin@store.com"
                              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                              dir="ltr"
                            />
                            <button
                              type="button"
                              onClick={handleSendTestEmail}
                              disabled={isSendingTestEmail}
                              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-medium text-xs whitespace-nowrap transition-colors flex items-center gap-1 shrink-0"
                              title="إرسال بريد تجريبي للتأكد من نجاح التكامل"
                            >
                              {isSendingTestEmail ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Send className="w-3.5 h-3.5" />
                              )}
                              <span>تجربة إرسال</span>
                            </button>
                          </div>
                          {testEmailStatus && (
                            <span className="text-[10px] text-emerald-400 block mt-1 font-medium">
                              {testEmailStatus}
                            </span>
                          )}
                        </div>

                        {/* High Profit Only Filter Toggle */}
                        <label className="flex items-center justify-between cursor-pointer pt-1 border-t border-slate-800/80">
                          <div>
                            <span className="text-slate-200 font-medium block">
                              حصر الإرسال على المنتجات "عالية الربحية" فقط (High Margin)
                            </span>
                            <span className="text-[10px] text-slate-400">
                              تقتصر الإشعارات على المنتجات التي يبلغ هامش ربحها ≥ 20% لتجنب إزعاج البريد
                            </span>
                          </div>
                          <input
                            type="checkbox"
                            checked={ruleConfig.emailOnHighProfitOnly}
                            onChange={(e) =>
                              onUpdateRuleConfig({
                                ...ruleConfig,
                                emailOnHighProfitOnly: e.target.checked,
                              })
                            }
                            className="w-4 h-4 rounded accent-indigo-500 cursor-pointer"
                          />
                        </label>

                        {/* Large Price Change Sensitivity */}
                        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/80">
                          <span className="text-slate-300 text-[11px]">
                            الحد الأدنى لنسبة التغير لإرسال بريد:
                          </span>
                          <select
                            value={ruleConfig.emailPriceChangeThresholdPercent}
                            onChange={(e) =>
                              onUpdateRuleConfig({
                                ...ruleConfig,
                                emailPriceChangeThresholdPercent: Number(e.target.value),
                              })
                            }
                            className="bg-slate-800 border border-slate-700 text-indigo-300 font-bold px-2 py-1 rounded text-xs focus:outline-none"
                          >
                            <option value={10}>تغير بنسبة ≥ 10% (ملحوظ)</option>
                            <option value={15}>تغير بنسبة ≥ 15% (كبير - موصى به)</option>
                            <option value={20}>تغير بنسبة ≥ 20% (جوهري جداً)</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pt-3 scrollbar-none text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  activeTab === 'all'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                الكل ({alerts.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('unread')}
                className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors flex items-center gap-1 ${
                  activeTab === 'unread'
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                غير المقروءة ({unreadCount})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('price')}
                className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors flex items-center gap-1 ${
                  activeTab === 'price'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <TrendingDown className="w-3 h-3 text-emerald-400" />
                الأسعار والتكلفة
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('availability')}
                className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors flex items-center gap-1 ${
                  activeTab === 'availability'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <PackageCheck className="w-3 h-3 text-cyan-400" />
                حالة التوفر
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('threshold')}
                className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors flex items-center gap-1 ${
                  activeTab === 'threshold'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Zap className="w-3 h-3 text-amber-400" />
                حدود التكلفة
              </button>
            </div>
          </div>

          {/* Alerts Content List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
            {filteredAlerts.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto text-slate-500 mb-3">
                  <BellRing className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-semibold text-slate-300 mb-1">
                  لا توجد تنبيهات مطابقة حالياً
                </h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto mb-4">
                  {activeTab === 'unread'
                    ? 'جميع التنبيهات مقروءة ومحدثة بالكامل.'
                    : 'سيتم رصد وتسجيل أي تغيرات في التوفر أو التكلفة تلقائياً.'}
                </p>
                <button
                  type="button"
                  onClick={onSimulateProviderChanges}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>محاكاة تغيرات المزود الآن</span>
                </button>
              </div>
            ) : (
              filteredAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3.5 rounded-xl border transition-all ${getSeverityStyle(alert)}`}
                >
                  {/* Alert Top Info */}
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded-lg bg-slate-900 border border-slate-800 shrink-0">
                        {getAlertIcon(alert.type)}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-100 block">
                          {alert.title}
                        </span>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400">
                          <span className="font-mono text-slate-300">ID: #{alert.productId}</span>
                          <span aria-hidden="true">·</span>
                          <span>{alert.category}</span>
                          <span aria-hidden="true">·</span>
                          <span className="flex items-center gap-1 text-slate-400">
                            <Clock className="w-2.5 h-2.5" />
                            {alert.timestamp}
                          </span>
                        </div>
                      </div>
                    </div>

                    {!alert.isRead ? (
                      <button
                        type="button"
                        onClick={() => onMarkAsRead(alert.id)}
                        className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-0.5 rounded border border-slate-700 transition-colors whitespace-nowrap shrink-0"
                      >
                        تعليم كمقروء
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-500 flex items-center gap-0.5">
                        <CheckCircle2 className="w-3 h-3 text-slate-600" />
                        مقروء
                      </span>
                    )}
                  </div>

                  {/* Product Name */}
                  <p className="text-xs font-semibold text-slate-200 mb-1.5">
                    {alert.productName}
                  </p>

                  {/* Diff / Details Highlight */}
                  <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-2 text-xs flex flex-wrap items-center justify-between gap-2 mb-2">
                    <span className="text-slate-300 text-[11px]">{alert.message}</span>

                    {alert.changePercent !== undefined && (
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono-numbers ${
                          alert.changePercent < 0
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                            : 'bg-rose-950 text-rose-300 border border-rose-500/40'
                        }`}
                      >
                        {alert.changePercent > 0 ? `+${alert.changePercent}%` : `${alert.changePercent}%`}
                      </span>
                    )}
                  </div>

                  {/* Email & Profit Tier Badges */}
                  {(alert.emailSent || alert.isHighProfit) && (
                    <div className="flex flex-wrap items-center gap-1.5 mb-2 text-[10px]">
                      {alert.isHighProfit && (
                        <span className="bg-emerald-950/70 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded font-medium flex items-center gap-1">
                          💎 عالية الربحية (High Margin)
                        </span>
                      )}
                      {alert.emailSent && (
                        <span className="bg-indigo-950/70 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded font-medium flex items-center gap-1 font-mono">
                          <Mail className="w-3 h-3 text-indigo-400" />
                          <span>إشعار بريدي: {alert.emailRecipient}</span>
                        </span>
                      )}
                    </div>
                  )}

                  {/* Card Bottom Actions */}
                  <div className="flex items-center justify-between pt-1 text-xs">
                    <button
                      type="button"
                      onClick={() => handleOpenProduct(alert)}
                      className="text-indigo-400 hover:text-indigo-300 text-xs font-semibold flex items-center gap-1 group transition-colors"
                    >
                      <span>عرض تفاصيل المنتج وحاسبة الربح</span>
                      <ArrowRight className="w-3 h-3 transition-transform group-hover:-translate-x-0.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Info */}
          <div className="p-3 bg-slate-950/90 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>سجل الأحداث يحتفظ بآخر 50 تنبيهاً مباشراً</span>
            <span className="text-slate-500 font-mono-numbers">محدث تلقائياً</span>
          </div>
        </div>
      </div>
    </div>
  );
};
