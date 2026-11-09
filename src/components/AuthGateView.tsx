import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  UserPlus,
  LogIn,
  Store,
  User,
  Phone,
  CheckCircle2,
  Clock,
  AlertTriangle,
  LogOut,
  Crown,
  Sparkles,
  Scale,
  BellRing,
  Package,
  RefreshCw,
  Save,
} from 'lucide-react';
import {
  SubscriptionPlanTier,
  UserAccountProfile,
  ThemeMode,
} from '../types';
import { ACCOUNT_CONSTRAINTS, OWNER_EMAIL, sanitizeString } from '../firebase';

interface AuthGateViewProps {
  // Null when not signed in; present when signed in but account is pending/suspended
  currentUserProfile: UserAccountProfile | null;
  authEmail: string | null;
  isSigningIn: boolean;
  authError: string | null;
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
    nameAr: 'باقة البداية (Starter)',
    priceLabel: '$29 / شهرياً',
    badge: 'للمتاجر الناشئة',
    features: [
      'ربط مزود واحد وفحص الكتالوج المباشر',
      'حاسبة هوامش الربح وتصدير CSV / JSON',
      'فحص المعلمات المطلوبة وأكواد الربط',
    ],
    colorClass: 'border-slate-700 bg-slate-900/90',
  },
  {
    id: 'pro',
    nameAr: 'باقة المتاجر الاحترافية (Pro)',
    priceLabel: '$59 / شهرياً',
    badge: 'الأكثر طلباً',
    features: [
      'خاصية المقارنة المزدوجة بين مزودين في نفس الوقت',
      'تنبيهات انخفاض التكلفة والهامش المنخفض (<5%)',
      'إشعارات فورية عبر تيليجرام وسطح المكتب والهاتف',
    ],
    colorClass: 'border-indigo-500/60 bg-indigo-950/30',
  },
  {
    id: 'enterprise',
    nameAr: 'باقة الشركات والوكلاء (Enterprise)',
    priceLabel: '$129 / شهرياً',
    badge: 'صلاحيات كاملة',
    features: [
      'مزامنة خلفية عالية التردد وسجل تاريخي للأسعار',
      'مقارنة شاملة لكافة الكتالوجات وتصدير التقارير',
      'دعم فني مخصص وأولوية تفعيل من المدير المالك',
    ],
    colorClass: 'border-emerald-500/50 bg-emerald-950/20',
  },
];

export const AuthGateView: React.FC<AuthGateViewProps> = ({
  currentUserProfile,
  authEmail,
  isSigningIn,
  authError,
  onGoogleAuth,
  onSignOut,
  onUpdateOwnMerchantProfile,
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [displayName, setDisplayName] = useState('');
  const [storeName, setStoreName] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlanTier>('pro');
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

  React.useEffect(() => {
    if (currentUserProfile) {
      setEditDisplayName(currentUserProfile.displayName);
      setEditStoreName(currentUserProfile.storeName);
      setEditContactInfo(currentUserProfile.contactInfo);
    }
  }, [currentUserProfile]);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormValidationMsg(null);

    const cleanName = sanitizeString(displayName, ACCOUNT_CONSTRAINTS.DISPLAY_NAME_MAX);
    const cleanStore = sanitizeString(storeName, ACCOUNT_CONSTRAINTS.STORE_NAME_MAX);
    const cleanContact = sanitizeString(contactInfo, ACCOUNT_CONSTRAINTS.CONTACT_INFO_MAX);

    if (cleanName.length < ACCOUNT_CONSTRAINTS.DISPLAY_NAME_MIN) {
      setFormValidationMsg('يرجى إدخال الاسم الكامل لصاحب الحساب.');
      return;
    }
    if (cleanStore.length < ACCOUNT_CONSTRAINTS.STORE_NAME_MIN) {
      setFormValidationMsg('يرجى إدخال اسم المتجر أو الشركة.');
      return;
    }

    await onGoogleAuth({
      displayName: cleanName,
      storeName: cleanStore,
      contactInfo: cleanContact,
      planTier: selectedPlan,
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
      setSaveSuccessMsg('تم تحديث بيانات طلب الاشتراك بنجاح.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // CASE A: User is signed in, but their account is 'pending' or 'suspended'
  if (currentUserProfile && currentUserProfile.accountStatus !== 'active') {
    const isSuspended = currentUserProfile.accountStatus === 'suspended';
    const planObj =
      PLAN_TIERS_INFO.find((p) => p.id === currentUserProfile.planTier) ||
      PLAN_TIERS_INFO[1];

    return (
      <div
        className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 font-sans"
        dir="rtl"
      >
        <div className="max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-800">
            <div className="flex items-center gap-3.5">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center border shrink-0 ${
                  isSuspended
                    ? 'bg-rose-500/15 border-rose-500/40 text-rose-400'
                    : 'bg-amber-500/15 border-amber-500/40 text-amber-400'
                }`}
              >
                {isSuspended ? (
                  <AlertTriangle className="w-6 h-6" />
                ) : (
                  <Clock className="w-6 h-6" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg sm:text-xl font-extrabold text-white">
                    {isSuspended
                      ? 'تم إيقاف الحساب مؤقتاً من إدارة المنصة'
                      : 'حسابك بانتظار موافقة وتفعيل المدير المالك'}
                  </h1>
                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md border ${
                      isSuspended
                        ? 'bg-rose-950/80 border-rose-500/50 text-rose-300'
                        : 'bg-amber-950/80 border-amber-500/50 text-amber-300'
                    }`}
                  >
                    {isSuspended ? 'موقوف (Suspended)' : 'قيد المراجعة (Pending)'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  منصة ShadX-Provider مخصصة للمشتركين المعتمدين فقط وتخضع لإدارة المدير المالك.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onSignOut}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span>تسجيل الخروج</span>
            </button>
          </div>

          {/* Account Status Explanation */}
          <div
            className={`p-4 rounded-xl border text-xs leading-relaxed ${
              isSuspended
                ? 'bg-rose-950/30 border-rose-500/30 text-rose-200'
                : 'bg-indigo-950/30 border-indigo-500/30 text-indigo-200'
            }`}
          >
            {isSuspended ? (
              <p>
                عذراً، تم تعليق صلاحية وصول هذا الحساب إلى أدوات الكتالوج والمقارنة المزدوجة من قِبل
                المدير المالك (<strong>{OWNER_EMAIL}</strong>). يرجى التواصل مع الإدارة لتجديد
                الاشتراك أو إعادة تفعيل الحساب.
              </p>
            ) : (
              <p>
                تم تسجيل طلب اشتراكك بنجاح! يقوم المدير المالك (<strong>{OWNER_EMAIL}</strong>)
                بمراجعة الحسابات الجديدة وتفعيلها. بمجرد موافقة المدير المالك على حسابك، ستفتح لك
                اللوحة تلقائياً في نفس اللحظة دون الحاجة لإعادة تحميل الصفحة.
              </p>
            )}
          </div>

          {/* Account Summary Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5">
              <span className="text-slate-400 block text-[11px] mb-1">البريد الإلكتروني المسجل:</span>
              <span className="font-mono-numbers font-bold text-slate-100 break-all">
                {currentUserProfile.email || authEmail}
              </span>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5">
              <span className="text-slate-400 block text-[11px] mb-1">الباقة المطلوبة:</span>
              <span className="font-bold text-indigo-300 block">{planObj.nameAr}</span>
              <span className="text-[11px] font-mono-numbers text-emerald-400">
                {planObj.priceLabel}
              </span>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5">
              <span className="text-slate-400 block text-[11px] mb-1">حالة التفعيل الفوري:</span>
              <span className="inline-flex items-center gap-1.5 font-bold text-amber-300">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span>متصل بانتظار التفعيل</span>
              </span>
            </div>
          </div>

          {/* Editable Store & Contact Details (Allowed while not suspended) */}
          {!isSuspended && onUpdateOwnMerchantProfile && (
            <form
              onSubmit={handleSavePendingDetails}
              className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3.5 text-xs"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-200">
                  تحديث بيانات المتجر والتواصل (تظهر للمدير المالك لتسريع التفعيل)
                </h3>
                {saveSuccessMsg && (
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{saveSuccessMsg}</span>
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                  <label className="block text-[11px] text-slate-400 mb-1">
                    رقم واتساب / تيليجرام للتواصل:
                  </label>
                  <input
                    type="text"
                    maxLength={ACCOUNT_CONSTRAINTS.CONTACT_INFO_MAX}
                    value={editContactInfo}
                    onChange={(e) => setEditContactInfo(e.target.value)}
                    placeholder="+966... أو @username"
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
                  <span>{isSavingProfile ? 'جارِ الحفظ...' : 'حفظ وتحديث البيانات'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  // CASE B: Unauthenticated Visitor -> Login & Create Account Pages
  return (
    <div
      className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 lg:p-10 font-sans relative overflow-hidden"
      dir="rtl"
    >
      {/* Subtle Ambient Glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="absolute -top-40 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-6xl w-full mx-auto my-auto grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
        {/* Right Column (7 cols): Platform Value Proposition & Subscription Plans */}
        <div className="lg:col-span-7 space-y-6">
          {/* Brand Header */}
          <div className="inline-flex items-center gap-3 bg-slate-900/90 border border-slate-800 px-4 py-2.5 rounded-2xl shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-slate-950 border border-indigo-500/30 p-1.5 flex items-center justify-center shrink-0">
              <img
                src="/assets/aistudio/7_20261107_230645______08f45ae0.png"
                alt="SX"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-white text-sm tracking-wide">
                  SHADX-PROVIDER HUB
                </span>
                <span className="text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-md">
                  منصة احترافية للمشتركين فقط
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                نظام إدارة ومقارنة مزودي البطاقات الرقمية والألعاب بالزمن الفعلي
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white leading-tight">
              تحكم كامل بأسعار المزودين، الهوامش الربحية، والمقارنة المزدوجة
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-2xl">
              هذه الخدمة مخصصة لأصحاب المتاجر الرقمية والموزعين المعتمدين. يتم إنشاء الحسابات
              ومراجعتها وتفعيل الاشتراكات مباشرة بواسطة <strong className="text-slate-200">المدير المالك</strong> لضمان أعلى مستويات الأمان والخصوصية.
            </p>
          </div>

          {/* Core Platform Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="bg-slate-900/80 border border-slate-800/90 rounded-xl p-3.5 space-y-1.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                <Scale className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-white">المقارنة المزدوجة للمزودين</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                ربط مزودين في آنٍ واحد ومقارنة أسعار نفس المنتج لاختيار الأرخص تلقائياً.
              </p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800/90 rounded-xl p-3.5 space-y-1.5">
              <div className="w-8 h-8 rounded-lg bg-rose-500/15 text-rose-400 flex items-center justify-center">
                <BellRing className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-white">حماية الهوامش (&lt;5%)</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                كشف تلقائي للمنتجات التي انخفض ربحها عن 5% بسبب ارتفاع التكلفة مع إشعارات فورية.
              </p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800/90 rounded-xl p-3.5 space-y-1.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/15 text-indigo-400 flex items-center justify-center">
                <Package className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-white">توحيد المعلمات والـ API</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                تحليل ذكي لمعلمات الطلب وتوليد أكواد الربط الجاهزة وتصدير الكتالوجات.
              </p>
            </div>
          </div>

          {/* Subscription Tiers Preview */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-300 flex items-center gap-1.5">
                <Crown className="w-4 h-4 text-amber-400" />
                <span>باقات الاشتراك المتاحة (يتم تفعيلها من المدير المالك):</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              {PLAN_TIERS_INFO.map((plan) => {
                const isSelected = selectedPlan === plan.id;
                return (
                  <div
                    key={plan.id}
                    onClick={() => {
                      setSelectedPlan(plan.id);
                      if (activeTab !== 'register') setActiveTab('register');
                    }}
                    className={`rounded-xl p-3.5 border transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-950/35 shadow-md shadow-indigo-950/40'
                        : plan.colorClass
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-950 text-indigo-300 border border-slate-800">
                          {plan.badge}
                        </span>
                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                        )}
                      </div>
                      <h4 className="font-extrabold text-white text-xs mt-1">{plan.nameAr}</h4>
                      <div className="text-sm font-extrabold font-mono-numbers text-emerald-400 my-1">
                        {plan.priceLabel}
                      </div>
                      <ul className="space-y-1 mt-2 text-[11px] text-slate-300">
                        {plan.features.map((f, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-emerald-400 mt-0.5">•</span>
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Left Column (5 cols): Login & Create Account Card */}
        <div className="lg:col-span-5">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-7 shadow-2xl space-y-5">
            {/* Mode Switcher Tabs: Login vs Create Account */}
            <div className="grid grid-cols-2 gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('login');
                  setFormValidationMsg(null);
                }}
                className={`py-2.5 px-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
                  activeTab === 'login'
                    ? 'bg-indigo-600 text-white shadow-sm'
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
                className={`py-2.5 px-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
                  activeTab === 'register'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                <span>إنشاء حساب جديد</span>
              </button>
            </div>

            {/* Error Banner */}
            {(authError || formValidationMsg) && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{formValidationMsg || authError}</span>
              </div>
            )}

            {/* TAB 1: LOGIN */}
            {activeTab === 'login' && (
              <div className="space-y-5">
                <div className="space-y-1">
                  <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
                    <Lock className="w-5 h-5 text-indigo-400" />
                    <span>تسجيل الدخول إلى حسابك</span>
                  </h2>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    سجّل دخولك باستخدام حساب Google المرتبط باشتراكك للوصول إلى الكتالوج والمقارنة
                    المزدوجة، أو للدخول كمدير مالك.
                  </p>
                </div>

                {/* Primary Google Sign-In Button */}
                <button
                  type="button"
                  onClick={() => onGoogleAuth()}
                  disabled={isSigningIn}
                  className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all shadow-lg shadow-indigo-600/25 disabled:opacity-50 cursor-pointer"
                >
                  {isSigningIn ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="w-5 h-5" />
                  )}
                  <span>
                    {isSigningIn
                      ? 'جارِ التحقق وتسجيل الدخول...'
                      : 'تسجيل الدخول السريع عبر حساب Google'}
                  </span>
                </button>

                {/* Owner Admin Note */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/90 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-amber-300 font-bold">
                    <Crown className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>دخول المدير المالك (Owner Admin):</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    عند تسجيل الدخول بالبريد المعتمد للمالك (
                    <span className="font-mono-numbers text-slate-200">{OWNER_EMAIL}</span>)، يتم
                    منحك تلقائياً صلاحية <strong className="text-emerald-400">المدير المالك</strong>{' '}
                    مع لوحة إدارة الحسابات لتفعيل أو إيقاف حسابات المشتركين وتحديد باقاتهم.
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800 text-center text-xs text-slate-400">
                  <span>ليس لديك حساب اشتراك حتى الآن؟ </span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('register')}
                    className="text-emerald-400 hover:text-emerald-300 font-bold underline underline-offset-4"
                  >
                    إنشاء حساب طلب اشتراك جديد
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: CREATE ACCOUNT (REGISTRATION) */}
            {activeTab === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-emerald-400" />
                    <span>إنشاء حساب مشترك جديد</span>
                  </h2>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    أدخل بيانات متجرك واختر الباقة المناسبة، ثم أكمل التسجيل ليتم إرسال حسابك إلى
                    المدير المالك للتفعيل.
                  </p>
                </div>

                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-300">
                    1. الاسم الكامل لصاحب الحساب <span className="text-rose-400">*</span>
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
                      placeholder="مثال: أحمد محمد"
                      className="w-full pl-3 pr-9 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Store / Company Name */}
                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-300">
                    2. اسم المتجر أو الشركة <span className="text-rose-400">*</span>
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
                      placeholder="مثال: متجر شادو للبطاقات الرقمية"
                      className="w-full pl-3 pr-9 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Contact Info (WhatsApp / Telegram) */}
                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-300">
                    3. وسيلة التواصل للتفعيل (واتساب أو معرف تيليجرام):
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
                      placeholder="+966500000000 أو @telegram_user"
                      dir="ltr"
                      className="w-full pl-3 pr-9 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono-numbers"
                    />
                  </div>
                </div>

                {/* Plan Selector */}
                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-300">
                    4. باقة الاشتراك المطلوبة:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {PLAN_TIERS_INFO.map((plan) => {
                      const active = selectedPlan === plan.id;
                      return (
                        <button
                          key={plan.id}
                          type="button"
                          onClick={() => setSelectedPlan(plan.id)}
                          className={`p-2.5 rounded-xl border text-center transition-all ${
                            active
                              ? 'bg-emerald-600/20 border-emerald-500 text-white font-bold'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <div className="text-[11px] truncate">
                            {plan.id === 'starter'
                              ? 'Starter'
                              : plan.id === 'pro'
                              ? 'Pro (احترافية)'
                              : 'Enterprise'}
                          </div>
                          <div className="text-[10px] font-mono-numbers text-emerald-400 mt-0.5">
                            {plan.priceLabel}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Submit Registration Button */}
                <button
                  type="submit"
                  disabled={isSigningIn}
                  className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-600/25 disabled:opacity-50 cursor-pointer"
                >
                  {isSigningIn ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <UserPlus className="w-5 h-5" />
                  )}
                  <span>
                    {isSigningIn
                      ? 'جارِ إنشاء الحساب...'
                      : 'إنشاء الحساب والمتابعة عبر Google'}
                  </span>
                </button>

                <div className="pt-2 border-t border-slate-800 text-center text-xs text-slate-400">
                  <span>لديك حساب مسجل بالفعل؟ </span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('login')}
                    className="text-indigo-400 hover:text-indigo-300 font-bold underline underline-offset-4"
                  >
                    تسجيل الدخول من هنا
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 max-w-6xl w-full mx-auto mt-8 pt-4 border-t border-slate-900 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
        <span>جميع الحقوق محفوظة © ShadX-Provider Hub • نظام محمي بمصادقة وصلاحيات المدير المالك</span>
        <span className="font-mono-numbers">Zero-Trust Firestore RBAC</span>
      </div>
    </div>
  );
};
