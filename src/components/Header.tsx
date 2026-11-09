import React, { useState } from 'react';
import {
  Globe,
  KeyRound,
  RefreshCw,
  Wallet,
  Settings2,
  CheckCircle2,
  Menu,
  BellRing,
} from 'lucide-react';
import {
  ProviderPreset,
  MarginConfig,
  PriceThresholdConfig,
  SyncScheduleConfig,
} from '../types';
import { PROVIDER_PRESETS } from '../data/mockCatalog';
import { ActiveSectionId } from './Sidebar';

interface HeaderProps {
  activeSection: ActiveSectionId;
  onSelectSection: (section: ActiveSectionId) => void;
  onOpenMobileSidebar: () => void;
  selectedPreset: ProviderPreset;
  onSelectPreset: (preset: ProviderPreset) => void;
  baseUrl: string;
  setBaseUrl: (url: string) => void;
  apiToken: string;
  setApiToken: (token: string) => void;
  onFetchProducts: () => void;
  isLoading: boolean;
  isLiveConnected: boolean;
  userBalance: string | null;
  userEmail: string | null;
  marginConfig: MarginConfig;
  totalProductsCount: number;
  thresholdConfig: PriceThresholdConfig;
  alertProductsCount: number;
  unreadAlertsCount: number;
  syncConfig: SyncScheduleConfig;
}

const SECTION_TITLES: Record<ActiveSectionId, { title: string; subtitle: string }> = {
  catalog: {
    title: 'كتالوج المنتجات والفلاتر الذكية',
    subtitle: 'استعراض المنتجات، مطابقة المعلمات، وتحليل هوامش الربح',
  },
  connection: {
    title: 'ربط المزود وجدولة المزامنة الدورية',
    subtitle: 'إعداد اتصال الـ API الحقيقي وضبط الفحص التلقائي في الخلفية',
  },
  pricing: {
    title: 'إعدادات هامش الربح والحدود السعرية',
    subtitle: 'ضبط قواعد التسعير الآلي وتنبيهات انخفاض التكلفة',
  },
  alerts: {
    title: 'سجل ومركز التنبيهات الذكي',
    subtitle: 'متابعة تغيرات الأسعار وحالة التوفر وإشعارات البريد الإلكتروني',
  },
  docs: {
    title: 'توثيق الـ API البرمجي والأكواد',
    subtitle: 'مواصفات نقاط النهاية، ترويسات التوثيق، ورموز الأخطاء',
  },
  deploy: {
    title: 'دليل النشر السحابي الشامل',
    subtitle: 'خطوات النشر وحل الأخطاء على GitHub + Neon + Render + Vercel',
  },
};

export const Header: React.FC<HeaderProps> = ({
  activeSection,
  onSelectSection,
  onOpenMobileSidebar,
  selectedPreset,
  onSelectPreset,
  baseUrl,
  setBaseUrl,
  apiToken,
  setApiToken,
  onFetchProducts,
  isLoading,
  isLiveConnected,
  userBalance,
  userEmail,
  totalProductsCount,
  unreadAlertsCount,
}) => {
  const [showToken, setShowToken] = useState(false);
  const [showQuickConnect, setShowQuickConnect] = useState(!isLiveConnected);

  const currentMeta = SECTION_TITLES[activeSection];

  return (
    <header className="border-b border-slate-800 bg-slate-900/95 backdrop-blur sticky top-0 z-30">
      {/* Compact Single-Row Top Bar */}
      <div className="px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
        {/* Right Zone: Mobile Menu Button + Current Section Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onOpenMobileSidebar}
            className="lg:hidden p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 shrink-0"
            aria-label="فتح القائمة الجانبية"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-white truncate">
                {currentMeta.title}
              </h2>
              <span className="hidden md:inline-block text-slate-600">·</span>
              <span className="hidden md:inline-block text-xs text-slate-400 truncate">
                {currentMeta.subtitle}
              </span>
            </div>
          </div>
        </div>

        {/* Left Zone: Status + Quick Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Live Balance / Status */}
          {userBalance !== null ? (
            <div className="hidden sm:flex items-center gap-1.5 bg-emerald-950/50 border border-emerald-500/30 text-emerald-300 px-3 py-1.5 rounded-xl text-xs">
              <Wallet className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-bold font-mono-numbers text-emerald-400">
                ${parseFloat(userBalance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
              {userEmail && (
                <span className="hidden xl:inline text-emerald-400/70 text-[11px]">
                  ({userEmail})
                </span>
              )}
            </div>
          ) : isLiveConnected ? (
            <div className="hidden sm:flex items-center gap-1.5 bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 px-3 py-1.5 rounded-xl text-xs">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>متصل ({totalProductsCount})</span>
            </div>
          ) : null}

          {/* Quick Alerts Shortcut */}
          <button
            type="button"
            onClick={() => onSelectSection('alerts')}
            className={`relative p-2 rounded-xl border text-xs transition-colors ${
              activeSection === 'alerts'
                ? 'bg-indigo-600 text-white border-indigo-500'
                : unreadAlertsCount > 0
                ? 'bg-indigo-950/80 border-indigo-500/50 text-indigo-300'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
            }`}
            title="سجل التنبيهات"
          >
            <BellRing className="w-4 h-4" />
            {unreadAlertsCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold font-mono-numbers px-1 rounded-full">
                {unreadAlertsCount}
              </span>
            )}
          </button>

          {/* Toggle Quick Connection Bar */}
          {activeSection === 'catalog' && (
            <button
              type="button"
              onClick={() => setShowQuickConnect(!showQuickConnect)}
              className={`p-2 rounded-xl border text-xs transition-colors ${
                showQuickConnect
                  ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
              }`}
              title="إظهار / إخفاء شريط الاتصال السريع بالمزود"
            >
              <Settings2 className="w-4 h-4" />
            </button>
          )}

          {/* Primary Action Button */}
          <button
            type="button"
            onClick={onFetchProducts}
            disabled={isLoading}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50 whitespace-nowrap shrink-0 shadow-sm shadow-indigo-600/20"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'جارِ الجلب...' : 'جلب وتحديث المنتجات'}</span>
          </button>
        </div>
      </div>

      {/* Collapsible Quick Provider Connection Bar (shown on Catalog page when toggled) */}
      {activeSection === 'catalog' && showQuickConnect && (
        <div className="bg-slate-950/90 border-t border-slate-800/80 px-4 sm:px-6 py-2.5">
          <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-2.5">
            {/* Presets Quick Picker */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 xl:pb-0">
              <span className="text-xs text-slate-400 shrink-0 font-medium ml-1">
                المزود:
              </span>
              {PROVIDER_PRESETS.map((preset) => {
                const isSelected = selectedPreset.id === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => onSelectPreset(preset)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all border ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-500'
                        : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    {preset.name}
                  </button>
                );
              })}
            </div>

            {/* URL & Token Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 grow xl:max-w-2xl">
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-slate-500">
                  <Globe className="w-3.5 h-3.5" />
                </div>
                <input
                  type="text"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="https://api.provider.com/"
                  dir="ltr"
                  className="w-full pl-3 pr-8 py-1.5 bg-slate-900 border border-slate-700/80 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono-numbers"
                />
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-slate-500">
                  <KeyRound className="w-3.5 h-3.5" />
                </div>
                <input
                  type={showToken ? 'text' : 'password'}
                  value={apiToken}
                  onChange={(e) => setApiToken(e.target.value)}
                  placeholder="API Token (التوكن الحقيقي)"
                  dir="ltr"
                  className="w-full pl-12 pr-8 py-1.5 bg-slate-900 border border-slate-700/80 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono-numbers"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute inset-y-0 left-0 pl-2.5 pr-1 flex items-center text-[10px] text-slate-400 hover:text-slate-200"
                >
                  {showToken ? 'إخفاء' : 'عرض'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
