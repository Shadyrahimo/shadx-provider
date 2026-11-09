export interface QtyRange {
  min: number | string;
  max: number | string;
}

export type QtyValues = null | (string | number)[] | QtyRange;

export interface RawProviderProduct {
  id: number | string;
  name: string;
  category_name?: string;
  price: number | string;
  base_price?: number | string;
  available?: boolean | string | number;
  product_type?: 'package' | 'amount' | 'fixed' | string;
  qty_values?: QtyValues;
  params?: string[] | string | Record<string, any>;
  category_img?: string;
  parent_id?: number;
}

export interface NormalizedParam {
  raw: string;
  normalizedKey: string;
  labelAr: string;
  category: 'player_id' | 'server_id' | 'email' | 'username' | 'phone' | 'uid' | 'custom';
}

export type IntegrationStatus = 'ready' | 'needs_fix' | 'unmapped';

export interface IntegrationDiagnostic {
  status: IntegrationStatus;
  statusLabel: string;
  missingFields: string[];
  suggestedParams: NormalizedParam[];
  fixReason: string;
}

export interface CatalogProduct {
  id: string | number;
  name: string;
  category: string;
  costPriceUsd: number;
  basePriceUsd?: number;
  suggestedSellPriceUsd: number;
  isAvailable: boolean;
  productType: 'package' | 'amount' | 'fixed';
  qtyValues: QtyValues;
  qtyDescriptionAr: string;
  limitsDisplay: string;
  rawParams: string[];
  normalizedParams: NormalizedParam[];
  categoryImg?: string;
  providerSource?: string;
  thresholdPrice?: number;
  isBelowThreshold?: boolean;
  thresholdSavings?: number;
  integrationStatus: IntegrationStatus;
  integrationDiagnostic?: IntegrationDiagnostic;
}

export interface PriceThresholdConfig {
  enabled: boolean;
  defaultThreshold: number | ''; // Global threshold, e.g. products costing below $5.00
  productThresholds: Record<string | number, number>; // Specific threshold per product ID
}

export interface ProviderPreset {
  id: string;
  name: string;
  baseUrl: string;
  defaultToken?: string;
  description: string;
  badge: string;
}

export interface MarginConfig {
  mode: 'percentage' | 'fixed';
  value: number; // e.g. 15 for 15% or 0.50 for $0.50
  rounding: 'exact' | '99cents' | 'roundHalf' | 'ceilInteger';
}

export interface FilterState {
  searchQuery: string;
  selectedCategory: string;
  availability: 'all' | 'available' | 'unavailable';
  productType: 'all' | 'package' | 'amount' | 'fixed';
  paramFilter: string; // 'all' or specific param category
  integrationFilter: 'all' | 'ready' | 'needs_fix' | 'unmapped';
  minCost: number | '';
  maxCost: number | '';
  sortBy: 'id_asc' | 'id_desc' | 'cost_asc' | 'cost_desc' | 'name_asc' | 'margin_desc' | 'savings_desc';
  onlyThresholdAlerts: boolean;
}

export type AlertSeverity = 'warning' | 'info' | 'success' | 'danger';

export type AlertType =
  | 'availability_oos'      // نفاذ الكمية / أصبح غير متوفر
  | 'availability_back'     // عودة التوفر / أصبح متاحاً للطلب
  | 'new_product'           // توفر منتج جديد في الكتالوج
  | 'price_drop'            // انخفاض سعر التكلفة من المزود
  | 'price_hike'            // ارتفاع سعر التكلفة من المزود
  | 'threshold_breach';     // هبوط التكلفة تحت حد الأمان المطلوب

export interface AppAlertItem {
  id: string;
  timestamp: string;
  dateObj: string; // ISO date string
  productId: string | number;
  productName: string;
  category: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  oldValue?: string | number | boolean;
  newValue?: string | number | boolean;
  changePercent?: number;
  isRead: boolean;
  emailSent?: boolean;
  emailRecipient?: string;
  telegramSent?: boolean;
  telegramChatId?: string;
  isHighProfit?: boolean;
  customPercentageThreshold?: number;
}

export interface AlertRuleConfig {
  trackAvailabilityChanges: boolean;
  trackPriceChanges: boolean;
  priceChangeThresholdPercent: number; // e.g. 5 means alert on >= 5% change
  customProductPercentages: Record<string | number, number>; // Specific percentage per product ID (e.g. 101 -> 5%)
  enabledProductAlertIds: (string | number)[]; // Explicitly activated products for custom percentage alerts
  trackThresholdBreaches: boolean;
  notifyOnCostDrop: boolean;
  notifyOnCostHike: boolean;
  playSound: boolean;
  // Email Notifications for High-Profit Products
  emailNotificationsEnabled: boolean;
  recipientEmail: string;
  emailOnHighProfitOnly: boolean; // Only for high profitability products (≥20% profit margin)
  emailPriceChangeThresholdPercent: number; // Significant price change threshold (e.g. >= 10%)
  // Telegram Bot Instant Notifications
  telegramNotificationsEnabled: boolean;
  telegramBotToken: string;
  telegramChatId: string;
  telegramNotifyOnCostDrop: boolean;
  telegramNotifyOnNewOrAvailableProducts: boolean;
}

export interface SyncScheduleConfig {
  enabled: boolean;
  intervalMinutes: number; // e.g. 15 for every 15 minutes, 1 for testing
  lastSyncTime: string | null;
  nextSyncTime: string | null;
  syncCount: number;
  isSyncing: boolean;
  secondsRemaining: number;
}

export type ThemeMode = 'system' | 'dark' | 'light';




