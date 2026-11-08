import { RawProviderProduct, ProviderPreset } from '../types';

export const PROVIDER_PRESETS: ProviderPreset[] = [
  {
    id: 'custom',
    name: 'مزود مخصص (ربط مباشر)',
    baseUrl: '',
    defaultToken: '',
    description: 'أدخل رابط الـ Base URL الخاص بالمزود ورمز الـ API Token الحقيقي الخاص بحسابك',
    badge: 'مباشر',
  },
  {
    id: 'mersal',
    name: 'Mersal Card API (مرسال كارد)',
    baseUrl: 'https://api.mersal-card.com/',
    defaultToken: '',
    description: 'مزود معتمد لبطاقات وشحن الألعاب والبطاقات الرقمية — أدخل التوكن الحقيقي الخاص بك',
    badge: 'مدعوم',
  },
  {
    id: 'tartousi',
    name: 'Tartousi Store API (متجر طرطوسي)',
    baseUrl: 'https://api.tartousi-store1.com/',
    defaultToken: '',
    description: 'مزود خدمات الألعاب وحزم شحن الأيدي والاشتراكات الرقمية — أدخل التوكن الحقيقي الخاص بك',
    badge: 'مدعوم',
  },
  {
    id: 'alkasr',
    name: 'Alkasr VIP API (القصر VIP)',
    baseUrl: 'https://api.alkasr-vip.com/',
    defaultToken: '',
    description: 'بوابة شحن الألعاب المباشرة بالجملة وأرصدة التطبيقات — أدخل التوكن الحقيقي الخاص بك',
    badge: 'مدعوم',
  },
];

// Clean empty initial catalog — populated exclusively from real provider API responses
export const MOCK_PROVIDER_CATALOG: RawProviderProduct[] = [];
