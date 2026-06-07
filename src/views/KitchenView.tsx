import { Clock, ChefHat, Flame, AlertTriangle } from 'lucide-react';
import type { Item } from '../lib/database.types';
import { daysRemaining } from '../hooks/useItems';

interface Props {
  items: Item[];
}

interface RecipeCard {
  meal: 'Breakfast' | 'Lunch' | 'Dinner';
  title: string;
  ingredients: string[];
  notes: string;
}

function generateRecipes(highRiskItems: Item[], allItems: Item[]): RecipeCard[] {
  const names = (items: Item[]) => items.map(i => i.name);
  const all = names(allItems);
  const recipes: RecipeCard[] = [];

  const hasVeg = allItems.some(i => i.category === 'Vegetables');
  const hasMeat = allItems.some(i => i.category === 'Meat' || i.category === 'Fish & Seafood');
  const hasEgg = allItems.some(i => i.category === 'Eggs & Dairy');
  const hasGrains = allItems.some(i => i.category === 'Grains');

  const urgentNames = names(highRiskItems);

  if (hasEgg || urgentNames.some(n => n.toLowerCase().includes('egg'))) {
    recipes.push({
      meal: 'Breakfast',
      title: hasVeg ? 'Veggie Scramble' : 'Simple Egg Toast',
      ingredients: [
        ...urgentNames.filter(n => n.toLowerCase().includes('egg') || allItems.find(i => i.name === n && i.category === 'Eggs & Dairy')).slice(0, 2),
        ...all.filter(n => allItems.find(i => i.name === n && i.category === 'Vegetables')).slice(0, 2),
        'Salt & seasoning',
      ].filter(Boolean).slice(0, 5),
      notes: 'Use eggs before they expire — scrambled with fresh veggies is quick and nutritious.',
    });
  }

  if (hasMeat || urgentNames.length > 0) {
    recipes.push({
      meal: 'Lunch',
      title: hasGrains ? 'Rice Bowl with Sautéed Greens' : 'Quick Stir Fry',
      ingredients: [
        ...urgentNames.slice(0, 3),
        ...all.filter(n => allItems.find(i => i.name === n && (i.category === 'Grains'))).slice(0, 1),
        'Cooking oil',
      ].filter((v, i, a) => a.indexOf(v) === i).slice(0, 5),
      notes: 'Prioritize the expiring items as the main ingredients to avoid waste.',
    });
  }

  if (hasMeat || hasVeg) {
    recipes.push({
      meal: 'Dinner',
      title: hasMeat ? 'Herb-Braised Protein with Roots' : 'Vegetable Stew',
      ingredients: [
        ...urgentNames.filter(n => allItems.find(i => i.name === n && (i.category === 'Meat' || i.category === 'Fish & Seafood'))).slice(0, 1),
        ...all.filter(n => allItems.find(i => i.name === n && (i.category === 'Root Crops' || i.category === 'Vegetables'))).slice(0, 3),
        'Herbs & spices',
      ].filter(Boolean).slice(0, 5),
      notes: 'Slow-cooking tough root crops with protein creates a hearty, zero-waste meal.',
    });
  }

  if (recipes.length === 0) {
    recipes.push(
      { meal: 'Breakfast', title: 'Simple Oats or Toast', ingredients: ['Pantry staples', 'Fresh fruit (if any)'], notes: 'Add more fresh items via Intake to get personalized suggestions.' },
      { meal: 'Lunch', title: 'Mixed Pantry Bowl', ingredients: ['Whatever is available'], notes: 'Log more items to unlock recipe matching.' },
      { meal: 'Dinner', title: 'Improvised Stir Fry', ingredients: ['Available vegetables', 'Protein of choice'], notes: 'Scan or log items first for smart recipe suggestions.' },
    );
  }

  return recipes;
}

const MEAL_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  Breakfast: { bg: 'bg-amber-50 border-amber-100', text: 'text-amber-700', icon: '🌅' },
  Lunch: { bg: 'bg-sky-50 border-sky-100', text: 'text-sky-700', icon: '☀️' },
  Dinner: { bg: 'bg-indigo-50 border-indigo-100', text: 'text-indigo-700', icon: '🌙' },
};

const DINNER_COLORS = { bg: 'bg-slate-50 border-slate-100', text: 'text-slate-700', icon: '🌙' };

function getMealStyle(meal: string) {
  if (meal === 'Dinner') return DINNER_COLORS;
  return MEAL_COLORS[meal] ?? { bg: 'bg-gray-50 border-gray-100', text: 'text-gray-700', icon: '🍽️' };
}

export default function KitchenView({ items }: Props) {
  const active = items.filter(i => !i.spoiled && i.current_qty > 0);
  const withDays = active.map(i => ({ ...i, days: daysRemaining(i) }));
  const expired = withDays.filter(i => i.days <= 0);
  const critical = withDays.filter(i => i.days > 0 && i.days <= 2);
  const warning = withDays.filter(i => i.days > 2 && i.days <= 5);
  const good = withDays.filter(i => i.days > 5);
  const highRisk = [...expired, ...critical, ...warning];
  const recipes = generateRecipes(highRisk, active);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Smart Kitchen</h1>
        <p className="text-sm text-gray-500 mt-1">Expiry tracking & recipe suggestions</p>
      </div>

      {/* Expiry Timeline */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
          <Clock size={14} className="text-gray-400" /> Expiry Tracker
        </h2>
        {active.length === 0 && (
          <p className="text-sm text-gray-400 py-4 text-center">No items tracked — add items in Intake</p>
        )}
        {expired.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-red-500 uppercase tracking-wide">Expired</p>
            {expired.map(item => (
              <div key={item.id} className="flex items-center justify-between px-3 py-2 bg-red-50 rounded-xl border border-red-100">
                <div className="flex items-center gap-2">
                  <Flame size={14} className="text-red-400" />
                  <span className="text-sm font-medium text-gray-800">{item.name}</span>
                </div>
                <span className="text-xs font-bold text-red-500 bg-red-100 px-2 py-0.5 rounded-full">Expired</span>
              </div>
            ))}
          </div>
        )}
        {critical.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-amber-500 uppercase tracking-wide">Use Today / Tomorrow</p>
            {critical.map(item => (
              <div key={item.id} className="flex items-center justify-between px-3 py-2 bg-amber-50 rounded-xl border border-amber-100">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={14} className="text-amber-400" />
                  <span className="text-sm font-medium text-gray-800">{item.name}</span>
                </div>
                <span className="text-xs font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">{item.days}d left</span>
              </div>
            ))}
          </div>
        )}
        {warning.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-yellow-600 uppercase tracking-wide">Use Within 5 Days</p>
            {warning.map(item => (
              <div key={item.id} className="flex items-center justify-between px-3 py-2 bg-yellow-50 rounded-xl border border-yellow-100">
                <span className="text-sm font-medium text-gray-800">{item.name}</span>
                <span className="text-xs font-bold text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full">{item.days}d left</span>
              </div>
            ))}
          </div>
        )}
        {good.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-emerald-500 uppercase tracking-wide">Good Shape</p>
            {good.map(item => (
              <div key={item.id} className="flex items-center justify-between px-3 py-2 bg-emerald-50 rounded-xl border border-emerald-100">
                <span className="text-sm font-medium text-gray-800">{item.name}</span>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">{item.days}d left</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Cook These First */}
      {highRisk.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
            <ChefHat size={14} className="text-gray-400" /> Cook These First
          </h2>
          <div className="flex gap-2 flex-wrap">
            {highRisk.slice(0, 5).map(item => (
              <span key={item.id} className="px-3 py-1.5 bg-orange-100 text-orange-700 text-xs font-semibold rounded-full border border-orange-200">
                {item.name}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Recipe Cards */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
          <ChefHat size={14} className="text-gray-400" /> Suggested Meals
        </h2>
        <div className="space-y-3">
          {recipes.map(recipe => {
            const style = getMealStyle(recipe.meal);
            return (
              <div key={recipe.meal} className={`rounded-2xl border p-4 space-y-3 ${style.bg}`}>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{style.icon}</span>
                  <div>
                    <p className={`text-xs font-bold uppercase tracking-wider ${style.text}`}>{recipe.meal}</p>
                    <p className="font-bold text-gray-900 text-sm">{recipe.title}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {recipe.ingredients.map(ing => (
                    <span key={ing} className="px-2 py-1 bg-white/70 rounded-lg text-xs font-medium text-gray-700 border border-white/50">{ing}</span>
                  ))}
                </div>
                <p className="text-xs text-gray-500 italic">{recipe.notes}</p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
