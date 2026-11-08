import React, { useState } from 'react';
import {
  X,
  Code2,
  Copy,
  Check,
  Play,
  ExternalLink,
  ShieldCheck,
  Send,
  Layers,
  Sparkles,
  FileCode,
  Tag,
} from 'lucide-react';
import { CatalogProduct } from '../types';
import { generateIntegrationSnippet } from '../utils/normalizer';

interface ProductDetailModalProps {
  product: CatalogProduct | null;
  onClose: () => void;
  providerBaseUrl: string;
  apiToken: string;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  providerBaseUrl,
  apiToken,
}) => {
  if (!product) return null;

  const [activeTab, setActiveTab] = useState<'url' | 'json' | 'salla' | 'curl' | 'js'>('url');
  const [copied, setCopied] = useState(false);
  const [testParams, setTestParams] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    product.normalizedParams.forEach((p) => {
      if (p.category === 'player_id' || p.category === 'uid') initial[p.normalizedKey] = '9876543210';
      else if (p.category === 'server_id') initial[p.normalizedKey] = '2001';
      else if (p.category === 'email') initial[p.normalizedKey] = 'customer@store.com';
      else if (p.category === 'username') initial[p.normalizedKey] = 'gamer_pro';
      else if (p.category === 'phone') initial[p.normalizedKey] = '+966501234567';
      else initial[p.normalizedKey] = 'test_value';
    });
    return initial;
  });
  const [testQty, setTestQty] = useState<number>(1);
  const [testResponse, setTestResponse] = useState<any>(null);
  const [isTesting, setIsTesting] = useState(false);

  // Generate unique UUID v4 for the order preview
  const sampleUuid = 'ecbdd545-e616-4aee-8770-7eefa977bcd';

  const buildCurrentOrderUrl = () => {
    const cleanBase = providerBaseUrl.replace(/\/+$/, '') || 'https://api.mersal-card.com';
    const q = new URLSearchParams();
    q.set('qty', String(testQty));

    Object.entries(testParams).forEach(([k, v]) => {
      if (v) q.set(k, v);
    });

    q.set('order_uuid', sampleUuid);
    return `${cleanBase}/client/api/newOrder/${product.id}/params?${q.toString()}`;
  };

  const getActiveCode = () => {
    switch (activeTab) {
      case 'url':
        return buildCurrentOrderUrl();
      case 'json':
        return generateIntegrationSnippet(product, 'json', providerBaseUrl);
      case 'salla':
        return generateIntegrationSnippet(product, 'salla_product', providerBaseUrl);
      case 'curl':
        return generateIntegrationSnippet(product, 'curl', providerBaseUrl);
      case 'js':
        return generateIntegrationSnippet(product, 'js_fetch', providerBaseUrl);
      default:
        return '';
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getActiveCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRunSimulator = async () => {
    setIsTesting(true);
    setTestResponse(null);

    try {
      const res = await fetch('/api/proxy/test-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseUrl: providerBaseUrl || 'https://api.mersal-card.com',
          apiToken: apiToken || 'demo_token',
          productId: product.id,
          qty: testQty,
          params: testParams,
          orderUuid: `test-${Math.random().toString(36).substring(2, 10)}`,
        }),
      });
      const data = await res.json();
      setTestResponse(data);
    } catch (err: any) {
      setTestResponse({
        success: false,
        error: err.message,
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-6 shadow-2xl relative my-8">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Info */}
        <div className="flex items-start gap-3 mb-6 pb-4 border-b border-slate-800">
          <div className="w-12 h-12 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center text-lg font-bold font-mono">
            #{product.id}
          </div>
          <div className="grow">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">
                {product.name}
              </h2>
              {product.isAvailable ? (
                <span className="text-[11px] text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded font-medium">
                  متاح للطلب
                </span>
              ) : (
                <span className="text-[11px] text-rose-400 bg-rose-950/60 border border-rose-500/30 px-2 py-0.5 rounded font-medium">
                  غير متوفر
                </span>
              )}
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-2 mt-1">
              <span>الفئة: {product.category}</span>
              <span aria-hidden="true">·</span>
              <span>نوع الكمية: {product.qtyDescriptionAr}</span>
              <span aria-hidden="true">·</span>
              <span>الحدود: {product.limitsDisplay}</span>
            </div>
          </div>
        </div>

        {/* Pricing Metrics Summary Grid */}
        <div className="grid grid-cols-3 gap-3 mb-6 text-xs">
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-500 block mb-1">سعر التكلفة (USD):</span>
            <span className="text-base font-bold font-mono-numbers text-slate-200">
              ${product.costPriceUsd.toFixed(3)}
            </span>
          </div>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-500 block mb-1">سعر البيع المقترح ($):</span>
            <span className="text-base font-bold font-mono-numbers text-emerald-400">
              ${product.suggestedSellPriceUsd.toFixed(2)}
            </span>
          </div>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-500 block mb-1">صافي الربح المتوقع:</span>
            <span className="text-base font-bold font-mono-numbers text-indigo-400">
              +${(product.suggestedSellPriceUsd - product.costPriceUsd).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Required Parameters Mapping Section */}
        <div className="mb-6">
          <h4 className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5">
            <Tag className="w-4 h-4 text-indigo-400" />
            <span>المعلمات المطلوبة من العميل في متجرك (Parameters Mapping):</span>
          </h4>

          {product.normalizedParams.length === 0 ? (
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs text-slate-400">
              هذا المنتج عبارة عن كود رقمي مباشر ولا يتطلب أي معلمات إضافية من العميل.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              {product.normalizedParams.map((param, idx) => (
                <div
                  key={idx}
                  className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">{param.labelAr}</span>
                    <span className="font-mono text-[10px] text-indigo-400 bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-500/30">
                      key: {param.normalizedKey}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    النص في وثائق المزود: <span className="text-slate-300 font-mono">"{param.raw}"</span>
                  </div>
                  {/* Test input */}
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">
                      قيمة تجريبية:
                    </label>
                    <input
                      type="text"
                      value={testParams[param.normalizedKey] || ''}
                      onChange={(e) =>
                        setTestParams({ ...testParams, [param.normalizedKey]: e.target.value })
                      }
                      dir="ltr"
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-slate-200 text-xs font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Code Snippets & Ready-to-use Formats */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              {[
                { id: 'url', label: 'رابط الطلب المباشر (GET)' },
                { id: 'json', label: 'كائن JSON' },
                { id: 'salla', label: 'تهيئة منتج سلة (Salla)' },
                { id: 'curl', label: 'أمر cURL' },
                { id: 'js', label: 'كود JavaScript' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors shadow-xs"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'تم النسخ!' : 'نسخ الكود'}</span>
            </button>
          </div>

          <div className="relative">
            <pre
              dir="ltr"
              className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs font-mono text-indigo-300 overflow-x-auto max-h-48 whitespace-pre-wrap select-all"
            >
              {getActiveCode()}
            </pre>
          </div>
        </div>

        {/* Test Simulator Action */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
          <div className="text-slate-400">
            يمكنك محاكاة تجهيز استعلام الطلب للتحقق من توافق المعلمات و `order_uuid`.
          </div>
          <button
            onClick={handleRunSimulator}
            disabled={isTesting}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium transition-colors disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 text-indigo-400 ${isTesting ? 'animate-pulse' : ''}`} />
            <span>{isTesting ? 'جارِ الاختبار...' : 'فحص وتوليد الرابط'}</span>
          </button>
        </div>

        {/* Simulator Response */}
        {testResponse && (
          <div className="mt-3 bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
            <div className="font-semibold text-emerald-400 mb-1 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              <span>نتيجة فحص وتجهيز الطلب:</span>
            </div>
            <pre dir="ltr" className="text-slate-300 font-mono text-[11px] overflow-x-auto">
              {JSON.stringify(testResponse, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
