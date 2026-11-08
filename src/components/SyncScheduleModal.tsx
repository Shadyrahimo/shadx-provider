import React from 'react';
import {
  X,
  Clock,
  RefreshCw,
  CheckCircle2,
  Play,
  Pause,
  Zap,
  Activity,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';
import { SyncScheduleConfig } from '../types';

interface SyncScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: SyncScheduleConfig;
  onUpdateConfig: (newConfig: Partial<SyncScheduleConfig>) => void;
  onTriggerManualSync: () => void;
  isLiveConnected: boolean;
}

export const SyncScheduleModal: React.FC<SyncScheduleModalProps> = ({
  isOpen,
  onClose,
  config,
  onUpdateConfig,
  onTriggerManualSync,
  isLiveConnected,
}) => {
  if (!isOpen) return null;

  const intervalOptions = [
    { value: 1, label: 'كل 1 دقيقة', badge: 'اختبار سريع' },
    { value: 5, label: 'كل 5 دقائق', badge: 'سريع' },
    { value: 15, label: 'كل 15 دقيقة', badge: 'موصى به' },
    { value: 30, label: 'كل 30 دقيقة', badge: 'معتدل' },
    { value: 60, label: 'كل ساعة', badge: 'اقتصادي' },
  ];

  const formatCountdown = (secs: number) => {
    if (secs <= 0) return 'جاري الفحص الآن...';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
      dir="rtl"
    >
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between gap-3 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                جدولة الفحص الدوري للمزودين
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-mono">
                  setInterval
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                جلب تحديثات الأسعار وحالة التوفر تلقائياً في الخلفية ورصد التغييرات
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 space-y-4 text-xs">
          {/* Main Toggle Switch */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-sm font-semibold text-slate-200 block">
                تفعيل الفحص التلقائي في الخلفية
              </span>
              <span className="text-slate-400 text-[11px] block">
                استدعاء دوري مستمر لمزامنة الكتالوج واكتشاف تغيرات التكلفة والتوفر
              </span>
            </div>

            <button
              type="button"
              onClick={() => onUpdateConfig({ enabled: !config.enabled })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                config.enabled ? 'bg-indigo-600' : 'bg-slate-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  config.enabled ? '-translate-x-6' : '-translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Sync Stats Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {/* Last Sync Indicator */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
              <span className="text-[11px] text-slate-400 block mb-1">
                آخر وقت تم فيه المزامنة:
              </span>
              <div className="text-sm font-bold font-mono-numbers text-slate-200 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="truncate">{config.lastSyncTime || 'لم تتم المزامنة بعد'}</span>
              </div>
            </div>

            {/* Next Sync Countdown */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
              <span className="text-[11px] text-slate-400 block mb-1">
                الفحص القادم بعد:
              </span>
              <div className="text-sm font-bold font-mono-numbers text-indigo-400 flex items-center gap-1.5">
                <Activity className={`w-4 h-4 ${config.enabled ? 'animate-pulse' : 'text-slate-600'}`} />
                <span>{config.enabled ? formatCountdown(config.secondsRemaining) : 'متوقف مؤقتاً'}</span>
              </div>
            </div>

            {/* Completed Sync Runs */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 col-span-2 sm:col-span-1">
              <span className="text-[11px] text-slate-400 block mb-1">
                دورات الفحص المكتملة:
              </span>
              <div className="text-sm font-bold font-mono-numbers text-amber-300">
                {config.syncCount} دورة ناجحة
              </div>
            </div>
          </div>

          {/* Interval Frequency Picker */}
          <div className="space-y-2">
            <label className="font-semibold text-slate-300 flex items-center gap-1.5 text-xs">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              تكرار المزامنة والفحص الدوري:
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {intervalOptions.map((opt) => {
                const isSelected = config.intervalMinutes === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onUpdateConfig({
                        intervalMinutes: opt.value,
                        secondsRemaining: opt.value * 60,
                      });
                    }}
                    className={`p-2.5 rounded-xl border text-right transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-indigo-600/15 border-indigo-500 text-white shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="font-bold text-xs">{opt.label}</span>
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded font-medium ${
                          isSelected
                            ? 'bg-indigo-500 text-white'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {opt.badge}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {opt.value * 60} ثانية
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mode explanation */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 flex items-start gap-2 text-slate-400 text-[11px] leading-relaxed">
            <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-slate-300 font-semibold block mb-0.5">
                آلية العمل في الخلفية:
              </span>
              عند انتهاء المؤقت، يتم فحص المزود وتحديث الأسعار وحالة التوفر تلقائياً. في حال تم اكتشاف أي تغيير في سعر التكلفة أو التوفر، يتم إصدار تنبيه فوري وإضافته إلى سجل التنبيهات.
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-900/90 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-slate-400">
            <span
              className={`w-2 h-2 rounded-full ${
                config.enabled ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'
              }`}
            />
            <span>{config.enabled ? 'الفحص الدوري نشط ويعمل في الخلفية' : 'المزامنة التلقائية معطلة'}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onTriggerManualSync}
              disabled={config.isSyncing}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-semibold transition-all shadow-md shadow-indigo-600/20 flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${config.isSyncing ? 'animate-spin' : ''}`} />
              <span>{config.isSyncing ? 'جاري الفحص والمزامنة...' : 'مزامنة فورية الآن'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
