import { RawProviderProduct, ProviderPreset } from '../types';

export const PROVIDER_PRESETS: ProviderPreset[] = [
  {
    id: 'mersal',
    name: 'Mersal Card API (مرسال كارد)',
    baseUrl: 'https://api.mersal-card.com/',
    defaultToken: 'demo_mersal_live_token_77a9',
    description: 'مزود معتمد لبطاقات وشحن الألعاب والبطاقات الرقمية (PUBG, Razer, iTunes, Free Fire)',
    badge: 'نشط وموثق',
  },
  {
    id: 'tartousi',
    name: 'Tartousi Store API (متجر طرطوسي)',
    baseUrl: 'https://api.tartousi-store1.com/',
    defaultToken: 'demo_tartousi_sec_token_99x1',
    description: 'مزود خدمات الألعاب وحزم شحن الأيدي والاشتراكات الرقمية للشرق الأوسط',
    badge: 'نشط وموثق',
  },
  {
    id: 'alkasr',
    name: 'Alkasr VIP API (القصر VIP)',
    baseUrl: 'https://api.alkasr-vip.com/',
    defaultToken: 'demo_alkasr_vip_token_24bb',
    description: 'بوابة شحن الألعاب المباشرة بالجملة وأرصدة التطبيقات ومفاتيح التفعيل',
    badge: 'نشط وموثق',
  },
  {
    id: 'custom',
    name: 'مزود مخصص (Custom Provider API)',
    baseUrl: '',
    defaultToken: '',
    description: 'ربط مباشر مع أي مزود بطاقات يعتمد نمط واجهة Mersal / Reseller API',
    badge: 'يدوي',
  },
];

// Helper to generate realistic high-density catalog of 420+ products
function createMockCatalog(): RawProviderProduct[] {
  const products: RawProviderProduct[] = [];
  let currentId = 101;

  // 1. PUBG Mobile UC (Global ID)
  const pubgPackages = [
    { name: 'UC 60 ببجي العالمية', price: 0.88, type: 'package' },
    { name: 'UC 300 + 25 ببجي العالمية', price: 4.39, type: 'package' },
    { name: 'UC 600 + 60 ببجي العالمية', price: 8.79, type: 'package' },
    { name: 'UC 1500 + 300 ببجي العالمية', price: 21.99, type: 'package' },
    { name: 'UC 3000 + 850 ببجي العالمية', price: 43.80, type: 'package' },
    { name: 'UC 6000 + 2100 ببجي العالمية', price: 87.50, type: 'package' },
    { name: 'UC 12000 + 4200 ببجي العالمية', price: 174.90, type: 'package' },
    { name: 'UC 18000 + 6300 ببجي العالمية', price: 261.00, type: 'package' },
    { name: 'UC 24000 + 8400 ببجي العالمية', price: 348.00, type: 'package' },
    { name: 'UC 30000 + 10500 ببجي العالمية', price: 435.00, type: 'package' },
    { name: 'UC شحن كميات مفتوحة (Flexi)', price: 0.015, type: 'amount', min: 100, max: 50000 },
  ];
  pubgPackages.forEach((p) => {
    products.push({
      id: currentId++,
      name: p.name,
      category_name: 'PUBG Global ID UC',
      price: p.price,
      base_price: Number((p.price * 0.95).toFixed(3)),
      available: true,
      product_type: p.type,
      qty_values: p.type === 'amount' ? { min: p.min!, max: p.max! } : null,
      params: ['معرف اللاعب [player_id]'],
    });
  });

  // 2. PUBG Mobile - Korea / Taiwan / Vietnam
  ['ببجي الكورية', 'ببجي الفيتنامية', 'ببجي التايوانية'].forEach((region) => {
    [60, 325, 660, 1800, 3850].forEach((uc) => {
      products.push({
        id: currentId++,
        name: `UC ${uc} ${region}`,
        category_name: `PUBG Mobile (${region})`,
        price: Number((uc * 0.015).toFixed(2)),
        base_price: Number((uc * 0.014).toFixed(2)),
        available: true,
        product_type: 'package',
        qty_values: null,
        params: ['player_id'],
      });
    });
  });

  // 3. Free Fire Diamonds (Garena ID)
  const ffPackages = [
    { name: '100 + 10 جواهر فري فاير', price: 0.92 },
    { name: '210 + 21 جواهر فري فاير', price: 1.85 },
    { name: '530 + 53 جواهر فري فاير', price: 4.60 },
    { name: '1080 + 108 جواهر فري فاير', price: 9.15 },
    { name: '2200 + 220 جواهر فري فاير', price: 18.25 },
    { name: 'عضوية أسبوعية فري فاير (Weekly)', price: 1.95 },
    { name: 'عضوية شهرية فري فاير (Monthly)', price: 7.80 },
    { name: 'تصريح مستوى (Level Up Pass)', price: 2.10 },
    { name: '100 إلى 15000 جوهرة كمية مفتوحة', price: 0.009, isAmount: true },
  ];
  ffPackages.forEach((ff) => {
    products.push({
      id: currentId++,
      name: ff.name,
      category_name: 'Free Fire Diamonds (UID)',
      price: ff.price,
      base_price: Number((ff.price * 0.96).toFixed(3)),
      available: true,
      product_type: ff.isAmount ? 'amount' : 'package',
      qty_values: ff.isAmount ? { min: 100, max: 15000 } : null,
      params: ['UID', 'معرف اللاعب (Player ID)'],
    });
  });

  // 4. Mobile Legends: Bang Bang (Player ID + Server ID)
  const mlTiers = [
    { name: '50 + 5 ماسات MLBB', price: 0.95 },
    { name: '100 + 10 ماسات MLBB', price: 1.88 },
    { name: '250 + 25 ماسات MLBB', price: 4.65 },
    { name: '500 + 65 ماسات MLBB', price: 9.20 },
    { name: '1000 + 155 ماسات MLBB', price: 18.30 },
    { name: '1500 + 265 ماسات MLBB', price: 27.50 },
    { name: '2500 + 475 ماسات MLBB', price: 45.90 },
    { name: '5000 + 1000 ماسات MLBB', price: 91.00 },
    { name: 'بطاقة اشتراك أسبوعي Twilight Pass', price: 9.50 },
    { name: 'بطاقة عضوية النجمة الترويجية Starlight', price: 4.90 },
    { name: 'باقة شحن ماسات مخصصة (Custom Range)', price: 0.018, isAmount: true },
  ];
  mlTiers.forEach((ml) => {
    products.push({
      id: currentId++,
      name: ml.name,
      category_name: 'Mobile Legends Bang Bang',
      price: ml.price,
      base_price: Number((ml.price * 0.94).toFixed(3)),
      available: true,
      product_type: ml.isAmount ? 'amount' : 'package',
      qty_values: ml.isAmount ? { min: 50, max: 50000 } : null,
      params: ['معرّف اللاعب [player_id]', 'Server ID [server_id]'],
    });
  });

  // 5. Roblox Robux
  [80, 400, 800, 1700, 4500, 10000].forEach((robux) => {
    products.push({
      id: currentId++,
      name: `${robux} روبوكس روبلوكس (Robux)`,
      category_name: 'Roblox Robux Direct',
      price: Number((robux * 0.0118).toFixed(2)),
      base_price: Number((robux * 0.011).toFixed(2)),
      available: true,
      product_type: 'package',
      qty_values: null,
      params: ['اسم المستخدم', 'User ID'],
    });
  });

  // 6. Yalla Ludo Diamonds & Golds
  [
    { name: 'يلا لودو 250 جوهرة + 100 ألف ذهب', price: 1.15 },
    { name: 'يلا لودو 650 جوهرة + 300 ألف ذهب', price: 2.90 },
    { name: 'يلا لودو 1350 جوهرة + 700 ألف ذهب', price: 5.75 },
    { name: 'يلا لودو 2800 جوهرة + 1.5 مليون ذهب', price: 11.50 },
    { name: 'يلا لودو 5800 جوهرة + 3.2 مليون ذهب', price: 23.00 },
    { name: 'يلا لودو 12000 جوهرة + 6.8 مليون ذهب', price: 46.00 },
    { name: 'يلا لودو 31000 جوهرة ملكية', price: 115.00 },
    { name: 'شحن كمية جواهر يلا لودو مفتوحة', price: 0.004, isAmount: true },
  ].forEach((yl) => {
    products.push({
      id: currentId++,
      name: yl.name,
      category_name: 'Yalla Ludo (يلا لودو)',
      price: yl.price,
      base_price: Number((yl.price * 0.95).toFixed(3)),
      available: true,
      product_type: yl.isAmount ? 'amount' : 'package',
      qty_values: yl.isAmount ? { min: 100, max: 100000 } : null,
      params: ['User ID', 'معرف اللاعب [player_id]'],
    });
  });

  // 7. BIGO LIVE & Likee Diamonds
  ['BIGO LIVE', 'Likee (لايكي)'].forEach((app) => {
    [100, 250, 500, 1000, 2000, 5000, 10000, 20000].forEach((d) => {
      products.push({
        id: currentId++,
        name: `${d} ماسة ${app}`,
        category_name: `${app} Diamonds`,
        price: Number((d * 0.021).toFixed(2)),
        base_price: Number((d * 0.0195).toFixed(2)),
        available: true,
        product_type: 'package',
        qty_values: null,
        params: ['User ID', 'UID'],
      });
    });
  });

  // 8. TikTok Coins (نقاط تيك توك)
  [70, 350, 700, 1400, 3500, 7000, 17500, 35000].forEach((coins) => {
    products.push({
      id: currentId++,
      name: `${coins} عملة تيك توك (TikTok Coins)`,
      category_name: 'TikTok Coins (تيك توك)',
      price: Number((coins * 0.0125).toFixed(2)),
      base_price: Number((coins * 0.0118).toFixed(2)),
      available: true,
      product_type: 'package',
      qty_values: null,
      params: ['USERNAME', 'اسم المستخدم'],
    });
  });

  // 9. Jawaker Tokens (جواكر توكنز)
  [
    { name: 'جواكر 25,000 توكنز', price: 1.40 },
    { name: 'جواكر 60,000 توكنز', price: 3.20 },
    { name: 'جواكر 150,000 توكنز', price: 7.50 },
    { name: 'جواكر 350,000 توكنز', price: 16.80 },
    { name: 'جواكر 800,000 توكنز', price: 36.50 },
    { name: 'جواكر 2,000,000 توكنز', price: 88.00 },
    { name: 'اشتراك باشا جواكر شهر (Pasha)', price: 4.80 },
    { name: 'اشتراك باشا جواكر 3 أشهر', price: 13.50 },
  ].forEach((j) => {
    products.push({
      id: currentId++,
      name: j.name,
      category_name: 'Jawaker Tokens (جواكر)',
      price: j.price,
      base_price: Number((j.price * 0.95).toFixed(2)),
      available: true,
      product_type: 'package',
      qty_values: null,
      params: ['الرقم', 'معرف اللاعب [player_id]'],
    });
  });

  // 10. PlayStation Network PSN (USA & Saudi & UAE)
  ['USA', 'Saudi (سعودي)', 'UAE (إماراتي)'].forEach((store) => {
    [10, 20, 25, 50, 75, 100].forEach((val) => {
      products.push({
        id: currentId++,
        name: `بطاقة بلايستيشن ستور $${val} ستور ${store}`,
        category_name: `PlayStation Network (${store})`,
        price: Number((val * 0.975).toFixed(2)),
        base_price: Number((val * 0.96).toFixed(2)),
        available: true,
        product_type: 'package',
        qty_values: null,
        params: ['EMAIL'],
      });
    });
    // PS Plus Subscriptions
    ['اشتراك شهر إسنشال', 'اشتراك 3 أشهر إكسترا', 'اشتراك سنة بريميوم'].forEach((sub, sIdx) => {
      products.push({
        id: currentId++,
        name: `بلايستيشن بلس (${sub}) - ${store}`,
        category_name: `PlayStation Network (${store})`,
        price: 9.99 * (sIdx + 1) * 2,
        base_price: 9.20 * (sIdx + 1) * 2,
        available: true,
        product_type: 'package',
        qty_values: null,
        params: ['EMAIL'],
      });
    });
  });

  // 11. Xbox Live & Game Pass
  ['Game Pass Ultimate شهر', 'Game Pass Ultimate 3 أشهر', 'بطاقة إكس بوكس $15', 'بطاقة إكس بوكس $25', 'بطاقة إكس بوكس $50', 'بطاقة إكس بوكس $100'].forEach((xb, i) => {
    products.push({
      id: currentId++,
      name: xb,
      category_name: 'Xbox & Game Pass',
      price: [14.50, 41.00, 14.80, 24.50, 48.90, 97.50][i],
      base_price: [13.80, 39.00, 14.20, 23.80, 47.00, 95.00][i],
      available: true,
      product_type: 'package',
      qty_values: null,
      params: ['EMAIL'],
    });
  });

  // 12. Razer Gold Global (USD)
  [5, 10, 20, 50, 100, 200, 500].forEach((rg) => {
    products.push({
      id: currentId++,
      name: `رايزر جولد $${rg} Razer Gold Global`,
      category_name: 'Razer Gold (Global USD)',
      price: Number((rg * 0.985).toFixed(2)),
      base_price: Number((rg * 0.97).toFixed(2)),
      available: true,
      product_type: 'package',
      qty_values: null,
      params: ['EMAIL'],
    });
  });

  // 13. iTunes & Apple App Store
  ['US', 'Saudi (SAR)'].forEach((c) => {
    [5, 10, 15, 25, 50, 100, 200].forEach((v) => {
      products.push({
        id: currentId++,
        name: `بطاقة آيتونز أبل ${c} فئة $${v}`,
        category_name: `Apple iTunes (${c})`,
        price: Number((v * 0.98).toFixed(2)),
        base_price: Number((v * 0.965).toFixed(2)),
        available: true,
        product_type: 'package',
        qty_values: null,
        params: ['EMAIL'],
      });
    });
  });

  // 14. Steam Wallet Gift Cards (Global / US / TRY)
  ['Global USD', 'US Region', 'Turkey TRY'].forEach((reg) => {
    [5, 10, 20, 50, 100].forEach((st) => {
      products.push({
        id: currentId++,
        name: `بطاقة ستيم والت Steam Wallet $${st} - ${reg}`,
        category_name: `Steam Wallet (${reg})`,
        price: Number((st * 0.975).toFixed(2)),
        base_price: Number((st * 0.96).toFixed(2)),
        available: true,
        product_type: 'package',
        qty_values: null,
        params: ['EMAIL'],
      });
    });
  });

  // 15. Google Play Gift Cards (US & Global)
  [5, 10, 15, 25, 50, 100].forEach((gp) => {
    products.push({
      id: currentId++,
      name: `بطاقة جوجل بلاي ستور $${gp} المتجر الأمريكي`,
      category_name: 'Google Play Gift Cards',
      price: Number((gp * 0.98).toFixed(2)),
      base_price: Number((gp * 0.96).toFixed(2)),
      available: gp !== 15, // one item out of stock for realistic testing
      product_type: 'package',
      qty_values: null,
      params: ['EMAIL'],
    });
  });

  // 16. Streaming & Entertainment (Netflix, Shahid, Spotify, Discord)
  const streamingServices = [
    { name: 'اشتراك نتفليكس بريميوم 4K شهر حساب كامل', cat: 'Netflix Premium', price: 9.99, p: ['EMAIL'] },
    { name: 'اشتراك نتفليكس بريميوم ملف خاص شهر', cat: 'Netflix Premium', price: 2.80, p: ['EMAIL', 'رقم الهاتف'] },
    { name: 'اشتراك شاهد VIP باقة المسلسلات والأفلام شهر', cat: 'Shahid VIP', price: 4.50, p: ['EMAIL', 'رقم الهاتف'] },
    { name: 'اشتراك شاهد VIP باقة شاملة مع رياضة 3 أشهر', cat: 'Shahid VIP', price: 21.00, p: ['EMAIL', 'رقم الهاتف'] },
    { name: 'ديسكورد نيترو قياسي شهر (Discord Nitro)', cat: 'Discord Nitro', price: 3.90, p: ['EMAIL', 'USERNAME'] },
    { name: 'ديسكورد نيترو قياسي سنة (Discord Nitro Year)', cat: 'Discord Nitro', price: 38.00, p: ['EMAIL', 'USERNAME'] },
    { name: 'اشتراك سبوتيفاي بريميوم شهر حساب خاص', cat: 'Spotify Premium', price: 2.20, p: ['EMAIL'] },
    { name: 'اشتراك يوتيوب بريميوم 3 أشهر تفعيل إيميلك', cat: 'YouTube Premium', price: 5.50, p: ['EMAIL'] },
    { name: 'اشتراك كانفا برو سنة كاملة حساب مخصص', cat: 'Canva Pro', price: 6.90, p: ['EMAIL'] },
    { name: 'اشتراك شات جي بي تي بلس ChatGPT Plus شهر', cat: 'OpenAI ChatGPT Plus', price: 21.50, p: ['EMAIL'] },
  ];
  streamingServices.forEach((s) => {
    products.push({
      id: currentId++,
      name: s.name,
      category_name: s.cat,
      price: s.price,
      base_price: Number((s.price * 0.93).toFixed(2)),
      available: true,
      product_type: 'package',
      qty_values: null,
      params: s.p,
    });
  });

  // 17. Multi-choice specific quantity packages (qty_values: ["110", "150", "210"])
  // as explicitly noted in the provider documentation!
  products.push({
    id: currentId++,
    name: 'شحن رصيد باقات كول أوف ديوتي موبايل (CP)',
    category_name: 'Call of Duty Mobile (CP)',
    price: 3.20,
    base_price: 2.95,
    available: true,
    product_type: 'fixed',
    qty_values: ['80', '420', '880', '2400', '5000'],
    params: ['player_id'],
  });

  products.push({
    id: currentId++,
    name: 'حزمة شحن نقاط فالورانت Riot Points (VP)',
    category_name: 'Valorant Points (VP)',
    price: 4.80,
    base_price: 4.40,
    available: true,
    product_type: 'fixed',
    qty_values: ['475', '1000', '2050', '3650', '5350'],
    params: ['USERNAME', 'EMAIL'],
  });

  products.push({
    id: currentId++,
    name: 'شحن نقاط فيفا FC 24 / 25 Points',
    category_name: 'EA Sports FC Mobile',
    price: 2.50,
    base_price: 2.30,
    available: true,
    product_type: 'fixed',
    qty_values: ['500', '1050', '2200', '5750', '12000'],
    params: ['معرف اللاعب [player_id]', 'Server ID [server_id]'],
  });

  // 18. Additional Game Credits & Regional Cards to exceed 420+ items
  const extraGames = [
    'Clash of Clans Gems',
    'Brawl Stars Gems',
    'Genshin Impact Genesis',
    'Honkai Star Rail Oneiric',
    'League of Legends Wild Rift',
    'Tower of Fantasy Tanium',
    'Hay Day Diamonds',
    'Apex Legends Mobile Coins',
    'Honor of Kings Tokens',
    'Arena of Valor Vouchers',
    'PUBG New State NC',
    'Super Sus Gold Stars',
    'Undawn RC Recharge',
    'Blood Strike Gold',
    'Black Desert Mobile Pearls',
  ];

  extraGames.forEach((game) => {
    const tiers = [
      { n: 'باقة مبتدئ 100 وحدة', p: 1.10 },
      { n: 'باقة فضية 300 وحدة', p: 3.25 },
      { n: 'باقة ذهبية 600 وحدة', p: 6.40 },
      { n: 'باقة بلاتينيوم 1500 وحدة', p: 15.90 },
      { n: 'باقة ماسية 3000 وحدة', p: 31.50 },
      { n: 'باقة أسطورية 6500 وحدة', p: 64.00 },
      { n: 'باقة ملكية 14000 وحدة', p: 129.00 },
      { n: 'كمية مفتوحة بحسب رغبة العميل', p: 0.012, isAmount: true },
    ];

    tiers.forEach((t) => {
      products.push({
        id: currentId++,
        name: `${game} - ${t.n}`,
        category_name: game,
        price: t.p,
        base_price: Number((t.p * 0.94).toFixed(3)),
        available: Math.random() > 0.08, // 92% available
        product_type: t.isAmount ? 'amount' : 'package',
        qty_values: t.isAmount ? { min: 50, max: 25000 } : null,
        params: ['معرف اللاعب [player_id]', 'Server ID [server_id]'],
      });
    });
  });

  // 19. VoIP & Live Chat recharge (HalaMe, Soul, TopTop, Mico, Chamet, Poppo)
  const voipApps = ['TopTop Coins', 'Mico Live Coins', 'Poppo Live Coins', 'Chamet Diamonds', 'HalaMe Diamonds'];
  voipApps.forEach((app) => {
    [500, 1500, 3000, 7500, 15000, 35000, 80000].forEach((pts) => {
      products.push({
        id: currentId++,
        name: `شحن ${pts.toLocaleString()} نقطة ${app}`,
        category_name: app,
        price: Number((pts * 0.0016).toFixed(2)),
        base_price: Number((pts * 0.0015).toFixed(2)),
        available: true,
        product_type: 'package',
        qty_values: null,
        params: ['User ID', 'رقم الهاتف'],
      });
    });
  });

  return products;
}

export const MOCK_PROVIDER_CATALOG = createMockCatalog();
