import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { Sidebar, ActiveSectionId } from './components/Sidebar';
import { FilterBar } from './components/FilterBar';
import { ProductTable } from './components/ProductTable';
import { MarginConfigModal } from './components/MarginConfigModal';
import { ThresholdConfigModal } from './components/ThresholdConfigModal';
import { ProductDetailModal } from './components/ProductDetailModal';
import { DocsDrawer } from './components/DocsDrawer';
import { AlertsDrawer } from './components/AlertsDrawer';
import { AlertToast } from './components/AlertToast';
import { SyncScheduleModal } from './components/SyncScheduleModal';
import { DeploymentGuideModal } from './components/DeploymentGuideModal';
import {
  ProviderPreset,
  MarginConfig,
  PriceThresholdConfig,
  FilterState,
  CatalogProduct,
  RawProviderProduct,
  AppAlertItem,
  AlertRuleConfig,
  SyncScheduleConfig,
  NormalizedParam,
  ThemeMode,
} from './types';
import { PROVIDER_PRESETS } from './data/mockCatalog';
import {
  transformRawProduct,
  exportProductsToCsv,
  buildBackendUrl,
} from './utils/normalizer';
import {
  Package,
  Layers,
  Sparkles,
  Bell,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  X,
  ChevronLeft,
  ChevronRight,
  Database,
  BellRing,
  Zap,
  PieChart as PieChartIcon,
  Globe,
  KeyRound,
  RefreshCw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
} from 'recharts';

export default function App() {
  // Provider settings (persisted in localStorage for real credentials)
  const [selectedPreset, setSelectedPreset] = useState<ProviderPreset>(PROVIDER_PRESETS[0]);
  const [baseUrl, setBaseUrl] = useState<string>(() => localStorage.getItem('shadx_base_url') || '');
  const [apiToken, setApiToken] = useState<string>(() => localStorage.getItem('shadx_api_token') || '');

  // Persist real baseUrl and apiToken in localStorage
  useEffect(() => {
    localStorage.setItem('shadx_base_url', baseUrl);
  }, [baseUrl]);

  useEffect(() => {
    localStorage.setItem('shadx_api_token', apiToken);
  }, [apiToken]);

  // Theme Mode ('system' auto-detects OS preference, while 'dark' and 'light' are manual overrides)
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('shadx_theme_mode');
    if (saved === 'system' || saved === 'dark' || saved === 'light') {
      return saved;
    }
    return 'system';
  });

  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true;
  });

  // Listen in real-time to OS/Browser color scheme changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemPrefersDark(e.matches);
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const resolvedTheme: 'dark' | 'light' =
    themeMode === 'system' ? (systemPrefersDark ? 'dark' : 'light') : themeMode;

  // Apply .dark or .light class on <html> and persist user's themeMode choice
  useEffect(() => {
    localStorage.setItem('shadx_theme_mode', themeMode);
    const root = document.documentElement;
    if (resolvedTheme === 'light') {
      root.classList.remove('dark');
      root.classList.add('light');
    } else {
      root.classList.remove('light');
      root.classList.add('dark');
    }
  }, [themeMode, resolvedTheme]);

  // Live state & balance
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(false);
  const [userBalance, setUserBalance] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Raw catalog products (starts completely empty — populated only from real provider API)
  const [rawProducts, setRawProducts] = useState<RawProviderProduct[]>([]);

  // Profit Margin Config
  const [marginConfig, setMarginConfig] = useState<MarginConfig>({
    mode: 'percentage',
    value: 15,
    rounding: 'exact',
  });

  // Price Threshold Config (clean — no pre-seeded fake product IDs)
  const [thresholdConfig, setThresholdConfig] = useState<PriceThresholdConfig>({
    enabled: true,
    defaultThreshold: '',
    productThresholds: {},
  });

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    selectedCategory: 'all',
    availability: 'all',
    productType: 'all',
    paramFilter: 'all',
    integrationFilter: 'all',
    minCost: '',
    maxCost: '',
    sortBy: 'id_asc',
    onlyThresholdAlerts: false,
  });

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());
  const [isCopiedIds, setIsCopiedIds] = useState<boolean>(false);

  // Active Sidebar Section & Mobile Drawer state
  const [activeSection, setActiveSection] = useState<ActiveSectionId>('catalog');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [showConnectionToken, setShowConnectionToken] = useState<boolean>(false);

  // Modals & Drawers
  const [activeModalProduct, setActiveModalProduct] = useState<CatalogProduct | null>(null);
  const [modalFixMode, setModalFixMode] = useState<boolean>(false);
  const [isMarginModalOpen, setIsMarginModalOpen] = useState<boolean>(false);
  const [isThresholdModalOpen, setIsThresholdModalOpen] = useState<boolean>(false);
  const [isDocsDrawerOpen, setIsDocsDrawerOpen] = useState<boolean>(false);
  const [isAlertsDrawerOpen, setIsAlertsDrawerOpen] = useState<boolean>(false);
  const [activeToastAlert, setActiveToastAlert] = useState<AppAlertItem | null>(null);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState<boolean>(false);
  const [isDeploymentModalOpen, setIsDeploymentModalOpen] = useState<boolean>(false);

  // Periodic background sync schedule config (default every 15 minutes)
  const [syncConfig, setSyncConfig] = useState<SyncScheduleConfig>({
    enabled: true,
    intervalMinutes: 15,
    lastSyncTime: null,
    nextSyncTime: null,
    syncCount: 0,
    isSyncing: false,
    secondsRemaining: 15 * 60,
  });

  // Status & Price Alert Rule Config (persisted in localStorage, clean — no fake product IDs)
  const [alertRuleConfig, setAlertRuleConfig] = useState<AlertRuleConfig>(() => {
    const defaults: AlertRuleConfig = {
      trackAvailabilityChanges: true,
      trackPriceChanges: true,
      priceChangeThresholdPercent: 5,
      customProductPercentages: {},
      enabledProductAlertIds: [],
      trackThresholdBreaches: true,
      notifyOnCostDrop: true,
      notifyOnCostHike: true,
      playSound: true,
      emailNotificationsEnabled: false,
      recipientEmail: '',
      emailOnHighProfitOnly: true,
      emailPriceChangeThresholdPercent: 10,
      telegramNotificationsEnabled: false,
      telegramBotToken: '',
      telegramChatId: '',
      telegramNotifyOnCostDrop: true,
      telegramNotifyOnNewOrAvailableProducts: true,
    };
    try {
      const saved = localStorage.getItem('shadx_alert_rules');
      if (saved) {
        return { ...defaults, ...JSON.parse(saved) };
      }
    } catch {
      // Fallback to defaults
    }
    return defaults;
  });

  useEffect(() => {
    try {
      localStorage.setItem('shadx_alert_rules', JSON.stringify(alertRuleConfig));
    } catch {
      // Ignore storage quota errors
    }
  }, [alertRuleConfig]);

  // Alert Log History (clean — only populated by real provider status/price changes)
  const [alerts, setAlerts] = useState<AppAlertItem[]>([]);

  // Product snapshot ref to detect status and cost changes
  const previousProductsRef = useRef<Map<string | number, RawProviderProduct>>(new Map());

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(50);

  // Notification Banner
  const [notification, setNotification] = useState<{
    text: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

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
    if (preset.baseUrl) {
      setBaseUrl(preset.baseUrl);
    }
    if (preset.defaultToken) {
      setApiToken(preset.defaultToken);
    }
    setIsLiveConnected(false);
    setUserBalance(null);
    setUserEmail(null);
  };

  // Live Fetch Products & Profile via Server Proxy
  const handleFetchProducts = async () => {
    if (!baseUrl.trim() || !apiToken.trim()) {
      setNotification({
        text: 'يرجى إدخال عنوان الـ API (Base URL) ورمز التوثيق الحقيقي (API Token) للمزود أولاً.',
        type: 'error',
      });
      return;
    }

    setIsLoading(true);
    setNotification(null);

    try {
      // 1. Fetch Products
      const prodRes = await fetch(buildBackendUrl('/api/proxy/products'), {
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

      const nowTimeStr = new Date().toLocaleTimeString('ar-SA', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

      setRawProducts(receivedList);
      detectAndGenerateAlerts(receivedList, 'المزود المباشر');
      setIsLiveConnected(true);
      setCurrentPage(1);
      setSelectedIds(new Set());
      setSyncConfig((prev) => ({
        ...prev,
        lastSyncTime: nowTimeStr,
        syncCount: prev.syncCount + 1,
        secondsRemaining: prev.intervalMinutes * 60,
      }));

      // 2. Fetch Profile Balance
      try {
        const profRes = await fetch(buildBackendUrl('/api/proxy/profile'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ baseUrl, apiToken }),
        });
        const profData = await profRes.json();
        if (profData.success && profData.data?.balance !== undefined) {
          setUserBalance(String(profData.data.balance));
          if (profData.data.email) setUserEmail(String(profData.data.email));
        }
      } catch {
        // Balance fetch is secondary
      }

      setNotification({
        text: `تم الاتصال بنجاح وجلب ${receivedList.length} منتج مباشرة من حسابك لدى المزود.`,
        type: 'success',
      });
    } catch (err: any) {
      console.warn('API fetch issue:', err);
      setNotification({
        text: `تعذر الاتصال بالمزود (${err.message}). تأكد من صحة رابط الـ Base URL وصلاحية الـ API Token.`,
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to dispatch instant Telegram Bot notifications
  const dispatchTelegramAlert = (payload: {
    title: string;
    productName: string;
    productId: string | number;
    category: string;
    message: string;
    oldValue?: string | number | boolean;
    newValue?: string | number | boolean;
    changePercent?: number;
    eventType: 'price_drop' | 'threshold_breach' | 'new_product' | 'availability_back';
  }) => {
    if (
      !alertRuleConfig.telegramNotificationsEnabled ||
      !alertRuleConfig.telegramBotToken?.trim() ||
      !alertRuleConfig.telegramChatId?.trim()
    ) {
      return;
    }

    fetch(buildBackendUrl('/api/notifications/send-telegram'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        botToken: alertRuleConfig.telegramBotToken,
        chatId: alertRuleConfig.telegramChatId,
        ...payload,
        isTest: false,
      }),
    }).catch((err) => console.warn('Telegram notification dispatch failed:', err));
  };

  // Core Alert Detection Function: compares old product snapshots with new states
  const detectAndGenerateAlerts = (
    newProducts: RawProviderProduct[],
    sourceLabel: string = 'المزود'
  ) => {
    const prevMap = previousProductsRef.current;
    const hadPreviousSnapshot = prevMap.size > 0;
    const newAlerts: AppAlertItem[] = [];
    const now = new Date();
    const timeFormatted = now.toLocaleTimeString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    const isTelegramReady =
      Boolean(alertRuleConfig.telegramNotificationsEnabled) &&
      Boolean(alertRuleConfig.telegramBotToken?.trim()) &&
      Boolean(alertRuleConfig.telegramChatId?.trim());

    newProducts.forEach((newProd) => {
      const newCost =
        typeof newProd.price === 'number'
          ? newProd.price
          : parseFloat(String(newProd.price)) || 0;
      const newAvail =
        newProd.available === true ||
        newProd.available === 1 ||
        newProd.available === '1' ||
        newProd.available === 'true';

      const oldProd = prevMap.get(newProd.id);

      // 0. Brand New Product Detected in Catalog (after initial sync)
      if (!oldProd) {
        prevMap.set(newProd.id, { ...newProd });

        if (hadPreviousSnapshot && newAvail && alertRuleConfig.trackAvailabilityChanges) {
          const shouldSendTgNew =
            isTelegramReady && (alertRuleConfig.telegramNotifyOnNewOrAvailableProducts ?? true);

          const alertTitle = 'توفر منتج جديد في كتالوج المزود';
          const alertMsg = `تم رصد إضافة منتج جديد متاح للطلب الفوري من (${sourceLabel}) بتكلفة $${newCost.toFixed(3)}.`;

          if (shouldSendTgNew) {
            dispatchTelegramAlert({
              title: alertTitle,
              productName: newProd.name,
              productId: newProd.id,
              category: newProd.category_name || 'عام',
              message: alertMsg,
              oldValue: 'غير مدرج سابقاً',
              newValue: `متوفر ($${newCost.toFixed(3)})`,
              eventType: 'new_product',
            });
          }

          newAlerts.push({
            id: `alert-new-prod-${newProd.id}-${Date.now()}-${Math.random()}`,
            timestamp: timeFormatted,
            dateObj: now.toISOString(),
            productId: newProd.id,
            productName: newProd.name,
            category: newProd.category_name || 'عام',
            type: 'new_product',
            severity: 'success',
            title: alertTitle,
            message: alertMsg,
            oldValue: 'جديد',
            newValue: `$${newCost.toFixed(3)}`,
            isRead: false,
            telegramSent: shouldSendTgNew,
            telegramChatId: shouldSendTgNew ? alertRuleConfig.telegramChatId : undefined,
          });
        }
        return;
      }

      const oldCost =
        typeof oldProd.price === 'number'
          ? oldProd.price
          : parseFloat(String(oldProd.price)) || 0;

      const oldAvail =
        oldProd.available === true ||
        oldProd.available === 1 ||
        oldProd.available === '1' ||
        oldProd.available === 'true';

      // 1. Availability Status Changed
      if (alertRuleConfig.trackAvailabilityChanges && oldAvail !== newAvail) {
        if (!newAvail) {
          newAlerts.push({
            id: `alert-avail-oos-${newProd.id}-${Date.now()}-${Math.random()}`,
            timestamp: timeFormatted,
            dateObj: now.toISOString(),
            productId: newProd.id,
            productName: newProd.name,
            category: newProd.category_name || 'عام',
            type: 'availability_oos',
            severity: 'danger',
            title: 'نفاد الكمية وتوقف التوفر من المزود',
            message: `تحولت حالة المنتج إلى "غير متوفر" من مزود الخدمة (${sourceLabel}).`,
            oldValue: 'متاح للطلب',
            newValue: 'غير متوفر',
            isRead: false,
          });
        } else {
          const shouldSendTgAvail =
            isTelegramReady && (alertRuleConfig.telegramNotifyOnNewOrAvailableProducts ?? true);
          const alertTitle = 'عودة المنتج للتوفر والطلب الفوري';
          const alertMsg = `أصبح المنتج متاحاً وجاهزاً للطلب الفوري وتنفيذ طلبات العملاء (${sourceLabel}) بتكلفة $${newCost.toFixed(3)}.`;

          if (shouldSendTgAvail) {
            dispatchTelegramAlert({
              title: alertTitle,
              productName: newProd.name,
              productId: newProd.id,
              category: newProd.category_name || 'عام',
              message: alertMsg,
              oldValue: 'غير متوفر',
              newValue: `متاح للطلب ($${newCost.toFixed(3)})`,
              eventType: 'availability_back',
            });
          }

          newAlerts.push({
            id: `alert-avail-back-${newProd.id}-${Date.now()}-${Math.random()}`,
            timestamp: timeFormatted,
            dateObj: now.toISOString(),
            productId: newProd.id,
            productName: newProd.name,
            category: newProd.category_name || 'عام',
            type: 'availability_back',
            severity: 'success',
            title: alertTitle,
            message: alertMsg,
            oldValue: 'غير متوفر',
            newValue: 'متاح للطلب',
            isRead: false,
            telegramSent: shouldSendTgAvail,
            telegramChatId: shouldSendTgAvail ? alertRuleConfig.telegramChatId : undefined,
          });
        }
      }

      // 2. Cost Price Changed
      const isCustomTracked = alertRuleConfig.enabledProductAlertIds.includes(newProd.id);
      const effectiveThresholdPercent = isCustomTracked && alertRuleConfig.customProductPercentages[newProd.id] !== undefined
        ? alertRuleConfig.customProductPercentages[newProd.id]
        : alertRuleConfig.priceChangeThresholdPercent;

      if (
        (alertRuleConfig.trackPriceChanges || isCustomTracked) &&
        oldCost > 0 &&
        newCost > 0 &&
        oldCost !== newCost
      ) {
        const diff = newCost - oldCost;
        const percentChange = Number(((diff / oldCost) * 100).toFixed(1));

        if (Math.abs(percentChange) >= effectiveThresholdPercent) {
          // Determine if product is high-profit (markup / margin >= 20%)
          const estimatedSell = marginConfig.mode === 'percentage'
            ? newCost * (1 + marginConfig.value / 100)
            : newCost + marginConfig.value;
          const estimatedMarkup = newCost > 0 ? ((estimatedSell - newCost) / newCost) * 100 : 0;
          const isHighProfit = estimatedMarkup >= 20;

          // Check if email dispatch condition is met
          const shouldSendEmail =
            alertRuleConfig.emailNotificationsEnabled &&
            Boolean(alertRuleConfig.recipientEmail) &&
            (!alertRuleConfig.emailOnHighProfitOnly || isHighProfit) &&
            Math.abs(percentChange) >= alertRuleConfig.emailPriceChangeThresholdPercent;

          if (shouldSendEmail) {
            fetch(buildBackendUrl('/api/notifications/send-email'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                recipientEmail: alertRuleConfig.recipientEmail,
                subject: `تنبيه تغير سعر منتج عالي الربحية: ${newProd.name} (${percentChange > 0 ? `+${percentChange}%` : `${percentChange}%`})`,
                productName: newProd.name,
                productId: newProd.id,
                oldCost: `$${oldCost.toFixed(3)}`,
                newCost: `$${newCost.toFixed(3)}`,
                changePercent: percentChange,
                profitTier: isHighProfit ? 'عالية الربحية (≥20%)' : 'متوسطة الربحية',
                marginPercent: Number(estimatedMarkup.toFixed(1)),
                isTest: false,
              }),
            }).catch((err) => console.warn('Email dispatch failed:', err));
          }

          const customNote = isCustomTracked
            ? ` (تجاوز حد التغير المخصص ${effectiveThresholdPercent}%)`
            : '';

          if (percentChange < 0 && alertRuleConfig.notifyOnCostDrop) {
            const shouldSendTgDrop =
              isTelegramReady && (alertRuleConfig.telegramNotifyOnCostDrop ?? true);
            const dropTitle = `انخفاض سعر التكلفة بنسبة ${Math.abs(percentChange)}%${customNote}`;
            const dropMsg = `انخفضت التكلفة من $${oldCost.toFixed(3)} إلى $${newCost.toFixed(3)} (وفر: $${Math.abs(diff).toFixed(3)}). ينصح بمراجعة هوامشك لزيادة الأرباح!`;

            if (shouldSendTgDrop) {
              dispatchTelegramAlert({
                title: dropTitle,
                productName: newProd.name,
                productId: newProd.id,
                category: newProd.category_name || 'عام',
                message: dropMsg,
                oldValue: `$${oldCost.toFixed(3)}`,
                newValue: `$${newCost.toFixed(3)}`,
                changePercent: percentChange,
                eventType: 'price_drop',
              });
            }

            newAlerts.push({
              id: `alert-price-drop-${newProd.id}-${Date.now()}-${Math.random()}`,
              timestamp: timeFormatted,
              dateObj: now.toISOString(),
              productId: newProd.id,
              productName: newProd.name,
              category: newProd.category_name || 'عام',
              type: 'price_drop',
              severity: 'success',
              title: dropTitle,
              message: dropMsg,
              oldValue: `$${oldCost.toFixed(3)}`,
              newValue: `$${newCost.toFixed(3)}`,
              changePercent: percentChange,
              isRead: false,
              emailSent: shouldSendEmail,
              emailRecipient: shouldSendEmail ? alertRuleConfig.recipientEmail : undefined,
              telegramSent: shouldSendTgDrop,
              telegramChatId: shouldSendTgDrop ? alertRuleConfig.telegramChatId : undefined,
              isHighProfit,
              customPercentageThreshold: isCustomTracked ? effectiveThresholdPercent : undefined,
            });
          } else if (percentChange > 0 && alertRuleConfig.notifyOnCostHike) {
            newAlerts.push({
              id: `alert-price-hike-${newProd.id}-${Date.now()}-${Math.random()}`,
              timestamp: timeFormatted,
              dateObj: now.toISOString(),
              productId: newProd.id,
              productName: newProd.name,
              category: newProd.category_name || 'عام',
              type: 'price_hike',
              severity: 'danger',
              title: `ارتفاع سعر التكلفة بنسبة +${percentChange}%${customNote}`,
              message: `ارتفعت التكلفة من $${oldCost.toFixed(3)} إلى $${newCost.toFixed(3)} (+${diff.toFixed(3)}$). يرجى مراجعة سعر البيع لتجنب تآكل الأرباح!`,
              oldValue: `$${oldCost.toFixed(3)}`,
              newValue: `$${newCost.toFixed(3)}`,
              changePercent: percentChange,
              isRead: false,
              emailSent: shouldSendEmail,
              emailRecipient: shouldSendEmail ? alertRuleConfig.recipientEmail : undefined,
              isHighProfit,
              customPercentageThreshold: isCustomTracked ? effectiveThresholdPercent : undefined,
            });
          }
        }
      }

      // 3. Target Cost Threshold Breach
      if (alertRuleConfig.trackThresholdBreaches) {
        const targetThreshold =
          thresholdConfig.productThresholds[newProd.id] ||
          (typeof thresholdConfig.defaultThreshold === 'number'
            ? thresholdConfig.defaultThreshold
            : null);

        if (
          targetThreshold &&
          newCost < targetThreshold &&
          (oldCost >= targetThreshold || oldCost === 0)
        ) {
          const shouldSendTgThreshold =
            isTelegramReady && (alertRuleConfig.telegramNotifyOnCostDrop ?? true);
          const threshTitle = `كسر حد التكلفة المستهدف ($${targetThreshold})`;
          const threshMsg = `انخفضت التكلفة الجديدة ($${newCost.toFixed(2)}) دون الحد المالي المحدد، بتوفير قدره $${(targetThreshold - newCost).toFixed(2)}!`;

          if (shouldSendTgThreshold) {
            dispatchTelegramAlert({
              title: threshTitle,
              productName: newProd.name,
              productId: newProd.id,
              category: newProd.category_name || 'عام',
              message: threshMsg,
              oldValue: `الحد: $${targetThreshold}`,
              newValue: `الجديد: $${newCost.toFixed(2)}`,
              eventType: 'threshold_breach',
            });
          }

          newAlerts.push({
            id: `alert-threshold-${newProd.id}-${Date.now()}-${Math.random()}`,
            timestamp: timeFormatted,
            dateObj: now.toISOString(),
            productId: newProd.id,
            productName: newProd.name,
            category: newProd.category_name || 'عام',
            type: 'threshold_breach',
            severity: 'warning',
            title: threshTitle,
            message: threshMsg,
            oldValue: `الحد: $${targetThreshold}`,
            newValue: `الجديد: $${newCost.toFixed(2)}`,
            isRead: false,
            telegramSent: shouldSendTgThreshold,
            telegramChatId: shouldSendTgThreshold ? alertRuleConfig.telegramChatId : undefined,
          });
        }
      }

      // Update snapshot
      prevMap.set(newProd.id, { ...newProd });
    });

    if (newAlerts.length > 0) {
      setAlerts((prev) => [...newAlerts, ...prev].slice(0, 50));
      setActiveToastAlert(newAlerts[0]);
    }

    return newAlerts;
  };

  // Trigger real provider check from Alerts Drawer
  const handleCheckProviderChanges = () => {
    handleFetchProducts();
  };

  const handleMarkAlertAsRead = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, isRead: true } : a))
    );
  };

  const handleMarkAllAlertsAsRead = () => {
    setAlerts((prev) => prev.map((a) => ({ ...a, isRead: true })));
  };

  const handleClearAlerts = () => {
    setAlerts([]);
  };

  const unreadAlertsCount = useMemo(() => {
    return alerts.filter((a) => !a.isRead).length;
  }, [alerts]);

  // Core background sync executor (only runs when real credentials are provided)
  const triggerBackgroundSync = useCallback(async () => {
    if (!baseUrl.trim() || !apiToken.trim()) {
      return;
    }

    setSyncConfig((prev) => ({ ...prev, isSyncing: true }));
    const nowTimeStr = new Date().toLocaleTimeString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    try {
      const prodRes = await fetch(buildBackendUrl('/api/proxy/products'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baseUrl, apiToken }),
      });
      const prodData = await prodRes.json();
      if (prodData.success) {
        const receivedList: RawProviderProduct[] = Array.isArray(prodData.data)
          ? prodData.data
          : prodData.data?.products || [];
        if (receivedList.length > 0) {
          setRawProducts(receivedList);
          detectAndGenerateAlerts(receivedList, 'فحص دوري تلقائي');
          setIsLiveConnected(true);
        }
      }

      setSyncConfig((prev) => ({
        ...prev,
        lastSyncTime: nowTimeStr,
        syncCount: prev.syncCount + 1,
        isSyncing: false,
        secondsRemaining: prev.intervalMinutes * 60,
      }));
    } catch (e) {
      console.warn('Periodic sync background issue:', e);
      setSyncConfig((prev) => ({
        ...prev,
        isSyncing: false,
        secondsRemaining: prev.intervalMinutes * 60,
      }));
    }
  }, [baseUrl, apiToken, alertRuleConfig, thresholdConfig]);

  // Scheduled Periodic Sync Engine using setInterval
  useEffect(() => {
    if (!syncConfig.enabled || !isLiveConnected) return;

    const intervalTimer = setInterval(() => {
      setSyncConfig((prev) => {
        if (!prev.enabled) return prev;

        if (prev.secondsRemaining <= 1) {
          triggerBackgroundSync();
          return {
            ...prev,
            secondsRemaining: prev.intervalMinutes * 60,
          };
        }

        return {
          ...prev,
          secondsRemaining: prev.secondsRemaining - 1,
        };
      });
    }, 1000);

    return () => clearInterval(intervalTimer);
  }, [syncConfig.enabled, syncConfig.intervalMinutes, isLiveConnected, triggerBackgroundSync]);

  const handleTriggerManualSync = async () => {
    if (!baseUrl.trim() || !apiToken.trim()) {
      setNotification({
        text: 'يرجى إدخال عنوان الـ API (Base URL) ورمز التوثيق (API Token) أولاً لإجراء المزامنة.',
        type: 'error',
      });
      return;
    }
    await triggerBackgroundSync();
    setNotification({
      text: '⚡ اكتمل الفحص والمزامنة الفورية للمزود بنجاح، وتم تحديث مؤشر آخر وقت فحص.',
      type: 'success',
    });
  };

  // Transform raw items into enriched CatalogProduct items using active marginConfig and thresholdConfig
  const catalogProducts = useMemo(() => {
    return rawProducts.map((raw) => transformRawProduct(raw, marginConfig, thresholdConfig));
  }, [rawProducts, marginConfig, thresholdConfig]);

  // Fast lookup map for opening products by ID
  const productsMap = useMemo(() => {
    const map = new Map<string | number, CatalogProduct>();
    catalogProducts.forEach((p) => map.set(p.id, p));
    return map;
  }, [catalogProducts]);

  // Count products triggering the threshold alert
  const alertProductsCount = useMemo(() => {
    return catalogProducts.filter((p) => p.isBelowThreshold).length;
  }, [catalogProducts]);

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
        // Price drop threshold alert filter
        if (filters.onlyThresholdAlerts && !p.isBelowThreshold) {
          return false;
        }

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

        // Auto-Integration status filter
        if (filters.integrationFilter && filters.integrationFilter !== 'all') {
          if (p.integrationStatus !== filters.integrationFilter) return false;
        }

        // Min Cost
        if (filters.minCost !== '' && p.costPriceUsd < filters.minCost) return false;

        // Max Cost
        if (filters.maxCost !== '' && p.costPriceUsd > filters.maxCost) return false;

        return true;
      })
      .sort((a, b) => {
        switch (filters.sortBy) {
          case 'savings_desc':
            return (b.thresholdSavings || 0) - (a.thresholdSavings || 0);
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
      integrationFilter: 'all',
      minCost: '',
      maxCost: '',
      sortBy: 'id_asc',
      onlyThresholdAlerts: false,
    });
  };

  // High-level KPI metrics
  const availableCount = useMemo(() => {
    return catalogProducts.filter((p) => p.isAvailable).length;
  }, [catalogProducts]);

  // Profitability Analytics on currently filtered products
  const profitAnalytics = useMemo(() => {
    if (filteredProducts.length === 0) {
      return {
        avgProfitUsd: 0,
        avgProfitPercent: 0,
        totalProfitPotential: 0,
        distribution: [
          { name: 'عالية (≥20%)', value: 0, color: '#10b981', tier: 'high' },
          { name: 'متوسطة (10-20%)', value: 0, color: '#6366f1', tier: 'medium' },
          { name: 'منخفضة (<10%)', value: 0, color: '#f59e0b', tier: 'low' },
        ],
        counts: { high: 0, medium: 0, low: 0 },
        percentages: { high: 0, medium: 0, low: 0 },
      };
    }

    let totalProfitUsd = 0;
    let totalProfitPercentSum = 0;
    let high = 0;
    let medium = 0;
    let low = 0;

    filteredProducts.forEach((p) => {
      const profitUsd = p.suggestedSellPriceUsd - p.costPriceUsd;
      const profitPct = p.costPriceUsd > 0 ? (profitUsd / p.costPriceUsd) * 100 : 0;
      totalProfitUsd += profitUsd;
      totalProfitPercentSum += profitPct;

      if (profitPct >= 20 || profitUsd >= 2.0) {
        high++;
      } else if (profitPct >= 10 || profitUsd >= 0.5) {
        medium++;
      } else {
        low++;
      }
    });

    const total = filteredProducts.length;
    const avgProfitUsd = totalProfitUsd / total;
    const avgProfitPercent = totalProfitPercentSum / total;

    return {
      avgProfitUsd,
      avgProfitPercent,
      totalProfitPotential: totalProfitUsd,
      distribution: [
        { name: 'عالية (≥20%)', value: high, color: '#10b981', tier: 'high' },
        { name: 'متوسطة (10-20%)', value: medium, color: '#6366f1', tier: 'medium' },
        { name: 'منخفضة (<10%)', value: low, color: '#f59e0b', tier: 'low' },
      ],
      counts: { high, medium, low },
      percentages: {
        high: Math.round((high / total) * 100),
        medium: Math.round((medium / total) * 100),
        low: Math.round((low / total) * 100),
      },
    };
  }, [filteredProducts]);

  // Handler to update or set custom threshold for a product
  const handleUpdateProductThreshold = (productId: string | number, threshold: number) => {
    setThresholdConfig((prev) => ({
      ...prev,
      enabled: true,
      productThresholds: {
        ...prev.productThresholds,
        [productId]: threshold,
      },
    }));
    setNotification({
      text: `تم تحديد الحد السعري للمنتج #${productId} بنجاح بقيمة $${threshold}.`,
      type: 'success',
    });
  };

  // Handler to activate/update custom price change % alert for a product
  const handleUpdateProductPriceAlertPercent = (productId: string | number, percent: number | null) => {
    const prodId = isNaN(Number(productId)) ? productId : Number(productId);
    if (percent === null) {
      setAlertRuleConfig((prev) => ({
        ...prev,
        enabledProductAlertIds: (prev.enabledProductAlertIds || []).filter((id) => String(id) !== String(prodId)),
      }));
      setNotification({
        text: `تم إلغاء التخصيص للمنتج #${productId} وعودته لاتباع النسبة العامة الافتراضية.`,
        type: 'info',
      });
    } else {
      setAlertRuleConfig((prev) => {
        const currentEnabled = prev.enabledProductAlertIds || [];
        return {
          ...prev,
          enabledProductAlertIds: currentEnabled.includes(prodId) ? currentEnabled : [...currentEnabled, prodId],
          customProductPercentages: {
            ...(prev.customProductPercentages || {}),
            [prodId]: percent,
          },
        };
      });
      setNotification({
        text: `تم تفعيل وتحديد نسبة تنبيه التغير في التكلفة للمنتج #${productId} بنجاح (±${percent}%).`,
        type: 'success',
      });
    }
  };

  // Handler to simulate cost price reduction from provider API
  const handleSimulateCostDrop = (productId: string | number, newLowerCost: number) => {
    const updated = rawProducts.map((p) =>
      String(p.id) === String(productId) ? { ...p, price: newLowerCost } : p
    );
    setRawProducts(updated);
    detectAndGenerateAlerts(updated, 'تخفيض التكلفة اليدوي');
    setNotification({
      text: `⚡ محاكاة انخفاض السعر: تم تخفيض تكلفة منتج #${productId} إلى $${newLowerCost} وتسجيل الحدث في سجل التنبيهات!`,
      type: 'success',
    });
  };

  // Handler to fix and apply missing parameter mappings for a product
  const handleApplyMappingFix = (productId: string | number, fixedParams: NormalizedParam[]) => {
    const rawParamStrings = fixedParams.map((fp) => fp.raw || fp.labelAr || fp.normalizedKey);

    const updated = rawProducts.map((p) => {
      if (String(p.id) === String(productId)) {
        return {
          ...p,
          params: rawParamStrings,
        };
      }
      return p;
    });

    setRawProducts(updated);

    if (activeModalProduct && String(activeModalProduct.id) === String(productId)) {
      const updatedProduct = transformRawProduct(
        {
          id: activeModalProduct.id,
          name: activeModalProduct.name,
          category_name: activeModalProduct.category,
          price: activeModalProduct.costPriceUsd,
          base_price: activeModalProduct.basePriceUsd,
          available: activeModalProduct.isAvailable,
          product_type: activeModalProduct.productType,
          qty_values: activeModalProduct.qtyValues,
          params: rawParamStrings,
        },
        marginConfig,
        thresholdConfig
      );
      setActiveModalProduct(updatedProduct);
    }

    setNotification({
      text: `✓ تم بنجاح إصلاح ومطابقة ربط المنتج #${productId}، وتم تحديث جميع روابط وأكواد الـ API وسلة تلقائياً.`,
      type: 'success',
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans" dir="rtl">
      {/* Responsive Sidebar Navigation (Desktop Sticky + Mobile Drawer + Mobile Bottom Bar) */}
      <Sidebar
        activeSection={activeSection}
        onSelectSection={setActiveSection}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        totalProductsCount={catalogProducts.length}
        unreadAlertsCount={unreadAlertsCount}
        alertProductsCount={alertProductsCount}
        isLiveConnected={isLiveConnected}
        userBalance={userBalance}
        marginConfig={marginConfig}
        syncConfig={syncConfig}
        onTriggerSyncNow={handleTriggerManualSync}
        themeMode={themeMode}
        resolvedTheme={resolvedTheme}
        onChangeThemeMode={setThemeMode}
      />

      {/* Main Content Column */}
      <div className="flex-1 min-w-0 flex flex-col pb-16 lg:pb-0">
        {/* Compact Responsive Top Header */}
        <Header
          activeSection={activeSection}
          onSelectSection={setActiveSection}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
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
          totalProductsCount={catalogProducts.length}
          thresholdConfig={thresholdConfig}
          alertProductsCount={alertProductsCount}
          unreadAlertsCount={unreadAlertsCount}
          syncConfig={syncConfig}
          themeMode={themeMode}
          resolvedTheme={resolvedTheme}
          onChangeThemeMode={setThemeMode}
        />

        {/* Main Viewport */}
        <main className="grow max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6">
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

          {/* SECTION 1: CATALOG & PRODUCTS */}
          {activeSection === 'catalog' && (
            <div>
              {/* Quick KPI Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 mb-4 text-xs">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center shrink-0">
                    <Package className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-slate-400 block text-[11px] truncate">إجمالي المنتجات</span>
                    <span className="text-sm font-bold font-mono-numbers text-white">
                      {catalogProducts.length}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-slate-400 block text-[11px] truncate">منتجات متوفرة</span>
                    <span className="text-sm font-bold font-mono-numbers text-emerald-400">
                      {availableCount}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-slate-400 block text-[11px] truncate">التصنيفات المتاحة</span>
                    <span className="text-sm font-bold font-mono-numbers text-amber-300">
                      {categoriesWithCounts.length} فئة
                    </span>
                  </div>
                </div>

                {/* Threshold Price Drop Alert Card */}
                <div
                  onClick={() =>
                    setFilters((prev) => ({
                      ...prev,
                      onlyThresholdAlerts: !prev.onlyThresholdAlerts,
                    }))
                  }
                  className={`border rounded-xl p-3 flex items-center gap-3 cursor-pointer transition-all ${
                    alertProductsCount > 0
                      ? 'bg-amber-950/30 border-amber-500/40 hover:bg-amber-950/50'
                      : 'bg-slate-900 border-slate-800 hover:bg-slate-800/80'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      alertProductsCount > 0
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    <BellRing className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-slate-400 block text-[11px] truncate">انخفاض التكلفة</span>
                    <span
                      className={`text-sm font-bold font-mono-numbers ${
                        alertProductsCount > 0 ? 'text-amber-300' : 'text-slate-400'
                      }`}
                    >
                      {alertProductsCount} منتج
                    </span>
                  </div>
                </div>

                {/* Status & Price Alerts Center Card */}
                <div
                  onClick={() => setActiveSection('alerts')}
                  className={`border rounded-xl p-3 flex items-center gap-3 cursor-pointer transition-all ${
                    unreadAlertsCount > 0
                      ? 'bg-indigo-950/40 border-indigo-500/50 hover:bg-indigo-950/60'
                      : 'bg-slate-900 border-slate-800 hover:bg-slate-800/80'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      unreadAlertsCount > 0
                        ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/40'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    <Bell className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-slate-400 block text-[11px] truncate">سجل التنبيهات</span>
                    <span
                      className={`text-sm font-bold font-mono-numbers ${
                        unreadAlertsCount > 0 ? 'text-indigo-300' : 'text-slate-400'
                      }`}
                    >
                      {unreadAlertsCount > 0 ? `${unreadAlertsCount} جديد` : `${alerts.length} تنبيه`}
                    </span>
                  </div>
                </div>

                <div
                  onClick={() => setActiveSection('pricing')}
                  className="bg-slate-900 border border-slate-800 hover:bg-slate-800/80 rounded-xl p-3 flex items-center gap-3 cursor-pointer transition-colors"
                >
                  <div className="w-9 h-9 rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/20 flex items-center justify-center shrink-0">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-slate-400 block text-[11px] truncate">هامش الربح النشط</span>
                    <span className="text-sm font-bold font-mono-numbers text-violet-300">
                      {marginConfig.mode === 'percentage' ? `+${marginConfig.value}%` : `+$${marginConfig.value}`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Profitability Analytics & Donut Chart Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-4 shadow-sm">
                <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 grow">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
                      <PieChartIcon className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-xs font-bold text-white">
                          تحليل هوامش الربحية للمنتجات المفلترة حالياً
                        </h3>
                        <span className="text-[11px] text-slate-400 font-mono-numbers">
                          · {filteredProducts.length} منتج مفلتر
                        </span>
                      </div>
                      <div className="flex flex-wrap items-baseline gap-3 text-xs font-mono-numbers">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-slate-400">متوسط هامش الربح المتوقع:</span>
                          <span className="text-base font-bold text-emerald-400">
                            +${profitAnalytics.avgProfitUsd.toFixed(2)}
                          </span>
                          <span className="text-xs font-semibold text-emerald-500/90">
                            ({profitAnalytics.avgProfitPercent.toFixed(1)}%)
                          </span>
                        </div>
                        <span className="text-slate-600 hidden sm:inline">·</span>
                        <div className="flex items-baseline gap-1 text-slate-400 text-xs">
                          <span>إجمالي الأرباح المتوقعة للكتالوج:</span>
                          <span className="text-slate-200 font-bold text-xs">
                            ${profitAnalytics.totalProfitPotential.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Donut Chart & Tier Breakdown */}
                  <div className="flex items-center gap-4 shrink-0 bg-slate-950/80 border border-slate-800/80 rounded-xl px-4 py-2 self-stretch sm:self-auto justify-between sm:justify-end">
                    <div className="w-24 h-20 relative flex items-center justify-center" dir="ltr">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <RechartsTooltip
                            contentStyle={{
                              backgroundColor: resolvedTheme === 'light' ? '#ffffff' : '#0f172a',
                              borderColor: resolvedTheme === 'light' ? '#cbd5e1' : '#334155',
                              borderRadius: '0.5rem',
                              fontSize: '11px',
                              color: resolvedTheme === 'light' ? '#0f172a' : '#f8fafc',
                              direction: 'rtl',
                            }}
                            formatter={(value: any, name?: any) => [`${value} منتج`, name || 'العدد']}
                          />
                          <Pie
                            data={profitAnalytics.distribution}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={25}
                            outerRadius={38}
                            paddingAngle={3}
                            stroke="none"
                          >
                            {profitAnalytics.distribution.map((entry, index) => (
                              <Cell key={`donut-cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-[10px] font-bold text-slate-300 font-mono-numbers">
                        {filteredProducts.length}
                      </div>
                    </div>

                    <div className="space-y-1 text-xs">
                      <div className="flex items-center justify-between gap-3 text-[11px]">
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                          <span>عالية (≥20%):</span>
                        </div>
                        <span className="font-bold text-emerald-400 font-mono-numbers">
                          {profitAnalytics.counts.high} ({profitAnalytics.percentages.high}%)
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-3 text-[11px]">
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <span className="w-2 h-2 rounded-full bg-indigo-400 shrink-0" />
                          <span>متوسطة (10-20%):</span>
                        </div>
                        <span className="font-bold text-indigo-400 font-mono-numbers">
                          {profitAnalytics.counts.medium} ({profitAnalytics.percentages.medium}%)
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-3 text-[11px]">
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                          <span>منخفضة (&lt;10%):</span>
                        </div>
                        <span className="font-bold text-amber-400 font-mono-numbers">
                          {profitAnalytics.counts.low} ({profitAnalytics.percentages.low}%)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Smart Filters Bar */}
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
                alertProductsCount={alertProductsCount}
              />

              {/* Responsive Product Table & Cards */}
              <ProductTable
                products={paginatedProducts}
                totalProductsCount={catalogProducts.length}
                selectedIds={selectedIds}
                onToggleSelect={handleToggleSelect}
                onOpenProductDetail={(prod, isFix) => {
                  setActiveModalProduct(prod);
                  setModalFixMode(Boolean(isFix));
                }}
                providerBaseUrl={baseUrl}
                onGoToConnection={() => setActiveSection('connection')}
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
            </div>
          )}

          {/* SECTION 2: PROVIDER CONNECTION & PERIODIC SYNC */}
          {activeSection === 'connection' && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
              {/* Provider Connection Credentials Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-5 text-xs">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">
                      بيانات الاتصال المباشر بالمزود (Provider API)
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      أدخل رابط الـ Base URL ورمز التوثيق الحقيقي (API Token) الخاص بحسابك
                    </p>
                  </div>
                </div>

                {/* Presets Selector */}
                <div className="space-y-2">
                  <label className="block font-semibold text-slate-300">
                    1. اختر المزود أو ابدأ بربط مخصص:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {PROVIDER_PRESETS.map((preset) => {
                      const isSelected = selectedPreset.id === preset.id;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => handleSelectPreset(preset)}
                          className={`p-3 rounded-xl border text-right transition-all ${
                            isSelected
                              ? 'bg-indigo-600/15 border-indigo-500 text-white'
                              : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          <div className="font-bold text-xs mb-0.5">{preset.name}</div>
                          <div className="text-[11px] text-slate-400 line-clamp-1">
                            {preset.description}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Base URL Input */}
                <div className="space-y-1.5">
                  <label className="block font-semibold text-slate-300">
                    2. عنوان الـ API الأساسي للمزود (Base URL):
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-500">
                      <Globe className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={baseUrl}
                      onChange={(e) => setBaseUrl(e.target.value)}
                      placeholder="https://api.mersal-card.com/"
                      dir="ltr"
                      className="w-full pl-3 pr-9 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono-numbers"
                    />
                  </div>
                </div>

                {/* API Token Input */}
                <div className="space-y-1.5">
                  <label className="block font-semibold text-slate-300">
                    3. رمز التوثيق السري (API Token):
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-500">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <input
                      type={showConnectionToken ? 'text' : 'password'}
                      value={apiToken}
                      onChange={(e) => setApiToken(e.target.value)}
                      placeholder="أدخل الـ API Token الحقيقي الخاص بك..."
                      dir="ltr"
                      className="w-full pl-16 pr-9 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono-numbers"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConnectionToken(!showConnectionToken)}
                      className="absolute inset-y-0 left-0 pl-3 pr-2 flex items-center text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                    >
                      {showConnectionToken ? 'إخفاء' : 'عرض'}
                    </button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setBaseUrl('');
                      setApiToken('');
                      setRawProducts([]);
                      setIsLiveConnected(false);
                      setUserBalance(null);
                      setUserEmail(null);
                      localStorage.removeItem('shadx_base_url');
                      localStorage.removeItem('shadx_api_token');
                      setNotification({
                        text: 'تم مسح بيانات الاتصال وتفريغ الكتالوج المحلي بنجاح.',
                        type: 'info',
                      });
                    }}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
                  >
                    مسح البيانات المحفوظة
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      await handleFetchProducts();
                    }}
                    disabled={isLoading}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-2 transition-colors shadow-md shadow-indigo-600/20 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    <span>{isLoading ? 'جارِ الاتصال والجلب...' : 'حفظ وجلب الكتالوج الآن'}</span>
                  </button>
                </div>
              </div>

              {/* Periodic Sync Schedule Inline Card */}
              <SyncScheduleModal
                isOpen={true}
                inline={true}
                onClose={() => {}}
                config={syncConfig}
                onUpdateConfig={(newCfg) => setSyncConfig((prev) => ({ ...prev, ...newCfg }))}
                onTriggerManualSync={handleTriggerManualSync}
                isLiveConnected={isLiveConnected}
              />
            </div>
          )}

          {/* SECTION 3: PRICING & COST THRESHOLDS */}
          {activeSection === 'pricing' && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
              <MarginConfigModal
                isOpen={true}
                inline={true}
                onClose={() => {}}
                config={marginConfig}
                onSave={(newCfg) => {
                  setMarginConfig(newCfg);
                  setNotification({
                    text: `تم تحديث هامش الربح (${newCfg.mode === 'percentage' ? `+${newCfg.value}%` : `+$${newCfg.value}`}) واحتساب سعر البيع المقترح لكافة المنتجات.`,
                    type: 'success',
                  });
                }}
              />

              <ThresholdConfigModal
                isOpen={true}
                inline={true}
                onClose={() => {}}
                thresholdConfig={thresholdConfig}
                onSave={(newCfg) => {
                  setThresholdConfig(newCfg);
                  setNotification({
                    text: 'تم حفظ وتفعيل إعدادات الحدود السعرية وتنبيهات انخفاض التكلفة.',
                    type: 'success',
                  });
                }}
                products={catalogProducts}
                onSimulateCostDrop={handleSimulateCostDrop}
              />
            </div>
          )}

          {/* SECTION 4: ALERTS CENTER & RULES */}
          {activeSection === 'alerts' && (
            <AlertsDrawer
              isOpen={true}
              inline={true}
              onClose={() => {}}
              alerts={alerts}
              unreadCount={unreadAlertsCount}
              onMarkAsRead={handleMarkAlertAsRead}
              onMarkAllAsRead={handleMarkAllAlertsAsRead}
              onClearAlerts={handleClearAlerts}
              ruleConfig={alertRuleConfig}
              onUpdateRuleConfig={setAlertRuleConfig}
              onSimulateProviderChanges={handleCheckProviderChanges}
              onSelectProduct={(prod) => setActiveModalProduct(prod)}
              productsMap={productsMap}
            />
          )}

          {/* SECTION 5: API DOCUMENTATION */}
          {activeSection === 'docs' && (
            <DocsDrawer
              isOpen={true}
              inline={true}
              onClose={() => {}}
            />
          )}

          {/* SECTION 6: CLOUD DEPLOYMENT GUIDE */}
          {activeSection === 'deploy' && (
            <DeploymentGuideModal
              isOpen={true}
              inline={true}
              onClose={() => {}}
            />
          )}
        </main>
      </div>

      {/* Integration & Request Simulator Modal (Opens when clicking a product) */}
      <ProductDetailModal
        product={activeModalProduct}
        onClose={() => {
          setActiveModalProduct(null);
          setModalFixMode(false);
        }}
        providerBaseUrl={baseUrl}
        apiToken={apiToken}
        onUpdateProductThreshold={handleUpdateProductThreshold}
        customPriceAlertPercent={
          activeModalProduct && alertRuleConfig.customProductPercentages
            ? alertRuleConfig.customProductPercentages[activeModalProduct.id]
            : undefined
        }
        isCustomAlertTracked={
          activeModalProduct
            ? (alertRuleConfig.enabledProductAlertIds || []).some((id) => String(id) === String(activeModalProduct.id))
            : false
        }
        onUpdateProductPriceAlertPercent={handleUpdateProductPriceAlertPercent}
        initialFixMode={modalFixMode}
        onApplyMappingFix={handleApplyMappingFix}
      />

      {/* Real-time Alert Toast Notification */}
      <AlertToast
        alert={activeToastAlert}
        onDismiss={() => setActiveToastAlert(null)}
        onViewAlert={(alert) => {
          const prod = productsMap.get(alert.productId);
          if (prod) {
            handleMarkAlertAsRead(alert.id);
            setActiveModalProduct(prod);
          }
        }}
        onOpenAlertsCenter={() => setActiveSection('alerts')}
      />
    </div>
  );
}

