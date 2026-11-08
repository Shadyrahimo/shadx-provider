import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  ExternalLink,
  Terminal,
  Server,
  Database,
  Globe,
  GitBranch,
  ShieldCheck,
  CheckCircle2,
  Layers,
  ArrowRight,
  Code2,
  FileCode,
  Zap,
} from 'lucide-react';
import {
  IconBrandGithub,
  IconBrandVercel,
  IconDatabase,
  IconServer2,
  IconCloudNetwork,
  IconArrowRight,
  IconCheck,
  IconCopy,
  IconFileText,
  IconTerminal2,
} from '@tabler/icons-react';

interface DeploymentGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeploymentGuideModal: React.FC<DeploymentGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const [activeStep, setActiveStep] = useState<'neon' | 'github' | 'render' | 'vercel' | 'arch'>('arch');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full p-6 shadow-2xl relative my-8 text-slate-200">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-start gap-3.5 mb-6 pb-4 border-b border-slate-800">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 shrink-0">
            <IconCloudNetwork className="w-6 h-6 text-white" stroke={2.2} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-tight">
                دليل النشر والتشغيل الشامل: ShadX-Provider
              </h2>
              <span className="text-[10px] font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-mono">
                Production Stack
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              شرح كامل وتفصيلي من البداية لربط وتشغيل المشروع على: <span className="text-slate-200 font-semibold">GitHub + Neon Console + Render + Vercel</span>
            </p>
          </div>
        </div>

        {/* Navigation Step Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 mb-6 text-xs">
          {[
            { id: 'arch', label: '1. المخطط الهندسي للمشروع', icon: IconCloudNetwork },
            { id: 'neon', label: '2. قاعدة البيانات (Neon Console)', icon: IconDatabase },
            { id: 'github', label: '3. مستودع الكود (GitHub)', icon: IconBrandGithub },
            { id: 'render', label: '4. خادم الـ API (Render)', icon: IconServer2 },
            { id: 'vercel', label: '5. واجهة المستخدم (Vercel)', icon: IconBrandVercel },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeStep === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveStep(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: Architecture Overview */}
        {activeStep === 'arch' && (
          <div className="space-y-4">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <h3 className="text-sm font-bold text-indigo-400 mb-2 flex items-center gap-2">
                <Layers className="w-4 h-4" />
                كيف تعمل بيئة التشغيل الرباعية في تناغم تام؟
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                مشروع <strong className="text-white">ShadX-Provider</strong> مصمم كمنظومة سحابية متكاملة تفصل بين واجهة المستخدم فائقة السرعة والخادم الآمن وقاعدة البيانات المدارة:
              </p>

              {/* Visual Flow diagram */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 my-4">
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-700/60 text-center">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 mx-auto flex items-center justify-center mb-1.5 font-bold">
                    <IconBrandGithub className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold text-white">GitHub (المستودع)</h4>
                  <p className="text-[11px] text-slate-400 mt-1">
                    يحفظ الكود المصدري ويدير الـ CI/CD للتحديثات التلقائية
                  </p>
                </div>

                <div className="bg-slate-900 p-3 rounded-xl border border-slate-700/60 text-center">
                  <div className="w-8 h-8 rounded-lg bg-sky-500/15 text-sky-400 mx-auto flex items-center justify-center mb-1.5 font-bold">
                    <IconDatabase className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold text-white">Neon Console</h4>
                  <p className="text-[11px] text-slate-400 mt-1">
                    قاعدة بيانات PostgreSQL سحابية بدون خوادم لحفظ الكتالوج والسجلات
                  </p>
                </div>

                <div className="bg-slate-900 p-3 rounded-xl border border-slate-700/60 text-center">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/15 text-purple-400 mx-auto flex items-center justify-center mb-1.5 font-bold">
                    <IconServer2 className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold text-white">Render (الخادم)</h4>
                  <p className="text-[11px] text-slate-400 mt-1">
                    خادم Node.js / Express كبروكسي آمن ومجدول الفحص الدوري
                  </p>
                </div>

                <div className="bg-slate-900 p-3 rounded-xl border border-slate-700/60 text-center">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/15 text-indigo-400 mx-auto flex items-center justify-center mb-1.5 font-bold">
                    <IconBrandVercel className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold text-white">Vercel (الواجهة)</h4>
                  <p className="text-[11px] text-slate-400 mt-1">
                    استضافة SPA سريعة عالمياً عبر شبكة Edge CDN فائقة السرعة
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs space-y-2">
              <h4 className="font-bold text-slate-200">الترتيب الصحيح للتنفيذ:</h4>
              <ol className="list-decimal list-inside space-y-1 text-slate-400 pr-2">
                <li><strong className="text-white">أولاً:</strong> إنشاء قاعدة بيانات Neon للحصول على رابط الاتصال <code className="text-indigo-300 font-mono">DATABASE_URL</code>.</li>
                <li><strong className="text-white">ثانياً:</strong> رفع المشروع على GitHub وتجهيز المستودع.</li>
                <li><strong className="text-white">ثالثاً:</strong> نشر خادم الـ Backend على Render وتزويده بمتغيرات البيئة ورابط الـ Database.</li>
                <li><strong className="text-white">رابعاً:</strong> نشر واجهة الـ Frontend على Vercel وربطها برابط الـ Backend المستضاف على Render.</li>
              </ol>
            </div>
          </div>
        )}

        {/* Tab 2: Neon Console */}
        {activeStep === 'neon' && (
          <div className="space-y-4 text-xs">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <IconDatabase className="w-5 h-5 text-sky-400" />
                  الخطوة الأولى: إعداد قاعدة البيانات على Neon Console (PostgreSQL)
                </h3>
                <a
                  href="https://console.neon.tech"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 font-semibold"
                >
                  <span>فتح Neon Console</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <div className="space-y-2 text-slate-300">
                <p>1. سجّل الدخول إلى <strong>neon.tech</strong> واضغط على زر <strong>"Create Project"</strong>.</p>
                <p>2. اختر اسم المشروع (مثلاً: <code className="text-sky-300 font-mono">shadx-provider-db</code>) وحدد أقرب منطقة جغرافية (مثل: <code className="text-sky-300 font-mono">Frankfurt / eu-central-1</code> لتوفير أقل زمن استجابة للشرق الأوسط).</p>
                <p>3. بعد الإنشاء مباشرة، ستظهر لك لوحة <strong>Connection Details</strong>.</p>
                <p>4. قم بنسخ رابط الاتصال المجمع (Pooled Connection String) بصيغة <strong>Postgres URI</strong>.</p>
              </div>

              {/* Sample Neon Connection String */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] text-slate-400 font-semibold block">نموذج رابط الاتصال (Connection String):</span>
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 flex items-center justify-between font-mono text-[11px] text-sky-300">
                  <span className="truncate">
                    postgresql://shadx_owner:AbCdEfG123@ep-sample-pooler.eu-central-1.aws.neon.tech/shadx_db?sslmode=require
                  </span>
                  <button
                    onClick={() =>
                      handleCopy(
                        'neon_url',
                        'postgresql://user:password@ep-sample-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require'
                      )
                    }
                    className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white shrink-0 mr-2"
                    title="نسخ الصيغة"
                  >
                    {copiedKey === 'neon_url' ? <IconCheck className="w-4 h-4 text-emerald-400" /> : <IconCopy className="w-4 h-4" />}
                  </button>
                </div>
                <span className="text-[10px] text-slate-500 block">
                  * ملاحظة: تأكد من تفعيل خيار <code className="text-amber-400 font-mono">Connection Pooling</code> في Neon لضمان تحمل مئات الاتصالات المتزامنة.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: GitHub */}
        {activeStep === 'github' && (
          <div className="space-y-4 text-xs">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <IconBrandGithub className="w-5 h-5 text-emerald-400" />
                  الخطوة الثانية: تجهيز الكود ورفعه على GitHub
                </h3>
                <a
                  href="https://github.com/new"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold"
                >
                  <span>إنشاء مستودع جديد على GitHub</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <p className="text-slate-300">
                قم بتشغيل الأوامر التالية في مجلد المشروع لتهيئة مستودع Git ورفعه إلى حسابك:
              </p>

              {/* Terminal Code Block */}
              <div className="relative">
                <pre dir="ltr" className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs font-mono text-emerald-300 overflow-x-auto whitespace-pre">
{`# 1. تهيئة المستودع المحلي
git init
git add .
git commit -m "feat: initial commit of ShadX-Provider app"

# 2. تغيير اسم الفرع الرئيسي إلى main
git branch -M main

# 3. ربط المستودع المحلي بمستودع GitHub (استبدل USERNAME باسم حسابك)
git remote add origin https://github.com/USERNAME/shadx-provider.git

# 4. رفع الكود
git push -u origin main`}
                </pre>
                <button
                  onClick={() =>
                    handleCopy(
                      'git_commands',
                      'git init\ngit add .\ngit commit -m "feat: initial commit of ShadX-Provider app"\ngit branch -M main\ngit remote add origin https://github.com/USERNAME/shadx-provider.git\ngit push -u origin main'
                    )
                  }
                  className="absolute top-2.5 left-2.5 p-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white"
                  title="نسخ الأوامر"
                >
                  {copiedKey === 'git_commands' ? <IconCheck className="w-4 h-4 text-emerald-400" /> : <IconCopy className="w-4 h-4" />}
                </button>
              </div>

              <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 text-slate-400 text-[11px]">
                <strong>تأكد من وجود ملف <code className="text-amber-300">.gitignore</code> يتضمن:</strong>
                <code className="block mt-1 font-mono text-slate-300">node_modules / dist / .env</code>
                حتى لا يتم رفع أسرار التوكنات أو مفاتيح الـ API إلى المستودع العام.
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Render */}
        {activeStep === 'render' && (
          <div className="space-y-4 text-xs">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <IconServer2 className="w-5 h-5 text-purple-400" />
                  الخطوة الثالثة: نشر خادم الـ API والبروكسي على Render
                </h3>
                <a
                  href="https://dashboard.render.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 font-semibold"
                >
                  <span>لوحة تحكم Render</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <p className="text-slate-300">
                يعمل خادم <strong>server.ts</strong> كبروكسي آمن لحل مشكلة الـ CORS ومزامنة أسعار المزودين في الخلفية.
              </p>

              {/* Render Setup Steps */}
              <div className="space-y-2 text-slate-300">
                <div>
                  <span className="font-bold text-white">1. إنشاء خدمة جديدة:</span>
                  <p className="text-slate-400">في لوحة Render اضغط <strong>New +</strong> ثم اختر <strong>Web Service</strong> واربط مستودع GitHub.</p>
                </div>
                <div>
                  <span className="font-bold text-white">2. ضبط إعدادات التشغيل:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1 font-mono text-[11px]">
                    <div className="bg-slate-900 p-2 rounded border border-slate-800">
                      <span className="text-slate-500 block">Runtime:</span>
                      <span className="text-purple-300 font-bold">Node</span>
                    </div>
                    <div className="bg-slate-900 p-2 rounded border border-slate-800">
                      <span className="text-slate-500 block">Build Command:</span>
                      <span className="text-purple-300 font-bold">npm install</span>
                    </div>
                    <div className="bg-slate-900 p-2 rounded border border-slate-800 sm:col-span-2">
                      <span className="text-slate-500 block">Start Command:</span>
                      <span className="text-purple-300 font-bold">npm start</span>
                    </div>
                  </div>
                </div>

                <div>
                  <span className="font-bold text-white">3. متغيرات البيئة (Environment Variables):</span>
                  <p className="text-slate-400 mb-1.5">في تبويب <strong>Environment</strong> أضف المتغيرات التالية:</p>
                  <div className="space-y-1 font-mono text-[11px]">
                    <div className="bg-slate-900 p-2 rounded border border-slate-800 flex justify-between">
                      <span className="text-slate-400">PORT:</span>
                      <span className="text-emerald-400 font-bold">3000</span>
                    </div>
                    <div className="bg-slate-900 p-2 rounded border border-slate-800 flex justify-between">
                      <span className="text-slate-400">NODE_ENV:</span>
                      <span className="text-emerald-400 font-bold">production</span>
                    </div>
                    <div className="bg-slate-900 p-2 rounded border border-slate-800 flex justify-between">
                      <span className="text-slate-400">DATABASE_URL:</span>
                      <span className="text-sky-300 font-bold truncate max-w-xs">رابط Neon Postgres URI</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-emerald-950/40 p-3 rounded-lg border border-emerald-500/30 text-emerald-300 text-[11px]">
                ✓ بمجرد اكتمال النشر، ستحصل على رابط خادم مباشر مثل:
                <code className="block mt-1 font-bold text-white font-mono">https://shadx-provider-backend.onrender.com</code>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Vercel */}
        {activeStep === 'vercel' && (
          <div className="space-y-4 text-xs">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <IconBrandVercel className="w-5 h-5 text-indigo-400" />
                  الخطوة الرابعة: نشر الواجهة التفاعلية على Vercel
                </h3>
                <a
                  href="https://vercel.com/new"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
                >
                  <span>استيراد إلى Vercel</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <p className="text-slate-300">
                توفر Vercel أسرع شبكة توزيع محتوى CDN عالمية مع دعم كامل لتطبيقات React + Vite.
              </p>

              {/* Vercel Steps */}
              <div className="space-y-2 text-slate-300">
                <p>1. في لوحة تحكم <strong>Vercel</strong> اضغط على <strong>"Add New Project"</strong> واختر مستودع GitHub الخاص بـ <strong className="text-white">shadx-provider</strong>.</p>
                <p>2. ستتعرف Vercel تلقائياً على إطار العمل <strong>Vite</strong>.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1 font-mono text-[11px]">
                  <div className="bg-slate-900 p-2 rounded border border-slate-800">
                    <span className="text-slate-500 block">Framework Preset:</span>
                    <span className="text-indigo-300 font-bold">Vite</span>
                  </div>
                  <div className="bg-slate-900 p-2 rounded border border-slate-800">
                    <span className="text-slate-500 block">Build Command:</span>
                    <span className="text-indigo-300 font-bold">npm run build</span>
                  </div>
                  <div className="bg-slate-900 p-2 rounded border border-slate-800 sm:col-span-2">
                    <span className="text-slate-500 block">Output Directory:</span>
                    <span className="text-indigo-300 font-bold">dist</span>
                  </div>
                </div>

                <div className="pt-1">
                  <span className="font-bold text-white block mb-1">3. إضافة متغيرات بيئة Vercel:</span>
                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 font-mono text-[11px] flex items-center justify-between">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Key:</span>
                      <span className="text-indigo-300 font-bold">VITE_API_URL</span>
                    </div>
                    <div className="text-left">
                      <span className="text-slate-400 block text-[10px]">Value:</span>
                      <span className="text-emerald-400 font-bold">https://shadx-provider-backend.onrender.com</span>
                    </div>
                  </div>
                </div>

                <div className="pt-1">
                  <span className="font-bold text-white block mb-1">4. ملف إعادة التوجيه لـ SPA (ملف vercel.json):</span>
                  <p className="text-[11px] text-slate-400 mb-1.5">لضمان عدم ظهور خطأ 404 عند تحديث الصفحة أو الانتقال بين المسارات، تم تجهيز هذا الملف:</p>
                  <pre dir="ltr" className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-[11px] font-mono text-cyan-300">
{`{
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ]
}`}
                  </pre>
                </div>
              </div>

              <div className="bg-indigo-950/40 p-3 rounded-lg border border-indigo-500/30 text-indigo-300 text-[11px]">
                🚀 فور الضغط على <strong>"Deploy"</strong> ستنتهي العملية خلال 40 ثانية ويكون موقعك متاحاً برابط مجاني مثل:
                <code className="block mt-1 font-bold text-white font-mono">https://shadx-provider.vercel.app</code>
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>بيئة التشغيل جاهزة بالكامل للتصدير والنشر الفوري.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors"
          >
            إغلاق الدليل
          </button>
        </div>
      </div>
    </div>
  );
};
