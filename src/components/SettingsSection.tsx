import React, { useState } from 'react';
import {
  Sliders,
  PlugZap,
  BellRing,
  DollarSign,
  Moon,
  Sun,
  Monitor,
  RefreshCw,
  Code2,
  ShieldCheck,
  Check,
  Save,
  Send,
  Loader2,
  Volume2,
  Mail,
  Globe,
  Layers,
  Zap,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import {
  ProviderPreset,
  MarginConfig,
  PriceThresholdConfig,
  AlertRuleConfig,
  SyncScheduleConfig,
  ThemeMode,
} from '../types';
import { PROVIDER_PRESETS } from '../data/mockCatalog';
import { buildBackendUrl } from '../utils/normalizer';

interface SettingsSectionProps {
  baseUrl: string;
  setBaseUrl: (val: string) => void;
  apiToken: string;
  setApiToken: (val: string) => void;
  selectedPreset: ProviderPreset;
  onSelectPreset: (preset: ProviderPreset) => void;
  syncConfig: SyncScheduleConfig;
  onUpdateSyncConfig: (config: SyncScheduleConfig) => void;
  ruleConfig: AlertRuleConfig;
  onUpdateRuleConfig: (config: AlertRuleConfig) => void;
  marginConfig: MarginConfig;
  onUpdateMarginConfig: (config: MarginConfig) => void;
  thresholdConfig: PriceThresholdConfig;
  onUpdateThresholdConfig: (config: PriceThresholdConfig) => void;
  themeMode: ThemeMode;
  resolvedTheme: 'dark' | 'light';
  onChangeThemeMode: (mode: ThemeMode) => void;
  isDeveloperMode: boolean;
  onToggleDeveloperMode: (val: boolean) => void;
  showMobileBottomBar: boolean;
  onToggleMobileBottomBar: (val: boolean) => void;
  onTriggerSyncNow: () => void;
  onNotify: (text: string, type: 'success' | 'error' | 'info') => void;
}

export const SettingsSection: React.FC<SettingsSectionProps> = ({
  baseUrl,
  setBaseUrl,
  apiToken,
  setApiToken,
  selectedPreset,
  onSelectPreset,
  syncConfig,
  onUpdateSyncConfig,
  ruleConfig,
  onUpdateRuleConfig,
  marginConfig,
  onUpdateMarginConfig,
  thresholdConfig,
  onUpdateThresholdConfig,
  themeMode,
  resolvedTheme,
  onChangeThemeMode,
  isDeveloperMode,
  onToggleDeveloperMode,
  showMobileBottomBar,
  onToggleMobileBottomBar,
  onTriggerSyncNow,
  onNotify,
}) => {
  const [activeTab, setActiveTab] = useState<'sync' | 'alerts' | 'pricing' | 'system'>('sync');

  // Test Telegram State
  const [isSendingTestTelegram, setIsSendingTestTelegram] = useState(false);
  const [testTelegramStatus, setTestTelegramStatus] = useState<string | null>(null);
  const [showTelegramToken, setShowTelegramToken] = useState(false);

  // Test Email State
  const [isSendingTestEmail, setIsSendingTestEmail] = useState(false);
  const [testEmailStatus, setTestEmailStatus] = useState<string | null>(null);

  const handleSendTestTelegram = async () => {
    if (!ruleConfig.telegramBotToken?.trim() || !ruleConfig.telegramChatId?.trim()) {
      setTestTelegramStatus('⚠️ يرجى إدخال رمز البوت (Bot Token) ومعرف المحادثة (Chat ID) أولاً.');
      return;
    }
    setIsSendingTestTelegram(true);
    setTestTelegramStatus(null);
    try {
      const res = await fetch(buildBackendUrl('/api/notifications/send-telegram'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botToken: ruleConfig.telegramBotToken,
          chatId: ruleConfig.telegramChatId,
          format: ruleConfig.telegramFormat || 'detailed',
          includeButtons: ruleConfig.telegramInteractiveButtons ?? true,
          appUrl: typeof window !== 'undefined' ? window.location.origin : '',
          title: 'اختبار إعدادات المنصة - ShadX-Provider',
          productName: 'اختبار ربط التنبيهات الموحدة',
          productId: 'SETTINGS-TEST',
          category: 'الإعدادات الموحدة',
          oldValue: '$10.000',
          newValue: '$8.500',
          changePercent: -15,
          message: 'تم اختبار ربط إعدادات التليجرام الموحدة بنجاح!',
          eventType: 'price_drop',
          isTest: true,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTestTelegramStatus(`✅ ${data.message}`);
      } else {
        setTestTelegramStatus(`❌ ${data.error || 'فشل الإرسال'}`);
      }
    } catch (e: any) {
      setTestTelegramStatus(`❌ خطأ في الاتصال: ${e.message}`);
    } finally {
      setIsSendingTestTelegram(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!ruleConfig.recipientEmail || !ruleConfig.recipientEmail.includes('@')) {
      setTestEmailStatus('⚠️ يرجى إدخال عنوان بريد إلكتروني صالح.');
      return;
    }
    setIsSendingTestEmail(true);
    setTestEmailStatus(null);
    try {
      const res = await fetch(buildBackendUrl('/api/notifications/send-email'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientEmail: ruleConfig.recipientEmail,
          subject: 'اختبار إعدادات البريد - ShadX-Provider',
          productName: 'فحص جاهزية التنبيهات البريدية الموحدة',
          productId: 'SETTINGS-TEST',
          oldCost: '-',
          newCost: '-',
          changePercent: 0,
          profitTier: 'عالية الربحية (≥20%)',
          marginPercent: 20,
          isTest: true,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTestEmailStatus(`✅ ${data.message}`);
      } else {
        setTestEmailStatus(`❌ ${data.error || 'فشل الإرسال'}`);
      }
    } catch (e: any) {
      setTestEmailStatus(`❌ خطأ في الإرسال: ${e.message}`);
    } finally {
      setIsSendingTestEmail(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12" dir="rtl">
      {/* Header Banner */}
      <div className="bg-gradient-to-l from-indigo-950/60 via-slate-900 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <Sliders className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white mb-1">إعدادات المنصة الموحدة</h2>
              <p className="text-xs text-slate-400">
                إدارة كافة تفضيلات المزود، قواعد التنبيهات الفورية (تليجرام وبريد)، هوامش الأرباح، وتفضيلات النظام في مكان واحد.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNotify('تم حفظ وتحديث جميع الإعدادات بنجاح.', 'success')}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm shrink-0 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>حفظ كافة التغييرات</span>
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 mt-6 overflow-x-auto pb-1 scrollbar-none text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('sync')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all shrink-0 ${
              activeTab === 'sync'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <PlugZap className="w-4 h-4" />
            <span>المزود والربط والمزامنة</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('alerts')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all shrink-0 ${
              activeTab === 'alerts'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <BellRing className="w-4 h-4" />
            <span>التنبيهات وتليجرام والبريد</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pricing')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all shrink-0 ${
              activeTab === 'pricing'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>هوامش الأرباح والتسعير</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('system')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all shrink-0 ${
              activeTab === 'system'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span>تفضيلات النظام والمظهر</span>
          </button>
        </div>
      </div>

      {/* TAB 1: SYNC & PROVIDER SETTINGS */}
      {activeTab === 'sync' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                  <PlugZap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">إعدادات ربط المزود والحساب الفعلي</h3>
                  <p className="text-xs text-slate-400">إدخال عنوان الـ Base URL ورمز الـ API Token الخاص بحسابك</p>
                </div>
              </div>
              <span className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 font-mono">
                {selectedPreset.name}
              </span>
            </div>

            {/* Presets */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-300">اختر منصة المزود:</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {PROVIDER_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onSelectPreset(preset)}
                    className={`p-3 rounded-xl border text-right transition-all flex flex-col gap-1 ${
                      selectedPreset.name === preset.name
                        ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-xs'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <span className="font-bold text-xs">{preset.name}</span>
                    <span className="text-[10px] text-slate-400 truncate">{preset.baseUrl}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  رابط الـ API الأساسي (Base URL):
                </label>
                <input
                  type="text"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="https://api.provider.com/v1"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  رمز التوثيق الحقيقي (API Token / Key):
                </label>
                <input
                  type="password"
                  value={apiToken}
                  onChange={(e) => setApiToken(e.target.value)}
                  placeholder="أدخل رمز الـ API الخاص بك هنا"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                  dir="ltr"
                />
              </div>
            </div>
          </div>

          {/* Background Sync Schedule Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
                  <RefreshCw className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">جدولة المزامنة التلقائية والتحقق الدوري</h3>
                  <p className="text-xs text-slate-400">ضبط فترات الفحص التلقائي لأسعار التكلفة وتغيرات التوفر</p>
                </div>
              </div>

              <button
                type="button"
                onClick={onTriggerSyncNow}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>مزامنة فورية الآن</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <label className="flex items-center justify-between cursor-pointer p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div>
                  <span className="text-slate-200 font-medium block text-xs">تفعيل الفحص التلقائي في الخلفية</span>
                  <span className="text-[10px] text-slate-400">فحص الأسعار وتوليد التنبيهات تلقائياً</span>
                </div>
                <input
                  type="checkbox"
                  checked={syncConfig.enabled}
                  onChange={(e) =>
                    onUpdateSyncConfig({
                      ...syncConfig,
                      enabled: e.target.checked,
                    })
                  }
                  className="w-4 h-4 rounded accent-indigo-500 cursor-pointer"
                />
              </label>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">فترة الفحص الدوري:</label>
                <select
                  value={syncConfig.intervalMinutes}
                  onChange={(e) =>
                    onUpdateSyncConfig({
                      ...syncConfig,
                      intervalMinutes: Number(e.target.value),
                      secondsRemaining: Number(e.target.value) * 60,
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-medium"
                >
                  <option value={1}>كل دقيقة (للاختبار)</option>
                  <option value={5}>كل 5 دقائق</option>
                  <option value={15}>كل 15 دقيقة (موصى به)</option>
                  <option value={30}>كل 30 دقيقة</option>
                  <option value={60}>كل ساعة</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ALERTS, TELEGRAM & EMAIL SETTINGS */}
      {activeTab === 'alerts' && (
        <div className="space-y-4">
          {/* Telegram Bot Config */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center">
                  <BellRing className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">إعدادات بوت تلجرام للإشعارات الفورية</h3>
                  <p className="text-xs text-slate-400">تلقي تنبيهات هبوط التكلفة وتوفر المنتجات مباشرة عبر بوت تلجرام مع أزرار تفاعلية</p>
                </div>
              </div>

              <input
                type="checkbox"
                checked={Boolean(ruleConfig.telegramNotificationsEnabled)}
                onChange={(e) =>
                  onUpdateRuleConfig({
                    ...ruleConfig,
                    telegramNotificationsEnabled: e.target.checked,
                  })
                }
                className="w-4 h-4 rounded accent-sky-500 cursor-pointer"
              />
            </div>

            {ruleConfig.telegramNotificationsEnabled && (
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      رمز البوت (Bot Token من @BotFather):
                    </label>
                    <div className="relative">
                      <input
                        type={showTelegramToken ? 'text' : 'password'}
                        value={ruleConfig.telegramBotToken || ''}
                        onChange={(e) =>
                          onUpdateRuleConfig({
                            ...ruleConfig,
                            telegramBotToken: e.target.value,
                          })
                        }
                        placeholder="123456789:ABCdefGHIjklMNOpqrSTUvwxYZ"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-12 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
                        dir="ltr"
                      />
                      <button
                        type="button"
                        onClick={() => setShowTelegramToken(!showTelegramToken)}
                        className="absolute inset-y-0 left-0 pl-3 pr-2 flex items-center text-xs text-sky-400 hover:text-sky-300 font-medium"
                      >
                        {showTelegramToken ? 'إخفاء' : 'عرض'}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      معرف المحادثة أو القناة (Chat ID):
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={ruleConfig.telegramChatId || ''}
                        onChange={(e) =>
                          onUpdateRuleConfig({
                            ...ruleConfig,
                            telegramChatId: e.target.value,
                          })
                        }
                        placeholder="مثال: 987654321 أو -100123456789"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
                        dir="ltr"
                      />
                      <button
                        type="button"
                        onClick={handleSendTestTelegram}
                        disabled={isSendingTestTelegram}
                        className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold text-xs whitespace-nowrap transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
                      >
                        {isSendingTestTelegram ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                        <span>تجربة تلجرام</span>
                      </button>
                    </div>
                  </div>
                </div>

                {testTelegramStatus && (
                  <div
                    className={`text-xs p-2.5 rounded-xl border font-medium ${
                      testTelegramStatus.startsWith('✅')
                        ? 'bg-emerald-950/60 border-emerald-500/30 text-emerald-300'
                        : 'bg-rose-950/60 border-rose-500/30 text-rose-300'
                    }`}
                  >
                    {testTelegramStatus}
                  </div>
                )}

                {/* Format & Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-slate-300">تنسيق محتوى الإشعار:</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateRuleConfig({
                            ...ruleConfig,
                            telegramFormat: 'detailed',
                          })
                        }
                        className={`p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                          (ruleConfig.telegramFormat || 'detailed') === 'detailed'
                            ? 'bg-sky-600/30 border-sky-500 text-sky-300 shadow-xs'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        📋 تفصيلي (كامل)
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateRuleConfig({
                            ...ruleConfig,
                            telegramFormat: 'brief',
                          })
                        }
                        className={`p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                          ruleConfig.telegramFormat === 'brief'
                            ? 'bg-sky-600/30 border-sky-500 text-sky-300 shadow-xs'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        ⚡ مختصر (سريع)
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <div>
                      <span className="text-slate-200 font-medium block text-xs">أزرار تفاعلية (Inline Keyboard)</span>
                      <span className="text-[10px] text-slate-400">زر "عرض المنتج في المنصة" أسفل الرسالة</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={ruleConfig.telegramInteractiveButtons ?? true}
                      onChange={(e) =>
                        onUpdateRuleConfig({
                          ...ruleConfig,
                          telegramInteractiveButtons: e.target.checked,
                        })
                      }
                      className="w-4 h-4 rounded accent-sky-500 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Email Notifications Config */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">إشعارات البريد الإلكتروني للمنتجات عالية الربحية</h3>
                  <p className="text-xs text-slate-400">إرسال تقارير فورية للبريد عند انخفاض تكلفة المنتجات المميزة</p>
                </div>
              </div>

              <input
                type="checkbox"
                checked={Boolean(ruleConfig.emailNotificationsEnabled)}
                onChange={(e) =>
                  onUpdateRuleConfig({
                    ...ruleConfig,
                    emailNotificationsEnabled: e.target.checked,
                  })
                }
                className="w-4 h-4 rounded accent-purple-500 cursor-pointer"
              />
            </div>

            {ruleConfig.emailNotificationsEnabled && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2">
                  <input
                    type="email"
                    value={ruleConfig.recipientEmail || ''}
                    onChange={(e) =>
                      onUpdateRuleConfig({
                        ...ruleConfig,
                        recipientEmail: e.target.value,
                      })
                    }
                    placeholder="merchant@example.com"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500 font-mono"
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={handleSendTestEmail}
                    disabled={isSendingTestEmail}
                    className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 text-white font-bold text-xs whitespace-nowrap transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    {isSendingTestEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    <span>تجربة البريد</span>
                  </button>
                </div>

                {testEmailStatus && (
                  <div
                    className={`text-xs p-2.5 rounded-xl border font-medium ${
                      testEmailStatus.startsWith('✅')
                        ? 'bg-emerald-950/60 border-emerald-500/30 text-emerald-300'
                        : 'bg-rose-950/60 border-rose-500/30 text-rose-300'
                    }`}
                  >
                    {testEmailStatus}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: PRICING & MARGINS */}
      {activeTab === 'pricing' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">إعدادات هوامش الأرباح الافتراضية</h3>
                <p className="text-xs text-slate-400">تحديد نسبة أو مبلغ الربح المضاف فوق تكلفة المزود تلقائياً</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">طريقة حساب الهامش:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateMarginConfig({
                        ...marginConfig,
                        mode: 'percentage',
                      })
                    }
                    className={`p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                      marginConfig.mode === 'percentage'
                        ? 'bg-indigo-600 text-white border-indigo-500'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    نسبة مئوية (%)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateMarginConfig({
                        ...marginConfig,
                        mode: 'fixed',
                      })
                    }
                    className={`p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                      marginConfig.mode === 'fixed'
                        ? 'bg-indigo-600 text-white border-indigo-500'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    مبلغ ثابت ($)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  قيمة الهامش ({marginConfig.mode === 'percentage' ? '%' : '$'}):
                </label>
                <input
                  type="number"
                  step={marginConfig.mode === 'percentage' ? '1' : '0.1'}
                  value={marginConfig.value}
                  onChange={(e) =>
                    onUpdateMarginConfig({
                      ...marginConfig,
                      value: Number(e.target.value) || 0,
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono-numbers focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SYSTEM PREFERENCES & THEME */}
      {activeTab === 'system' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
                <Monitor className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">تفضيلات المظهر ونظام التشغيل</h3>
                <p className="text-xs text-slate-400">التبديل بين الوضع الداكن، الفاتح، أو مطابقة إعدادات النظام</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => onChangeThemeMode('dark')}
                className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                  themeMode === 'dark'
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-xs'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Moon className="w-4 h-4" />
                <span>الوضع الداكن (Dark)</span>
              </button>

              <button
                type="button"
                onClick={() => onChangeThemeMode('light')}
                className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                  themeMode === 'light'
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-xs'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sun className="w-4 h-4" />
                <span>الوضع الفاتح (Light)</span>
              </button>

              <button
                type="button"
                onClick={() => onChangeThemeMode('system')}
                className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                  themeMode === 'system'
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-xs'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Monitor className="w-4 h-4" />
                <span>حسب النظام (Auto)</span>
              </button>
            </div>
          </div>

          {/* Developer Mode Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center">
                <Code2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">وضع المطور (Developer Mode)</h3>
                <p className="text-xs text-slate-400">إظهار زر الفحص الخام (&lt;/&gt; Raw) للمنتجات في جدول الكتالوج</p>
              </div>
            </div>

            <input
              type="checkbox"
              checked={isDeveloperMode}
              onChange={(e) => onToggleDeveloperMode(e.target.checked)}
              className="w-4 h-4 rounded accent-purple-500 cursor-pointer"
            />
          </div>

          {/* Mobile Bottom Bar / Speed Bar Visibility Control Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
                <Sliders className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">إظهار / إخفاء شريط التنقل السريع السفلي (Mobile Speed Bar)</h3>
                <p className="text-xs text-slate-400">التحكم في ظهور أو إخفاء شريط التنقل السفلي الثابت على الهواتف والأجهزة اللوحية</p>
              </div>
            </div>

            <input
              type="checkbox"
              checked={showMobileBottomBar}
              onChange={(e) => onToggleMobileBottomBar(e.target.checked)}
              className="w-4 h-4 rounded accent-indigo-500 cursor-pointer"
            />
          </div>
        </div>
      )}
    </div>
  );
};
