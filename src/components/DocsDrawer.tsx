import React from 'react';
import { X, BookOpen, AlertOctagon, Terminal, Shield, CheckCircle, ExternalLink, Cpu } from 'lucide-react';

interface DocsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DocsDrawer: React.FC<DocsDrawerProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border-r border-slate-800 w-full max-w-xl h-full overflow-y-auto p-6 shadow-2xl space-y-6">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                دليل وثائق الربط البرمجي (API Documentation)
              </h2>
              <p className="text-xs text-slate-400">
                مواصفات Mersal و Tartousi و Alkasr ومزودي البطاقات الرقمية
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Authentication Notice */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs">
            <Shield className="w-4 h-4" />
            <span>المصادقة والتوثيق (Authentication Header)</span>
          </div>
          <p className="text-xs text-slate-400">
            يجب تضمين الترويسة التالية في كافة طلبات الـ HTTP GET/POST:
          </p>
          <pre dir="ltr" className="bg-slate-900 p-2.5 rounded-lg text-xs font-mono text-emerald-400">
            api-token: YOUR_API_TOKEN
          </pre>
        </div>

        {/* Primary Endpoints */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <Terminal className="w-4 h-4 text-indigo-400" />
            <span>نقاط النهاية الأساسية (Endpoints):</span>
          </h3>

          <div className="space-y-2 text-xs">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2 font-mono text-xs">
                <span className="bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded text-[10px] font-bold">
                  GET
                </span>
                <span className="text-white font-semibold">/client/api/profile</span>
              </div>
              <p className="text-slate-400 text-[11px] mt-1">
                استرداد رصيد المحفظة ومعلومات حساب التاجر البريدية.
              </p>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2 font-mono text-xs">
                <span className="bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded text-[10px] font-bold">
                  GET
                </span>
                <span className="text-white font-semibold">/client/api/products</span>
              </div>
              <p className="text-slate-400 text-[11px] mt-1">
                جلب جميع المنتجات المتاحة مع الأسعار والمعلمات وحدود الكمية.
              </p>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2 font-mono text-xs">
                <span className="bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded text-[10px] font-bold">
                  GET
                </span>
                <span className="text-white font-semibold">/client/api/products?base=1</span>
              </div>
              <p className="text-slate-400 text-[11px] mt-1">
                استرجاع قائمة خفيفة تحتوي فقط على معرفات وأسماء المنتجات.
              </p>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2 font-mono text-xs">
                <span className="bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded text-[10px] font-bold">
                  GET
                </span>
                <span className="text-white font-semibold">
                  /client/api/newOrder/[id]/params?...
                </span>
              </div>
              <p className="text-slate-400 text-[11px] mt-1">
                تنفيذ طلب شحن جديد مع تضمين <code className="text-amber-400">order_uuid</code> لمنع تكرار الخصم (Idempotency).
              </p>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2 font-mono text-xs">
                <span className="bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded text-[10px] font-bold">
                  GET
                </span>
                <span className="text-white font-semibold">/client/api/check?orders=[id1,id2]</span>
              </div>
              <p className="text-slate-400 text-[11px] mt-1">
                التحقق من حالة تنفيذ الطلبات (accept = تم القبول والارسال، wait = قيد الانتظار، reject = مرفوض).
              </p>
            </div>
          </div>
        </div>

        {/* Quantity Rules */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
          <h4 className="font-bold text-slate-200">
            قواعد قيم الكمية (Quantity Values Note):
          </h4>
          <ul className="space-y-1.5 text-slate-400 text-[11px] list-disc list-inside">
            <li>
              <code className="text-indigo-300 font-mono">qty_values: null</code> - الكمية في الطلب يجب أن تكون دائماً 1 (باقة محددة).
            </li>
            <li>
              <code className="text-indigo-300 font-mono">qty_values: ["110", "150", "210"]</code> - يسمح فقط بهذه الكميات المحددة حصراً.
            </li>
            <li>
              <code className="text-indigo-300 font-mono">qty_values: &#123; "min": "500", "max": "500000" &#125;</code> - يجب أن تكون الكمية ضمن هذا النطاق.
            </li>
          </ul>
        </div>

        {/* Error Codes Table */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <AlertOctagon className="w-4 h-4 text-rose-400" />
            <span>جدول رموز الأخطاء (Error Codes Guide):</span>
          </h4>

          <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden text-xs">
            <table className="w-full text-right">
              <thead>
                <tr className="bg-slate-900 text-slate-400 font-semibold border-b border-slate-800">
                  <th className="p-2 w-16 text-center font-mono">الرمز</th>
                  <th className="p-2">المعنى / السبب</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-[11px] text-slate-300">
                <tr>
                  <td className="p-2 text-center font-mono text-amber-400">120</td>
                  <td className="p-2">Api Token is required! (رمز API مفقود)</td>
                </tr>
                <tr>
                  <td className="p-2 text-center font-mono text-amber-400">121</td>
                  <td className="p-2">Token error (رمز التوثيق غير صالح أو منتهي)</td>
                </tr>
                <tr>
                  <td className="p-2 text-center font-mono text-amber-400">122</td>
                  <td className="p-2">Not allowed to use API (الحساب غير مصرح له باستخدام الـ API)</td>
                </tr>
                <tr>
                  <td className="p-2 text-center font-mono text-amber-400">123</td>
                  <td className="p-2">IP not allowed (عنوان الـ IP الخاص بك غير مسجل في القائمة البيضاء)</td>
                </tr>
                <tr>
                  <td className="p-2 text-center font-mono text-rose-400">100</td>
                  <td className="p-2">Insufficient balance (رصيد المحفظة غير كافٍ لإتمام العملية)</td>
                </tr>
                <tr>
                  <td className="p-2 text-center font-mono text-rose-400">105</td>
                  <td className="p-2">Quantity not available (الكمية غير متوفرة في المخزون)</td>
                </tr>
                <tr>
                  <td className="p-2 text-center font-mono text-rose-400">107</td>
                  <td className="p-2">Player ID blocked (معرف اللاعب محظور لدى اللعبة أو المزود)</td>
                </tr>
                <tr>
                  <td className="p-2 text-center font-mono text-rose-400">109</td>
                  <td className="p-2">Product deleted or not found (المنتج محذوف أو غير موجود)</td>
                </tr>
                <tr>
                  <td className="p-2 text-center font-mono text-rose-400">110</td>
                  <td className="p-2">Product not available now (المنتج متوقف مؤقتاً)</td>
                </tr>
                <tr>
                  <td className="p-2 text-center font-mono text-rose-400">111</td>
                  <td className="p-2">Try again after 1 minute (تجاوز معدل الطلبات - انتظر دقيقة)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Architecture Note */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-1.5">
          <div className="font-semibold text-slate-200 flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-indigo-400" />
            <span>بيئة التشغيل المعتمدة (Deployment Architecture)</span>
          </div>
          <p className="text-[11px]">
            المشروع مهيأ بالكامل للعمل على: <strong className="text-white">GitHub + Vercel / Render + Neon Console</strong>.
            يستخدم خادم Node.js / Express كبروكسي آمن يتجاوز مشاكل قيود CORS للمتصفحات.
          </p>
        </div>
      </div>
    </div>
  );
};
