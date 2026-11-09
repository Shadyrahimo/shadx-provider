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
  Monitor,
  Moon,
  Sun,
  Clock,
  PlugZap,
} from 'lucide-react';
import {
  ProviderPreset,
  MarginConfig,
  PriceThresholdConfig,
  SyncScheduleConfig,
  ThemeMode,
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
  themeMode: ThemeMode;
  resolvedTheme: 'dark' | 'light';
  onChangeThemeMode: (mode: ThemeMode) => void;
}

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
  syncConfig,
  themeMode,
  resolvedTheme,
  onChangeThemeMode,
}) => {
  const [showToken, setShowToken] = useState(false);
  const [showQuickConnect, setShowQuickConnect] = useState(!isLiveConnected);

  return (
    <header className="border-b border-slate-800 bg-slate-900/95 backdrop-blur-md sticky top-0 z-30">
      {/* Sleek Single-Row Top Bar (No Cluttered Section Titles) */}
      <div className="max-w-[1600px] mx-auto px-3 sm:px-5 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Right Zone: Mobile Menu + Brand Mark + Compact Connection Status Pill */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            type="button"
            onClick={onOpenMobileSidebar}
            className="lg:hidden p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 shrink-0 transition-colors"
            aria-label="فتح القائمة الجانبية"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Compact SX + SHADOWX Logo visible on mobile/tablet when Sidebar is closed */}
          <div
            onClick={() => onSelectSection('catalog')}
            className="lg:hidden flex items-center gap-2 pl-2 border-l border-slate-800 shrink-0 cursor-pointer"
          >
            <img
              src="/assets/aistudio/7_20261107_230645______08f45ae0.png"
              alt="SX"
              className="w-7 h-7 object-contain"
            />
            <div className="hidden sm:flex h-5 w-24 overflow-hidden items-center">
              <img
                src="/assets/aistudio/6_20261107_230645______4e8b394e.png"
                alt="SHADOWX"
                className="w-full h-20 object-cover object-center select-none pointer-events-none"
              />
            </div>
          </div>

          {/* Clean Live Provider Status Badge */}
          <div className="flex items-center gap-2 min-w-0">
            {isLiveConnected ? (
              <div
                onClick={() => onSelectSection('connection')}
                className="flex items-center gap-2 bg-emerald-950/50 border border-emerald-500/30 text-emerald-300 px-3 py-1.5 rounded-xl text-xs cursor-pointer hover:bg-emerald-950/70 transition-colors truncate"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span className="font-semibold truncate">متصل بالمزود</span>
                <span className="font-mono-numbers font-bold text-emerald-400 hidden sm:inline">
                  ({totalProductsCount})
                </span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onSelectSection('connection')}
                className="flex items-center gap-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 px-3 py-1.5 rounded-xl text-xs transition-colors truncate"
              >
                <PlugZap className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span className="font-medium truncate">إعداد ربط المزود</span>
              </button>
            )}

            {syncConfig.lastSyncTime && (
              <div
                onClick={() => onSelectSection('connection')}
                className="hidden md:flex items-center gap-1.5 bg-slate-950 border border-slate-800 text-slate-400 px-2.5 py-1.5 rounded-xl text-[11px] cursor-pointer hover:border-slate-700 transition-colors"
                title="وقت آخر مزامنة مع المزود"
              >
                <Clock className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>آخر تحديث:</span>
                <span className="font-mono-numbers font-semibold text-slate-200">
                  {syncConfig.lastSyncTime}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Left Zone: Balance + Theme Switcher + Alerts + Quick Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Live Balance Pill */}
          {userBalance !== null && (
            <div className="hidden sm:flex items-center gap-1.5 bg-emerald-950/50 border border-emerald-500/30 text-emerald-300 px-3 py-1.5 rounded-xl text-xs">
              <Wallet className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="font-extrabold font-mono-numbers text-emerald-400">
                ${parseFloat(userBalance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
              {userEmail && (
                <span className="hidden 2xl:inline text-emerald-400/70 text-[11px] font-mono-numbers">
                  ({userEmail})
                </span>
              )}
            </div>
          )}

          {/* Theme Switcher (System Auto / Dark Current / Light) */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-0.5 text-xs">
            <button
              type="button"
              onClick={() => onChangeThemeMode('system')}
              className={`p-1.5 rounded-lg flex items-center gap-1 transition-all ${
                themeMode === 'system'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title={`تبديل تلقائي حسب النظام (النشط حالياً: ${resolvedTheme === 'dark' ? 'داكن' : 'فاتح'})`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span className="hidden xl:inline text-[11px] font-medium px-0.5">تلقائي</span>
            </button>
            <button
              type="button"
              onClick={() => onChangeThemeMode('dark')}
              className={`p-1.5 rounded-lg flex items-center gap-1 transition-all ${
                themeMode === 'dark'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="السمة الداكنة الحالية (يدوي)"
            >
              <Moon className="w-3.5 h-3.5" />
              <span className="hidden xl:inline text-[11px] font-medium px-0.5">داكن</span>
            </button>
            <button
              type="button"
              onClick={() => onChangeThemeMode('light')}
              className={`p-1.5 rounded-lg flex items-center gap-1 transition-all ${
                themeMode === 'light'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="الوضع الفاتح (يدوي)"
            >
              <Sun className="w-3.5 h-3.5" />
              <span className="hidden xl:inline text-[11px] font-medium px-0.5">فاتح</span>
            </button>
          </div>

          {/* Quick Alerts Shortcut */}
          <button
            type="button"
            onClick={() => onSelectSection('alerts')}
            className={`relative p-2 rounded-xl border text-xs transition-colors ${
              activeSection === 'alerts'
                ? 'bg-indigo-600 text-white border-indigo-500'
                : unreadAlertsCount > 0
                ? 'bg-indigo-950/80 border-indigo-500/50 text-indigo-300'
                : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white'
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
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
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
            className="px-3 sm:px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50 whitespace-nowrap shrink-0 shadow-sm shadow-indigo-600/20"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden xs:inline sm:inline">
              {isLoading ? 'جارِ الجلب...' : 'جلب وتحديث المنتجات'}
            </span>
            <span className="xs:hidden sm:hidden">{isLoading ? '...' : 'تحديث'}</span>
          </button>
        </div>
      </div>

      {/* Collapsible Quick Provider Connection Bar (shown on Catalog page when toggled) */}
      {activeSection === 'catalog' && showQuickConnect && (
        <div className="bg-slate-950/90 border-t border-slate-800/80">
          <div className="max-w-[1600px] mx-auto px-3 sm:px-5 lg:px-8 py-2.5 flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-2.5">
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
