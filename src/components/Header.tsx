import React, { useState } from 'react';
import {
  Globe,
  KeyRound,
  RefreshCw,
  Wallet,
  Settings2,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Sliders,
  BellRing,
  Zap,
  Clock,
} from 'lucide-react';
import {
  IconApiApp,
  IconServer2,
  IconDatabase,
  IconArrowsShuffle,
  IconReceipt2,
  IconRefresh,
  IconShieldLock,
  IconCloudNetwork,
} from '@tabler/icons-react';
import {
  ProviderPreset,
  MarginConfig,
  PriceThresholdConfig,
  SyncScheduleConfig,
} from '../types';
import { PROVIDER_PRESETS } from '../data/mockCatalog';

interface HeaderProps {
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
  onOpenMarginModal: () => void;
  onOpenDocsDrawer: () => void;
  totalProductsCount: number;
  thresholdConfig: PriceThresholdConfig;
  alertProductsCount: number;
  onOpenThresholdModal: () => void;
  unreadAlertsCount: number;
  onOpenAlertsCenter: () => void;
  syncConfig: SyncScheduleConfig;
  onOpenSyncModal: () => void;
  onTriggerSyncNow: () => void;
  onOpenDeploymentGuide?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
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
  marginConfig,
  onOpenMarginModal,
  onOpenDocsDrawer,
  totalProductsCount,
  thresholdConfig,
  alertProductsCount,
  onOpenThresholdModal,
  unreadAlertsCount,
  onOpenAlertsCenter,
  syncConfig,
  onOpenSyncModal,
  onTriggerSyncNow,
  onOpenDeploymentGuide,
}) => {
  const [showToken, setShowToken] = useState(false);
  const [showConfigBar, setShowConfigBar] = useState(true);

  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-40">
      {/* Primary Brand & Top Actions */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        {/* Brand Zone: ShadX-Provider */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 ring-1 ring-white/20">
            <IconApiApp className="w-6 h-6 text-white" stroke={2.2} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-1.5 font-mono-numbers">
                <span className="bg-gradient-to-r from-cyan-300 via-indigo-200 to-white bg-clip-text text-transparent">
                  ShadX-Provider
                </span>
              </h1>
              <span className="text-[10px] font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-full font-mono-numbers">
                PRO HUB
              </span>
              <span className="text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-md font-mono-numbers">
                v2.6
              </span>
            </div>
            <p className="text-xs text-slate-400">
              بوابة ربط كتالوجات المزودين، مطابقة المعلمات الذكية، وهوامش ربح المتاجر الرقمية
            </p>
          </div>
        </div>

        {/* Global Controls & Status */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Live Balance / Connection Status */}
          {userBalance ? (
            <div className="flex items-center gap-2 bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 px-3 py-1.5 rounded-lg text-xs">
              <Wallet className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-slate-400">الرصيد:</span>
              <span className="font-bold font-mono-numbers text-emerald-400 text-sm">
                ${parseFloat(userBalance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
              {userEmail && <span className="text-emerald-500/70 text-[11px]">({userEmail})</span>}
            </div>
          ) : isLiveConnected ? (
            <div className="flex items-center gap-1.5 bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 px-3 py-1.5 rounded-lg text-xs">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>متصل بالمزود المباشر ({totalProductsCount} منتج)</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700/60 text-slate-300 px-3 py-1.5 rounded-lg text-xs">
              <span className="w-2 h-2 rounded-full bg-slate-500 inline-block" />
              <span>بانتظار ربط المزود الحقيقي</span>
            </div>
          )}

          {/* Periodic Sync Indicator & Trigger Button */}
          <button
            onClick={onOpenSyncModal}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
              syncConfig.isSyncing
                ? 'bg-indigo-950/80 border-indigo-500 text-indigo-300 shadow-sm shadow-indigo-500/20'
                : syncConfig.enabled
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                : 'bg-slate-850 hover:bg-slate-800 text-slate-400 border-slate-800'
            }`}
            title="جدولة الفحص الدوري للمزود وإظهار مؤشر آخر وقت مزامنة"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${
                syncConfig.isSyncing
                  ? 'animate-spin text-indigo-400'
                  : syncConfig.enabled
                  ? 'text-emerald-400'
                  : 'text-slate-500'
              }`}
            />
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 hidden sm:inline">آخر مزامنة:</span>
              <span className="font-bold font-mono-numbers text-slate-200">
                {syncConfig.lastSyncTime ? syncConfig.lastSyncTime.split(' ')[0] : 'لم تتم بعد'}
              </span>
              {syncConfig.enabled ? (
                <span className="bg-emerald-950/70 border border-emerald-500/40 text-emerald-400 text-[10px] px-1.5 py-0.2 rounded font-mono-numbers">
                  كل {syncConfig.intervalMinutes} د
                </span>
              ) : (
                <span className="bg-slate-800 text-slate-400 text-[10px] px-1.5 py-0.2 rounded">
                  متوقف
                </span>
              )}
            </div>
          </button>

          {/* Threshold Alerts Button with Visual Indicator */}
          <button
            onClick={onOpenThresholdModal}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
              alertProductsCount > 0
                ? 'bg-amber-950/70 border-amber-500/60 text-amber-300 shadow-sm shadow-amber-500/20'
                : thresholdConfig.enabled
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                : 'bg-slate-850 hover:bg-slate-800 text-slate-400 border-slate-800'
            }`}
            title="إعداد الحد السعري وتنبيهات انخفاض التكلفة للمنتجات"
          >
            <BellRing
              className={`w-3.5 h-3.5 ${
                alertProductsCount > 0 ? 'text-amber-400 animate-bounce' : 'text-slate-400'
              }`}
            />
            <span>حدود التكلفة:</span>
            {alertProductsCount > 0 ? (
              <span className="bg-amber-500 text-slate-950 font-bold px-1.5 py-0.2 rounded-full text-[10px] font-mono-numbers">
                {alertProductsCount} انخفاض!
              </span>
            ) : (
              <span className="font-mono-numbers text-slate-400 text-[11px]">
                {thresholdConfig.defaultThreshold ? `$${thresholdConfig.defaultThreshold}` : 'مخصص'}
              </span>
            )}
          </button>

          {/* Margin Setting Quick Button */}
          <button
            onClick={onOpenMarginModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-colors"
            title="تعديل نسبة أو مبلغ هامش الربح لحساب سعر البيع المقترح"
          >
            <Sliders className="w-3.5 h-3.5 text-indigo-400" />
            <span>هامش الربح:</span>
            <span className="font-bold font-mono-numbers text-indigo-400">
              {marginConfig.mode === 'percentage' ? `+${marginConfig.value}%` : `+$${marginConfig.value}`}
            </span>
          </button>

          {/* Alerts & Activity Log Button */}
          <button
            onClick={onOpenAlertsCenter}
            className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
              unreadAlertsCount > 0
                ? 'bg-indigo-950/80 border-indigo-500/60 text-indigo-200 shadow-md shadow-indigo-500/20'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
            title="سجل ومركز التنبيهات الذكي لرصد تغيرات التوفر وتكلفة المزود"
          >
            <div className="relative">
              <BellRing
                className={`w-3.5 h-3.5 ${
                  unreadAlertsCount > 0 ? 'text-indigo-400 animate-pulse' : 'text-slate-400'
                }`}
              />
              {unreadAlertsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-slate-900" />
              )}
            </div>
            <span>سجل التنبيهات</span>
            {unreadAlertsCount > 0 && (
              <span className="bg-indigo-500 text-white font-bold px-1.5 py-0.2 rounded-full text-[10px] font-mono-numbers">
                {unreadAlertsCount}
              </span>
            )}
          </button>

          {/* Documentation Drawer Toggle */}
          <button
            onClick={onOpenDocsDrawer}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-amber-400" />
            <span>توثيق الـ API</span>
          </button>

          {/* Cloud Deployment Guide Button */}
          {onOpenDeploymentGuide && (
            <button
              onClick={onOpenDeploymentGuide}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-950/70 to-slate-800 hover:from-emerald-900/80 hover:to-slate-700 text-emerald-300 border border-emerald-500/40 text-xs font-semibold transition-all shadow-xs"
              title="دليل النشر والتشغيل الشامل على GitHub + Neon + Render + Vercel"
            >
              <IconCloudNetwork className="w-4 h-4 text-emerald-400" stroke={2} />
              <span>دليل النشر (Render + Vercel + Neon)</span>
            </button>
          )}

          {/* Toggle Config Bar */}
          <button
            onClick={() => setShowConfigBar(!showConfigBar)}
            className={`p-1.5 rounded-lg border text-xs transition-colors ${
              showConfigBar
                ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
            }`}
            title="إظهار / إخفاء شريط إعدادات اتصال المزود"
          >
            <Settings2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Provider API Connection Setup Bar */}
      {showConfigBar && (
        <div className="bg-slate-950/80 border-t border-slate-800/80 px-4 sm:px-6 lg:px-8 py-3">
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Presets Quick Picker */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
              <span className="text-xs text-slate-400 shrink-0 font-medium ml-1">
                المزود:
              </span>
              {PROVIDER_PRESETS.map((preset) => {
                const isSelected = selectedPreset.id === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => onSelectPreset(preset)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all border ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                        : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    {preset.name}
                  </button>
                );
              })}
            </div>

            {/* Inputs & Action Form */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 grow lg:max-w-2xl">
              {/* Base URL */}
              <div className="relative grow">
                <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-slate-500">
                  <Globe className="w-3.5 h-3.5" />
                </div>
                <input
                  type="text"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="https://api.provider.com/"
                  dir="ltr"
                  className="w-full pl-3 pr-8 py-1.5 bg-slate-900 border border-slate-700/80 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono-numbers"
                />
              </div>

              {/* API Token */}
              <div className="relative grow sm:max-w-[240px]">
                <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-slate-500">
                  <KeyRound className="w-3.5 h-3.5" />
                </div>
                <input
                  type={showToken ? 'text' : 'password'}
                  value={apiToken}
                  onChange={(e) => setApiToken(e.target.value)}
                  placeholder="API Token (رمز التوثيق)"
                  dir="ltr"
                  className="w-full pl-12 pr-8 py-1.5 bg-slate-900 border border-slate-700/80 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono-numbers"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute inset-y-0 left-0 pl-2 pr-1 flex items-center text-[10px] text-slate-400 hover:text-slate-200"
                >
                  {showToken ? 'إخفاء' : 'عرض'}
                </button>
              </div>

              {/* Fetch Button */}
              <button
                onClick={onFetchProducts}
                disabled={isLoading}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 shrink-0 shadow-md shadow-indigo-600/20"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>{isLoading ? 'جارِ الجلب...' : 'جلب وتحديث المنتجات'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
