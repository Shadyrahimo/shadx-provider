import React from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  RotateCcw,
  Download,
  FileSpreadsheet,
  FileCode,
  Copy,
  Check,
  Tag,
  DollarSign,
  Package,
} from 'lucide-react';
import { FilterState } from '../types';

interface FilterBarProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  categories: { name: string; count: number }[];
  totalFilteredCount: number;
  totalProductsCount: number;
  onResetFilters: () => void;
  selectedIds: Set<string | number>;
  onExportCsv: () => void;
  onExportJson: () => void;
  onCopySelectedIds: () => void;
  isCopiedIds: boolean;
  onSelectAll: () => void;
  isAllSelected: boolean;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  setFilters,
  categories,
  totalFilteredCount,
  totalProductsCount,
  onResetFilters,
  selectedIds,
  onExportCsv,
  onExportJson,
  onCopySelectedIds,
  isCopiedIds,
  onSelectAll,
  isAllSelected,
}) => {
  const hasActiveFilters =
    filters.searchQuery !== '' ||
    filters.selectedCategory !== 'all' ||
    filters.availability !== 'all' ||
    filters.productType !== 'all' ||
    filters.paramFilter !== 'all' ||
    filters.minCost !== '' ||
    filters.maxCost !== '' ||
    filters.sortBy !== 'id_asc';

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-4 shadow-sm space-y-3.5">
      {/* Top Row: Search + Quick Category + Sort + Reset */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
        {/* Search Input (5 cols) */}
        <div className="relative md:col-span-5">
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-500">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => setFilters((prev) => ({ ...prev, searchQuery: e.target.value }))}
            placeholder="ابحث بالاسم، المعرف (ID)، أو الكلمة المفتاحية (مثلاً: ببجي، 365، ماسات)..."
            className="w-full pl-4 pr-9 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
          {filters.searchQuery && (
            <button
              onClick={() => setFilters((prev) => ({ ...prev, searchQuery: '' }))}
              className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs text-slate-400 hover:text-white"
            >
              مسح
            </button>
          )}
        </div>

        {/* Category Dropdown (3 cols) */}
        <div className="relative md:col-span-4">
          <select
            value={filters.selectedCategory}
            onChange={(e) => setFilters((prev) => ({ ...prev, selectedCategory: e.target.value }))}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="all">كل الفئات والتصنيفات ({totalProductsCount})</option>
            {categories.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name} ({c.count})
              </option>
            ))}
          </select>
        </div>

        {/* Sort Selector (3 cols) */}
        <div className="relative md:col-span-3">
          <select
            value={filters.sortBy}
            onChange={(e) => setFilters((prev) => ({ ...prev, sortBy: e.target.value as any }))}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="id_asc">المعرف ID: من الأصغر للأكبر</option>
            <option value="id_desc">المعرف ID: من الأكبر للأصغر</option>
            <option value="cost_asc">سعر التكلفة: من الأقل للأعلى</option>
            <option value="cost_desc">سعر التكلفة: من الأعلى للأقل</option>
            <option value="name_asc">الاسم: أبجدياً (أ - ي)</option>
            <option value="margin_desc">الأعلى هامش ربح مقترح</option>
          </select>
        </div>
      </div>

      {/* Second Row: Specific Filters (Availability, Qty Type, Required Param, Price Range) */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80 text-xs">
        {/* Availability Filter Tabs */}
        <div className="flex items-center gap-1 p-0.5 bg-slate-950 rounded-lg border border-slate-800">
          <span className="text-[11px] text-slate-500 px-2">الحالة:</span>
          {(['all', 'available', 'unavailable'] as const).map((status) => {
            const labels = { all: 'الكل', available: 'متاح فقط', unavailable: 'غير متوفر' };
            const isActive = filters.availability === status;
            return (
              <button
                key={status}
                onClick={() => setFilters((prev) => ({ ...prev, availability: status }))}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {labels[status]}
              </button>
            );
          })}
        </div>

        {/* Quantity Type Filter */}
        <div className="flex items-center gap-1 p-0.5 bg-slate-950 rounded-lg border border-slate-800">
          <span className="text-[11px] text-slate-500 px-2">نوع الكمية:</span>
          {[
            { id: 'all', label: 'الكل' },
            { id: 'package', label: 'باقة' },
            { id: 'amount', label: 'مرنة (Amount)' },
            { id: 'fixed', label: 'محددة' },
          ].map((type) => {
            const isActive = filters.productType === type.id;
            return (
              <button
                key={type.id}
                onClick={() => setFilters((prev) => ({ ...prev, productType: type.id as any }))}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {type.label}
              </button>
            );
          })}
        </div>

        {/* Required Parameter Smart Filter */}
        <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
          <Tag className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-[11px] text-slate-400">معلمات الربط:</span>
          <select
            value={filters.paramFilter}
            onChange={(e) => setFilters((prev) => ({ ...prev, paramFilter: e.target.value }))}
            className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="all">كافة المعلمات</option>
            <option value="player_id">معرف اللاعب (Player ID / UID)</option>
            <option value="server_id">معرف الخادم (Server ID)</option>
            <option value="email">البريد الإلكتروني (EMAIL)</option>
            <option value="username">اسم المستخدم (User ID / USERNAME)</option>
            <option value="phone">رقم الهاتف / الرقم</option>
          </select>
        </div>

        {/* Price Range inputs */}
        <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
          <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-[11px] text-slate-400">التكلفة $:</span>
          <input
            type="number"
            min="0"
            step="0.1"
            value={filters.minCost}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                minCost: e.target.value === '' ? '' : parseFloat(e.target.value),
              }))
            }
            placeholder="من"
            dir="ltr"
            className="w-14 bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 text-xs text-slate-200 focus:outline-none font-mono-numbers"
          />
          <span className="text-slate-600">-</span>
          <input
            type="number"
            min="0"
            step="0.1"
            value={filters.maxCost}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                maxCost: e.target.value === '' ? '' : parseFloat(e.target.value),
              }))
            }
            placeholder="إلى"
            dir="ltr"
            className="w-14 bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 text-xs text-slate-200 focus:outline-none font-mono-numbers"
          />
        </div>

        {/* Reset Filters button */}
        {hasActiveFilters && (
          <button
            onClick={onResetFilters}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors mr-auto"
          >
            <RotateCcw className="w-3 h-3" />
            <span>إعادة ضبط</span>
          </button>
        )}
      </div>

      {/* Third Row: Stats & Bulk Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/60 text-xs">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white select-none">
            <input
              type="checkbox"
              checked={isAllSelected}
              onChange={onSelectAll}
              className="rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-0 focus:ring-offset-0 cursor-pointer"
            />
            <span className="font-medium">تحديد المعروض</span>
          </label>

          <span className="text-slate-500">|</span>

          <div className="text-slate-400 flex items-center gap-1.5">
            <span>النتائج المعروضة:</span>
            <span className="font-bold font-mono-numbers text-indigo-400 text-sm">
              {totalFilteredCount}
            </span>
            <span className="text-slate-500">من إجمالي {totalProductsCount} منتج</span>
          </div>

          {selectedIds.size > 0 && (
            <div className="bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 px-2.5 py-0.5 rounded-md text-[11px] font-medium font-mono-numbers">
              تم تحديد {selectedIds.size} منتج
            </div>
          )}
        </div>

        {/* Export & Bulk Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onCopySelectedIds}
            disabled={selectedIds.size === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title="نسخ قائمة الـ IDs المحددة لاستخدامها في استعلامات API المجمعة أو إعدادات المتجر"
          >
            {isCopiedIds ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{isCopiedIds ? 'تم نسخ المعرفات!' : 'نسخ المعرفات (IDs)'}</span>
          </button>

          <button
            onClick={onExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-500/30 text-xs font-medium transition-colors shadow-xs"
            title="تصدير جدول المنتجات إلى ملف Excel / CSV متوافق مع المتاجر وسلة وزد"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>تصدير Excel (CSV)</span>
          </button>

          <button
            onClick={onExportJson}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-colors"
            title="تصدير الكتالوج بصيغة JSON نظيفة للمطورين والربط المباشر"
          >
            <FileCode className="w-3.5 h-3.5 text-indigo-400" />
            <span>تصدير JSON</span>
          </button>
        </div>
      </div>
    </div>
  );
};
