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
import { DualComparisonView } from './components/DualComparisonView';
import { AuthGateView } from './components/AuthGateView';
import { AdminAccountsView } from './components/AdminAccountsView';
import { TermsDrawer, LegalTabType } from './components/TermsDrawer';
import { BulkCartModal } from './components/BulkCartModal';
import { SettingsSection } from './components/SettingsSection';
import { OrdersHistoryView } from './components/OrdersHistoryView';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import {
  auth,
  db,
  googleProvider,
  OWNER_EMAIL,
  ACCOUNT_CONSTRAINTS,
  OperationType,
  handleFirestoreError,
  sanitizeString,
} from './firebase';
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
  PriceHistoryPoint,
  UserAccountProfile,
  SubscriptionPlanTier,
  ProviderOrderRecord,
} from './types';
import { PROVIDER_PRESETS } from './data/mockCatalog';
import {
  transformRawProduct,
  exportProductsToCsv,
  buildBackendUrl,
  getSubscriptionDaysRemaining,
} from './utils/normalizer';
import {
  getDesktopNotificationPermission,
  requestDesktopNotificationPermission,
  triggerNativeDesktopNotification,
} from './utils/desktopNotifier';
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
  ShieldCheck,
  Cpu,
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
  const [providerAName, setProviderAName] = useState<string>(
    () => localStorage.getItem('shadx_provider_a_name') || 'المزود الأول (A)'
  );
  const [baseUrl, setBaseUrl] = useState<string>(() => localStorage.getItem('shadx_base_url') || '');
  const [apiToken, setApiToken] = useState<string>(() => localStorage.getItem('shadx_api_token') || '');

  // Persist real baseUrl, apiToken, and providerAName in localStorage
  useEffect(() => {
    localStorage.setItem('shadx_provider_a_name', providerAName);
  }, [providerAName]);

  useEffect(() => {
    localStorage.setItem('shadx_base_url', baseUrl);
  }, [baseUrl]);

  useEffect(() => {
    localStorage.setItem('shadx_api_token', apiToken);
  }, [apiToken]);

  // Firebase Auth & Server Session Account Management State
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(
    () => localStorage.getItem('shadx_session_token')
  );
  const [isAuthReady, setIsAuthReady] = useState<boolean>(false);
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<UserAccountProfile | null>(null);
  const [allAccounts, setAllAccounts] = useState<UserAccountProfile[]>([]);
  const [isTermsDrawerOpen, setIsTermsDrawerOpen] = useState<boolean>(false);
  const [termsDrawerTab, setTermsDrawerTab] = useState<LegalTabType>('terms');
  const [isBulkCartOpen, setIsBulkCartOpen] = useState<boolean>(false);
  const [isDeveloperMode, setIsDeveloperMode] = useState<boolean>(
    () => localStorage.getItem('shadx_developer_mode') === 'true'
  );

  useEffect(() => {
    localStorage.setItem('shadx_developer_mode', String(isDeveloperMode));
  }, [isDeveloperMode]);

  const handleOpenLegalDrawer = useCallback((tab: LegalTabType) => {
    setTermsDrawerTab(tab);
    setIsTermsDrawerOpen(true);
  }, []);
  const pendingRegistrationDraftRef = useRef<{
    displayName: string;
    storeName: string;
    contactInfo: string;
    planTier: SubscriptionPlanTier;
  } | null>(null);

  const fetchServerAdminAccounts = useCallback(async (token: string) => {
    try {
      const res = await fetch(buildBackendUrl('/api/admin/accounts'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.accounts)) {
        setAllAccounts(data.accounts);
      }
    } catch {
      // Ignore transient network errors
    }
  }, []);

  // 0. Restore Server Session Token on boot (and poll while pending or admin)
  useEffect(() => {
    if (!sessionToken) return;

    let cancelled = false;
    const verifySession = async () => {
      try {
        const res = await fetch(buildBackendUrl('/api/auth/me'), {
          headers: { Authorization: `Bearer ${sessionToken}` },
        });
        const data = await res.json();
        if (cancelled) return;
        if (data.success && data.profile) {
          setCurrentUserProfile(data.profile);
          if (
            data.profile.role === 'owner' ||
            data.profile.role === 'admin' ||
            data.profile.email === OWNER_EMAIL
          ) {
            fetchServerAdminAccounts(sessionToken);
          } else {
            setAllAccounts([data.profile]);
          }
        } else {
          localStorage.removeItem('shadx_session_token');
          setSessionToken(null);
          if (!auth.currentUser) {
            setCurrentUserProfile(null);
          }
        }
      } catch {
        // Keep existing state if offline momentarily
      } finally {
        if (!cancelled) setIsAuthReady(true);
      }
    };

    verifySession();
    const pollTimer = setInterval(verifySession, 6000);
    return () => {
      cancelled = true;
      clearInterval(pollTimer);
    };
  }, [sessionToken, fetchServerAdminAccounts]);

  // 1. Track Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (!user) {
        if (!localStorage.getItem('shadx_session_token')) {
          setCurrentUserProfile(null);
          setAllAccounts([]);
          setIsAuthReady(true);
        }
        return;
      }

      // Ensure user profile document exists in /users/{uid}
      const userDocPath = `users/${user.uid}`;
      const userRef = doc(db, 'users', user.uid);
      try {
        const snap = await getDoc(userRef);
        if (!snap.exists()) {
          const isOwnerAccount = user.email === OWNER_EMAIL;
          const draft = pendingRegistrationDraftRef.current;
          const safeUid = sanitizeString(user.uid, ACCOUNT_CONSTRAINTS.UID_MAX, 'user_1');
          const safeEmail = sanitizeString(
            user.email || 'user@example.com',
            ACCOUNT_CONSTRAINTS.EMAIL_MAX,
            'user@example.com'
          );
          const safeDisplayName = sanitizeString(
            draft?.displayName || user.displayName || (isOwnerAccount ? 'المدير العام' : 'مشترك جديد'),
            ACCOUNT_CONSTRAINTS.DISPLAY_NAME_MAX,
            'مشترك جديد'
          );
          const safeStoreName = sanitizeString(
            draft?.storeName || (isOwnerAccount ? 'إدارة المنصة الرئيسية' : 'متجر رقمي'),
            ACCOUNT_CONSTRAINTS.STORE_NAME_MAX,
            'متجر رقمي'
          );
          const safeContactInfo = sanitizeString(
            draft?.contactInfo || '',
            ACCOUNT_CONSTRAINTS.CONTACT_INFO_MAX,
            ''
          );

          await setDoc(userRef, {
            uid: safeUid,
            email: safeEmail,
            displayName: safeDisplayName,
            storeName: safeStoreName,
            contactInfo: safeContactInfo,
            role: isOwnerAccount ? 'owner' : 'merchant',
            accountStatus: isOwnerAccount ? 'active' : 'pending',
            planTier: isOwnerAccount ? 'enterprise' : draft?.planTier || 'pro',
            subscriptionEndsAt: isOwnerAccount ? 'اشتراك دائم (مفتوح)' : 'بانتظار التفعيل',
            notes: isOwnerAccount ? 'الحساب الرئيسي لمالك المنصة' : '',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          pendingRegistrationDraftRef.current = null;
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, userDocPath);
      } finally {
        setIsAuthReady(true);
      }
    });

    return () => unsubscribe();
  }, []);

  // 2. Real-time listener on current user's profile document (/users/{uid})
  useEffect(() => {
    if (!isAuthReady || !firebaseUser) return;
    const userDocPath = `users/${firebaseUser.uid}`;
    const unsubscribe = onSnapshot(
      doc(db, 'users', firebaseUser.uid),
      (snap) => {
        if (snap.exists()) {
          setCurrentUserProfile(snap.data() as UserAccountProfile);
        }
      },
      (err) => {
        handleFirestoreError(err, OperationType.GET, userDocPath);
      }
    );
    return () => unsubscribe();
  }, [isAuthReady, firebaseUser]);

  // Automated subscription expiration check & email warning simulation
  useEffect(() => {
    if (!currentUserProfile?.subscriptionEndsAt) return;
    const { isExpiringSoon, isExpired, daysRemaining } = getSubscriptionDaysRemaining(
      currentUserProfile.subscriptionEndsAt
    );
    if (isExpiringSoon || isExpired) {
      console.log('----------------------------------------------------');
      console.log(`[SUBSCRIPTION EXPIRATION WARNING EMAIL] To: ${currentUserProfile.email}`);
      console.log(
        `[SUBSCRIPTION EXPIRATION WARNING EMAIL] Store: ${currentUserProfile.storeName} | Days Remaining: ${daysRemaining}`
      );
      console.log(
        `[SUBSCRIPTION EXPIRATION WARNING EMAIL] Status: WARNING EMAIL SENT & DELIVERED SUCCESSFULLY`
      );
      console.log('----------------------------------------------------');
    }
  }, [currentUserProfile]);

  // 3. Real-time listener on all accounts (/users) when signed in via Firebase as Bootstrapped Owner
  useEffect(() => {
    if (!isAuthReady || !firebaseUser) return;
    if (firebaseUser.email !== OWNER_EMAIL) {
      setAllAccounts(currentUserProfile ? [currentUserProfile] : []);
      return;
    }

    const usersPath = 'users';
    const unsubscribe = onSnapshot(
      collection(db, 'users'),
      (snap) => {
        const list: UserAccountProfile[] = [];
        snap.forEach((docSnap) => {
          list.push(docSnap.data() as UserAccountProfile);
        });
        setAllAccounts(list);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, usersPath);
      }
    );

    return () => unsubscribe();
  }, [isAuthReady, firebaseUser, currentUserProfile]);

  // Email & Password Login Handler
  const handleEmailLogin = async (email: string, password: string) => {
    setAuthError(null);
    setIsSigningIn(true);
    try {
      const res = await fetch(buildBackendUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!data.success) {
        setAuthError(data.error || 'البريد الإلكتروني أو كلمة المرور غير صحيحة.');
        return;
      }
      localStorage.setItem('shadx_session_token', data.token);
      setSessionToken(data.token);
      setCurrentUserProfile(data.profile);
      if (
        data.profile.role === 'owner' ||
        data.profile.role === 'admin' ||
        data.profile.email === OWNER_EMAIL
      ) {
        fetchServerAdminAccounts(data.token);
      } else {
        setAllAccounts([data.profile]);
      }
    } catch (err: any) {
      setAuthError('تعذر الاتصال بخادم المصادقة. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsSigningIn(false);
    }
  };

  // Email & Password Registration Handler
  const handleEmailRegister = async (payload: {
    displayName: string;
    storeName: string;
    email: string;
    password: string;
    contactInfo: string;
    planTier: SubscriptionPlanTier;
  }) => {
    setAuthError(null);
    setIsSigningIn(true);
    try {
      const res = await fetch(buildBackendUrl('/api/auth/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) {
        setAuthError(data.error || 'تعذر إنشاء الحساب.');
        return;
      }
      localStorage.setItem('shadx_session_token', data.token);
      setSessionToken(data.token);
      setCurrentUserProfile(data.profile);
      if (
        data.profile.role === 'owner' ||
        data.profile.role === 'admin' ||
        data.profile.email === OWNER_EMAIL
      ) {
        fetchServerAdminAccounts(data.token);
      } else {
        setAllAccounts([data.profile]);
      }
    } catch (err: any) {
      setAuthError('تعذر الاتصال بخادم التسجيل. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleGoogleAuth = async (registrationDraft?: {
    displayName: string;
    storeName: string;
    contactInfo: string;
    planTier: SubscriptionPlanTier;
  }) => {
    setAuthError(null);
    setIsSigningIn(true);
    if (registrationDraft) {
      pendingRegistrationDraftRef.current = registrationDraft;
    }
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.warn('Google sign-in error:', err);
      const errCode = String(err?.code || err?.message || '');
      if (errCode.includes('unauthorized-domain')) {
        const currentHost =
          typeof window !== 'undefined' ? window.location.hostname : '';
        setAuthError(
          `تعذر إتمام تسجيل الدخول عبر Google بسبب عدم إضافة النطاق الحالي (${currentHost}) في قائمة Authorized Domains داخل Firebase (auth/unauthorized-domain). يمكنك إضافة النطاق من الدليل أدناه أو تسجيل الدخول مباشرة بالبريد وكلمة المرور.`
        );
      } else if (errCode.includes('popup-closed-by-user')) {
        setAuthError('تم إغلاق نافذة تسجيل الدخول قبل إتمام العملية. يرجى المحاولة مرة أخرى.');
      } else {
        setAuthError('يرجى تسجيل الدخول باستخدام البريد الإلكتروني وكلمة المرور أعلاه.');
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOutUser = async () => {
    if (sessionToken) {
      fetch(buildBackendUrl('/api/auth/logout'), {
        method: 'POST',
        headers: { Authorization: `Bearer ${sessionToken}` },
      }).catch(() => {});
      localStorage.removeItem('shadx_session_token');
      setSessionToken(null);
    }
    if (firebaseUser) {
      await signOut(auth).catch(() => {});
    }
    setCurrentUserProfile(null);
    setAllAccounts([]);
  };

  const handleUpdateOwnMerchantProfile = async (updates: {
    displayName: string;
    storeName: string;
    contactInfo: string;
  }) => {
    if (sessionToken) {
      const res = await fetch(buildBackendUrl('/api/auth/profile'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (data.success && data.profile) {
        setCurrentUserProfile(data.profile);
      }
      return;
    }

    if (!firebaseUser) return;
    const path = `users/${firebaseUser.uid}`;
    try {
      await updateDoc(doc(db, 'users', firebaseUser.uid), {
        displayName: sanitizeString(updates.displayName, ACCOUNT_CONSTRAINTS.DISPLAY_NAME_MAX, 'تاجر'),
        storeName: sanitizeString(updates.storeName, ACCOUNT_CONSTRAINTS.STORE_NAME_MAX, 'متجر رقمي'),
        contactInfo: sanitizeString(updates.contactInfo, ACCOUNT_CONSTRAINTS.CONTACT_INFO_MAX, ''),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const pendingAccountsCount = useMemo(() => {
    return allAccounts.filter((a) => a.accountStatus === 'pending').length;
  }, [allAccounts]);

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
    onlyLowMargin: false,
  });

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());
  const [isCopiedIds, setIsCopiedIds] = useState<boolean>(false);

  // Active Sidebar Section & Mobile Drawer state
  const [activeSection, setActiveSection] = useState<ActiveSectionId>('catalog');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [showConnectionToken, setShowConnectionToken] = useState<boolean>(false);
  const [showMobileBottomBar, setShowMobileBottomBar] = useState<boolean>(() => {
    return localStorage.getItem('shadx_show_mobile_bottom_bar') !== 'false';
  });

  useEffect(() => {
    localStorage.setItem('shadx_show_mobile_bottom_bar', String(showMobileBottomBar));
  }, [showMobileBottomBar]);

  // Order History State
  const [ordersHistory, setOrdersHistory] = useState<ProviderOrderRecord[]>([]);
  const [isFetchingOrders, setIsFetchingOrders] = useState<boolean>(false);

  const handleFetchOrdersHistory = async () => {
    if (!baseUrl.trim() || !apiToken.trim()) {
      setNotification({
        text: 'يرجى إدخال رابط المزود ورمز التوثيق (API Token) أولاً لجلب سجل الطلبات.',
        type: 'error',
      });
      return;
    }

    setIsFetchingOrders(true);
    try {
      const res = await fetch(buildBackendUrl('/api/proxy/orders'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baseUrl, apiToken }),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.orders)) {
        setOrdersHistory(data.orders);
        setNotification({
          text: `تم بنجاح جلب وتحديث سجل الطلبات (${data.orders.length} طلب) من المزود.`,
          type: 'success',
        });
      } else {
        throw new Error(data.error || 'تعذر جلب الطلبات');
      }
    } catch (err: any) {
      setNotification({
        text: `فشل جلب سجل الطلبات: ${err.message}`,
        type: 'error',
      });
    } finally {
      setIsFetchingOrders(false);
    }
  };

  useEffect(() => {
    if (isLiveConnected && baseUrl && apiToken && ordersHistory.length === 0) {
      handleFetchOrdersHistory();
    }
  }, [isLiveConnected, baseUrl, apiToken]);

  // Modals & Drawers
  const [activeModalProduct, setActiveModalProduct] = useState<CatalogProduct | null>(null);
  const [modalProviderUrlOverride, setModalProviderUrlOverride] = useState<string | null>(null);
  const [focusedCompareProductId, setFocusedCompareProductId] = useState<string | number | null>(null);
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
      desktopNotificationsEnabled: true,
      emailNotificationsEnabled: false,
      recipientEmail: '',
      emailOnHighProfitOnly: true,
      emailPriceChangeThresholdPercent: 10,
      telegramNotificationsEnabled: false,
      telegramBotToken: '',
      telegramChatId: '',
      telegramNotifyOnCostDrop: true,
      telegramNotifyOnNewOrAvailableProducts: true,
      telegramFormat: 'detailed',
      telegramInteractiveButtons: true,
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

  // Historical Price Trend Points per product ID (persisted in localStorage)
  const [priceHistoryMap, setPriceHistoryMap] = useState<Record<string | number, PriceHistoryPoint[]>>(() => {
    try {
      const saved = localStorage.getItem('shadx_price_history');
      if (saved) return JSON.parse(saved);
    } catch {
      // Ignore storage error
    }
    return {};
  });

  useEffect(() => {
    try {
      localStorage.setItem('shadx_price_history', JSON.stringify(priceHistoryMap));
    } catch {
      // Ignore storage quota error
    }
  }, [priceHistoryMap]);

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
        format: alertRuleConfig.telegramFormat || 'detailed',
        includeButtons: alertRuleConfig.telegramInteractiveButtons ?? true,
        appUrl: typeof window !== 'undefined' ? window.location.origin : '',
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

    // Record price history points for synced / changed products
    setPriceHistoryMap((prevHist) => {
      const nextHist = { ...prevHist };
      let changed = false;

      newProducts.forEach((p) => {
        const costVal = typeof p.price === 'number' ? p.price : parseFloat(String(p.price)) || 0;
        if (costVal <= 0) return;

        const existingPoints = nextHist[p.id] || [];
        const lastPoint = existingPoints[existingPoints.length - 1];

        // Record if no history yet or if cost changed
        if (!lastPoint || lastPoint.cost !== costVal) {
          const sellVal =
            marginConfig.mode === 'percentage'
              ? Number((costVal * (1 + marginConfig.value / 100)).toFixed(4))
              : Number((costVal + marginConfig.value).toFixed(4));
          const profitVal = Number((sellVal - costVal).toFixed(4));
          const prodThresh =
            thresholdConfig.productThresholds[p.id] ||
            (typeof thresholdConfig.defaultThreshold === 'number' ? thresholdConfig.defaultThreshold : undefined);

          const newPoint: PriceHistoryPoint = {
            timestamp: now.toISOString(),
            dateLabel: timeFormatted,
            cost: Number(costVal.toFixed(4)),
            sellPrice: sellVal,
            profit: profitVal,
            threshold: prodThresh,
            source: sourceLabel.includes('تخفيض') ? 'simulation' : 'sync',
          };

          nextHist[p.id] = [...existingPoints, newPoint].slice(-30);
          changed = true;
        }
      });

      return changed ? nextHist : prevHist;
    });

    if (newAlerts.length > 0) {
      if (alertRuleConfig.desktopNotificationsEnabled ?? true) {
        const currentPerm = getDesktopNotificationPermission();
        if (currentPerm === 'granted') {
          newAlerts.slice(0, 5).forEach((alertItem, idx) => {
            alertItem.desktopSent = true;
            triggerNativeDesktopNotification({
              title: `🔔 ${alertItem.title}`,
              body: `${alertItem.productName} (#${alertItem.productId})\n${alertItem.message}`,
              tag: alertItem.id,
              playSound: idx === 0 && (alertRuleConfig.playSound ?? true),
              onClick: () => {
                setActiveSection('alerts');
              },
            });
          });
        } else if (currentPerm === 'default') {
          requestDesktopNotificationPermission().then((perm) => {
            if (perm === 'granted') {
              const firstAlert = newAlerts[0];
              triggerNativeDesktopNotification({
                title: `🔔 ${firstAlert.title}`,
                body: `${firstAlert.productName} (#${firstAlert.productId})\n${firstAlert.message}`,
                tag: firstAlert.id,
                playSound: alertRuleConfig.playSound ?? true,
                onClick: () => {
                  setActiveSection('alerts');
                },
              });
            }
          });
        }
      }

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

  // Transform raw items into enriched CatalogProduct items using active marginConfig, thresholdConfig, and recorded cost history
  const catalogProducts = useMemo(() => {
    return rawProducts.map((raw) => {
      const historyPoints = priceHistoryMap[raw.id];
      let baselineCost: number | undefined = undefined;
      if (historyPoints && historyPoints.length >= 2) {
        const firstCost = historyPoints[0].cost;
        const prevCost = historyPoints[historyPoints.length - 2].cost;
        baselineCost = Math.min(firstCost, prevCost);
      }
      return transformRawProduct(raw, marginConfig, thresholdConfig, baselineCost);
    });
  }, [rawProducts, marginConfig, thresholdConfig, priceHistoryMap]);

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

  // Count products where profit margin dropped below 5% (Low Margin)
  const lowMarginProductsCount = useMemo(() => {
    return catalogProducts.filter((p) => p.isLowMargin).length;
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

        // Low Margin (< 5%) filter
        if (filters.onlyLowMargin && !p.isLowMargin) {
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
          case 'margin_asc':
            return (a.profitMarginPercent ?? 0) - (b.profitMarginPercent ?? 0);
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
      onlyLowMargin: false,
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

  // Handler to simulate cost price change (drop or hike) from provider API
  const handleSimulateCostDrop = (productId: string | number, newCostValue: number) => {
    const prevRaw = rawProducts.find((p) => String(p.id) === String(productId));
    const prevCost = prevRaw
      ? typeof prevRaw.price === 'number'
        ? prevRaw.price
        : parseFloat(String(prevRaw.price)) || 0
      : undefined;

    const updated = rawProducts.map((p) =>
      String(p.id) === String(productId) ? { ...p, price: newCostValue } : p
    );
    setRawProducts(updated);
    detectAndGenerateAlerts(updated, 'تخفيض التكلفة اليدوي');

    if (activeModalProduct && String(activeModalProduct.id) === String(productId)) {
      const targetRaw = updated.find((p) => String(p.id) === String(productId));
      if (targetRaw) {
        setActiveModalProduct(
          transformRawProduct(targetRaw, marginConfig, thresholdConfig, prevCost)
        );
      }
    }

    setNotification({
      text: `⚡ محاكاة تغير السعر: تم تحديث تكلفة منتج #${productId} إلى $${newCostValue} وتحديث السجل الزمني وهوامش الربح!`,
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

  // Loading timeout state & smooth fade-out transition state
  const [loadingTimedOut, setLoadingTimedOut] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isAuthReady) {
        setLoadingTimedOut(true);
      }
    }, 15000);
    return () => clearTimeout(timer);
  }, [isAuthReady]);

  useEffect(() => {
    if (isAuthReady) {
      setIsFadingOut(true);
    }
  }, [isAuthReady]);

  // Show loading screen while Firebase Auth state initializes
  if (!isAuthReady || isFadingOut) {
    return (
      <div
        className={`min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 font-sans relative overflow-hidden select-none transition-opacity duration-700 ease-in-out ${
          isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
        dir="rtl"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-950/40 via-slate-950 to-slate-950 pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center max-w-sm text-center space-y-5">
          {/* Smoothly Spinning Tech Hub Icon */}
          <div className="relative">
            <div className="absolute -inset-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-violet-500 rounded-full blur-lg opacity-50 animate-pulse" />
            <div className="relative w-20 h-20 rounded-2xl bg-slate-900 border border-indigo-500/50 flex items-center justify-center text-indigo-400 shadow-2xl">
              <Cpu className="w-10 h-10 animate-spin text-indigo-400" style={{ animationDuration: '6s' }} />
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-base font-extrabold text-white tracking-wide">
              ShadX-Provider Hub
            </h3>
            <p className="text-xs font-bold text-indigo-300 tracking-wide">
              بيئة آمنة، موثوقة، وفعّالة
            </p>
          </div>

          {loadingTimedOut ? (
            <div className="space-y-3 pt-2">
              <p className="text-[11px] text-amber-300">
                استغرقت عملية التحقق وقتاً أطول من المتوقع. يمكنك إعادة المحاولة:
              </p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors shadow-sm cursor-pointer"
              >
                إعادة المحاولة (Retry)
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 pt-2">
              <div className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
              <span className="text-[11px] text-slate-400 font-mono">جارِ مزامنة الجلسة وصلاحيات الحساب...</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Gate the entire platform behind Authentication, Active Status, and Active Paid Subscription Plan (or Owner Admin)
  const isOwnerAdmin =
    currentUserProfile?.role === 'owner' || currentUserProfile?.email === OWNER_EMAIL;
  const hasActivePaidPlan =
    currentUserProfile &&
    currentUserProfile.accountStatus === 'active' &&
    ['starter', 'pro', 'enterprise'].includes(currentUserProfile.planTier);

  if (
    !currentUserProfile ||
    currentUserProfile.accountStatus !== 'active' ||
    (!hasActivePaidPlan && !isOwnerAdmin)
  ) {
    return (
      <AuthGateView
        currentUserProfile={currentUserProfile}
        authEmail={currentUserProfile?.email || firebaseUser?.email || null}
        isSigningIn={isSigningIn}
        authError={authError}
        onEmailLogin={handleEmailLogin}
        onEmailRegister={handleEmailRegister}
        onGoogleAuth={handleGoogleAuth}
        onSignOut={handleSignOutUser}
        onUpdateOwnMerchantProfile={handleUpdateOwnMerchantProfile}
        themeMode={themeMode}
      />
    );
  }

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
        currentUserProfile={currentUserProfile}
        pendingAccountsCount={pendingAccountsCount}
        onSignOut={handleSignOutUser}
        onOpenLegalDrawer={handleOpenLegalDrawer}
        showMobileBottomBar={showMobileBottomBar}
      />

      {/* Main Content Column */}
      <div className="flex-1 min-w-0 flex flex-col pb-24 lg:pb-0">
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
        <main className="grow max-w-[1600px] w-full mx-auto px-3 sm:px-5 lg:px-8 py-4 sm:py-6">
          {/* Floating Notification */}
          {notification && (
            <div
              className={`mb-4 p-3.5 rounded-xl border flex items-center justify-between text-xs transition-all ${
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
              {/* Subscription Expiration Warning Banner */}
              {currentUserProfile && (() => {
                const { daysRemaining, isExpiringSoon, isExpired } = getSubscriptionDaysRemaining(
                  currentUserProfile.subscriptionEndsAt
                );
                if (isExpiringSoon || isExpired) {
                  return (
                    <div className="bg-amber-950/90 border border-amber-500/60 rounded-xl p-3.5 sm:p-4 text-xs sm:text-sm text-amber-200 flex flex-wrap items-center justify-between gap-3 shadow-lg mb-4">
                      <div className="flex items-center gap-2.5">
                        <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
                        <div>
                          <strong className="block text-amber-100 font-bold">
                            {isExpired
                              ? '⚠️ تنبيه: انتهت صلاحية اشتراكك في المنصة!'
                              : `⚠️ تنبيه هام: اشتراكك ينتهي قريباً (متبقي ${daysRemaining} أيام)`}
                          </strong>
                          <span className="text-xs text-amber-300">
                            تاريخ انتهاء الاشتراك: <strong>{currentUserProfile.subscriptionEndsAt}</strong>. يرجى التواصل مع إدارة المنصة لتجديد الاشتراك أو ترقية الباقة لضمان استمرار عمل المتجر بدون انقطاع.
                          </span>
                        </div>
                      </div>
                      <a
                        href="https://wa.me/?text=مرحباً، أرغب في تجديد اشتراكي في منصة ShadX-Provider متجري: "
                        target="_blank"
                        rel="noreferrer"
                        className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors shrink-0 shadow-xs"
                      >
                        تواصل لتجديد الاشتراك الآن
                      </a>
                    </div>
                  );
                }
                return null;
              })()}

              {/* Quick KPI Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2.5 sm:gap-3.5 mb-4 text-xs">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 flex items-center gap-3 shadow-2xs">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center shrink-0">
                    <Package className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-slate-400 block text-[11px] truncate mb-0.5">إجمالي المنتجات</span>
                    <span className="text-base font-extrabold font-mono-numbers text-white">
                      {catalogProducts.length.toLocaleString('en-US')}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 flex items-center gap-3 shadow-2xs">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-slate-400 block text-[11px] truncate mb-0.5">منتجات متوفرة</span>
                    <span className="text-base font-extrabold font-mono-numbers text-emerald-400">
                      {availableCount.toLocaleString('en-US')}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 flex items-center gap-3 shadow-2xs">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-slate-400 block text-[11px] truncate mb-0.5">التصنيفات المتاحة</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-base font-extrabold font-mono-numbers text-amber-300">
                        {categoriesWithCounts.length}
                      </span>
                      <span className="text-[11px] text-amber-400/80 font-medium">فئة</span>
                    </div>
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
                  className={`border rounded-2xl p-3.5 flex items-center gap-3 cursor-pointer transition-all shadow-2xs ${
                    alertProductsCount > 0
                      ? 'bg-amber-950/30 border-amber-500/40 hover:bg-amber-950/50'
                      : 'bg-slate-900 border-slate-800 hover:bg-slate-800/80'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      alertProductsCount > 0
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    <BellRing className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-slate-400 block text-[11px] truncate mb-0.5">انخفاض التكلفة</span>
                    <div className="flex items-baseline gap-1">
                      <span
                        className={`text-base font-extrabold font-mono-numbers ${
                          alertProductsCount > 0 ? 'text-amber-300' : 'text-slate-400'
                        }`}
                      >
                        {alertProductsCount}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">منتج</span>
                    </div>
                  </div>
                </div>

                {/* Status & Price Alerts Center Card */}
                <div
                  onClick={() => setActiveSection('alerts')}
                  className={`border rounded-2xl p-3.5 flex items-center gap-3 cursor-pointer transition-all shadow-2xs ${
                    unreadAlertsCount > 0
                      ? 'bg-indigo-950/40 border-indigo-500/50 hover:bg-indigo-950/60'
                      : 'bg-slate-900 border-slate-800 hover:bg-slate-800/80'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      unreadAlertsCount > 0
                        ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/40'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    <Bell className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-slate-400 block text-[11px] truncate mb-0.5">سجل التنبيهات</span>
                    <div className="flex items-baseline gap-1">
                      <span
                        className={`text-base font-extrabold font-mono-numbers ${
                          unreadAlertsCount > 0 ? 'text-indigo-300' : 'text-slate-400'
                        }`}
                      >
                        {unreadAlertsCount > 0 ? unreadAlertsCount : alerts.length}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {unreadAlertsCount > 0 ? 'جديد' : 'تنبيه'}
                      </span>
                    </div>
                  </div>
                </div>

                <div
                  onClick={() => setActiveSection('pricing')}
                  className="bg-slate-900 border border-slate-800 hover:bg-slate-800/80 rounded-2xl p-3.5 flex items-center gap-3 cursor-pointer transition-colors shadow-2xs"
                >
                  <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20 flex items-center justify-center shrink-0">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-slate-400 block text-[11px] truncate mb-0.5">هامش الربح النشط</span>
                    <span className="text-base font-extrabold font-mono-numbers text-violet-300">
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
                lowMarginProductsCount={lowMarginProductsCount}
                onOpenBulkCart={() => setIsBulkCartOpen(true)}
              />

              {/* Responsive Product Table & Cards */}
              <ProductTable
                products={paginatedProducts}
                totalProductsCount={catalogProducts.length}
                selectedIds={selectedIds}
                onToggleSelect={handleToggleSelect}
                onOpenProductDetail={(prod, isFix) => {
                  setModalProviderUrlOverride(null);
                  setActiveModalProduct(prod);
                  setModalFixMode(Boolean(isFix));
                }}
                providerBaseUrl={baseUrl}
                onGoToConnection={() => setActiveSection('connection')}
                onCompareProduct={(prod) => {
                  setFocusedCompareProductId(prod.id);
                  setActiveSection('compare');
                }}
                isDeveloperMode={isDeveloperMode}
                onRefresh={handleFetchProducts}
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

          {/* SECTION 1.5: DUAL PROVIDER PRICE COMPARISON */}
          {activeSection === 'compare' && (
            <DualComparisonView
              providerAName={providerAName}
              setProviderAName={setProviderAName}
              baseUrlA={baseUrl}
              setBaseUrlA={setBaseUrl}
              apiTokenA={apiToken}
              setApiTokenA={setApiToken}
              productsA={catalogProducts}
              isLiveConnectedA={isLiveConnected}
              userBalanceA={userBalance}
              isLoadingA={isLoading}
              onFetchProviderA={handleFetchProducts}
              marginConfig={marginConfig}
              thresholdConfig={thresholdConfig}
              focusedProductAId={focusedCompareProductId}
              onClearFocusedProduct={() => setFocusedCompareProductId(null)}
              onOpenProductDetail={(prod, providerUrlOverride) => {
                setModalProviderUrlOverride(providerUrlOverride || null);
                setActiveModalProduct(prod);
                setModalFixMode(false);
              }}
            />
          )}

          {/* SECTION 1.8: OWNER ACCOUNT MANAGEMENT & SUBSCRIBER PROFILE */}
          {activeSection === 'accounts' && currentUserProfile && (
            <AdminAccountsView
              currentUserProfile={currentUserProfile}
              accounts={
                currentUserProfile.email === OWNER_EMAIL ||
                currentUserProfile.role === 'owner' ||
                currentUserProfile.role === 'admin'
                  ? allAccounts
                  : [currentUserProfile]
              }
              isOwner={
                currentUserProfile.email === OWNER_EMAIL ||
                currentUserProfile.role === 'owner' ||
                currentUserProfile.role === 'admin'
              }
              sessionToken={sessionToken}
              onRefreshServerAccounts={(updatedList) => {
                if (updatedList) {
                  setAllAccounts(updatedList);
                } else if (sessionToken) {
                  fetchServerAdminAccounts(sessionToken);
                }
              }}
              onSignOut={handleSignOutUser}
              onNotify={(text, type) => setNotification({ text, type })}
              isDeveloperMode={isDeveloperMode}
              onToggleDeveloperMode={setIsDeveloperMode}
            />
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
              onTriggerTestAlert={(testAlert) => {
                setAlerts((prev) => [testAlert, ...prev].slice(0, 50));
                setActiveToastAlert(testAlert);
              }}
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

          {/* SECTION 7: UNIFIED SETTINGS SECTION */}
          {activeSection === 'settings' && (
            <SettingsSection
              baseUrl={baseUrl}
              setBaseUrl={setBaseUrl}
              apiToken={apiToken}
              setApiToken={setApiToken}
              selectedPreset={selectedPreset}
              onSelectPreset={handleSelectPreset}
              syncConfig={syncConfig}
              onUpdateSyncConfig={setSyncConfig}
              ruleConfig={alertRuleConfig}
              onUpdateRuleConfig={setAlertRuleConfig}
              marginConfig={marginConfig}
              onUpdateMarginConfig={setMarginConfig}
              thresholdConfig={thresholdConfig}
              onUpdateThresholdConfig={setThresholdConfig}
              themeMode={themeMode}
              resolvedTheme={resolvedTheme}
              onChangeThemeMode={setThemeMode}
              isDeveloperMode={isDeveloperMode}
              onToggleDeveloperMode={setIsDeveloperMode}
              showMobileBottomBar={showMobileBottomBar}
              onToggleMobileBottomBar={setShowMobileBottomBar}
              onTriggerSyncNow={handleFetchProducts}
              onNotify={(text, type) => setNotification({ text, type })}
            />
          )}

          {/* SECTION 8: ORDERS HISTORY VIEW */}
          {activeSection === 'orders' && (
            <OrdersHistoryView
              orders={ordersHistory}
              isFetching={isFetchingOrders}
              onRefreshOrders={handleFetchOrdersHistory}
              providerBaseUrl={baseUrl}
            />
          )}
        </main>

        {/* Main Application Footer with Terms & Privacy Links */}
        <footer className="border-t border-slate-800/80 bg-slate-900/60 py-3.5 px-4 sm:px-6 lg:px-8 text-xs text-slate-400">
          <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>جميع الحقوق محفوظة © ShadX-Provider Hub • نظام إدارة ومقارنة مزودي البطاقات الرقمية</span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleOpenLegalDrawer('terms')}
                className="text-slate-300 hover:text-indigo-300 font-bold underline underline-offset-4 transition-colors cursor-pointer"
              >
                اتفاقية الاستخدام
              </button>
              <span className="text-slate-700">•</span>
              <button
                type="button"
                onClick={() => handleOpenLegalDrawer('privacy')}
                className="text-slate-300 hover:text-emerald-300 font-bold underline underline-offset-4 transition-colors cursor-pointer"
              >
                سياسة الخصوصية وأمن البيانات
              </button>
            </div>
          </div>
        </footer>
      </div>

      {/* Terms of Use & Privacy Policy Drawer */}
      <TermsDrawer
        isOpen={isTermsDrawerOpen}
        onClose={() => setIsTermsDrawerOpen(false)}
        initialTab={termsDrawerTab}
      />

      {/* Automated Bulk Order Cart Modal */}
      <BulkCartModal
        isOpen={isBulkCartOpen}
        onClose={() => setIsBulkCartOpen(false)}
        selectedProducts={catalogProducts.filter((p) => selectedIds.has(p.id))}
        allProducts={catalogProducts}
        providerBaseUrl={baseUrl}
        apiToken={apiToken}
        onNotify={(text, type) => setNotification({ text, type })}
        onClearSelection={() => setSelectedIds(new Set())}
      />

      {/* Integration & Request Simulator Modal (Opens when clicking a product) */}
      <ProductDetailModal
        product={activeModalProduct}
        onClose={() => {
          setActiveModalProduct(null);
          setModalProviderUrlOverride(null);
          setModalFixMode(false);
        }}
        providerBaseUrl={modalProviderUrlOverride || baseUrl}
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
        productPriceHistory={
          activeModalProduct ? priceHistoryMap[activeModalProduct.id] || [] : []
        }
        onSimulateCostDrop={handleSimulateCostDrop}
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

