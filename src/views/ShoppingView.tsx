import { useState } from 'react';
import { ShoppingBag, Store, Check, ShoppingCart, DollarSign } from 'lucide-react';
import type { Item } from '../lib/database.types';

interface Props {
  items: Item[];
}

const AISLE_ORDER = [
  'Produce', 'Fresh Meat', 'Dairy', 'Bakery',
  'Canned Goods', 'Grains', 'Condiments', 'Snacks',
  'Beverages', 'Frozen Foods', 'Personal Care', 'Cleaning', 'Household', 'General',
];

function categoryToAisle(category: string): string {
  if (['Vegetables', 'Fruits', 'Herbs', 'Root Crops'].includes(category)) return 'Produce';
  if (['Meat', 'Fish & Seafood'].includes(category)) return 'Fresh Meat';
  if (category === 'Eggs & Dairy') return 'Dairy';
  if (AISLE_ORDER.includes(category)) return category;
  return 'General';
}

function estimateCost(item: Item): number {
  if (item.cost_type === 'PER_LB') return item.cost * item.alert_threshold * 2;
  if (item.cost_type === 'PER_UNIT') return item.cost * Math.max(1, item.alert_threshold);
  return item.cost;
}

export default function ShoppingView({ items }: Props) {
  const [activeTab, setActiveTab] = useState<'market' | 'supermarket'>('market');
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const needsRestock = items.filter(i => !i.spoiled && i.current_qty <= i.alert_threshold);
  const marketItems = needsRestock.filter(i => i.source === 'MARKET');
  const superItems = needsRestock.filter(i => i.source === 'SUPERMARKET');

  const toggleCheck = (id: string) => {
    setChecked(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const listItems = activeTab === 'market' ? marketItems : superItems;
  const totalEstimate = listItems.reduce((sum, item) => sum + estimateCost(item), 0);
  const checkedEstimate = listItems.filter(i => checked.has(i.id)).reduce((sum, item) => sum + estimateCost(item), 0);

  // Group supermarket items by aisle
  const aisleGroups: Record<string, Item[]> = {};
  if (activeTab === 'supermarket') {
    superItems.forEach(item => {
      const aisle = categoryToAisle(item.category);
      if (!aisleGroups[aisle]) aisleGroups[aisle] = [];
      aisleGroups[aisle].push(item);
    });
  }
  const sortedAisles = Object.keys(aisleGroups).sort((a, b) => {
    const ai = AISLE_ORDER.indexOf(a);
    const bi = AISLE_ORDER.indexOf(b);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Shopping List</h1>
        <p className="text-sm text-gray-500 mt-1">{needsRestock.length} items need restocking</p>
      </div>

      {/* Budget Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <DollarSign size={18} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">Estimated Budget</p>
              <p className="text-2xl font-bold text-gray-900">${totalEstimate.toFixed(2)}</p>
            </div>
          </div>
          {checked.size > 0 && (
            <div className="text-right">
              <p className="text-xs text-gray-400">In cart</p>
              <p className="text-lg font-bold text-emerald-600">${checkedEstimate.toFixed(2)}</p>
            </div>
          )}
        </div>
        {checked.size > 0 && (
          <div className="mt-3">
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                style={{ width: `${totalEstimate > 0 ? (checkedEstimate / totalEstimate) * 100 : 0}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">{checked.size}/{listItems.length} items checked</p>
          </div>
        )}
      </div>

      {/* Tab Toggle */}
      <div className="flex bg-gray-100 rounded-2xl p-1 gap-1">
        {([['market', 'Market List', ShoppingBag] as const, ['supermarket', 'Supermarket List', Store] as const]).map(([val, label, Icon]) => (
          <button
            key={val}
            onClick={() => setActiveTab(val)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
              activeTab === val ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon size={16} />
            {label}
            {(val === 'market' ? marketItems : superItems).length > 0 && (
              <span className="w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                {(val === 'market' ? marketItems : superItems).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Empty state */}
      {listItems.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <ShoppingCart size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium text-gray-500">All stocked up!</p>
          <p className="text-sm mt-1">Items will appear here when they run low</p>
        </div>
      )}

      {/* Market List */}
      {activeTab === 'market' && marketItems.length > 0 && (
        <div className="space-y-2">
          {marketItems.map(item => (
            <div
              key={item.id}
              onClick={() => toggleCheck(item.id)}
              className={`flex items-center gap-3 p-4 bg-white rounded-2xl border shadow-sm cursor-pointer transition-all duration-200 ${checked.has(item.id) ? 'border-emerald-200 bg-emerald-50/50 opacity-60' : 'border-gray-100 hover:border-emerald-200'}`}
            >
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${checked.has(item.id) ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300'}`}>
                {checked.has(item.id) && <Check size={12} className="text-white" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold text-gray-900 ${checked.has(item.id) ? 'line-through text-gray-400' : ''}`}>{item.name}</p>
                <p className="text-xs text-gray-400">{item.category} · {item.unit === 'lbs' ? 'by weight' : 'by unit'}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-gray-700">~${estimateCost(item).toFixed(2)}</p>
                <p className="text-xs text-gray-400">estimated</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Supermarket List - sorted by aisle */}
      {activeTab === 'supermarket' && superItems.length > 0 && (
        <div className="space-y-4">
          {sortedAisles.map(aisle => (
            <section key={aisle} className="space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">{aisle}</h3>
                <div className="flex-1 h-px bg-gray-100" />
              </div>
              {aisleGroups[aisle].map(item => (
                <div
                  key={item.id}
                  onClick={() => toggleCheck(item.id)}
                  className={`flex items-center gap-3 p-4 bg-white rounded-2xl border shadow-sm cursor-pointer transition-all duration-200 ${checked.has(item.id) ? 'border-emerald-200 bg-emerald-50/50 opacity-60' : 'border-gray-100 hover:border-emerald-200'}`}
                >
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${checked.has(item.id) ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300'}`}>
                    {checked.has(item.id) && <Check size={12} className="text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold text-gray-900 ${checked.has(item.id) ? 'line-through text-gray-400' : ''}`}>{item.name}</p>
                    {item.barcode && <p className="text-xs text-gray-400">#{item.barcode}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-700">~${estimateCost(item).toFixed(2)}</p>
                    <p className="text-xs text-gray-400">estimated</p>
                  </div>
                </div>
              ))}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
