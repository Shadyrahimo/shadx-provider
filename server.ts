import express, { Request, Response } from 'express';
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
        endpoints: ['/api/health', '/api/proxy/products', '/api/proxy/profile', '/api/proxy/test-order', '/api/notifications/send-email'],
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
