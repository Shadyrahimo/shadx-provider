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
} from 'lucide-react';
import { SyncScheduleConfig, MarginConfig, ThemeMode } from '../types';

export type ActiveSectionId =
  | 'catalog'
  | 'connection'
  | 'pricing'
  | 'alerts'
  | 'docs'
  | 'deploy';

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
}) => {
  const navItems: {
    id: ActiveSectionId;
    label: string;
    subtitle: string;
    icon: React.FC<{ className?: string }>;
    badge?: string | number;
    badgeColor?: string;
  }[] = [
    {
      id: 'catalog',
      label: 'كتالوج المنتجات',
      subtitle: 'الجدول، الفلترة، التصدير، والربحية',
      icon: Package,
      badge: totalProductsCount > 0 ? totalProductsCount : undefined,
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    },
    {
      id: 'connection',
      label: 'ربط المزود والمزامنة',
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
      subtitle: 'قواعد التسعير وتنبيهات انخفاض التكلفة',
      icon: Sliders,
      badge:
        alertProductsCount > 0
          ? `${alertProductsCount} فرصة`
          : marginConfig.mode === 'percentage'
          ? `+${marginConfig.value}%`
          : `+$${marginConfig.value}`,
      badgeColor:
        alertProductsCount > 0
          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
          : 'bg-slate-800 text-slate-300 border-slate-700',
    },
    {
      id: 'alerts',
      label: 'سجل وقواعد التنبيهات',
      subtitle: 'رصد الأسعار والتوفر وإشعارات البريد',
      icon: BellRing,
      badge: unreadAlertsCount > 0 ? `${unreadAlertsCount} جديد` : undefined,
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    },
    {
      id: 'docs',
      label: 'توثيق الـ API البرمجي',
      subtitle: 'نقاط النهاية، المعلمات، ورموز الأخطاء',
      icon: BookOpen,
    },
    {
      id: 'deploy',
      label: 'دليل النشر السحابي',
      subtitle: 'GitHub + Neon + Render + Vercel',
      icon: CloudUpload,
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

      {/* Mobile Bottom Quick Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-slate-900/95 backdrop-blur border-t border-slate-800 px-1 py-1.5 flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelect(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg text-[10px] font-medium transition-colors relative ${
                isActive ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4 mb-0.5" />
              <span className="truncate max-w-[60px]">{item.label.split(' ')[0]}</span>
              {item.id === 'alerts' && unreadAlertsCount > 0 && (
                <span className="absolute top-0.5 right-2 w-2 h-2 rounded-full bg-rose-500" />
              )}
            </button>
          );
        })}
      </nav>
    </>
  );
};
