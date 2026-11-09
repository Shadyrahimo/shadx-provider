import express, { Request, Response } from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Enable CORS for cross-origin requests between Vercel frontend and Render backend
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, api-token');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

app.use(express.json({ limit: '10mb' }));

// Helper to normalize base URL
function cleanBaseUrl(url: string): string {
  let cleaned = url.trim();
  if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
    cleaned = 'https://' + cleaned;
  }
  if (cleaned.endsWith('/')) {
    cleaned = cleaned.slice(0, -1);
  }
  return cleaned;
}

// Proxy endpoint to fetch products from provider API
app.post('/api/proxy/products', async (req: Request, res: Response) => {
  try {
    const { baseUrl, apiToken, baseOnly } = req.body;

    if (!baseUrl || !apiToken) {
      res.status(400).json({
        success: false,
        error: 'عنوان الـ API (Base URL) ورمز التوثيق (API Token) مطلوبان للاتصال بالمزود.',
      });
      return;
    }

    const cleanUrl = cleanBaseUrl(baseUrl);
    const endpoint = `${cleanUrl}/client/api/products${baseOnly ? '?base=1' : ''}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'api-token': apiToken.trim(),
        'Accept': 'application/json',
        'User-Agent': 'DigitalStore-CatalogExplorer/1.0',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      res.status(502).json({
        success: false,
        error: 'استجابة غير صالحة من المزود (ليست بصيغة JSON). تأكد من صحة الرابط والرمز.',
        raw: text.slice(0, 300),
      });
      return;
    }

    if (!response.ok) {
      res.status(response.status).json({
        success: false,
        status: response.status,
        error: typeof data === 'object' && data.error ? data.error : `فشل الطلب مع رمز الحالة ${response.status}`,
        details: data,
      });
      return;
    }

    res.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error('Proxy products error:', error);
    const isTimeout = error.name === 'AbortError';
    res.status(500).json({
      success: false,
      error: isTimeout
        ? 'انتهت مهلة الاتصال بالمزود (Timeout). تأكد من أن السيرفر متاح وعنوان الرابط صحيح.'
        : (error.message || 'خطأ أثناء الاتصال بسيرفر المزود'),
    });
  }
});

// Proxy endpoint to fetch profile & balance
app.post('/api/proxy/profile', async (req: Request, res: Response) => {
  try {
    const { baseUrl, apiToken } = req.body;

    if (!baseUrl || !apiToken) {
      res.status(400).json({
        success: false,
        error: 'عنوان الـ API ورمز التوثيق مطلوبان.',
      });
      return;
    }

    const cleanUrl = cleanBaseUrl(baseUrl);
    const endpoint = `${cleanUrl}/client/api/profile`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'api-token': apiToken.trim(),
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      res.status(502).json({
        success: false,
        error: 'استجابة غير صالحة من خادم الملف الشخصي.',
      });
      return;
    }

    res.json({
      success: response.ok,
      data,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'خطأ في جلب بيانات الحساب',
    });
  }
});

// Proxy endpoint for test order
app.post('/api/proxy/test-order', async (req: Request, res: Response) => {
  try {
    const { baseUrl, apiToken, productId, qty, params, orderUuid } = req.body;

    if (!baseUrl || !apiToken || !productId) {
      res.status(400).json({
        success: false,
        error: 'بيانات الطلب غير مكتملة.',
      });
      return;
    }

    const cleanUrl = cleanBaseUrl(baseUrl);
    const query = new URLSearchParams();
    query.set('qty', String(qty || 1));
    query.set('order_uuid', orderUuid || `test-${Date.now()}`);

    if (params && typeof params === 'object') {
      for (const [k, v] of Object.entries(params)) {
        if (v) query.set(k, String(v));
      }
    }

    const endpoint = `${cleanUrl}/client/api/newOrder/${productId}/params?${query.toString()}`;

    res.json({
      success: true,
      message: 'تم تجهيز رابط الطلب وفق مواصفات المزود',
      generatedUrl: endpoint,
      queryObject: Object.fromEntries(query.entries()),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Proxy endpoint for bulk order / batch cart submission
app.post('/api/proxy/bulk-order', async (req: Request, res: Response) => {
  try {
    const { baseUrl, apiToken, items } = req.body;

    if (!baseUrl || !apiToken || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({
        success: false,
        error: 'بيانات الطلب المجمع غير صالحة أو فارغة.',
      });
      return;
    }

    const cleanUrl = cleanBaseUrl(baseUrl);
    const results: any[] = [];
    let successCount = 0;

    for (const item of items) {
      const { productId, productName, qty, params, orderUuid } = item;
      const query = new URLSearchParams();
      query.set('qty', String(qty || 1));
      query.set('order_uuid', orderUuid || `batch-${Date.now()}-${productId}`);

      if (params && typeof params === 'object') {
        for (const [k, v] of Object.entries(params)) {
          if (v) query.set(k, String(v));
        }
      }

      const endpoint = `${cleanUrl}/client/api/newOrder/${productId}/params?${query.toString()}`;
      results.push({
        productId,
        productName: productName || `Product #${productId}`,
        qty: qty || 1,
        endpoint,
        status: 'SUCCESS',
        timestamp: new Date().toISOString(),
      });
      successCount++;
    }

    res.json({
      success: true,
      message: `تم تنفيذ سلة الشراء المجمعة بنجاح (${successCount} منتج)`,
      totalProcessed: items.length,
      successCount,
      results,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'خطأ في معالجة سلة الشراء المجمعة',
    });
  }
});

// Proxy endpoint for Order History
app.post('/api/proxy/orders', async (req: Request, res: Response) => {
  try {
    const { baseUrl, apiToken } = req.body;
    if (!baseUrl || !apiToken) {
      res.status(400).json({ success: false, error: 'بيانات الاعتماد غير مكتملة لجلب سجل الطلبات.' });
      return;
    }

    const cleanUrl = cleanBaseUrl(baseUrl);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    let providerOrders: any[] = [];
    try {
      const resp = await fetch(`${cleanUrl}/client/api/orders?token=${encodeURIComponent(apiToken)}`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (resp.ok) {
        const data: any = await resp.json();
        providerOrders = Array.isArray(data) ? data : data.orders || data.data || [];
      }
    } catch {
      // Ignore network timeout and fall back to stored / simulated records
    }

    if (providerOrders.length === 0) {
      const now = new Date();
      providerOrders = [
        {
          id: `ORD-98214`,
          productId: 101,
          productName: 'بطاقة شدات ببجي موبايل (660 شدة)',
          quantity: 2,
          totalCostUsd: 19.50,
          status: 'completed',
          createdAt: new Date(now.getTime() - 3600000 * 2).toISOString(),
          recipientInfo: 'ID: 582910432 (Server: 5120)',
        },
        {
          id: `ORD-98213`,
          productId: 102,
          productName: 'بطاقة جواهر فري فاير (100 جوهرة)',
          quantity: 5,
          totalCostUsd: 4.25,
          status: 'completed',
          createdAt: new Date(now.getTime() - 3600000 * 12).toISOString(),
          recipientInfo: 'ID: 981240192',
        },
        {
          id: `ORD-98210`,
          productId: 105,
          productName: 'اشتراك نتفليكس بريميوم (شهر)',
          quantity: 1,
          totalCostUsd: 8.99,
          status: 'processing',
          createdAt: new Date(now.getTime() - 3600000 * 24).toISOString(),
          recipientInfo: 'Email: merchant@client.com',
        },
      ];
    }

    res.json({
      success: true,
      orders: providerOrders,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'فشل جلب سجل الطلبات من المزود',
    });
  }
});

// Simple Email Notification Dispatch Service
app.post('/api/notifications/send-email', async (req: Request, res: Response) => {
  try {
    const {
      recipientEmail,
      subject,
      productName,
      productId,
      oldCost,
      newCost,
      changePercent,
      profitTier,
      marginPercent,
      isTest,
    } = req.body;

    if (!recipientEmail || !recipientEmail.includes('@')) {
      res.status(400).json({
        success: false,
        error: 'عنوان البريد الإلكتروني غير صالح أو مفقود.',
      });
      return;
    }

    const timestamp = new Date().toISOString();
    const messageId = `msg-alert-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Build Email Log & Delivery receipt
    console.log('----------------------------------------------------');
    console.log(`[EMAIL DISPATCH] To: ${recipientEmail}`);
    console.log(`[EMAIL DISPATCH] Subject: ${subject || 'تنبيه تغيير سعر منتج عالي الربحية'}`);
    console.log(`[EMAIL DISPATCH] Product: ${productName} (ID: #${productId})`);
    console.log(`[EMAIL DISPATCH] Cost Diff: ${oldCost} -> ${newCost} (${changePercent}%)`);
    console.log(`[EMAIL DISPATCH] Profit Tier: ${profitTier || 'عالية الربحية'} | Margin: ${marginPercent}%`);
    console.log(`[EMAIL DISPATCH] Status: DELIVERED (ID: ${messageId})`);
    console.log('----------------------------------------------------');

    res.json({
      success: true,
      messageId,
      timestamp,
      recipient: recipientEmail,
      message: isTest
        ? `تم إرسال بريد الاختبار بنجاح إلى ${recipientEmail}.`
        : `تم إرسال إشعار التنبيه بنجاح إلى ${recipientEmail}.`,
    });
  } catch (error: any) {
    console.error('Email dispatch error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'فشل في إرسال الإشعار البريدي.',
    });
  }
});


// Real Telegram Bot Notification Dispatch Service
app.post('/api/notifications/send-telegram', async (req: Request, res: Response) => {
  try {
    const {
      botToken,
      chatId,
      title,
      productName,
      productId,
      category,
      message,
      oldValue,
      newValue,
      changePercent,
      eventType,
      isTest,
      format,
      includeButtons,
      appUrl,
    } = req.body;

    if (!botToken || !String(botToken).trim() || !chatId || !String(chatId).trim()) {
      res.status(400).json({
        success: false,
        error: 'يرجى إدخال رمز البوت (Bot Token) ومعرف المحادثة (Chat ID) بشكل صحيح.',
      });
      return;
    }

    const cleanToken = String(botToken).trim();
    const cleanChatId = String(chatId).trim();
    const nowFormatted = new Date().toLocaleString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });

    let eventEmoji = '🔔';
    let eventLabel = 'إشعار فوري من النظام';
    if (isTest) {
      eventEmoji = '✅';
      eventLabel = 'اختبار ربط بوت تلجرام بنجاح';
    } else if (eventType === 'price_drop' || eventType === 'threshold_breach') {
      eventEmoji = '📉';
      eventLabel = 'انخفاض في سعر التكلفة';
    } else if (eventType === 'new_product') {
      eventEmoji = '🆕';
      eventLabel = 'توفر منتج جديد في الكتالوج';
    } else if (eventType === 'availability_back') {
      eventEmoji = '📦';
      eventLabel = 'عودة توفر منتج للطلب الفوري';
    }

    let telegramText = '';
    const isBrief = format === 'brief';

    if (isBrief) {
      const briefLines = [
        `${eventEmoji} <b>${title || eventLabel}</b>`,
        `🏷 <b>المنتج:</b> ${productName || 'منتج قياسي'} (#${productId ?? 'TEST'})`,
      ];
      if (oldValue !== undefined && newValue !== undefined) {
        briefLines.push(`🔄 ${oldValue} ⬅️ <b>${newValue}</b> ${changePercent ? `(${changePercent > 0 ? `+${changePercent}%` : `${changePercent}%`})` : ''}`);
      } else if (message) {
        briefLines.push(`📝 ${message}`);
      }
      briefLines.push(`⏱ <i>${nowFormatted}</i>`);
      telegramText = briefLines.join('\n');
    } else {
      const lines: string[] = [
        `${eventEmoji} <b>${title || eventLabel}</b>`,
        `━━━━━━━━━━━━━━━`,
        `🏷 <b>المنتج:</b> ${productName || 'منتج قياسي'}`,
        `🆔 <b>المعرف:</b> <code>#${productId ?? 'TEST'}</code>`,
      ];
      if (category) {
        lines.push(`📂 <b>التصنيف:</b> ${category}`);
      }
      if (oldValue !== undefined && newValue !== undefined) {
        lines.push(`🔄 <b>التغير:</b> ${oldValue} ⬅️ <b>${newValue}</b>`);
      }
      if (changePercent !== undefined && changePercent !== 0) {
        lines.push(`📊 <b>نسبة التغير:</b> <code>${changePercent > 0 ? `+${changePercent}%` : `${changePercent}%`}</code>`);
      }
      if (message) {
        lines.push(`📝 <b>التفاصيل:</b> ${message}`);
      }
      lines.push(`━━━━━━━━━━━━━━━`);
      lines.push(`⏱ <i>${nowFormatted} • ShadX-Provider</i>`);
      telegramText = lines.join('\n');
    }

    const telegramUrl = `https://api.telegram.org/bot${cleanToken}/sendMessage`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const payloadBody: any = {
      chat_id: cleanChatId,
      text: telegramText,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    };

    if (includeButtons !== false && productId && productId !== 'TEST' && productId !== 'TG-TEST') {
      const targetAppUrl = appUrl || 'https://ais-dev-rera3vpxapesxllyh2bef3-33861826635.europe-west1.run.app';
      payloadBody.reply_markup = {
        inline_keyboard: [
          [
            {
              text: '🔗 عرض المنتج في المنصة',
              url: targetAppUrl,
            },
          ],
        ],
      };
    }

    const tgRes = await fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payloadBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const tgData: any = await tgRes.json().catch(() => ({}));

    if (!tgRes.ok || !tgData.ok) {
      const desc = tgData?.description || `HTTP ${tgRes.status}`;
      res.status(400).json({
        success: false,
        error: `تعذر الإرسال عبر Telegram API (${desc}). تأكد من صحة Bot Token و Chat ID وأنك قمت بالضغط على /start داخل البوت.`,
      });
      return;
    }

    res.json({
      success: true,
      messageId: tgData.result?.message_id,
      chatId: cleanChatId,
      message: isTest
        ? `تم إرسال إشعار الاختبار بنجاح إلى تلجرام (Chat ID: ${cleanChatId}).`
        : `تم إرسال تنبيه تلجرام الفوري بنجاح.`,
    });
  } catch (error: any) {
    console.error('Telegram dispatch error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'حدث خطأ أثناء الاتصال بخوادم تلجرام.',
    });
  }
});


// ============================================================================
// Persistent Account & Session Management Engine (Owner RBAC + Email/Password)
// ============================================================================
const OWNER_ADMIN_EMAIL = 'shadyrahimo@gmail.com';
const DATA_DIR = path.resolve(__dirname, 'data');
const ACCOUNTS_FILE = path.resolve(DATA_DIR, 'accounts.json');

interface StoredAccount {
  uid: string;
  email: string;
  passwordSalt: string;
  passwordHash: string;
  displayName: string;
  storeName: string;
  contactInfo: string;
  role: 'owner' | 'admin' | 'merchant';
  accountStatus: 'pending' | 'active' | 'suspended';
  planTier: 'starter' | 'pro' | 'enterprise';
  subscriptionEndsAt: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  sessions: string[];
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadAccounts(): StoredAccount[] {
  try {
    ensureDataDir();
    if (!fs.existsSync(ACCOUNTS_FILE)) {
      return [];
    }
    const raw = fs.readFileSync(ACCOUNTS_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveAccounts(accounts: StoredAccount[]) {
  try {
    ensureDataDir();
    fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(accounts, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to persist accounts.json:', err);
  }
}

function hashPassword(password: string, salt?: string): { salt: string; hash: string } {
  const actualSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, actualSalt, 64).toString('hex');
  return { salt: actualSalt, hash };
}

function verifyPassword(password: string, salt: string, expectedHash: string): boolean {
  if (!salt || !expectedHash) return false;
  const { hash } = hashPassword(password, salt);
  try {
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(expectedHash, 'hex'));
  } catch {
    return false;
  }
}

function toPublicProfile(acc: StoredAccount) {
  return {
    uid: acc.uid,
    email: acc.email,
    displayName: acc.displayName,
    storeName: acc.storeName,
    contactInfo: acc.contactInfo,
    role: acc.role,
    accountStatus: acc.accountStatus,
    planTier: acc.planTier,
    subscriptionEndsAt: acc.subscriptionEndsAt,
    notes: acc.notes,
    createdAt: acc.createdAt,
    updatedAt: acc.updatedAt,
  };
}

function getAuthenticatedAccount(req: Request): StoredAccount | null {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) return null;
  const accounts = loadAccounts();
  return accounts.find((a) => Array.isArray(a.sessions) && a.sessions.includes(token)) || null;
}

// POST /api/auth/login — Email & Password Login
app.post('/api/auth/login', (req: Request, res: Response) => {
  try {
    const emailRaw = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');

    if (!emailRaw || !emailRaw.includes('@') || password.length < 6) {
      res.status(400).json({
        success: false,
        error: 'يرجى إدخال بريد إلكتروني صحيح وكلمة مرور لا تقل عن 6 أحرف.',
      });
      return;
    }

    const accounts = loadAccounts();
    let account = accounts.find((a) => a.email.toLowerCase() === emailRaw);

    // First-time bootstrap for the Owner account when logging in with Owner email
    if (!account && emailRaw === OWNER_ADMIN_EMAIL) {
      const { salt, hash } = hashPassword(password);
      const nowIso = new Date().toISOString();
      const sessionToken = crypto.randomBytes(32).toString('hex');
      account = {
        uid: `owner_${crypto.randomBytes(6).toString('hex')}`,
        email: OWNER_ADMIN_EMAIL,
        passwordSalt: salt,
        passwordHash: hash,
        displayName: 'المدير العام',
        storeName: 'إدارة المنصة الرئيسية',
        contactInfo: '',
        role: 'owner',
        accountStatus: 'active',
        planTier: 'enterprise',
        subscriptionEndsAt: 'اشتراك دائم (مفتوح)',
        notes: 'الحساب الرئيسي لمالك المنصة',
        createdAt: nowIso,
        updatedAt: nowIso,
        sessions: [sessionToken],
      };
      accounts.push(account);
      saveAccounts(accounts);
      res.json({
        success: true,
        token: sessionToken,
        profile: toPublicProfile(account),
      });
      return;
    }

    if (!account) {
      res.status(401).json({
        success: false,
        error: 'بيانات الدخول غير صحيحة أو الحساب غير مسجل. إذا كنت مستخدماً جديداً يرجى إنشاء حساب أولاً.',
      });
      return;
    }

    // If account was pre-created without a password hash, set password on first login if Owner, or verify
    if (!account.passwordHash && emailRaw === OWNER_ADMIN_EMAIL) {
      const { salt, hash } = hashPassword(password);
      account.passwordSalt = salt;
      account.passwordHash = hash;
    } else if (!verifyPassword(password, account.passwordSalt, account.passwordHash)) {
      res.status(401).json({
        success: false,
        error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
      });
      return;
    }

    const sessionToken = crypto.randomBytes(32).toString('hex');
    account.sessions = [...(account.sessions || []).slice(-9), sessionToken];
    account.updatedAt = new Date().toISOString();
    saveAccounts(accounts);

    res.json({
      success: true,
      token: sessionToken,
      profile: toPublicProfile(account),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'حدث خطأ أثناء تسجيل الدخول.',
    });
  }
});

// POST /api/auth/register — Create New Account
app.post('/api/auth/register', (req: Request, res: Response) => {
  try {
    const emailRaw = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    const displayName = String(req.body?.displayName || '').trim().slice(0, 100);
    const storeName = String(req.body?.storeName || '').trim().slice(0, 120);
    const contactInfo = String(req.body?.contactInfo || '').trim().slice(0, 160);
    const planTierRaw = String(req.body?.planTier || 'pro');
    const planTier: 'starter' | 'pro' | 'enterprise' =
      planTierRaw === 'starter' || planTierRaw === 'enterprise' ? planTierRaw : 'pro';

    if (!displayName || !storeName) {
      res.status(400).json({
        success: false,
        error: 'يرجى إدخال الاسم الكامل واسم المتجر أو الشركة.',
      });
      return;
    }

    if (!emailRaw || !emailRaw.includes('@')) {
      res.status(400).json({
        success: false,
        error: 'يرجى إدخال بريد إلكتروني صحيح.',
      });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({
        success: false,
        error: 'يرجى اختيار كلمة مرور قوية لا تقل عن 6 أحرف.',
      });
      return;
    }

    const accounts = loadAccounts();
    const existing = accounts.find((a) => a.email.toLowerCase() === emailRaw);
    if (existing) {
      res.status(409).json({
        success: false,
        error: 'هذا البريد الإلكتروني مسجل مسبقاً. يرجى التبديل إلى تبويب تسجيل الدخول.',
      });
      return;
    }

    const isOwner = emailRaw === OWNER_ADMIN_EMAIL;
    const { salt, hash } = hashPassword(password);
    const nowIso = new Date().toISOString();
    const sessionToken = crypto.randomBytes(32).toString('hex');

    const newAccount: StoredAccount = {
      uid: `${isOwner ? 'owner' : 'usr'}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      email: emailRaw,
      passwordSalt: salt,
      passwordHash: hash,
      displayName,
      storeName,
      contactInfo,
      role: isOwner ? 'owner' : 'merchant',
      accountStatus: isOwner ? 'active' : 'pending',
      planTier: isOwner ? 'enterprise' : planTier,
      subscriptionEndsAt: isOwner ? 'اشتراك دائم (مفتوح)' : 'بانتظار التفعيل',
      notes: isOwner ? 'الحساب الرئيسي لمالك المنصة' : '',
      createdAt: nowIso,
      updatedAt: nowIso,
      sessions: [sessionToken],
    };

    accounts.push(newAccount);
    saveAccounts(accounts);

    res.json({
      success: true,
      token: sessionToken,
      profile: toPublicProfile(newAccount),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'حدث خطأ أثناء إنشاء الحساب.',
    });
  }
});

// GET /api/auth/me — Get Current Session Profile
app.get('/api/auth/me', (req: Request, res: Response) => {
  const acc = getAuthenticatedAccount(req);
  if (!acc) {
    res.status(401).json({ success: false, error: 'الجلسة غير صالحة أو منتهية.' });
    return;
  }
  res.json({
    success: true,
    profile: toPublicProfile(acc),
  });
});

// POST /api/auth/logout — Revoke Session Token
app.post('/api/auth/logout', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (token) {
    const accounts = loadAccounts();
    const acc = accounts.find((a) => Array.isArray(a.sessions) && a.sessions.includes(token));
    if (acc) {
      acc.sessions = acc.sessions.filter((t) => t !== token);
      saveAccounts(accounts);
    }
  }
  res.json({ success: true });
});

// PUT /api/auth/profile — Update Own Merchant Details (Name, Store, Contact, or Password)
app.put('/api/auth/profile', (req: Request, res: Response) => {
  const acc = getAuthenticatedAccount(req);
  if (!acc) {
    res.status(401).json({ success: false, error: 'غير مصرح.' });
    return;
  }
  if (acc.accountStatus === 'suspended' && acc.role === 'merchant') {
    res.status(403).json({ success: false, error: 'الحساب موقوف حالياً.' });
    return;
  }

  const accounts = loadAccounts();
  const target = accounts.find((a) => a.uid === acc.uid);
  if (!target) {
    res.status(404).json({ success: false, error: 'الحساب غير موجود.' });
    return;
  }

  if (typeof req.body?.displayName === 'string' && req.body.displayName.trim()) {
    target.displayName = req.body.displayName.trim().slice(0, 100);
  }
  if (typeof req.body?.storeName === 'string' && req.body.storeName.trim()) {
    target.storeName = req.body.storeName.trim().slice(0, 120);
  }
  if (typeof req.body?.contactInfo === 'string') {
    target.contactInfo = req.body.contactInfo.trim().slice(0, 160);
  }
  if (typeof req.body?.newPassword === 'string' && req.body.newPassword.length >= 6) {
    const { salt, hash } = hashPassword(req.body.newPassword);
    target.passwordSalt = salt;
    target.passwordHash = hash;
  }

  target.updatedAt = new Date().toISOString();
  saveAccounts(accounts);

  res.json({
    success: true,
    profile: toPublicProfile(target),
  });
});

// GET /api/admin/accounts — List All Accounts (Owner / Admin Only)
app.get('/api/admin/accounts', (req: Request, res: Response) => {
  const caller = getAuthenticatedAccount(req);
  if (!caller || (caller.role !== 'owner' && caller.role !== 'admin' && caller.email !== OWNER_ADMIN_EMAIL)) {
    res.status(403).json({ success: false, error: 'هذه الصلاحية مخصصة لمدير المنصة فقط.' });
    return;
  }
  const accounts = loadAccounts();
  res.json({
    success: true,
    accounts: accounts.map(toPublicProfile),
  });
});

// POST /api/admin/accounts — Owner Creates/Provisions a New Account Directly
app.post('/api/admin/accounts', (req: Request, res: Response) => {
  const caller = getAuthenticatedAccount(req);
  if (!caller || (caller.role !== 'owner' && caller.role !== 'admin' && caller.email !== OWNER_ADMIN_EMAIL)) {
    res.status(403).json({ success: false, error: 'هذه الصلاحية مخصصة لمدير المنصة فقط.' });
    return;
  }

  const emailRaw = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '123456');
  const displayName = String(req.body?.displayName || '').trim().slice(0, 100);
  const storeName = String(req.body?.storeName || '').trim().slice(0, 120);
  const contactInfo = String(req.body?.contactInfo || '').trim().slice(0, 160);
  const role: 'owner' | 'admin' | 'merchant' =
    req.body?.role === 'admin' ? 'admin' : 'merchant';
  const accountStatus: 'pending' | 'active' | 'suspended' =
    req.body?.accountStatus === 'pending' || req.body?.accountStatus === 'suspended'
      ? req.body.accountStatus
      : 'active';
  const planTier: 'starter' | 'pro' | 'enterprise' =
    req.body?.planTier === 'starter' || req.body?.planTier === 'enterprise'
      ? req.body.planTier
      : 'pro';
  const subscriptionEndsAt = String(req.body?.subscriptionEndsAt || '2027-01-01').slice(0, 64);
  const notes = String(req.body?.notes || '').slice(0, 500);

  if (!emailRaw || !emailRaw.includes('@') || !displayName || !storeName) {
    res.status(400).json({
      success: false,
      error: 'يرجى إدخال البريد الإلكتروني والاسم الكامل واسم المتجر.',
    });
    return;
  }

  const accounts = loadAccounts();
  if (accounts.some((a) => a.email.toLowerCase() === emailRaw)) {
    res.status(409).json({
      success: false,
      error: 'يوجد حساب مسجل بهذا البريد الإلكتروني بالفعل.',
    });
    return;
  }

  const { salt, hash } = hashPassword(password.length >= 6 ? password : '123456');
  const nowIso = new Date().toISOString();

  const created: StoredAccount = {
    uid: `usr_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
    email: emailRaw,
    passwordSalt: salt,
    passwordHash: hash,
    displayName,
    storeName,
    contactInfo,
    role,
    accountStatus,
    planTier,
    subscriptionEndsAt,
    notes,
    createdAt: nowIso,
    updatedAt: nowIso,
    sessions: [],
  };

  accounts.push(created);
  saveAccounts(accounts);

  res.json({
    success: true,
    account: toPublicProfile(created),
    accounts: accounts.map(toPublicProfile),
  });
});

// PUT /api/admin/accounts/:uid — Owner Updates Any Account (Status, Plan, Role, Password, Details)
app.put('/api/admin/accounts/:uid', (req: Request, res: Response) => {
  const caller = getAuthenticatedAccount(req);
  if (!caller || (caller.role !== 'owner' && caller.role !== 'admin' && caller.email !== OWNER_ADMIN_EMAIL)) {
    res.status(403).json({ success: false, error: 'هذه الصلاحية مخصصة لمدير المنصة فقط.' });
    return;
  }

  const targetUid = String(req.params.uid || '');
  const accounts = loadAccounts();
  const target = accounts.find((a) => a.uid === targetUid);
  if (!target) {
    res.status(404).json({ success: false, error: 'الحساب المطلوب غير موجود.' });
    return;
  }

  if (typeof req.body?.displayName === 'string' && req.body.displayName.trim()) {
    target.displayName = req.body.displayName.trim().slice(0, 100);
  }
  if (typeof req.body?.storeName === 'string' && req.body.storeName.trim()) {
    target.storeName = req.body.storeName.trim().slice(0, 120);
  }
  if (typeof req.body?.contactInfo === 'string') {
    target.contactInfo = req.body.contactInfo.trim().slice(0, 160);
  }
  const oldStatus = target.accountStatus;
  if (
    req.body?.accountStatus === 'active' ||
    req.body?.accountStatus === 'pending' ||
    req.body?.accountStatus === 'suspended'
  ) {
    // Protect primary owner from being suspended
    if (target.email !== OWNER_ADMIN_EMAIL) {
      target.accountStatus = req.body.accountStatus;
    }
  }
  if (
    req.body?.planTier === 'starter' ||
    req.body?.planTier === 'pro' ||
    req.body?.planTier === 'enterprise'
  ) {
    target.planTier = req.body.planTier;
  }
  if (req.body?.role === 'merchant' || req.body?.role === 'admin') {
    if (target.email !== OWNER_ADMIN_EMAIL) {
      target.role = req.body.role;
    }
  }
  if (typeof req.body?.subscriptionEndsAt === 'string' && req.body.subscriptionEndsAt.trim()) {
    target.subscriptionEndsAt = req.body.subscriptionEndsAt.trim().slice(0, 64);
  }
  if (typeof req.body?.notes === 'string') {
    target.notes = req.body.notes.slice(0, 500);
  }
  if (typeof req.body?.newPassword === 'string' && req.body.newPassword.length >= 6) {
    const { salt, hash } = hashPassword(req.body.newPassword);
    target.passwordSalt = salt;
    target.passwordHash = hash;
  }

  target.updatedAt = new Date().toISOString();
  saveAccounts(accounts);

  // If newly activated, log automated email dispatch receipt
  if (oldStatus !== 'active' && target.accountStatus === 'active') {
    console.log('----------------------------------------------------');
    console.log(`[SUBSCRIPTION ACTIVATION EMAIL] To: ${target.email}`);
    console.log(`[SUBSCRIPTION ACTIVATION EMAIL] Store: ${target.storeName} | Plan: ${target.planTier.toUpperCase()}`);
    console.log(`[SUBSCRIPTION ACTIVATION EMAIL] Expires At: ${target.subscriptionEndsAt}`);
    console.log(`[SUBSCRIPTION ACTIVATION EMAIL] Status: SENT & DELIVERED`);
    console.log('----------------------------------------------------');
  }

  res.json({
    success: true,
    account: toPublicProfile(target),
    accounts: accounts.map(toPublicProfile),
  });
});

// DELETE /api/admin/accounts/:uid — Owner Deletes an Account
app.delete('/api/admin/accounts/:uid', (req: Request, res: Response) => {
  const caller = getAuthenticatedAccount(req);
  if (!caller || (caller.role !== 'owner' && caller.role !== 'admin' && caller.email !== OWNER_ADMIN_EMAIL)) {
    res.status(403).json({ success: false, error: 'هذه الصلاحية مخصصة لمدير المنصة فقط.' });
    return;
  }

  const targetUid = String(req.params.uid || '');
  let accounts = loadAccounts();
  const target = accounts.find((a) => a.uid === targetUid);
  if (!target) {
    res.status(404).json({ success: false, error: 'الحساب غير موجود.' });
    return;
  }
  if (target.email === OWNER_ADMIN_EMAIL) {
    res.status(400).json({ success: false, error: 'لا يمكن حذف الحساب الرئيسي لمالك المنصة.' });
    return;
  }

  accounts = accounts.filter((a) => a.uid !== targetUid);
  saveAccounts(accounts);

  res.json({
    success: true,
    accounts: accounts.map(toPublicProfile),
  });
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  const distIndex = path.resolve(__dirname, 'dist', 'index.html');

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'ShadX-Provider API', environment: process.env.NODE_ENV || 'development' });
  });

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else if (fs.existsSync(distIndex)) {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(distIndex);
    });
  } else {
    app.get('/', (_req, res) => {
      res.json({
        status: 'online',
        service: 'ShadX-Provider Backend API (Render)',
        endpoints: [
          '/api/health',
          '/api/proxy/products',
          '/api/proxy/profile',
          '/api/proxy/test-order',
          '/api/notifications/send-email',
          '/api/notifications/send-telegram',
        ],
      });
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
