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
  minCost: number | '';
  maxCost: number | '';
  sortBy: 'id_asc' | 'id_desc' | 'cost_asc' | 'cost_desc' | 'name_asc' | 'margin_desc';
}
