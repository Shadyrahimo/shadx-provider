import React, { useState, useEffect } from 'react';
import {
  X,
  FileText,
  ShieldCheck,
  Lock,
  Scale,
  CheckCircle2,
  Server,
  UserCheck,
  AlertTriangle,
  KeyRound,
  BellRing,
  Building2,
} from 'lucide-react';

export type LegalTabType = 'terms' | 'privacy';

interface TermsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: LegalTabType;
  inline?: boolean;
}

export const TermsDrawer: React.FC<TermsDrawerProps> = ({
  isOpen,
  onClose,
  initialTab = 'terms',
  inline = false,
}) => {
  const [activeTab, setActiveTab] = useState<LegalTabType>(initialTab);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen && !inline) return null;

  return (
    <div
      className={
        inline
          ? 'w-full'
          : 'fixed inset-0 z-50 flex justify-end bg-slate-950/80 backdrop-blur-sm'
      }
      dir="rtl"
    >
      {/* Backdrop click to close */}
      {!inline && (
        <div
          className="fixed inset-0"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <div
        className={
          inline
            ? 'bg-slate-900 border border-slate-800 rounded-2xl w-full p-5 sm:p-6 shadow-sm space-y-6 relative z-10'
            : 'bg-slate-900 border-r border-slate-800 w-full max-w-2xl h-full flex flex-col justify-between shadow-2xl relative z-10 overflow-hidden'
        }
      >
        {/* Top Sticky Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 bg-slate-950/60 space-y-4 shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0">
                {activeTab === 'terms' ? (
                  <FileText className="w-5 h-5" />
                ) : (
                  <ShieldCheck className="w-5 h-5" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base sm:text-lg font-extrabold text-white">
                    الشروط القانونية وسياسة الخصوصية
                  </h2>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-950/90 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold">
                    وثيقة رسمية معتمدة
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  منصة ShadX-Provider Hub لإدارة ومقارنة مزودي البطاقات الرقمية • الإصدار 2.4
                </p>
              </div>
            </div>

            {!inline && (
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent hover:border-slate-700 transition-colors cursor-pointer"
                aria-label="إغلاق"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Segmented Tab Switcher */}
          <div className="grid grid-cols-2 gap-2 bg-slate-900 p-1.5 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('terms')}
              className={`py-2.5 px-3 rounded-lg font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'terms'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Scale className="w-4 h-4 shrink-0" />
              <span>اتفاقية الاستخدام</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('privacy')}
              className={`py-2.5 px-3 rounded-lg font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'privacy'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Lock className="w-4 h-4 shrink-0" />
              <span>سياسة الخصوصية وأمن البيانات</span>
            </button>
          </div>
        </div>

        {/* Scrollable Legal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs leading-relaxed text-slate-300 grow">
          {activeTab === 'terms' ? (
            <>
              {/* Intro Banner */}
              <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/30 space-y-1.5">
                <div className="flex items-center gap-2 text-indigo-300 font-extrabold text-xs">
                  <Building2 className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>تمهيد ونطاق الاتفاقية (B2B SaaS Agreement)</span>
                </div>
                <p className="text-slate-300 text-xs leading-relaxed">
                  تُنظّم هذه الاتفاقية العلاقة القانونية والتقنية بين منصة{' '}
                  <strong className="text-white">ShadX-Provider Hub</strong> وكافة المتاجر الرقمية
                  والموزعين المشتركين في خدمات فحص الكتالوجات، المقارنة المزدوجة للأسعار، ومراقبة
                  هوامش الربح عبر واجهات البرمجة (API).
                </p>
              </div>

              {/* Section 1 */}
              <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 space-y-2">
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>1. شروط التسجيل واعتماد حسابات المتاجر</span>
                </h3>
                <ul className="list-disc list-inside space-y-1.5 text-slate-300">
                  <li>
                    الخدمة مخصصة حصرياً لأصحاب المتاجر الرقمية، الموزعين، والشركات العاملة في قطاع
                    البطاقات الرقمية وشحن الألعاب.
                  </li>
                  <li>
                    يلتزم المشترك بتقديم بيانات صحيحة ودقيقة عند إنشاء الحساب (الاسم الكامل، اسم
                    المتجر أو الكيان التجاري، البريد الإلكتروني الرسمي، ورقم التواصل).
                  </li>
                  <li>
                    تخضع جميع الحسابات الجديدة للمراجعة والتفعيل من قِبل إدارة المنصة لضمان جودة
                    الخدمة وأمان الشبكة.
                  </li>
                  <li>
                    يُمنع منعاً باتاً مشاركة بيانات الدخول الخاصة بالحساب الواحد بين عدة متاجر أو
                    أطراف غير مصرح لها.
                  </li>
                </ul>
              </div>

              {/* Section 2 */}
              <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 space-y-2">
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <Scale className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>2. طبيعة عمل المنصة والمقارنة السعرية</span>
                </h3>
                <ul className="list-disc list-inside space-y-1.5 text-slate-300">
                  <li>
                    تعمل المنصة كوسيط تقني (Technical Aggregator &amp; Analyzer) لاستعراض ومقارنة
                    كتالوجات المزودين الذين يربطهم التاجر باستخدام مفاتيح الـ API الخاصة به.
                  </li>
                  <li>
                    الأسعار وحالة التوفر المعروضة في الجداول والمقارنة المزدوجة يتم جلبها مباشرةً
                    في الوقت الفعلي (Real-Time) من خوادم المزودين الذين يحددهم المشترك.
                  </li>
                  <li>
                    أداة كشف انخفاض هامش الربح (&lt; 5%) وحاسبة التسعير هي أدوات مساندة لاتخاذ
                    القرار، ويبقى التاجر مسؤولاً عن اعتماد التسعيرة النهائية في متجره.
                  </li>
                </ul>
              </div>

              {/* Section 3 */}
              <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 space-y-2">
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <Server className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>3. الاستخدام العادل للربط البرمجي والمزامنة</span>
                </h3>
                <ul className="list-disc list-inside space-y-1.5 text-slate-300">
                  <li>
                    يلتزم المشترك بضبط فترات المزامنة الدورية بما يتوافق مع حدود الطلبات المسموحة
                    (Rate Limits) لدى مزود الخدمة لتجنب حظر عنوان الـ IP أو إيقاف التوكن من المصدر.
                  </li>
                  <li>
                    يُحظر استخدام المنصة في أي محاولات فحص عشوائي أو هجمات إغراق (Flooding) ضد
                    خوادم المزودين الخارجيين.
                  </li>
                </ul>
              </div>

              {/* Section 4 */}
              <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 space-y-2">
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>4. تعليق أو إنهاء الاشتراك</span>
                </h3>
                <p className="text-slate-300">
                  تحتفظ إدارة المنصة بحق تعليق أو إيقاف أي حساب يخالف بنود الاستخدام العادل، أو
                  ينتحل صفة متجر آخر، أو يسيء استخدام موارد الخادم الوسيط، مع إشعار صاحب الحساب
                  بسبب الإجراء المتخذ.
                </p>
              </div>
            </>
          ) : (
            <>
              {/* Privacy Intro Banner */}
              <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-300 font-extrabold text-xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>التزامنا بأمن وخصوصية بيانات متجرك</span>
                </div>
                <p className="text-slate-300 text-xs leading-relaxed">
                  نطبق في <strong className="text-white">ShadX-Provider Hub</strong> معايير صارمة
                  لحماية أسرار التجارة ومفاتيح الربط البرمجي (`API Tokens`) الخاصة بمتجرك، مع عزل
                  كامل لبيانات كل مشترك.
                </p>
              </div>

              {/* Privacy Section 1 */}
              <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 space-y-2">
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>1. سرية مفاتيح الـ API وبيانات المزودين</span>
                </h3>
                <ul className="list-disc list-inside space-y-1.5 text-slate-300">
                  <li>
                    يتم حفظ عناوين المزودين (`Base URL`) ورموز الوصول (`API Tokens`) محلياً داخل
                    بيئة متصفحك المشفرة (`Local Storage`) لتسهيل استخدامك اليومي.
                  </li>
                  <li>
                    عند جلب الكتالوج أو إجراء المقارنة المزدوجة، يمر الطلب عبر البروكسي المشفر
                    للمنصة لتجاوز قيود المتصفح (`CORS`) فقط، ولا يتم تخزين أو مشاركة مفاتيحك مع أي
                    طرف ثالث تحت أي ظرف.
                  </li>
                </ul>
              </div>

              {/* Privacy Section 2 */}
              <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 space-y-2">
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <Lock className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>2. البيانات المسجلة وقواعد الحماية (Zero-Trust Security)</span>
                </h3>
                <ul className="list-disc list-inside space-y-1.5 text-slate-300">
                  <li>
                    تقتصر البيانات المحفوظة في قاعدة بيانات الحسابات على: الاسم، اسم المتجر، البريد
                    الإلكتروني، رقم التواصل، حالة الحساب، ونوع الباقة.
                  </li>
                  <li>
                    تُشفّر كلمات المرور خوارزمياً باستخدام معيار (`PBKDF2-SHA512`) مع ملح عشوائي
                    فريد (`Salt`)، بحيث لا يمكن لأي شخص الاطلاع على كلمة المرور النصية.
                  </li>
                  <li>
                    تمنع قواعد الأمان (`Firestore Security Rules`) أي مستخدم من قراءة أو استعراض
                    بيانات حسابات المشتركين الآخرين.
                  </li>
                </ul>
              </div>

              {/* Privacy Section 3 */}
              <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 space-y-2">
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <BellRing className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>3. الإشعارات والتنبيهات الفورية</span>
                </h3>
                <p className="text-slate-300">
                  تُستخدم صلاحيات إشعارات النظام (في الهاتف أو سطح المكتب) ومعرفات بوت تيليجرام
                  حصرياً لإرسال تنبيهات انخفاض الأسعار، تغير حالة التوفر، أو تنبيهات انخفاض هامش
                  الربح عن 5% التي يقوم المشترك بتفعيلها بنفسه، ولا تُستخدم لأي رسائل دعائية.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Bottom Sticky Action Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>باستخدامك للمنصة فإنك تقر بالاطلاع والموافقة على هذه البنود</span>
          </div>

          {!inline && (
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs transition-colors cursor-pointer shadow-md shadow-indigo-600/20"
            >
              قرأت وأوافق • إغلاق
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
