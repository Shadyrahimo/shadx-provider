import React, { useState } from 'react';
import { X, Sliders, DollarSign, Percent, Check, HelpCircle } from 'lucide-react';
import { MarginConfig } from '../types';
import { calculateSuggestedPrice } from '../utils/normalizer';

interface MarginConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: MarginConfig;
  onSave: (newConfig: MarginConfig) => void;
}

export const MarginConfigModal: React.FC<MarginConfigModalProps> = ({
  isOpen,
  onClose,
  config,
  onSave,
}) => {
  const [mode, setMode] = useState<'percentage' | 'fixed'>(config.mode);
  const [value, setValue] = useState<number>(config.value);
  const [rounding, setRounding] = useState<MarginConfig['rounding']>(config.rounding);

  if (!isOpen) return null;

  const handleApply = () => {
    onSave({
      mode,
      value: Number(value) || 0,
      rounding,
    });
    onClose();
  };

  const previewExamples = [0.88, 4.39, 14.50, 48.90];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              إعداد هامش الربح وسعر البيع المقترح
            </h3>
            <p className="text-xs text-slate-400">
              يتم تطبيق هذا الهامش تلقائياً على كافة أسعار التكلفة في الجدول لتحديد سعر البيع
            </p>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-2">
              نوع حساب هامش الربح:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMode('percentage')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border font-medium transition-all ${
                  mode === 'percentage'
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                <Percent className="w-4 h-4" />
                <span>نسبة مئوية مضافة (%)</span>
              </button>

              <button
                type="button"
                onClick={() => setMode('fixed')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border font-medium transition-all ${
                  mode === 'fixed'
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                <DollarSign className="w-4 h-4" />
                <span>مبلغ إضافي ثابت ($)</span>
              </button>
            </div>
          </div>

          {/* Value Input */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">
              {mode === 'percentage' ? 'نسبة الربح المئوية (%):' : 'المبلغ الثابت المضاف ($):'}
            </label>
            <div className="relative">
              <input
                type="number"
                step={mode === 'percentage' ? '1' : '0.1'}
                min="0"
                value={value}
                onChange={(e) => setValue(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 font-mono-numbers text-sm focus:outline-none focus:border-indigo-500"
              />
              <span className="absolute inset-y-0 left-3 flex items-center text-slate-500 text-xs font-mono">
                {mode === 'percentage' ? '%' : 'USD $'}
              </span>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 mt-2">
              <span className="text-[11px] text-slate-500">خيارات سريعة:</span>
              {mode === 'percentage'
                ? [10, 15, 20, 25, 30].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setValue(p)}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-mono-numbers"
                    >
                      +{p}%
                    </button>
                  ))
                : [0.5, 1.0, 2.0, 5.0].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setValue(d)}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-mono-numbers"
                    >
                      +${d}
                    </button>
                  ))}
            </div>
          </div>

          {/* Rounding Strategy */}
          <div>
            <label className="block text-slate-300 font-semibold mb-2">
              سياسة تقريب الأسعار المعروضة:
            </label>
            <div className="space-y-1.5">
              {[
                { id: 'exact', label: 'دقيق (خانة أو خانتين عشريتين - موصى به)' },
                { id: '99cents', label: 'تسعير نفسي ينتهي بـ .99 سنت (مثال: $4.99)' },
                { id: 'roundHalf', label: 'التقريب لأقرب نصف دولار (.50 أو .00)' },
                { id: 'ceilInteger', label: 'التقريب للأعلى لأقرب دولار صحيح' },
              ].map((opt) => (
                <label
                  key={opt.id}
                  className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                    rounding === opt.id
                      ? 'bg-indigo-950/40 border-indigo-500/50 text-indigo-200'
                      : 'bg-slate-950 border-slate-800/80 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="rounding"
                    checked={rounding === opt.id}
                    onChange={() => setRounding(opt.id as any)}
                    className="text-indigo-600 focus:ring-0"
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Live Preview Box */}
          <div className="bg-slate-950 rounded-xl p-3 border border-slate-800">
            <div className="text-[11px] font-semibold text-slate-400 mb-2">
              معاينة حية لتأثير الهامش:
            </div>
            <div className="grid grid-cols-4 gap-2 text-center">
              {previewExamples.map((cost) => {
                const sell = calculateSuggestedPrice(cost, { mode, value, rounding });
                const profit = sell - cost;
                return (
                  <div key={cost} className="bg-slate-900 p-2 rounded-lg border border-slate-800/80">
                    <div className="text-[10px] text-slate-500">تكلفة: ${cost}</div>
                    <div className="font-bold text-emerald-400 font-mono-numbers text-xs mt-0.5">
                      ${sell.toFixed(2)}
                    </div>
                    <div className="text-[9px] text-indigo-400 font-mono-numbers">
                      ربح +${profit > 0 ? profit.toFixed(2) : 0}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 mt-6 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-medium transition-colors"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors shadow-md shadow-indigo-600/20"
          >
            تطبيق الهامش على الكتالوج
          </button>
        </div>
      </div>
    </div>
  );
};
