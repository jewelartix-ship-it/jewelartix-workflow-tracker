import { NavLink } from 'react-router-dom';
import { Home, Users, Layers, Sparkles, Flower2, Settings, ShieldCheck, Eye } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';

const NAV_ITEMS = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/client', label: 'Client', icon: Users },
  { to: '/collection', label: 'Collection', icon: Layers },
  { to: '/thematique', label: 'Thematique', icon: Sparkles },
  { to: '/spa', label: 'Spa Francorchamps', icon: Flower2 },
];

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const { isAdmin } = useAuth();

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors',
      isActive ? 'bg-accent-soft text-accent-hover' : 'text-ink-muted hover:bg-surface-hover hover:text-ink'
    );

  return (
    <div className="flex h-full flex-col bg-surface-alt">
      <div className="flex items-center gap-2 px-5 pb-2 pt-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-sm font-semibold text-surface">
          W
        </div>
        <span className="text-[15px] font-semibold tracking-tight text-ink">Workflow</span>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={linkClass} onClick={onNavigate}>
            <Icon size={17} strokeWidth={2} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="space-y-1 border-t border-border px-3 py-3">
        <NavLink to="/settings" className={linkClass} onClick={onNavigate}>
          <Settings size={17} strokeWidth={2} />
          Settings
        </NavLink>
      </div>

      <div className="flex items-center gap-3 border-t border-border px-4 py-4">
        <div
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
            isAdmin ? 'bg-accent-soft text-accent-hover' : 'bg-surface-hover text-ink-muted'
          )}
        >
          {isAdmin ? <ShieldCheck size={16} /> : <Eye size={16} />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-ink">{isAdmin ? 'Admin mode' : 'View only'}</p>
          <p className="truncate text-xs text-ink-muted">
            {isAdmin ? 'You can edit everything' : 'Unlock in Settings to edit'}
          </p>
        </div>
      </div>
    </div>
  );
}
