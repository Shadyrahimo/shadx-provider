import React, { useState } from 'react';
import {
  Lock,
  UserPlus,
  LogIn,
  Store,
  User,
  Phone,
  Mail,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  Clock,
  AlertTriangle,
  LogOut,
  RefreshCw,
  Save,
  ShieldCheck,
  Scale,
  TrendingDown,
  Code2,
  BellRing,
  ArrowLeft,
  Layers,
  Zap,
  Copy,
  Check,
  ExternalLink,
  Globe,
  ChevronDown,
  ChevronUp,
  FileText,
} from 'lucide-react';
import {
  SubscriptionPlanTier,
  UserAccountProfile,
  ThemeMode,
} from '../types';
import { ACCOUNT_CONSTRAINTS, sanitizeString } from '../firebase';
import firebaseConfig from '../../firebase-applet-config.json';
import { TermsDrawer, LegalTabType } from './TermsDrawer';
import { GoogleSetupGuideModal } from './GoogleSetupGuideModal';

interface AuthGateViewProps {
  currentUserProfile: UserAccountProfile | null;
  authEmail: string | null;
  isSigningIn: boolean;
  authError: string | null;
  onEmailLogin: (email: string, password: string) => Promise<void>;
  onEmailRegister: (payload: {
    displayName: string;
    storeName: string;
    email: string;
    password: string;
    contactInfo: string;
    planTier: SubscriptionPlanTier;
  }) => Promise<void>;
  onGoogleAuth: (registrationDraft?: {
    displayName: string;
    storeName: string;
    contactInfo: string;
    planTier: SubscriptionPlanTier;
  }) => Promise<void>;
  onSignOut: () => Promise<void>;
  onUpdateOwnMerchantProfile?: (updates: {
    displayName: string;
    storeName: string;
    contactInfo: string;
  }) => Promise<void>;
  themeMode?: ThemeMode;
}

export const PLAN_TIERS_INFO: {
  id: SubscriptionPlanTier;
  nameAr: string;
  priceLabel: string;
  badge: string;
  features: string[];
  colorClass: string;
}[] = [
  {
    id: 'starter',
    nameAr: 'الباقة الأساسية (Starter)',
    priceLabel: 'Starter',
    badge: 'أساسي',
    features: ['ربط مزود واحد وفحص الكتالوج المباشر'],
    colorClass: 'border-slate-700 bg-slate-900/90',
  },
  {
    id: 'pro',
    nameAr: 'باقة المتاجر الاحترافية (Pro)',
    priceLabel: 'Pro',
    badge: 'احترافي',
    features: ['المقارنة المزدوجة وتنبيهات الأسعار والهامش'],
    colorClass: 'border-indigo-500/60 bg-indigo-950/30',
  },
  {
    id: 'enterprise',
    nameAr: 'باقة الشركات والوكلاء (Enterprise)',
    priceLabel: 'Enterprise',
    badge: 'شركات',
    features: ['كافة المزايا والمزامنة الدورية المتقدمة'],
    colorClass: 'border-emerald-500/50 bg-emerald-950/20',
  },
];

const WHY_JOIN_BENEFITS = [
  {
    icon: Scale,
    accentColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25',
    badge: 'ميزة حصرية',
    badgeStyle: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/30',
    title: 'المقارنة المزدوجة اللحظية بين المزودين',
    description:
      'اربط حسابك لدى مزودين مختلفين في نفس الوقت وقارن أسعار التكلفة لنفس المنتج وجهاً لوجه لاقتناص السعر الأقل دائماً.',
    visualMetricLabel: 'مثال مقارنة فورية:',
    visualMetricValue: 'مزود A ($8.95) ← مزود B ($8.40) • وفر +6.1%',
  },
  {
    icon: TrendingDown,
    accentColor: 'text-rose-400 bg-rose-500/10 border-rose-500/25',
    badge: 'حماية الأرباح',
    badgeStyle: 'bg-rose-950/80 text-rose-300 border-rose-500/30',
    title: 'كشف تلقائي لتآكل هامش الربح (< 5%)',
    description:
      'رصد آلي لأي ارتفاع مفاجئ في أسعار التكلفة لدى المزود يؤدي إلى هبوط صافي ربحك عن 5% مع تمييز فوري للمنتجات المتأثرة.',
    visualMetricLabel: 'حالة الرصد الآلي:',
    visualMetricValue: 'تنبيه فوري عند انخفاض الهامش قبل البيع بالخسارة',
  },
  {
    icon: Code2,
    accentColor: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/25',
    badge: 'أتمتة تقنية',
    badgeStyle: 'bg-indigo-950/80 text-indigo-300 border-indigo-500/30',
    title: 'توحيد المعلمات وتوليد أكواد الربط الجاهزة',
    description:
      'تحليل ذكي لمعلمات المنتجات (معرف اللاعب، السيرفر، الكميات) مع إصلاح النواقص وتصدير الكتالوج بصيغ CSV و JSON بضغطة زر.',
    visualMetricLabel: 'توافق الأنظمة:',
    visualMetricValue: 'جاهز للربط البرمجي المباشر ومتاجر سلة والـ API',
  },
  {
    icon: BellRing,
    accentColor: 'text-amber-400 bg-amber-500/10 border-amber-500/25',
    badge: 'تزامن 24/7',
    badgeStyle: 'bg-amber-950/80 text-amber-300 border-amber-500/30',
    title: 'رادار الأسعار وإشعارات التيليجرام والنظام',
    description:
      'استقبل إشعارات فورية على هاتفك أو سطح المكتب أو عبر بوت تيليجرام فور انخفاض سعر منتج مستهدف أو عودته للتوفر.',
    visualMetricLabel: 'قنوات التنبيه:',
    visualMetricValue: 'Telegram Bot + إشعارات النظام + سجل تاريخي للأسعار',
  },
];

export const AuthGateView: React.FC<AuthGateViewProps> = ({
  currentUserProfile,
  authEmail,
  isSigningIn,
  authError,
  onEmailLogin,
  onEmailRegister,
  onGoogleAuth,
  onSignOut,
  onUpdateOwnMerchantProfile,
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Login State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Registration State
  const [displayName, setDisplayName] = useState('');
  const [storeName, setStoreName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [contactInfo, setContactInfo] = useState('');
  const [formValidationMsg, setFormValidationMsg] = useState<string | null>(null);

  // State for editing merchant's own pending profile
  const [editDisplayName, setEditDisplayName] = useState(
    currentUserProfile?.displayName || ''
  );
  const [editStoreName, setEditStoreName] = useState(
    currentUserProfile?.storeName || ''
  );
  const [editContactInfo, setEditContactInfo] = useState(
    currentUserProfile?.contactInfo || ''
  );
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Firebase Authorized Domains Helper State (for auth/unauthorized-domain)
  const [showDomainHelper, setShowDomainHelper] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Terms & Privacy Policy Drawer State
  const [isTermsDrawerOpen, setIsTermsDrawerOpen] = useState(false);
  const [termsDrawerTab, setTermsDrawerTab] = useState<LegalTabType>('terms');
  const [isGoogleGuideOpen, setIsGoogleGuideOpen] = useState(false);

  const handleOpenLegalDrawer = (tab: LegalTabType) => {
    setTermsDrawerTab(tab);
    setIsTermsDrawerOpen(true);
  };

  const currentHostname =
    typeof window !== 'undefined' && window.location.hostname
      ? window.location.hostname
      : 'ais-dev-rera3vpxapesxllyh2bef3-33861826635.europe-west1.run.app';

  const firebaseProjectId = firebaseConfig.projectId || 'even-tine-v7cdj';
  const firebaseConsoleAuthSettingsUrl = `https://console.firebase.google.com/project/${firebaseProjectId}/authentication/settings`;

  const recommendedDomains = React.useMemo(() => {
    const known = [
      {
        host: currentHostname,
        label: 'النطاق الحالي المفتوح الآن (أضفه أولاً)',
        isCurrent: true,
      },
      {
        host: 'ais-dev-rera3vpxapesxllyh2bef3-33861826635.europe-west1.run.app',
        label: 'نطاق بيئة التطوير (Development URL)',
        isCurrent:
          currentHostname ===
          'ais-dev-rera3vpxapesxllyh2bef3-33861826635.europe-west1.run.app',
      },
      {
        host: 'ais-pre-rera3vpxapesxllyh2bef3-33861826635.europe-west1.run.app',
        label: 'نطاق الرابط المشترك والمعاينة (Shared / Preview URL)',
        isCurrent:
          currentHostname ===
          'ais-pre-rera3vpxapesxllyh2bef3-33861826635.europe-west1.run.app',
      },
    ];
    const seen = new Set<string>();
    return known.filter((item) => {
      const clean = item.host.trim().toLowerCase();
      if (!clean || seen.has(clean)) return false;
      seen.add(clean);
      return true;
    });
  }, [currentHostname]);

  const handleCopyText = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2500);
    } catch {
      // Fallback copy method
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2500);
    }
  };

  React.useEffect(() => {
    if (authError && authError.includes('unauthorized-domain')) {
      setShowDomainHelper(true);
    }
  }, [authError]);

  React.useEffect(() => {
    if (currentUserProfile) {
      setEditDisplayName(currentUserProfile.displayName);
      setEditStoreName(currentUserProfile.storeName);
      setEditContactInfo(currentUserProfile.contactInfo);
    }
  }, [currentUserProfile]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormValidationMsg(null);

    const cleanEmail = loginEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setFormValidationMsg('يرجى إدخال البريد الإلكتروني بشكل صحيح.');
      return;
    }
    if (loginPassword.length < 6) {
      setFormValidationMsg('كلمة المرور يجب أن تتكون من 6 أحرف أو أرقام على الأقل.');
      return;
    }

    await onEmailLogin(cleanEmail, loginPassword);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormValidationMsg(null);

    const cleanName = sanitizeString(displayName, ACCOUNT_CONSTRAINTS.DISPLAY_NAME_MAX);
    const cleanStore = sanitizeString(storeName, ACCOUNT_CONSTRAINTS.STORE_NAME_MAX);
    const cleanEmail = sanitizeString(
      registerEmail.toLowerCase(),
      ACCOUNT_CONSTRAINTS.EMAIL_MAX
    );
    const cleanContact = sanitizeString(contactInfo, ACCOUNT_CONSTRAINTS.CONTACT_INFO_MAX);

    if (cleanName.length < ACCOUNT_CONSTRAINTS.DISPLAY_NAME_MIN) {
      setFormValidationMsg('يرجى إدخال الاسم الكامل.');
      return;
    }
    if (cleanStore.length < ACCOUNT_CONSTRAINTS.STORE_NAME_MIN) {
      setFormValidationMsg('يرجى إدخال اسم المتجر أو الشركة.');
      return;
    }
    if (cleanEmail.length < ACCOUNT_CONSTRAINTS.EMAIL_MIN || !cleanEmail.includes('@')) {
      setFormValidationMsg('يرجى إدخال بريد إلكتروني صحيح.');
      return;
    }
    if (registerPassword.length < 6) {
      setFormValidationMsg('يرجى اختيار كلمة مرور لا تقل عن 6 أحرف.');
      return;
    }

    await onEmailRegister({
      displayName: cleanName,
      storeName: cleanStore,
      email: cleanEmail,
      password: registerPassword,
      contactInfo: cleanContact,
      planTier: 'pro',
    });
  };

  const handleSavePendingDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdateOwnMerchantProfile) return;
    setIsSavingProfile(true);
    setSaveSuccessMsg(null);
    try {
      await onUpdateOwnMerchantProfile({
        displayName: sanitizeString(editDisplayName, ACCOUNT_CONSTRAINTS.DISPLAY_NAME_MAX, 'تاجر'),
        storeName: sanitizeString(editStoreName, ACCOUNT_CONSTRAINTS.STORE_NAME_MAX, 'متجر رقمي'),
        contactInfo: sanitizeString(editContactInfo, ACCOUNT_CONSTRAINTS.CONTACT_INFO_MAX, ''),
      });
      setSaveSuccessMsg('تم تحديث بيانات الحساب بنجاح.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // CASE A: Signed-in user whose account is 'pending' or 'suspended'
  if (currentUserProfile && currentUserProfile.accountStatus !== 'active') {
    const isSuspended = currentUserProfile.accountStatus === 'suspended';

    return (
      <div
        className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 font-sans"
        dir="rtl"
      >
        <div className="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-2xl space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center border shrink-0 ${
                  isSuspended
                    ? 'bg-rose-500/15 border-rose-500/40 text-rose-400'
                    : 'bg-amber-500/15 border-amber-500/40 text-amber-400'
                }`}
              >
                {isSuspended ? (
                  <AlertTriangle className="w-5 h-5" />
                ) : (
                  <Clock className="w-5 h-5" />
                )}
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-extrabold text-white">
                  {isSuspended
                    ? 'تم إيقاف الحساب مؤقتاً'
                    : 'تواصل مع المدير لتفعيل الحساب'}
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isSuspended
                    ? 'يرجى التواصل مع إدارة المنصة لإعادة تفعيل الحساب.'
                    : 'تم استلام طلبك بنجاح، يرجى التواصل مع المدير المالك لتفعيل اشتراكك ومنحك صلاحية الوصول لكتالوج المنتجات ومقارنة الأسعار.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onSignOut}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span>تسجيل الخروج</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5">
              <span className="text-slate-400 block text-[11px] mb-1">البريد الإلكتروني المسجل:</span>
              <span className="font-mono-numbers font-bold text-slate-100 break-all">
                {currentUserProfile.email || authEmail}
              </span>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5">
              <span className="text-slate-400 block text-[11px] mb-1">حالة الحساب:</span>
              <span
                className={`inline-flex items-center gap-1.5 font-bold ${
                  isSuspended ? 'text-rose-400' : 'text-amber-300'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isSuspended ? 'bg-rose-400' : 'bg-amber-400 animate-ping'
                  }`}
                />
                <span>{isSuspended ? 'موقوف' : 'بانتظار التفعيل من الإدارة'}</span>
              </span>
            </div>
          </div>

          {!isSuspended && onUpdateOwnMerchantProfile && (
            <form
              onSubmit={handleSavePendingDetails}
              className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3 text-xs"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-200">بيانات الحساب المسجلة</h3>
                {saveSuccessMsg && (
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{saveSuccessMsg}</span>
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">الاسم الكامل:</label>
                  <input
                    type="text"
                    maxLength={ACCOUNT_CONSTRAINTS.DISPLAY_NAME_MAX}
                    value={editDisplayName}
                    onChange={(e) => setEditDisplayName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">اسم المتجر / الشركة:</label>
                  <input
                    type="text"
                    maxLength={ACCOUNT_CONSTRAINTS.STORE_NAME_MAX}
                    value={editStoreName}
                    onChange={(e) => setEditStoreName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">رقم التواصل:</label>
                  <input
                    type="text"
                    maxLength={ACCOUNT_CONSTRAINTS.CONTACT_INFO_MAX}
                    value={editContactInfo}
                    onChange={(e) => setEditContactInfo(e.target.value)}
                    placeholder="+966..."
                    dir="ltr"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500 font-mono-numbers"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSavingProfile ? 'جارِ الحفظ...' : 'حفظ التعديلات'}</span>
                </button>
              </div>
            </form>
          )}

          {/* Legal links inside Pending / Suspended view */}
          <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
            <span>الوثائق القانونية المعتمدة للمنصة:</span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleOpenLegalDrawer('terms')}
                className="text-indigo-400 hover:text-indigo-300 font-bold underline underline-offset-4 cursor-pointer"
              >
                اتفاقية الاستخدام
              </button>
              <span className="text-slate-700">•</span>
              <button
                type="button"
                onClick={() => handleOpenLegalDrawer('privacy')}
                className="text-emerald-400 hover:text-emerald-300 font-bold underline underline-offset-4 cursor-pointer"
              >
                سياسة الخصوصية
              </button>
            </div>
          </div>
        </div>

        <TermsDrawer
          isOpen={isTermsDrawerOpen}
          onClose={() => setIsTermsDrawerOpen(false)}
          initialTab={termsDrawerTab}
        />
      </div>
    );
  }

  // CASE B: Professional B2B Portal — Prominent Login Card FIRST + "Why Join Us?" Visual Showcase
  return (
    <div
      className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans relative overflow-x-hidden"
      dir="rtl"
    >
      {/* Top Enterprise Header Bar with Prominent Login / Register Action Buttons */}
      <header className="w-full border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          {/* Brand Identity */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-slate-950 border border-indigo-500/40 p-1.5 flex items-center justify-center shrink-0 shadow-sm">
              <img
                src="/assets/aistudio/7_20261107_230645______08f45ae0.png"
                alt="SX"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="min-w-0">
              <div className="h-5 w-32 sm:w-36 overflow-hidden flex items-center">
                <img
                  src="/assets/aistudio/6_20261107_230645______4e8b394e.png"
                  alt="SHADOWX"
                  className="w-full h-20 object-cover object-center select-none pointer-events-none"
                />
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-400 truncate">
                منصة إدارة ومقارنة مزودي البطاقات الرقمية
              </p>
            </div>
          </div>

          {/* Prominent Top-Right Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setActiveTab('login');
                setFormValidationMsg(null);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'login'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                  : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>تسجيل الدخول</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('register');
                setFormValidationMsg(null);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'register'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                  : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>إنشاء حساب</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 flex items-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* COLUMN 1 (FIRST ON MOBILE & RIGHT ON DESKTOP): Prominent Login & Registration Card */}
          <div className="lg:col-span-5 order-1">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-7 shadow-2xl space-y-5 relative">
              {/* Top Accent Line */}
              <div className="absolute top-0 inset-x-6 h-1 rounded-b-full bg-gradient-to-l from-indigo-500 via-indigo-400 to-emerald-500" />

              {/* Prominent Action Switcher Buttons at the Top of the Card */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-lg sm:text-xl font-extrabold text-white">
                      {activeTab === 'login'
                        ? 'تسجيل الدخول إلى حسابك'
                        : 'إنشاء حساب متجر جديد'}
                    </h1>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {activeTab === 'login'
                        ? 'أدخل بيانات حسابك للوصول الفوري إلى أدوات الكتالوج والمقارنة'
                        : 'سجّل بيانات متجرك لتفعيل اشتراكك في المنصة'}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 flex items-center justify-center shrink-0">
                    {activeTab === 'login' ? (
                      <Lock className="w-5 h-5" />
                    ) : (
                      <UserPlus className="w-5 h-5" />
                    )}
                  </div>
                </div>

                {/* High-Visibility Segmented Control */}
                <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('login');
                      setFormValidationMsg(null);
                    }}
                    className={`py-2.5 px-3 rounded-lg font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      activeTab === 'login'
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <LogIn className="w-4 h-4" />
                    <span>تسجيل الدخول</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('register');
                      setFormValidationMsg(null);
                    }}
                    className={`py-2.5 px-3 rounded-lg font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      activeTab === 'register'
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>إنشاء حساب جديد</span>
                  </button>
                </div>
              </div>

              {/* Error / Validation Banner */}
              {(authError || formValidationMsg) && (
                <div className="p-3.5 rounded-xl bg-rose-950/70 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2.5 leading-relaxed">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{formValidationMsg || authError}</span>
                </div>
              )}

              {/* TAB 1: LOGIN */}
              {activeTab === 'login' && (
                <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
                  <div className="space-y-1.5">
                    <label className="block font-bold text-slate-300">
                      البريد الإلكتروني
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-500">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        required
                        autoComplete="email"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="name@company.com"
                        dir="ltr"
                        className="w-full pl-3.5 pr-10 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono-numbers text-xs sm:text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block font-bold text-slate-300">
                      كلمة المرور
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-500">
                        <KeyRound className="w-4 h-4" />
                      </div>
                      <input
                        type={showLoginPassword ? 'text' : 'password'}
                        required
                        autoComplete="current-password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        dir="ltr"
                        className="w-full pl-10 pr-10 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono-numbers text-xs sm:text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 hover:text-slate-200"
                        aria-label="إظهار أو إخفاء كلمة المرور"
                      >
                        {showLoginPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Prominent Primary Login Buttons Block */}
                  <div className="pt-2 space-y-3">
                    <button
                      type="button"
                      onClick={() => onGoogleAuth()}
                      disabled={isSigningIn}
                      className="w-full py-4 px-5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2.5 transition-all shadow-xl shadow-indigo-600/30 disabled:opacity-50 cursor-pointer"
                    >
                      <ShieldCheck className="w-5 h-5 text-white" />
                      <span>الدخول السريع باستخدام حساب Google</span>
                    </button>

                    <button
                      type="submit"
                      disabled={isSigningIn}
                      className="w-full py-3.5 px-4 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-100 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {isSigningIn ? (
                        <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                      ) : (
                        <LogIn className="w-4 h-4 text-indigo-400" />
                      )}
                      <span>
                        {isSigningIn ? 'جارِ تسجيل الدخول...' : 'تسجيل الدخول عبر البريد الإلكتروني'}
                      </span>
                    </button>

                    {/* Smooth Warning Banner for Google Setup Guide */}
                    <div className="mt-3 p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-indigo-200 text-[11px] flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <Globe className="w-4 h-4 text-indigo-400 shrink-0" />
                        <span className="truncate">تنبيه: لتفعيل الدخول بجوجل بسلاسة، راجع خطوات تفعيل النطاق.</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsGoogleGuideOpen(true)}
                        className="text-white bg-indigo-600 hover:bg-indigo-500 font-bold px-2.5 py-1 rounded-lg shrink-0 transition-colors cursor-pointer text-[10px]"
                      >
                        عرض الدليل
                      </button>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                    <span>مستخدم جديد في المنصة؟</span>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('register');
                        setFormValidationMsg(null);
                      }}
                      className="text-emerald-400 hover:text-emerald-300 font-extrabold inline-flex items-center gap-1"
                    >
                      <span>إنشاء حساب جديد الآن</span>
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 2: REGISTER */}
              {activeTab === 'register' && (
                <form onSubmit={handleRegisterSubmit} className="space-y-3.5 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block font-bold text-slate-300">
                        الاسم الكامل <span className="text-rose-400">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-500">
                          <User className="w-4 h-4" />
                        </div>
                        <input
                          type="text"
                          required
                          maxLength={ACCOUNT_CONSTRAINTS.DISPLAY_NAME_MAX}
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder="الاسم الكامل"
                          className="w-full pl-3 pr-9 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block font-bold text-slate-300">
                        اسم المتجر / الشركة <span className="text-rose-400">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-500">
                          <Store className="w-4 h-4" />
                        </div>
                        <input
                          type="text"
                          required
                          maxLength={ACCOUNT_CONSTRAINTS.STORE_NAME_MAX}
                          value={storeName}
                          onChange={(e) => setStoreName(e.target.value)}
                          placeholder="اسم المتجر"
                          className="w-full pl-3 pr-9 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block font-bold text-slate-300">
                      البريد الإلكتروني <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-500">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        required
                        autoComplete="email"
                        maxLength={ACCOUNT_CONSTRAINTS.EMAIL_MAX}
                        value={registerEmail}
                        onChange={(e) => setRegisterEmail(e.target.value)}
                        placeholder="name@company.com"
                        dir="ltr"
                        className="w-full pl-3 pr-9 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono-numbers"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block font-bold text-slate-300">
                      كلمة المرور (6 أحرف على الأقل) <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-500">
                        <KeyRound className="w-4 h-4" />
                      </div>
                      <input
                        type={showRegisterPassword ? 'text' : 'password'}
                        required
                        autoComplete="new-password"
                        value={registerPassword}
                        onChange={(e) => setRegisterPassword(e.target.value)}
                        placeholder="••••••••"
                        dir="ltr"
                        className="w-full pl-10 pr-9 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono-numbers"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                        className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 hover:text-slate-200"
                        aria-label="إظهار أو إخفاء كلمة المرور"
                      >
                        {showRegisterPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block font-bold text-slate-300">
                      رقم الهاتف / واتساب للتواصل
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-500">
                        <Phone className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        maxLength={ACCOUNT_CONSTRAINTS.CONTACT_INFO_MAX}
                        value={contactInfo}
                        onChange={(e) => setContactInfo(e.target.value)}
                        placeholder="+966500000000"
                        dir="ltr"
                        className="w-full pl-3 pr-9 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono-numbers"
                      />
                    </div>
                  </div>

                  {/* Legal Agreement Notice before Submit */}
                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/90 text-[11px] text-slate-400 leading-relaxed">
                    بإنشائك للحساب، فإنك توافق على{' '}
                    <button
                      type="button"
                      onClick={() => handleOpenLegalDrawer('terms')}
                      className="text-indigo-400 hover:text-indigo-300 font-bold underline underline-offset-4 cursor-pointer"
                    >
                      اتفاقية الاستخدام
                    </button>{' '}
                    و{' '}
                    <button
                      type="button"
                      onClick={() => handleOpenLegalDrawer('privacy')}
                      className="text-emerald-400 hover:text-emerald-300 font-bold underline underline-offset-4 cursor-pointer"
                    >
                      سياسة الخصوصية وأمن البيانات
                    </button>{' '}
                    الخاصة بالمنصة.
                  </div>

                  <button
                    type="submit"
                    disabled={isSigningIn}
                    className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-600/25 disabled:opacity-50 cursor-pointer"
                  >
                    {isSigningIn ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <UserPlus className="w-4 h-4" />
                    )}
                    <span>
                      {isSigningIn ? 'جارِ إنشاء الحساب...' : 'إنشاء الحساب وإرسال طلب التفعيل'}
                    </span>
                  </button>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                    <span>لديك حساب مسجل بالفعل؟</span>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('login');
                        setFormValidationMsg(null);
                      }}
                      className="text-indigo-400 hover:text-indigo-300 font-extrabold inline-flex items-center gap-1"
                    >
                      <span>تسجيل الدخول الآن</span>
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* COLUMN 2: "لماذا تنضم إلينا؟" (Why Join Us?) Visual B2B Showcase */}
          <div className="lg:col-span-7 order-2 space-y-6">
            {/* Section Header */}
            <div className="bg-slate-900/70 border border-slate-800/90 rounded-2xl p-5 sm:p-6 space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 text-xs font-bold">
                <Zap className="w-3.5 h-3.5 text-indigo-400" />
                <span>لماذا تنضم إلينا؟</span>
              </div>

              <h2 className="text-xl sm:text-2xl font-extrabold text-white leading-snug">
                البنية التحتية المتكاملة لإدارة مزودي البطاقات الرقمية وحماية أرباح متجرك
              </h2>

              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                صُممت منصة <strong className="text-slate-200">ShadX-Provider</strong> خصيصاً لأصحاب
                المتاجر الرقمية والموزعين لربط عدة مزودين عبر الـ API، ومقارنة تكاليف الشراء لحظياً،
                ومنع الخسائر الناتجة عن تغير أسعار المصدر دون علمك.
              </p>

              {/* Key Operational Metrics Strip */}
              <div className="grid grid-cols-3 gap-2.5 pt-2">
                <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3 text-center">
                  <div className="text-base sm:text-lg font-extrabold font-mono-numbers text-emerald-400">
                    2x
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    مقارنة مزودين معاً
                  </div>
                </div>
                <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3 text-center">
                  <div className="text-base sm:text-lg font-extrabold font-mono-numbers text-indigo-400">
                    &lt; 5%
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    تنبيه تلقائي للهامش المنخفض
                  </div>
                </div>
                <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3 text-center">
                  <div className="text-base sm:text-lg font-extrabold font-mono-numbers text-amber-400">
                    100%
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    توحيد معلمات الطلب والـ API
                  </div>
                </div>
              </div>
            </div>

            {/* 4 Visual Benefit Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {WHY_JOIN_BENEFITS.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div
                    key={idx}
                    className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-3.5 transition-all"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <div
                          className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${item.accentColor}`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md border ${item.badgeStyle}`}
                        >
                          {item.badge}
                        </span>
                      </div>

                      <h3 className="text-sm font-extrabold text-white leading-snug">
                        {item.title}
                      </h3>

                      <p className="text-xs text-slate-400 leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    {/* Visual Evidence / Metric Footer inside Card */}
                    <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between gap-2 text-[11px] bg-slate-950/60 px-3 py-2 rounded-xl">
                      <span className="text-slate-400 shrink-0">{item.visualMetricLabel}</span>
                      <span className="font-mono-numbers font-bold text-slate-200 truncate">
                        {item.visualMetricValue}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Enterprise Security & Trust Bar */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>اتصال مباشر ومشفر مع خوادم المزودين دون تخزين رموز الـ API خارج جلستك</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-indigo-300 font-bold">
                <Layers className="w-3.5 h-3.5" />
                <span>مخصص للمتاجر المعتمدة</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Official Enterprise Footer with Legal Links */}
      <footer className="border-t border-slate-800/80 bg-slate-900/70 py-4 px-4 sm:px-6 lg:px-8 text-center sm:text-right">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span>جميع الحقوق محفوظة © ShadX-Provider Hub • بوابة إدارة مزودي البطاقات الرقمية</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={() => handleOpenLegalDrawer('terms')}
              className="text-slate-300 hover:text-indigo-300 font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-indigo-400" />
              <span>اتفاقية الاستخدام</span>
            </button>

            <span className="text-slate-700">|</span>

            <button
              type="button"
              onClick={() => handleOpenLegalDrawer('privacy')}
              className="text-slate-300 hover:text-emerald-300 font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>سياسة الخصوصية وأمن البيانات</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Terms of Use & Privacy Policy Drawer */}
      <TermsDrawer
        isOpen={isTermsDrawerOpen}
        onClose={() => setIsTermsDrawerOpen(false)}
        initialTab={termsDrawerTab}
      />

      {/* Google Setup Guide Modal */}
      <GoogleSetupGuideModal
        isOpen={isGoogleGuideOpen}
        onClose={() => setIsGoogleGuideOpen(false)}
      />
    </div>
  );
};
