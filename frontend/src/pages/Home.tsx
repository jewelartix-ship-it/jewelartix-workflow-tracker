import { Link } from 'react-router-dom';
import { Users, Layers, Sparkles, Flower2, ArrowRight } from 'lucide-react';
import { useTaskSummary } from '../hooks/useTasks';
import type { Category } from '../types';

const CATEGORIES: { to: string; category: Category; label: string; icon: typeof Users }[] = [
  { to: '/client', category: 'CLIENT', label: 'Client', icon: Users },
  { to: '/collection', category: 'COLLECTION', label: 'Collection', icon: Layers },
  { to: '/thematique', category: 'THEMATIQUE', label: 'Thematique', icon: Sparkles },
  { to: '/spa', category: 'SPA', label: 'Spa Francorchamps', icon: Flower2 },
];

export function Home() {
  const { data: summary, isLoading } = useTaskSummary();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="mx-auto max-w-5xl px-6 py-10 sm:px-8">
      <p className="text-sm font-medium text-ink-muted">
        {greeting}
      </p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">Where do you want to go?</h1>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {CATEGORIES.map(({ to, category, label, icon: Icon }) => {
          const s = summary?.[category];
          return (
            <Link
              key={category}
              to={to}
              className="group flex items-center justify-between rounded-2xl border border-border bg-surface p-5 shadow-soft transition-colors hover:border-border-strong hover:bg-surface-hover"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-accent-hover">
                  <Icon size={20} />
                </div>
                <div>
                  <p className="font-medium text-ink">{label}</p>
                  <p className="tabular text-sm text-ink-muted">
                    {isLoading || !s ? 'Loading…' : `${s.pending} pending · ${s.total} total`}
                  </p>
                </div>
              </div>
              <ArrowRight size={18} className="text-ink-faint transition-transform group-hover:translate-x-0.5" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
