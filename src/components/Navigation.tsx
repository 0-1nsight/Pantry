import { LayoutDashboard, Package, ChefHat, ShoppingCart, LogOut, User } from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { useState, useRef, useEffect } from 'react';
import PackageIcon from './PackageIcon';

export type View = 'dashboard' | 'pantry' | 'kitchen' | 'shopping';

interface Props {
  active: View;
  onChange: (v: View) => void;
  user: SupabaseUser | null;
  onSignOut: () => void;
}

const NAV_ITEMS: { id: View; label: string; Icon: React.FC<{ size?: number; className?: string }> }[] = [
  { id: 'dashboard', label: 'Intake', Icon: LayoutDashboard },
  { id: 'pantry', label: 'Pantry', Icon: Package },
  { id: 'kitchen', label: 'Kitchen', Icon: ChefHat },
  { id: 'shopping', label: 'Shopping', Icon: ShoppingCart },
];

export default function Navigation({ active, onChange, user, onSignOut }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    window.addEventListener('click', onClick);
    return () => window.removeEventListener('click', onClick);
  }, [menuOpen]);

  const email = user?.email ?? '';
  const initials = email.slice(0, 2).toUpperCase();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 shadow-lg md:top-0 md:bottom-auto md:shadow-sm">
      <div className="max-w-5xl mx-auto flex items-center justify-around md:justify-between md:px-6 md:h-16">
        <div className="hidden md:flex items-center gap-2">
          <div className="w-7 h-7 bg-emerald-600 rounded-lg flex items-center justify-center">
            <PackageIcon size={16} className="text-white" />
          </div>
          <span className="font-bold text-gray-900 text-lg tracking-tight">FindYourItems</span>
        </div>

        <div className="flex items-center gap-1">
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

        {/* User Menu */}
        <div ref={menuRef} className="hidden md:block relative">
          <button onClick={() => setMenuOpen(o => !o)} className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors">
            <div className="w-8 h-8 bg-emerald-100 text-emerald-700 rounded-lg flex items-center justify-center text-sm font-bold">
              {initials}
            </div>
            <div className="text-left hidden lg:block">
              <p className="text-xs font-semibold text-gray-700 truncate max-w-[140px]">{email}</p>
              <p className="text-[10px] text-gray-400">My Pantry</p>
            </div>
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50">
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-xs text-gray-400">Signed in as</p>
                <p className="text-sm font-medium text-gray-900 truncate">{email}</p>
              </div>
              <button
                onClick={() => { setMenuOpen(false); onSignOut(); }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut size={16} /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
