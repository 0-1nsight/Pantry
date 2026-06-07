import { useState } from 'react';
import { ShoppingBag, Store, Check, ChevronRight, Scan, Plus, Minus } from 'lucide-react';
import type { Source, ItemInsert } from '../lib/database.types';
import { MARKET_CATEGORIES, SHELF_LIFE_DEFAULTS } from '../lib/database.types';

interface Props {
  onAdd: (item: ItemInsert) => Promise<unknown>;
}

const SIZE_PRESETS = [
  { label: 'Small', value: 2, hint: '~2 lbs' },
  { label: 'Med', value: 5, hint: '~5 lbs' },
  { label: 'Large', value: 10, hint: '~10 lbs' },
];

const SUPERMARKET_ITEMS = [
  { name: 'Mackerel (Canned)', barcode: '123456789', category: 'Canned Goods', unit: 'units' as const },
  { name: 'Tomato Paste', barcode: '234567890', category: 'Canned Goods', unit: 'units' as const },
  { name: 'Rice (5kg)', barcode: '345678901', category: 'Grains', unit: 'units' as const },
  { name: 'Toothpaste', barcode: '456789012', category: 'Personal Care', unit: 'units' as const },
  { name: 'Dish Soap', barcode: '567890123', category: 'Cleaning', unit: 'units' as const },
  { name: 'Cooking Oil (1L)', barcode: '678901234', category: 'Condiments', unit: 'units' as const },
  { name: 'Sugar (1kg)', barcode: '789012345', category: 'Grains', unit: 'units' as const },
  { name: 'Salt', barcode: '890123456', category: 'Condiments', unit: 'units' as const },
];

export default function DashboardView({ onAdd }: Props) {
  const [source, setSource] = useState<Source>('MARKET');
  const [step, setStep] = useState<'category' | 'item' | 'qty' | 'price' | 'confirm'>('category');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [itemName, setItemName] = useState('');
  const [sizePreset, setSizePreset] = useState<number | null>(null);
  const [manualQty, setManualQty] = useState('');
  const [pricePerLb, setPricePerLb] = useState('');
  const [flatPrice, setFlatPrice] = useState('');
  const [useFlatPrice, setUseFlatPrice] = useState(false);
  const [saving, setSaving] = useState(false);
  const [scanStep, setScanStep] = useState<'scan' | 'count' | 'price' | 'confirm'>('scan');
  const [scannedItem, setScannedItem] = useState<typeof SUPERMARKET_ITEMS[0] | null>(null);
  const [scanQty, setScanQty] = useState(1);
  const [scanPrice, setScanPrice] = useState('');
  const [scanning, setScanning] = useState(false);

  const resetMarket = () => { setStep('category'); setSelectedCategory(''); setItemName(''); setSizePreset(null); setManualQty(''); setPricePerLb(''); setFlatPrice(''); setUseFlatPrice(false); };
  const resetSupermarket = () => { setScanStep('scan'); setScannedItem(null); setScanQty(1); setScanPrice(''); setScanning(false); };

  const handleScanSimulate = () => {
    setScanning(true);
    setTimeout(() => {
      const item = SUPERMARKET_ITEMS[Math.floor(Math.random() * SUPERMARKET_ITEMS.length)];
      setScannedItem(item);
      setScanStep('count');
      setScanning(false);
    }, 1500);
  };

  const handleSupermarketSave = async () => {
    if (!scannedItem || !scanPrice) return;
    setSaving(true);
    await onAdd({
      name: scannedItem.name,
      barcode: scannedItem.barcode,
      source: 'SUPERMARKET',
      category: scannedItem.category,
      current_qty: scanQty,
      initial_qty: scanQty,
      unit: scannedItem.unit,
      cost: parseFloat(scanPrice),
      cost_type: 'FLAT',
      date_logged: new Date().toISOString(),
      shelf_life_days: SHELF_LIFE_DEFAULTS[scannedItem.category] ?? 30,
      alert_threshold: 1,
      spoiled: false,
    });
    setSaving(false);
    resetSupermarket();
  };

  const handleMarketSave = async () => {
    if (!itemName || !selectedCategory) return;
    const qty = sizePreset ?? parseFloat(manualQty);
    if (!qty || qty <= 0) return;
    const costVal = useFlatPrice ? parseFloat(flatPrice) : parseFloat(pricePerLb) * qty;
    setSaving(true);
    await onAdd({
      name: itemName,
      barcode: null,
      source: 'MARKET',
      category: selectedCategory,
      current_qty: qty,
      initial_qty: qty,
      unit: 'lbs',
      cost: costVal || 0,
      cost_type: useFlatPrice ? 'FLAT' : 'PER_LB',
      date_logged: new Date().toISOString(),
      shelf_life_days: SHELF_LIFE_DEFAULTS[selectedCategory] ?? 7,
      alert_threshold: 0.5,
      spoiled: false,
    });
    setSaving(false);
    resetMarket();
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Intake Log</h1>
        <p className="text-sm text-gray-500 mt-1">Record what you bought today</p>
      </div>

      {/* Source Toggle */}
      <div className="flex bg-gray-100 rounded-2xl p-1 gap-1">
        {([['MARKET', 'Market Run', ShoppingBag], ['SUPERMARKET', 'Supermarket Run', Store]] as const).map(([val, label, Icon]) => (
          <button
            key={val}
            onClick={() => { setSource(val); resetMarket(); resetSupermarket(); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
              source === val ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {/* MARKET FLOW */}
      {source === 'MARKET' && (
        <div className="space-y-4">
          {/* Step: Category */}
          <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-all ${step !== 'category' && selectedCategory ? '' : ''}`}>
            <button
              onClick={() => setStep('category')}
              className="w-full flex items-center justify-between p-4 text-left"
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${selectedCategory ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'}`}>
                  {selectedCategory ? <Check size={14} /> : '1'}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Category</p>
                  {selectedCategory && <p className="text-xs text-emerald-600">{selectedCategory}</p>}
                </div>
              </div>
              <ChevronRight size={16} className="text-gray-400" />
            </button>
            {step === 'category' && (
              <div className="px-4 pb-4 grid grid-cols-4 gap-2">
                {MARKET_CATEGORIES.map(cat => (
                  <button
                    key={cat.name}
                    onClick={() => { setSelectedCategory(cat.name); setStep('item'); }}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all text-xs font-medium ${
                      selectedCategory === cat.name ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-100 bg-gray-50 text-gray-600 hover:border-emerald-200 hover:bg-emerald-50'
                    }`}
                  >
                    <span className="text-xl">{cat.icon}</span>
                    <span className="text-center leading-tight">{cat.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Step: Item Name */}
          {selectedCategory && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <button onClick={() => setStep('item')} className="w-full flex items-center justify-between p-4 text-left">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${itemName ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'}`}>
                    {itemName ? <Check size={14} /> : '2'}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Item Name</p>
                    {itemName && <p className="text-xs text-emerald-600">{itemName}</p>}
                  </div>
                </div>
                <ChevronRight size={16} className="text-gray-400" />
              </button>
              {step === 'item' && (
                <div className="px-4 pb-4 space-y-3">
                  <input
                    type="text"
                    value={itemName}
                    onChange={e => setItemName(e.target.value)}
                    placeholder={`e.g. Tomatoes, Sweet Potato...`}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
                    autoFocus
                  />
                  <button
                    disabled={!itemName.trim()}
                    onClick={() => setStep('qty')}
                    className="w-full py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold disabled:opacity-40 hover:bg-emerald-700 transition-colors"
                  >
                    Continue
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Step: Quantity */}
          {itemName && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <button onClick={() => setStep('qty')} className="w-full flex items-center justify-between p-4 text-left">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${(sizePreset || manualQty) ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'}`}>
                    {(sizePreset || manualQty) ? <Check size={14} /> : '3'}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Quantity</p>
                    {(sizePreset || manualQty) && <p className="text-xs text-emerald-600">{sizePreset ?? manualQty} lbs</p>}
                  </div>
                </div>
                <ChevronRight size={16} className="text-gray-400" />
              </button>
              {step === 'qty' && (
                <div className="px-4 pb-4 space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    {SIZE_PRESETS.map(p => (
                      <button
                        key={p.value}
                        onClick={() => { setSizePreset(p.value); setManualQty(''); }}
                        className={`py-3 rounded-xl border-2 text-sm font-medium transition-all ${sizePreset === p.value ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-100 text-gray-600 hover:border-emerald-200'}`}
                      >
                        <div className="font-bold">{p.label}</div>
                        <div className="text-xs opacity-70">{p.hint}</div>
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-px bg-gray-100" />
                    <span className="text-xs text-gray-400">or manual</span>
                    <div className="flex-1 h-px bg-gray-100" />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={manualQty}
                      onChange={e => { setManualQty(e.target.value); setSizePreset(null); }}
                      placeholder="Custom lbs"
                      min="0"
                      step="0.25"
                      className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                    <span className="text-sm text-gray-500 font-medium">lbs</span>
                  </div>
                  <button
                    disabled={!sizePreset && !manualQty}
                    onClick={() => setStep('price')}
                    className="w-full py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold disabled:opacity-40 hover:bg-emerald-700 transition-colors"
                  >
                    Continue
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Step: Price */}
          {(sizePreset || manualQty) && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <button onClick={() => setStep('price')} className="w-full flex items-center justify-between p-4 text-left">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${(pricePerLb || flatPrice) ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'}`}>
                    {(pricePerLb || flatPrice) ? <Check size={14} /> : '4'}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Price</p>
                    {(pricePerLb || flatPrice) && <p className="text-xs text-emerald-600">{useFlatPrice ? `$${flatPrice} flat` : `$${pricePerLb}/lb`}</p>}
                  </div>
                </div>
                <ChevronRight size={16} className="text-gray-400" />
              </button>
              {step === 'price' && (
                <div className="px-4 pb-4 space-y-3">
                  <div className="flex bg-gray-100 rounded-xl p-1">
                    <button onClick={() => setUseFlatPrice(false)} className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${!useFlatPrice ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500'}`}>Per lb</button>
                    <button onClick={() => setUseFlatPrice(true)} className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${useFlatPrice ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500'}`}>Flat price</button>
                  </div>
                  {!useFlatPrice ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">$</span>
                      <input type="number" value={pricePerLb} onChange={e => setPricePerLb(e.target.value)} placeholder="0.00" min="0" step="0.01" className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                      <span className="text-sm text-gray-500">/ lb</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">$</span>
                      <input type="number" value={flatPrice} onChange={e => setFlatPrice(e.target.value)} placeholder="0.00" min="0" step="0.01" className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                    </div>
                  )}
                  <button
                    onClick={handleMarketSave}
                    disabled={saving || (!pricePerLb && !flatPrice)}
                    className="w-full py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold disabled:opacity-40 hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Check size={16} />
                    )}
                    {saving ? 'Saving...' : 'Add to Pantry'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* SUPERMARKET FLOW */}
      {source === 'SUPERMARKET' && (
        <div className="space-y-4">
          {/* Scanner */}
          {scanStep === 'scan' && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6 text-center space-y-4">
                <div
                  onClick={handleScanSimulate}
                  className={`relative mx-auto w-64 h-40 bg-gray-900 rounded-2xl overflow-hidden cursor-pointer transition-transform active:scale-95 ${scanning ? 'pointer-events-none' : ''}`}
                >
                  {/* Camera viewfinder */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    {scanning ? (
                      <div className="space-y-2 text-center">
                        <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto" />
                        <p className="text-emerald-400 text-xs">Scanning...</p>
                      </div>
                    ) : (
                      <div className="space-y-2 text-center">
                        <Scan size={32} className="text-emerald-400 mx-auto" />
                        <p className="text-gray-400 text-xs">Tap to scan barcode</p>
                      </div>
                    )}
                  </div>
                  {/* Corner markers */}
                  {['top-3 left-3', 'top-3 right-3', 'bottom-3 left-3', 'bottom-3 right-3'].map((pos, i) => (
                    <div key={i} className={`absolute ${pos} w-5 h-5 border-emerald-400 ${i < 2 ? 'border-t-2' : 'border-b-2'} ${i % 2 === 0 ? 'border-l-2' : 'border-r-2'}`} />
                  ))}
                  {/* Scan line */}
                  {scanning && (
                    <div className="absolute left-4 right-4 h-0.5 bg-emerald-400 opacity-80 animate-bounce" style={{ top: '50%' }} />
                  )}
                </div>
                <p className="text-xs text-gray-400">Simulated scanner — tap the viewfinder to scan an item</p>
              </div>
            </div>
          )}

          {/* Count step */}
          {scanStep === 'count' && scannedItem && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <Check size={18} className="text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-emerald-600 font-medium">Recognized</p>
                  <p className="font-bold text-gray-900">{scannedItem.name}</p>
                  <p className="text-xs text-gray-400">{scannedItem.category} · #{scannedItem.barcode}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">Quantity</span>
                <div className="flex items-center gap-4">
                  <button onClick={() => setScanQty(q => Math.max(1, q - 1))} className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors">
                    <Minus size={16} className="text-gray-700" />
                  </button>
                  <span className="w-8 text-center text-xl font-bold text-gray-900">{scanQty}</span>
                  <button onClick={() => setScanQty(q => q + 1)} className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center hover:bg-emerald-200 transition-colors">
                    <Plus size={16} className="text-emerald-700" />
                  </button>
                </div>
              </div>
              <button onClick={() => setScanStep('price')} className="w-full py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors">
                Continue
              </button>
            </div>
          )}

          {/* Price step */}
          {scanStep === 'price' && scannedItem && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
              <div>
                <p className="font-bold text-gray-900">{scannedItem.name}</p>
                <p className="text-xs text-gray-400">Qty: {scanQty} {scannedItem.unit}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Total Price</label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">$</span>
                  <input
                    type="number"
                    value={scanPrice}
                    onChange={e => setScanPrice(e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    autoFocus
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
              </div>
              <button
                onClick={handleSupermarketSave}
                disabled={saving || !scanPrice}
                className="w-full py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold disabled:opacity-40 hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
              >
                {saving ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Check size={16} />}
                {saving ? 'Saving...' : 'Add to Pantry'}
              </button>
              <button onClick={() => setScanStep('count')} className="w-full py-2 text-sm text-gray-400 hover:text-gray-600 transition-colors">Back</button>
            </div>
          )}

          {/* Scan again prompt */}
          {scanStep !== 'scan' && !saving && (
            <button
              onClick={resetSupermarket}
              className="w-full py-3 border-2 border-dashed border-gray-200 rounded-2xl text-sm font-medium text-gray-400 hover:border-emerald-300 hover:text-emerald-600 transition-all flex items-center justify-center gap-2"
            >
              <Scan size={16} />
              Scan another item
            </button>
          )}
        </div>
      )}
    </div>
  );
}
