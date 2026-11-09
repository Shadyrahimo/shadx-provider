import React from 'react';
import {
  Package,
  PlugZap,
  Sliders,
  BellRing,
  BookOpen,
  CloudUpload,
  CheckCircle2,
  RefreshCw,
  Wallet,
  X,
  ChevronLeft,
  Monitor,
  Moon,
  Sun,
  Scale,
  Users,
  Crown,
  LogOut,
  FileText,
  ShieldCheck,
  History,
} from 'lucide-react';
import { LegalTabType } from './TermsDrawer';
import {
  SyncScheduleConfig,
  MarginConfig,
  ThemeMode,
  UserAccountProfile,
} from '../types';
import { OWNER_EMAIL } from '../firebase';

export type ActiveSectionId =
  | 'catalog'
  | 'compare'
  | 'accounts'
  | 'connection'
  | 'pricing'
  | 'alerts'
  | 'docs'
  | 'deploy'
  | 'settings'
  | 'orders';

interface SidebarProps {
  activeSection: ActiveSectionId;
  onSelectSection: (section: ActiveSectionId) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  totalProductsCount: number;
  unreadAlertsCount: number;
  alertProductsCount: number;
  isLiveConnected: boolean;
  userBalance: string | null;
  marginConfig: MarginConfig;
  syncConfig: SyncScheduleConfig;
  onTriggerSyncNow: () => void;
  themeMode: ThemeMode;
  resolvedTheme: 'dark' | 'light';
  onChangeThemeMode: (mode: ThemeMode) => void;
  currentUserProfile?: UserAccountProfile | null;
  pendingAccountsCount?: number;
  onSignOut?: () => void;
  onOpenLegalDrawer?: (tab: LegalTabType) => void;
  showMobileBottomBar?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeSection,
  onSelectSection,
  isOpenMobile,
  onCloseMobile,
  totalProductsCount,
  unreadAlertsCount,
  alertProductsCount,
  isLiveConnected,
  userBalance,
  marginConfig,
  syncConfig,
  onTriggerSyncNow,
  themeMode,
  resolvedTheme,
  onChangeThemeMode,
  currentUserProfile,
  pendingAccountsCount = 0,
  onSignOut,
  onOpenLegalDrawer,
  showMobileBottomBar = true,
}) => {
  const isOwner =
    currentUserProfile?.email === OWNER_EMAIL || currentUserProfile?.role === 'owner';

  const navItems: {
    id: ActiveSectionId;
    label: string;
    shortLabel: string;
    subtitle: string;
    icon: React.FC<{ className?: string }>;
    badge?: string | number;
    mobileBadge?: string | number;
    badgeColor?: string;
  }[] = [
    {
      id: 'catalog',
      label: 'كتالوج المنتجات',
      shortLabel: 'الكتالوج',
      subtitle: 'الجدول، الفلترة، التصدير، والربحية',
      icon: Package,
      badge: totalProductsCount > 0 ? totalProductsCount : undefined,
      mobileBadge: totalProductsCount > 0 ? totalProductsCount : undefined,
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    },
    {
      id: 'compare',
      label: 'المقارنة المزدوجة',
      shortLabel: 'المقارنة',
      subtitle: 'مقارنة أسعار مزودين معاً لنفس المنتج',
      icon: Scale,
      badge: 'مزودين',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    },
    {
      id: 'accounts',
      label: isOwner ? 'إدارة الحسابات (المالك)' : 'حسابي واشتراكي',
      shortLabel: 'الحسابات',
      subtitle: isOwner
        ? 'تفعيل المشتركين والباقات والصلاحيات'
        : 'تفاصيل باقتك وحالة اشتراكك',
      icon: isOwner ? Crown : Users,
      badge: isOwner
        ? pendingAccountsCount > 0
          ? `${pendingAccountsCount} طلب`
          : 'المالك'
        : 'نشط',
      mobileBadge: isOwner && pendingAccountsCount > 0 ? pendingAccountsCount : undefined,
      badgeColor:
        isOwner && pendingAccountsCount > 0
          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
          : 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    },
    {
      id: 'connection',
      label: 'ربط المزود والمزامنة',
      shortLabel: 'المزود',
      subtitle: 'إعداد الـ API Token والفحص الدوري',
      icon: PlugZap,
      badge: isLiveConnected ? 'متصل' : 'غير متصل',
      badgeColor: isLiveConnected
        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
        : 'bg-slate-800 text-slate-400 border-slate-700',
    },
    {
      id: 'pricing',
      label: 'هامش الربح والحدود',
      shortLabel: 'الأرباح',
      subtitle: 'قواعد التسعير وتنبيهات انخفاض التكلفة',
      icon: Sliders,
      badge:
        alertProductsCount > 0
          ? `${alertProductsCount} فرصة`
          : marginConfig.mode === 'percentage'
          ? `+${marginConfig.value}%`
          : `+$${marginConfig.value}`,
      mobileBadge: alertProductsCount > 0 ? alertProductsCount : undefined,
      badgeColor:
        alertProductsCount > 0
          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
          : 'bg-slate-800 text-slate-300 border-slate-700',
    },
    {
      id: 'alerts',
      label: 'سجل وقواعد التنبيهات',
      shortLabel: 'التنبيهات',
      subtitle: 'رصد الأسعار والتوفر وإشعارات البريد',
      icon: BellRing,
      badge: unreadAlertsCount > 0 ? `${unreadAlertsCount} جديد` : undefined,
      mobileBadge: unreadAlertsCount > 0 ? unreadAlertsCount : undefined,
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    },
    {
      id: 'docs',
      label: 'توثيق الـ API البرمجي',
      shortLabel: 'التوثيق',
      subtitle: 'نقاط النهاية، المعلمات، ورموز الأخطاء',
      icon: BookOpen,
    },
    {
      id: 'deploy',
      label: 'دليل النشر السحابي',
      shortLabel: 'النشر',
      subtitle: 'GitHub + Neon + Render + Vercel',
      icon: CloudUpload,
    },
    {
      id: 'settings',
      label: 'إعدادات المنصة الموحدة',
      shortLabel: 'الإعدادات',
      subtitle: 'التنبيهات، المزامنة، التسعير، والمظهر',
      icon: Sliders,
    },
    {
      id: 'orders',
      label: 'سجل الطلبات السابقة',
      shortLabel: 'الطلبات',
      subtitle: 'جلب وتتبع عمليات الشراء عبر الـ API',
      icon: History,
    },
  ];

  const handleSelect = (id: ActiveSectionId) => {
    onSelectSection(id);
    onCloseMobile();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 border-l border-slate-800 text-slate-200 w-72 shrink-0 select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-2.5 bg-slate-950/40">
        <div
          onClick={() => handleSelect('catalog')}
          className="flex items-center gap-3 cursor-pointer min-w-0"
        >
          {/* SX Icon Mark */}
          <div className="w-11 h-11 rounded-xl bg-slate-950 border border-indigo-500/30 p-1.5 flex items-center justify-center shadow-md shadow-indigo-950/50 shrink-0">
            <img
              src="/assets/aistudio/7_20261107_230645______08f45ae0.png"
              alt="SX Icon"
              className="w-full h-full object-contain"
            />
          </div>

          {/* SHADOWX Website Wordmark Logo + Subtitle */}
          <div className="min-w-0 flex flex-col justify-center">
            <div className="h-6 w-36 overflow-hidden flex items-center">
              <img
                src="/assets/aistudio/6_20261107_230645______4e8b394e.png"
                alt="SHADOWX Logo"
                className="w-full h-24 object-cover object-center select-none pointer-events-none"
              />
            </div>
            <p className="text-[11px] text-slate-400 truncate mt-0.5">
              ShadX-Provider • إدارة مزودي البطاقات
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onCloseMobile}
          className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 shrink-0"
          aria-label="إغلاق القائمة"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Connection Status Card inside Sidebar */}
      <div className="p-3.5 border-b border-slate-800/80 bg-slate-950/50">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="text-slate-400 font-medium">حالة الاتصال:</span>
          {isLiveConnected ? (
            <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>متصل بالمزود</span>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => handleSelect('connection')}
              className="text-amber-400 hover:text-amber-300 font-medium underline underline-offset-4"
            >
              إعداد الاتصال الآن
            </button>
          )}
        </div>

        {userBalance !== null && (
          <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs mb-2">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-emerald-400" />
              <span>الرصيد المتاح:</span>
            </span>
            <span className="font-bold font-mono-numbers text-emerald-400 text-sm">
              ${parseFloat(userBalance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
          <span>آخر مزامنة: {syncConfig.lastSyncTime ? syncConfig.lastSyncTime.split(' ')[0] : 'لم تتم'}</span>
          <button
            type="button"
            onClick={onTriggerSyncNow}
            disabled={syncConfig.isSyncing}
            className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${syncConfig.isSyncing ? 'animate-spin' : ''}`} />
            <span>تحديث</span>
          </button>
        </div>
      </div>

      {/* Main Navigation Sections */}
      <div className="p-3 grow overflow-y-auto space-y-1.5">
        <div className="px-2 pb-1 text-[11px] font-semibold text-slate-500">
          الأقسام الرئيسية
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelect(item.id)}
              className={`w-full text-right p-2.5 rounded-xl transition-all flex items-center justify-between gap-2.5 group border ${
                isActive
                  ? 'bg-indigo-600/15 border-indigo-500/50 text-white shadow-xs'
                  : 'border-transparent text-slate-300 hover:bg-slate-800/70 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                    isActive
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-400 group-hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold truncate">{item.label}</div>
                  <div className="text-[10px] text-slate-400 truncate mt-0.5">
                    {item.subtitle}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {item.badge !== undefined && (
                  <span
                    className={`text-[10px] font-mono-numbers font-semibold px-2 py-0.5 rounded-md border ${
                      item.badgeColor || 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
                <ChevronLeft
                  className={`w-3.5 h-3.5 transition-transform ${
                    isActive ? 'text-indigo-400 -translate-x-0.5' : 'text-slate-600'
                  }`}
                />
              </div>
            </button>
          );
        })}
      </div>

      {/* Theme Mode Selector (Auto System / Dark Default / Light) & Footer */}
      <div className="p-3.5 border-t border-slate-800 space-y-2.5 bg-slate-950/40">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-400 font-medium">مظهر الواجهة:</span>
          <span className="text-[10px] text-indigo-400 font-medium">
            {themeMode === 'system'
              ? `تلقائي (${resolvedTheme === 'dark' ? 'داكن' : 'فاتح'})`
              : themeMode === 'dark'
              ? 'السمة الداكنة (يدوي)'
              : 'السمة الفاتحة (يدوي)'}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px]">
          <button
            type="button"
            onClick={() => onChangeThemeMode('system')}
            className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg font-medium transition-all ${
              themeMode === 'system'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="تبديل تلقائي بين الفاتح والداكن حسب إعدادات نظام التشغيل"
          >
            <Monitor className="w-3.5 h-3.5 shrink-0" />
            <span>تلقائي</span>
          </button>

          <button
            type="button"
            onClick={() => onChangeThemeMode('dark')}
            className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg font-medium transition-all ${
              themeMode === 'dark'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="الاحتفاظ بالسمة الداكنة الحالية يدوياً"
          >
            <Moon className="w-3.5 h-3.5 shrink-0" />
            <span>داكن</span>
          </button>

          <button
            type="button"
            onClick={() => onChangeThemeMode('light')}
            className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg font-medium transition-all ${
              themeMode === 'light'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="تفعيل الوضع الفاتح يدوياً"
          >
            <Sun className="w-3.5 h-3.5 shrink-0" />
            <span>فاتح</span>
          </button>
        </div>

        {currentUserProfile && (
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2 text-[11px]">
            <div
              onClick={() => handleSelect('accounts')}
              className="min-w-0 cursor-pointer hover:opacity-90"
            >
              <div className="font-bold text-slate-200 truncate flex items-center gap-1">
                {isOwner && <Crown className="w-3 h-3 text-amber-400 shrink-0" />}
                <span className="truncate">{currentUserProfile.storeName}</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono-numbers truncate">
                {currentUserProfile.email}
              </div>
            </div>
            {onSignOut && (
              <button
                type="button"
                onClick={onSignOut}
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950/60 border border-slate-800 hover:border-rose-500/40 text-slate-400 hover:text-rose-300 transition-colors shrink-0"
                title="تسجيل الخروج"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {onOpenLegalDrawer && (
          <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-1.5 text-[11px]">
            <button
              type="button"
              onClick={() => {
                onOpenLegalDrawer('terms');
                onCloseMobile();
              }}
              className="py-1.5 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-indigo-300 font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span className="truncate">اتفاقية الاستخدام</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onOpenLegalDrawer('privacy');
                onCloseMobile();
              }}
              className="py-1.5 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-emerald-300 font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate">سياسة الخصوصية</span>
            </button>
          </div>
        )}

        <div className="pt-1 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-2">
            <img
              src="/assets/aistudio/7_20261107_230645______08f45ae0.png"
              alt="SX"
              className="w-4 h-4 object-contain opacity-80"
            />
            <span>ShadX-Provider Hub</span>
          </div>
          <span className="font-mono-numbers text-slate-400">RTL Responsive</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:block sticky top-0 h-screen shrink-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs"
            onClick={onCloseMobile}
          />
          <div className="relative z-10 h-full max-w-full flex">
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar */}
      {showMobileBottomBar && (
        <nav
          aria-label="قائمة التنقل السفلية للهاتف"
          className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 shadow-[0_-8px_24px_rgba(2,6,23,0.45)] px-1 pt-1.5 pb-[max(0.4rem,env(safe-area-inset-bottom))]"
        >
          <div className="grid grid-cols-8 gap-0.5 max-w-xl mx-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelect(item.id)}
                  className={`relative flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all select-none ${
                    isActive
                      ? 'text-indigo-400 bg-indigo-600/12 font-bold'
                      : 'text-slate-400 hover:text-slate-200 active:scale-95'
                  }`}
                >
                  {isActive && (
                    <span className="absolute top-0 inset-x-3 h-0.5 rounded-full bg-indigo-500" />
                  )}
                  <div className="relative flex items-center justify-center mb-0.5">
                    <Icon className={`w-4 h-4 transition-transform ${isActive ? 'scale-110 text-indigo-400' : ''}`} />
                  </div>
                  <span className={`text-[10px] leading-tight truncate max-w-full ${isActive ? 'text-white font-bold' : 'text-slate-400 font-medium'}`}>
                    {item.shortLabel}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </>
  );
};
