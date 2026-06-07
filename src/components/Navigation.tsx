import { LayoutDashboard, Package, ChefHat, ShoppingCart } from 'lucide-react';

export type View = 'dashboard' | 'pantry' | 'kitchen' | 'shopping';

interface Props {
  active: View;
  onChange: (v: View) => void;
}

const NAV_ITEMS: { id: View; label: string; Icon: React.FC<{ size?: number; className?: string }> }[] = [
  { id: 'dashboard', label: 'Intake', Icon: LayoutDashboard },
  { id: 'pantry', label: 'Pantry', Icon: Package },
  { id: 'kitchen', label: 'Kitchen', Icon: ChefHat },
  { id: 'shopping', label: 'Shopping', Icon: ShoppingCart },
];

export default function Navigation({ active, onChange }: Props) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 shadow-lg md:top-0 md:bottom-auto md:shadow-sm">
      <div className="max-w-5xl mx-auto flex items-center justify-around md:justify-start md:gap-1 md:px-6 md:h-16">
        <div className="hidden md:flex items-center gap-2 mr-8">
          <div className="w-7 h-7 bg-emerald-600 rounded-lg flex items-center justify-center">
            <Package size={16} className="text-white" />
          </div>
          <span className="font-bold text-gray-900 text-lg tracking-tight">FindYourItems</span>
        </div>
        {NAV_ITEMS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={`flex flex-col md:flex-row items-center gap-1 md:gap-2 px-4 py-3 md:py-2 rounded-xl transition-all duration-200 text-xs md:text-sm font-medium ${
              active === id
                ? 'text-emerald-600 bg-emerald-50 md:bg-emerald-50'
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Icon size={20} className={active === id ? 'text-emerald-600' : ''} />
            <span>{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
