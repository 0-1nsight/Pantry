import { useState, useRef } from 'react';
import { Trash2, CheckCircle, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import type { Item } from '../lib/database.types';
import { FRESH_CATEGORIES } from '../lib/database.types';
import { depletionPercent, formatQty, preciseQty, daysRemaining } from '../hooks/useItems';

interface Props {
  items: Item[];
  onUpdate: (id: string, updates: Partial<Item>) => Promise<boolean>;
  onMarkFinished: (id: string) => Promise<boolean>;
  onMarkSpoiled: (id: string) => Promise<boolean>;
}

function depletionColor(pct: number): string {
  if (pct > 60) return 'bg-emerald-500';
  if (pct > 30) return 'bg-amber-400';
  return 'bg-red-500';
}

function depletionTextColor(pct: number): string {
  if (pct > 60) return 'text-emerald-600';
  if (pct > 30) return 'text-amber-500';
  return 'text-red-500';
}

function ItemCard({ item, onUpdate, onMarkFinished, onMarkSpoiled }: { item: Item; onUpdate: (id: string, u: Partial<Item>) => Promise<boolean>; onMarkFinished: (id: string) => Promise<boolean>; onMarkSpoiled: (id: string) => Promise<boolean> }) {
  const pct = depletionPercent(item);
  const days = daysRemaining(item);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [localQty, setLocalQty] = useState(item.current_qty);
  const [expanded, setExpanded] = useState(false);
  const [actioning, setActioning] = useState(false);

  const handleSliderChange = (val: number) => {
    const snapped = preciseQty(val, 0.25);
    setLocalQty(snapped);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onUpdate(item.id, { current_qty: snapped }), 500);
  };

  const handleCountChange = (delta: number) => {
    const next = Math.max(0, item.current_qty + delta);
    setLocalQty(next);
    onUpdate(item.id, { current_qty: next });
  };

  const handleFinished = async () => { setActioning(true); await onMarkFinished(item.id); setActioning(false); };
  const handleSpoiled = async () => { setActioning(true); await onMarkSpoiled(item.id); setActioning(false); };

  const isFresh = FRESH_CATEGORIES.has(item.category);
  const isExpiring = days <= 2;
  const isExpired = days <= 0;

  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all duration-200 ${isExpired ? 'border-red-200 bg-red-50/30' : isExpiring ? 'border-amber-200' : 'border-gray-100'}`}>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-gray-900 text-sm truncate">{item.name}</h3>
              {isExpired && <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded-full font-medium">Expired</span>}
              {isExpiring && !isExpired && <span className="px-2 py-0.5 bg-amber-100 text-amber-600 text-xs rounded-full font-medium">Expiring soon</span>}
            </div>
            <p className="text-xs text-gray-400 mt-0.5">{item.category} · {days > 0 ? `${days}d left` : 'Expired'}</p>
          </div>
          <button onClick={() => setExpanded(e => !e)} className="text-gray-300 hover:text-gray-500 transition-colors p-1">
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>

        {/* Depletion bar */}
        <div className="mt-3 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold ${depletionTextColor(pct)}`}>{formatQty(localQty, item.unit)}</span>
            <span className="text-xs text-gray-400">{Math.round(pct)}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-300 ${depletionColor(pct)}`} style={{ width: `${pct}%` }} />
          </div>
        </div>

        {/* Controls */}
        <div className="mt-3">
          {isFresh && item.unit === 'lbs' ? (
            <input
              type="range"
              min={0}
              max={item.initial_qty}
              step={0.25}
              value={localQty}
              onChange={e => handleSliderChange(parseFloat(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          ) : (
            <div className="flex items-center justify-center gap-4">
              <button onClick={() => handleCountChange(-1)} disabled={localQty <= 0} className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center hover:bg-red-50 hover:text-red-500 disabled:opacity-30 transition-colors text-lg font-bold text-gray-600">−</button>
              <span className="text-2xl font-bold text-gray-900 w-10 text-center">{Math.round(localQty)}</span>
              <button onClick={() => handleCountChange(1)} className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center hover:bg-emerald-50 hover:text-emerald-600 transition-colors text-lg font-bold text-gray-600">+</button>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      {expanded && (
        <div className="border-t border-gray-100 px-4 py-3 flex gap-2 bg-gray-50/50">
          <button
            onClick={handleFinished}
            disabled={actioning}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-gray-100 text-gray-600 text-xs font-semibold hover:bg-emerald-50 hover:text-emerald-700 transition-colors disabled:opacity-50"
          >
            <CheckCircle size={14} /> Mark Finished
          </button>
          <button
            onClick={handleSpoiled}
            disabled={actioning}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-gray-100 text-gray-600 text-xs font-semibold hover:bg-amber-50 hover:text-amber-600 transition-colors disabled:opacity-50"
          >
            <AlertTriangle size={14} /> Mark Spoiled
          </button>
          <button className="p-2 rounded-xl bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-400 transition-colors">
            <Trash2 size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

export default function PantryView({ items, onUpdate, onMarkFinished, onMarkSpoiled }: Props) {
  const active = items.filter(i => !i.spoiled && i.current_qty > 0);
  const fresh = active.filter(i => FRESH_CATEGORIES.has(i.category));
  const household = active.filter(i => !FRESH_CATEGORIES.has(i.category));

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Digital Pantry</h1>
        <p className="text-sm text-gray-500 mt-1">{active.length} items in stock</p>
      </div>

      {active.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">📦</div>
          <p className="font-medium text-gray-500">Your pantry is empty</p>
          <p className="text-sm mt-1">Log items in the Intake tab to get started</p>
        </div>
      )}

      {fresh.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Fresh Provisions</h2>
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-600 text-xs rounded-full font-medium">{fresh.length}</span>
          </div>
          {fresh.map(item => (
            <ItemCard key={item.id} item={item} onUpdate={onUpdate} onMarkFinished={onMarkFinished} onMarkSpoiled={onMarkSpoiled} />
          ))}
        </section>
      )}

      {household.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Household Essentials</h2>
            <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-xs rounded-full font-medium">{household.length}</span>
          </div>
          {household.map(item => (
            <ItemCard key={item.id} item={item} onUpdate={onUpdate} onMarkFinished={onMarkFinished} onMarkSpoiled={onMarkSpoiled} />
          ))}
        </section>
      )}
    </div>
  );
}
