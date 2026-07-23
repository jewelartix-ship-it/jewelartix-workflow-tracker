import { useState, type FormEvent, type ReactNode } from 'react';
import { Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

/**
 * Shown to absolutely everyone before they can see any part of the app —
 * separate from (and in front of) the admin edit password. The backend
 * enforces this on the actual data routes too (see
 * middleware/requireViewPassword.ts), so it can't be bypassed by calling the
 * API directly.
 */
export function ViewGate({ children }: { children: ReactNode }) {
  const { hasViewAccess, loginView } = useAuth();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (hasViewAccess) return <>{children}</>;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    const result = await loginView(password);
    setIsSubmitting(false);
    if (!result.ok) {
      setError(result.message ?? 'Incorrect password.');
      return;
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6 shadow-soft">
        <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-accent-soft text-accent-hover">
          <Lock size={20} />
        </div>
        <h1 className="text-center text-lg font-semibold text-ink">This is confidential information</h1>
        <p className="mt-1 text-center text-sm text-ink-muted">Please enter the password to continue.</p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-3">
          <input
            type="password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-ink focus:border-accent"
            placeholder="Password"
            required
          />
          {error && <p className="text-sm text-danger">{error}</p>}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-accent px-3 py-2 text-sm font-medium text-surface hover:bg-accent-hover disabled:opacity-60"
          >
            {isSubmitting ? 'Checking…' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}
