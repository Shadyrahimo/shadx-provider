import { NormalizedParam, QtyValues, MarginConfig, CatalogProduct, RawProviderProduct } from '../types';

/**
 * Normalizes provider parameter strings into unified machine keys and Arabic labels
 */
export function normalizeParam(rawInput: string): NormalizedParam {
  const raw = String(rawInput || '').trim();
  const lower = raw.toLowerCase();

  // 1. Server ID / Zone ID / خادم
  if (
    lower.includes('server') ||
    lower.includes('zone') ||
    raw.includes('سيرفر') ||
    raw.includes('الخادم') ||
    raw.includes('منطقة')
  ) {
    return {
      raw,
      normalizedKey: 'server_id',
      labelAr: 'معرف الخادم (Server ID)',
      category: 'server_id',
    };
  }

  // 2. Email / البريد
  if (
    lower.includes('email') ||
    lower.includes('mail') ||
    raw.includes('بريد') ||
    raw.includes('ايميل')
  ) {
    return {
      raw,
      normalizedKey: 'email',
      labelAr: 'البريد الإلكتروني (EMAIL)',
      category: 'email',
    };
  }

  // 3. Phone / Number / رقم الهاتف / الرقم
  if (
    lower.includes('phone') ||
    lower.includes('mobile') ||
    lower.includes('tel') ||
    raw.includes('هاتف') ||
    raw.includes('جوال') ||
    raw === 'الرقم' ||
    raw.includes('رقم الهاتف')
  ) {
    return {
      raw,
      normalizedKey: 'phone',
      labelAr: 'رقم الهاتف (Phone Number)',
      category: 'phone',
    };
  }

  // 4. UID / معرّف اللاعب / Player ID / ادخل الايدي اللاعب
  if (
    lower.includes('player_id') ||
    lower.includes('playerid') ||
    lower.includes('player id') ||
    lower === 'uid' ||
    raw.includes('معرف اللاعب') ||
    raw.includes('معرّف اللاعب') ||
    raw.includes('الايدي') ||
    raw.includes('الأيدي') ||
    raw.includes('اللاعب') ||
    raw.includes('id اللاعب')
  ) {
    return {
      raw,
      normalizedKey: 'player_id',
      labelAr: 'معرّف اللاعب (Player ID)',
      category: 'player_id',
    };
  }

  // 5. Username / User ID / اسم المستخدم
  if (
    lower.includes('username') ||
    lower.includes('user_id') ||
    lower.includes('userid') ||
    lower.includes('user id') ||
    raw.includes('اسم المستخدم') ||
    raw.includes('المستخدم') ||
    raw.includes('حساب')
  ) {
    return {
      raw,
      normalizedKey: 'username',
      labelAr: 'اسم المستخدم (User ID / Username)',
      category: 'username',
    };
  }

  // Default fallback for custom or unmapped parameter
  const safeKey = raw
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .toLowerCase() || 'custom_param';

  return {
    raw,
    normalizedKey: safeKey,
    labelAr: raw || 'معلمة مخصصة',
    category: 'custom',
  };
}

/**
 * Calculates suggested retail price from cost and margin configuration
 */
export function calculateSuggestedPrice(costPrice: number, margin: MarginConfig): number {
  if (isNaN(costPrice) || costPrice <= 0) return 0;

  let rawSell = 0;
  if (margin.mode === 'percentage') {
    rawSell = costPrice * (1 + margin.value / 100);
  } else {
    rawSell = costPrice + margin.value;
  }

  switch (margin.rounding) {
    case '99cents':
      return Math.floor(rawSell) + 0.99;
    case 'roundHalf':
      return Math.ceil(rawSell * 2) / 2;
    case 'ceilInteger':
      return Math.ceil(rawSell);
    case 'exact':
    default:
      // Rounded to 2 decimal places (or 3 for very small micropayments)
      return costPrice < 1 ? Number(rawSell.toFixed(3)) : Number(rawSell.toFixed(2));
  }
}

/**
 * Parses qty_values and product_type from raw API format
 */
export function parseQtyValues(
  qtyValues: QtyValues | undefined,
  productTypeRaw?: string
): {
  type: 'package' | 'amount' | 'fixed';
  descriptionAr: string;
  limitsDisplay: string;
} {
  // If product_type is explicitly specified
  const normalizedType = String(productTypeRaw || '').toLowerCase();

  if (qtyValues === null || qtyValues === undefined) {
    return {
      type: 'package',
      descriptionAr: 'باقة محددة (كمية 1)',
      limitsDisplay: 'ثابت = 1',
    };
  }

  if (Array.isArray(qtyValues)) {
    return {
      type: 'fixed',
      descriptionAr: 'كميات محددة مسبقاً',
      limitsDisplay: `خيارات: [${qtyValues.join(', ')}]`,
    };
  }

  if (typeof qtyValues === 'object' && ('min' in qtyValues || 'max' in qtyValues)) {
    const min = qtyValues.min !== undefined ? qtyValues.min : 1;
    const max = qtyValues.max !== undefined ? qtyValues.max : 'غير محدود';
    return {
      type: 'amount',
      descriptionAr: 'كمية مرنة (نطاق)',
      limitsDisplay: `${min} - ${max}`,
    };
  }

  if (normalizedType === 'amount') {
    return {
      type: 'amount',
      descriptionAr: 'كمية مرنة',
      limitsDisplay: 'حسب الرغبة',
    };
  }

  return {
    type: 'package',
    descriptionAr: 'باقة قياسية',
    limitsDisplay: 'ثابت',
  };
}

/**
 * Diagnoses auto-integration readiness for a catalog product
 */
export function evaluateIntegrationStatus(product: {
  name: string;
  category: string;
  normalizedParams: NormalizedParam[];
  isAvailable: boolean;
  rawParams?: string[];
}): {
  status: 'ready' | 'needs_fix' | 'unmapped';
  statusLabel: string;
  missingFields: string[];
  suggestedParams: NormalizedParam[];
  fixReason: string;
} {
  if (!product.isAvailable) {
    return {
      status: 'unmapped',
      statusLabel: 'غير متوفر / غير مهيأ',
      missingFields: [],
      suggestedParams: [],
      fixReason: 'المنتج غير متوفر حالياً لدى المزود، تم إيقاف الربط مؤقتاً.',
    };
  }

  const nameLower = (product.name || '').toLowerCase();
  const catLower = (product.category || '').toLowerCase();
  const text = `${nameLower} ${catLower}`;

  const missingFields: string[] = [];
  const suggestedParams: NormalizedParam[] = [];

  const hasParamCategory = (cat: NormalizedParam['category']) =>
    product.normalizedParams.some((p) => p.category === cat);

  const hasKey = (key: string) =>
    product.normalizedParams.some((p) => p.normalizedKey === key);

  // 1. Zone/Server ID Games (Mobile Legends, Genshin Impact, EA FC, Tower of Fantasy, etc.)
  const isServerGame =
    text.includes('mobile legends') ||
    text.includes('mlbb') ||
    text.includes('genshin') ||
    text.includes('tower of fantasy') ||
    text.includes('ea sports fc') ||
    text.includes('fc mobile') ||
    text.includes('سيرفر') ||
    text.includes('خادم') ||
    text.includes('zone');

  // 2. Direct Player ID Games (PUBG, Free Fire, Roblox, COD, Valorant, Brawl Stars, Clash, Apex, etc.)
  const isGame =
    isServerGame ||
    text.includes('pubg') ||
    text.includes('ببجي') ||
    text.includes('free fire') ||
    text.includes('فري فاير') ||
    text.includes('roblox') ||
    text.includes('روبلوكس') ||
    text.includes('call of duty') ||
    text.includes('valorant') ||
    text.includes('clash') ||
    text.includes('brawl') ||
    text.includes('yalla ludo') ||
    text.includes('يلا لودو') ||
    text.includes('diamonds') ||
    text.includes('جواهر') ||
    text.includes('ماسات') ||
    text.includes('شدات') ||
    text.includes('ألعاب') ||
    text.includes('games');

  // 3. Streaming and Digital Subscriptions (Netflix, Shahid, Spotify, YouTube, ChatGPT, Canva, Discord)
  const isSubscription =
    text.includes('netflix') ||
    text.includes('نتفليكس') ||
    text.includes('نتفلكس') ||
    text.includes('shahid') ||
    text.includes('شاهد') ||
    text.includes('spotify') ||
    text.includes('سبوتيفاي') ||
    text.includes('youtube') ||
    text.includes('يوتيوب') ||
    text.includes('canva') ||
    text.includes('كانفا') ||
    text.includes('chatgpt') ||
    text.includes('شات جي بي') ||
    text.includes('discord') ||
    text.includes('ديسكورد') ||
    text.includes('اشتراك') ||
    text.includes('subscription');

  // 4. Telecom / Recharge / Live Apps (STC, Zain, Mobily, TopTop, Mico, Poppo, Chamet, HalaMe, Likee, TikTok, BIGO)
  const isTelecomOrApp =
    text.includes('toptop') ||
    text.includes('mico') ||
    text.includes('poppo') ||
    text.includes('chamet') ||
    text.includes('halame') ||
    text.includes('tiktok') ||
    text.includes('تيك توك') ||
    text.includes('bigo') ||
    text.includes('likee') ||
    text.includes('لايكي') ||
    text.includes('jawaker') ||
    text.includes('جواكر') ||
    text.includes('stc') ||
    text.includes('zain') ||
    text.includes('mobily') ||
    text.includes('سوا') ||
    text.includes('زين') ||
    text.includes('موبايلي');

  // Evaluate requirements:
  if (isGame) {
    if (!hasParamCategory('player_id') && !hasParamCategory('uid') && !hasParamCategory('username')) {
      missingFields.push('معرّف اللاعب [player_id]');
      suggestedParams.push({
        raw: 'معرف اللاعب [player_id]',
        normalizedKey: 'player_id',
        labelAr: 'معرّف اللاعب (Player ID)',
        category: 'player_id',
      });
    }

    if (isServerGame && !hasParamCategory('server_id') && !hasKey('server_id')) {
      missingFields.push('معرف الخادم [server_id]');
      suggestedParams.push({
        raw: 'Server ID [server_id]',
        normalizedKey: 'server_id',
        labelAr: 'معرف الخادم (Server ID)',
        category: 'server_id',
      });
    }
  } else if (isSubscription) {
    if (!hasParamCategory('email') && !hasKey('email')) {
      missingFields.push('البريد الإلكتروني [email]');
      suggestedParams.push({
        raw: 'EMAIL',
        normalizedKey: 'email',
        labelAr: 'البريد الإلكتروني (EMAIL)',
        category: 'email',
      });
    }
  } else if (isTelecomOrApp) {
    if (!hasParamCategory('phone') && !hasParamCategory('username') && !hasParamCategory('player_id')) {
      missingFields.push('رقم الهاتف أو المعرف [phone]');
      suggestedParams.push({
        raw: 'رقم الهاتف [phone]',
        normalizedKey: 'phone',
        labelAr: 'رقم الهاتف (Phone Number)',
        category: 'phone',
      });
    }
  }

  // Check unmapped / custom parameters
  const customParams = product.normalizedParams.filter((p) => p.category === 'custom');
  if (customParams.length > 0) {
    missingFields.push(`معلمة غير معيارية (${customParams.map((cp) => cp.raw).join(', ')})`);
    customParams.forEach((cp) => {
      const low = cp.raw.toLowerCase();
      if (low.includes('id') || low.includes('ايدي') || low.includes('لاعب')) {
        suggestedParams.push({
          raw: cp.raw,
          normalizedKey: 'player_id',
          labelAr: 'معرّف اللاعب (Player ID)',
          category: 'player_id',
        });
      } else if (low.includes('سيرفر') || low.includes('خادم')) {
        suggestedParams.push({
          raw: cp.raw,
          normalizedKey: 'server_id',
          labelAr: 'معرف الخادم (Server ID)',
          category: 'server_id',
        });
      } else if (low.includes('بريد') || low.includes('ايميل')) {
        suggestedParams.push({
          raw: cp.raw,
          normalizedKey: 'email',
          labelAr: 'البريد الإلكتروني (EMAIL)',
          category: 'email',
        });
      } else {
        suggestedParams.push({
          raw: cp.raw,
          normalizedKey: 'username',
          labelAr: 'اسم المستخدم (Username)',
          category: 'username',
        });
      }
    });
  }

  // Deduplicate suggested params by normalizedKey
  const uniqueSuggested: NormalizedParam[] = [];
  const seenKeys = new Set<string>(product.normalizedParams.map((p) => p.normalizedKey));
  suggestedParams.forEach((sp) => {
    if (!seenKeys.has(sp.normalizedKey)) {
      uniqueSuggested.push(sp);
      seenKeys.add(sp.normalizedKey);
    }
  });

  if (missingFields.length > 0) {
    return {
      status: 'needs_fix',
      statusLabel: 'معلمات ناقصة',
      missingFields,
      suggestedParams: uniqueSuggested,
      fixReason: `ينقص معلمات الربط التلقائي: ${missingFields.join(' و ')}`,
    };
  }

  return {
    status: 'ready',
    statusLabel: 'ربط مكتمل',
    missingFields: [],
    suggestedParams: [],
    fixReason: 'جميع معلمات الربط مطابقة ومكتملة للتنفيذ التلقائي عبر الـ API.',
  };
}

/**
 * Transforms a raw provider product object into our standardized CatalogProduct
 */
export function transformRawProduct(
  raw: RawProviderProduct,
  margin: MarginConfig,
  thresholdConfig?: {
    enabled: boolean;
    defaultThreshold: number | '';
    productThresholds: Record<string | number, number>;
  }
): CatalogProduct {
  const cost = typeof raw.price === 'string' ? parseFloat(raw.price) || 0 : Number(raw.price || 0);
  const basePrice = raw.base_price !== undefined ? parseFloat(String(raw.base_price)) : undefined;

  let rawParamsList: string[] = [];
  if (Array.isArray(raw.params)) {
    rawParamsList = raw.params.map(String);
  } else if (typeof raw.params === 'string' && raw.params.trim().length > 0) {
    try {
      const parsed = JSON.parse(raw.params);
      rawParamsList = Array.isArray(parsed) ? parsed.map(String) : [raw.params];
    } catch {
      rawParamsList = [raw.params];
    }
  } else if (raw.params && typeof raw.params === 'object') {
    rawParamsList = Object.keys(raw.params);
  }

  const normalizedParams = rawParamsList.map(normalizeParam);
  const { type, descriptionAr, limitsDisplay } = parseQtyValues(raw.qty_values, raw.product_type);

  // Available can be boolean, 1/0, "true"/"false"
  let isAvailable = true;
  if (raw.available === false || raw.available === 0 || raw.available === '0' || raw.available === 'false') {
    isAvailable = false;
  }

  // Threshold alert computation
  let thresholdPrice: number | undefined = undefined;
  let isBelowThreshold: boolean = false;
  let thresholdSavings: number | undefined = undefined;

  if (thresholdConfig && thresholdConfig.enabled) {
    if (thresholdConfig.productThresholds[raw.id] !== undefined) {
      thresholdPrice = thresholdConfig.productThresholds[raw.id];
    } else if (thresholdConfig.defaultThreshold !== '' && thresholdConfig.defaultThreshold > 0) {
      thresholdPrice = Number(thresholdConfig.defaultThreshold);
    }

    if (thresholdPrice !== undefined && thresholdPrice > 0) {
      if (cost < thresholdPrice) {
        isBelowThreshold = true;
        thresholdSavings = Number((thresholdPrice - cost).toFixed(3));
      }
    }
  }

  const catName = raw.category_name || 'عام / غير مصنف';
  const prodName = raw.name || `منتج #${raw.id}`;

  const diagnostic = evaluateIntegrationStatus({
    name: prodName,
    category: catName,
    normalizedParams,
    isAvailable,
    rawParams: rawParamsList,
  });

  return {
    id: raw.id,
    name: prodName,
    category: catName,
    costPriceUsd: cost,
    basePriceUsd: basePrice,
    suggestedSellPriceUsd: calculateSuggestedPrice(cost, margin),
    isAvailable,
    productType: type,
    qtyValues: raw.qty_values ?? null,
    qtyDescriptionAr: descriptionAr,
    limitsDisplay,
    rawParams: rawParamsList,
    normalizedParams,
    categoryImg: raw.category_img,
    thresholdPrice,
    isBelowThreshold,
    thresholdSavings,
    integrationStatus: diagnostic.status,
    integrationDiagnostic: diagnostic,
  };
}

/**
 * Generates ready-to-use integration codes in multiple formats
 */
export function generateIntegrationSnippet(
  product: CatalogProduct,
  format: 'order_url' | 'json' | 'salla_product' | 'curl' | 'js_fetch',
  providerBaseUrl: string = 'https://api.mersal-card.com'
): string {
  const baseUrl = providerBaseUrl.replace(/\/+$/, '');
  const paramsQuery = product.normalizedParams
    .map((p) => `${p.normalizedKey}=VALUE`)
    .join('&');
  const queryStr = `qty=1&${paramsQuery}&order_uuid=UNIQUE_UUID_V4`;

  switch (format) {
    case 'order_url':
      return `${baseUrl}/client/api/newOrder/${product.id}/params?${queryStr}`;

    case 'json':
      return JSON.stringify(
        {
          provider_product_id: product.id,
          name: product.name,
          category: product.category,
          cost_price_usd: product.costPriceUsd,
          suggested_price_usd: product.suggestedSellPriceUsd,
          available: product.isAvailable,
          product_type: product.productType,
          limits: product.limitsDisplay,
          required_params: product.normalizedParams.map((p) => ({
            key: p.normalizedKey,
            arabic_label: p.labelAr,
            original: p.raw,
          })),
        },
        null,
        2
      );

    case 'salla_product':
      return JSON.stringify(
        {
          name: product.name,
          price: product.suggestedSellPriceUsd,
          cost_price: product.costPriceUsd,
          sku: `API-${product.id}`,
          metadata: {
            api_provider_id: product.id,
            api_type: product.productType,
            custom_fields: product.normalizedParams.map((p) => ({
              field_id: p.normalizedKey,
              title: p.labelAr,
              type: 'text',
              is_required: true,
            })),
          },
        },
        null,
        2
      );

    case 'curl':
      return `curl -X GET "${baseUrl}/client/api/newOrder/${product.id}/params?${queryStr}" \\
  -H "api-token: YOUR_API_TOKEN" \\
  -H "Accept: application/json"`;

    case 'js_fetch':
      return `const response = await fetch("${baseUrl}/client/api/newOrder/${product.id}/params?${queryStr}", {
  headers: {
    "api-token": "YOUR_API_TOKEN",
    "Accept": "application/json"
  }
});
const result = await response.json();
console.log(result);`;

    default:
      return '';
  }
}

/**
 * Exports products array to Excel-compatible CSV with UTF-8 BOM
 */
export function exportProductsToCsv(products: CatalogProduct[]): void {
  const headers = [
    'المعرف (ID)',
    'اسم المنتج',
    'الفئة / التصنيف',
    'سعر التكلفة (USD)',
    'سعر البيع المقترح (USD)',
    'هامش الربح (USD)',
    'الحد السعري للتنبيه (Threshold)',
    'تنبيه انخفاض التكلفة',
    'الحالة',
    'نوع الكمية',
    'الحدود (Min-Max)',
    'المعلمات المطلوبة (Params)',
    'مفاتيح الربط البرمجي (Keys)',
  ];

  const rows = products.map((p) => {
    const profit = (p.suggestedSellPriceUsd - p.costPriceUsd).toFixed(3);
    const paramsLabels = p.normalizedParams.map((np) => np.labelAr).join(' | ') || 'لا توجد';
    const paramsKeys = p.normalizedParams.map((np) => np.normalizedKey).join(', ') || 'none';
    const thresholdStr = p.thresholdPrice !== undefined ? `$${p.thresholdPrice}` : 'غير محدد';
    const alertStr = p.isBelowThreshold ? `تنبيه: أقل من الحد بفارق $${p.thresholdSavings}` : 'طبيعي';

    return [
      `"${p.id}"`,
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.category.replace(/"/g, '""')}"`,
      p.costPriceUsd,
      p.suggestedSellPriceUsd,
      profit,
      `"${thresholdStr}"`,
      `"${alertStr}"`,
      p.isAvailable ? 'متاح' : 'غير متاح',
      `"${p.qtyDescriptionAr}"`,
      `"${p.limitsDisplay}"`,
      `"${paramsLabels.replace(/"/g, '""')}"`,
      `"${paramsKeys}"`,
    ].join(',');
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `catalog-export-${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
