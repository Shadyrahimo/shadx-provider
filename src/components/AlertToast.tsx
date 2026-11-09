import React, { useEffect } from 'react';
import {
  Bell,
  X,
  TrendingDown,
  TrendingUp,
  PackageCheck,
  PackageX,
  Zap,
  ArrowRight,
  Eye,
  Sparkles,
  Send,
} from 'lucide-react';
import { AppAlertItem } from '../types';

interface AlertToastProps {
  alert: AppAlertItem | null;
  onDismiss: () => void;
  onViewAlert: (alert: AppAlertItem) => void;
  onOpenAlertsCenter: () => void;
}

export const AlertToast: React.FC<AlertToastProps> = ({
  alert,
  onDismiss,
  onViewAlert,
  onOpenAlertsCenter,
}) => {
  useEffect(() => {
    if (!alert) return;
    const timer = setTimeout(() => {
      onDismiss();
    }, 6000);
    return () => clearTimeout(timer);
  }, [alert, onDismiss]);

  if (!alert) return null;

  const getAlertIcon = () => {
    switch (alert.type) {
      case 'price_drop':
        return <TrendingDown className="w-5 h-5 text-emerald-400" />;
      case 'price_hike':
        return <TrendingUp className="w-5 h-5 text-rose-400" />;
      case 'new_product':
        return <Sparkles className="w-5 h-5 text-sky-400" />;
      case 'availability_back':
        return <PackageCheck className="w-5 h-5 text-emerald-400" />;
      case 'availability_oos':
        return <PackageX className="w-5 h-5 text-rose-400" />;
      case 'threshold_breach':
        return <Zap className="w-5 h-5 text-amber-400" />;
      default:
        return <Bell className="w-5 h-5 text-indigo-400" />;
    }
  };

  const getBorderColor = () => {
    switch (alert.severity) {
      case 'success':
        return 'border-emerald-500/50 bg-slate-900/95 shadow-emerald-500/10';
      case 'danger':
        return 'border-rose-500/50 bg-slate-900/95 shadow-rose-500/10';
      case 'warning':
        return 'border-amber-500/50 bg-slate-900/95 shadow-amber-500/10';
      default:
        return 'border-indigo-500/50 bg-slate-900/95 shadow-indigo-500/10';
    }
  };

  return (
    <div
      dir="rtl"
      className="fixed bottom-5 left-5 z-50 max-w-sm w-full animate-slideIn transition-all"
    >
      <div
        className={`p-3.5 rounded-2xl border backdrop-blur-md shadow-2xl flex flex-col gap-2 ${getBorderColor()}`}
      >
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 shrink-0">
              {getAlertIcon()}
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-bold text-white block">
                  {alert.title}
                </span>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.2 rounded font-mono">
                  #{alert.productId}
                </span>
                {alert.telegramSent && (
                  <span className="text-[10px] bg-sky-500/20 text-sky-300 border border-sky-500/30 px-1.5 py-0.2 rounded flex items-center gap-1">
                    <Send className="w-2.5 h-2.5" />
                    <span>تلجرام</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-300 line-clamp-1">
                {alert.productName}
              </p>
            </div>
          </div>

          <button
            onClick={onDismiss}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-400 bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
          {alert.message}
        </p>

        <div className="flex items-center justify-between pt-1 text-xs">
          <button
            onClick={() => {
              onViewAlert(alert);
              onDismiss();
            }}
            className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>عرض المنتج وحاسبة الربح</span>
          </button>

          <button
            onClick={() => {
              onOpenAlertsCenter();
              onDismiss();
            }}
            className="text-slate-400 hover:text-slate-200 text-[11px] flex items-center gap-1 transition-colors"
          >
            <span>فتح السجل ({alert.timestamp})</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
