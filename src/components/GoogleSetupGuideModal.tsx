import React, { useState } from 'react';
import {
  X,
  Globe,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  HelpCircle,
  ArrowLeft,
  Terminal,
} from 'lucide-react';
import firebaseConfig from '../../firebase-applet-config.json';

interface GoogleSetupGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GoogleSetupGuideModal: React.FC<GoogleSetupGuideModalProps> = ({ isOpen, onClose }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const currentHostname =
    typeof window !== 'undefined' && window.location.hostname
      ? window.location.hostname
      : 'ais-dev-rera3vpxapesxllyh2bef3-33861826635.europe-west1.run.app';

  const firebaseProjectId = firebaseConfig.projectId || 'even-tine-v7cdj';
  const firebaseConsoleAuthSettingsUrl = `https://console.firebase.google.com/project/${firebaseProjectId}/authentication/settings`;

  const handleCopyText = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2500);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2500);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-3 sm:p-4 font-sans"
      dir="rtl"
    >
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl relative z-10 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-white">
                دليل إعداد وتفعيل تسجيل الدخول بـ Google
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                خطوات حل خطأ <code className="text-rose-300 font-mono-numbers">auth/unauthorized-domain</code> في Firebase
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto grow space-y-5 text-xs text-slate-300 leading-relaxed">
          {/* Explanation Banner */}
          <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/30 space-y-2">
            <div className="flex items-center gap-2 text-indigo-300 font-bold">
              <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>لماذا تظهر رسالة الخطأ؟</span>
            </div>
            <p className="text-slate-300 text-xs">
              تطلب خدمة Firebase المصادقة من مالك المشروع السماح الصريح لنطاق موقعك الحالي بالاتصال بنافذة تسجيل الدخول عبر Google. لإصلاح ذلك نهائياً، قم بنسخ نطاقك الحالي وإضافته في لوحة تحكم Firebase.
            </p>
          </div>

          {/* Current Domain Box */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-white">نطاق موقعك الحالي المطلوب إضافته:</span>
              <span className="px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                جاهز للنسخ
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <code
                dir="ltr"
                className="font-mono-numbers text-xs font-bold text-indigo-200 bg-slate-900 px-3 py-2 rounded-lg border border-slate-800 grow select-all break-all text-left"
              >
                {currentHostname}
              </code>
              <button
                type="button"
                onClick={() => handleCopyText(currentHostname, 'current_domain')}
                className={`px-3 py-2 rounded-lg font-bold text-xs flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer ${
                  copiedKey === 'current_domain'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'
                }`}
              >
                {copiedKey === 'current_domain' ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>تم النسخ</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>نسخ النطاق</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Step by Step Guide with Placeholder Illustration */}
          <div className="space-y-3">
            <h3 className="font-extrabold text-white text-sm flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-indigo-400" />
              <span>خطوات الإضافة في وحدة تحكم Firebase (Firebase Console):</span>
            </h3>

            <div className="grid grid-cols-1 gap-3">
              {/* Step 1 */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 font-bold font-mono flex items-center justify-center shrink-0">
                  1
                </div>
                <div className="space-y-1 grow">
                  <div className="font-bold text-white">فتح إعدادات المصادقة في مشروعك</div>
                  <p className="text-slate-400 text-[11px]">
                    انتقل إلى مشروعك في Firebase (معرّف المشروع: <code className="text-emerald-300 font-mono">{firebaseProjectId}</code>)، ثم اختر من القائمة الجانبية <strong className="text-slate-200">Authentication</strong> وانتقل إلى تبويب <strong className="text-slate-200">Settings</strong>.
                  </p>
                  {/* Mock Screenshot Placeholder */}
                  <div className="mt-2 p-2 rounded-lg bg-slate-900 border border-slate-800 text-center text-[10px] text-slate-500 font-mono">
                    [صورة توضيحية: لوحة تحكم Firebase &gt; Authentication &gt; Settings]
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 font-bold font-mono flex items-center justify-center shrink-0">
                  2
                </div>
                <div className="space-y-1 grow">
                  <div className="font-bold text-white">إضافة النطاق المعتمد (Authorized Domains)</div>
                  <p className="text-slate-400 text-[11px]">
                    ابحث عن قسم <strong className="text-slate-200">Authorized domains</strong> ثم اضغط على زر <strong className="text-emerald-300">Add domain</strong>.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 font-bold font-mono flex items-center justify-center shrink-0">
                  3
                </div>
                <div className="space-y-1 grow">
                  <div className="font-bold text-white">لصق النطاق وحفظ التغييرات</div>
                  <p className="text-slate-400 text-[11px]">
                    الصق النطاق الذي نسخته أعلاه (بدون <code className="font-mono text-slate-300">https://</code>) ثم اضغط <strong className="text-white">Add</strong> لتفعيل الدخول الفوري بـ Google.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Direct Link Button */}
          <div className="pt-2">
            <a
              href={firebaseConsoleAuthSettingsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 transition-colors shadow-md shadow-indigo-600/30"
            >
              <ExternalLink className="w-4 h-4" />
              <span>فتح صفحة إعدادات النطاقات المعتمدة في Firebase Console</span>
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/90 flex items-center justify-between gap-3 shrink-0">
          <span className="text-[11px] text-slate-500">
            يمكنك أيضاً استخدام تسجيل الدخول بالبريد الإلكتروني وكلمة المرور في أي وقت.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors cursor-pointer"
          >
            إغلاق الدليل
          </button>
        </div>
      </div>
    </div>
  );
};
