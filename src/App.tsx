import { useState } from 'react';
import Navigation, { type View } from './components/Navigation';
import DashboardView from './views/DashboardView';
import PantryView from './views/PantryView';
import KitchenView from './views/KitchenView';
import ShoppingView from './views/ShoppingView';
import { useItems } from './hooks/useItems';

export default function App() {
  const [view, setView] = useState<View>('dashboard');
  const { items, loading, error, addItem, updateItem, markFinished, markSpoiled } = useItems();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation active={view} onChange={setView} />

      <main className="pt-0 pb-20 md:pt-16 md:pb-8">
        {error && (
          <div className="max-w-2xl mx-auto px-4 pt-4">
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="space-y-3 text-center">
              <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm text-gray-400">Loading pantry...</p>
            </div>
          </div>
        ) : (
          <>
            {view === 'dashboard' && <DashboardView onAdd={addItem} />}
            {view === 'pantry' && (
              <PantryView
                items={items}
                onUpdate={updateItem}
                onMarkFinished={markFinished}
                onMarkSpoiled={markSpoiled}
              />
            )}
            {view === 'kitchen' && <KitchenView items={items} />}
            {view === 'shopping' && <ShoppingView items={items} />}
          </>
        )}
      </main>
    </div>
  );
}
