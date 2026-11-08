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
} from 'lucide-react';
import { ProviderPreset, MarginConfig } from '../types';
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
}) => {
  const [showToken, setShowToken] = useState(false);
  const [showConfigBar, setShowConfigBar] = useState(true);

  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-40">
      {/* Primary Brand & Top Actions */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        {/* Brand Zone */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 font-bold text-lg">
            API
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white tracking-tight">
                مستكشف ومربط منتجات المزودين
              </h1>
              <span className="text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-md font-mono-numbers">
                v2.5
              </span>
            </div>
            <p className="text-xs text-slate-400">
              تصفح كتالوج الخدمات، مطابقة المعلمات، وتخصيص هوامش الربح للمتاجر الرقمية
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
              <span>متصل بالمزود المباشر</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700/60 text-slate-300 px-3 py-1.5 rounded-lg text-xs">
              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
              <span>كتالوج استعراض واختبار ({totalProductsCount} منتج)</span>
            </div>
          )}

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

          {/* Documentation Drawer Toggle */}
          <button
            onClick={onOpenDocsDrawer}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-amber-400" />
            <span>توثيق الـ API</span>
          </button>

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
