import { useState, type FormEvent } from 'react';
import { UserPlus, ShieldCheck, ShieldOff, Lock, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCreateUser, useDeactivateUser, useTeamMembers, useUpdateUser, useRecentActivity } from '../hooks/useUsers';
import { Button } from '../components/common/Button';
import { formatDateTime, CATEGORY_LABELS } from '../lib/utils';
import type { Role } from '../types';

export function Settings() {
  const { isAdmin } = useAuth();

  return (
    <div className="mx-auto max-w-3xl space-y-10 px-6 py-8 sm:px-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Settings</h1>
        <p className="mt-1 text-sm text-ink-muted">
          {isAdmin ? 'Manage admin access, your team, and recent activity.' : 'Unlock admin access to edit tasks.'}
        </p>
      </div>

      <AdminAccessSection />
      {isAdmin && <TeamMembersSection />}
      {isAdmin && <RecentActivitySection />}
    </div>
  );
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-6 shadow-soft">
      <h2 className="text-base font-semibold text-ink">{title}</h2>
      {description && <p className="mt-1 text-sm text-ink-muted">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function AdminAccessSection() {
  const { isAdmin, login, logout } = useAuth();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    const result = await login(password);
    setIsSubmitting(false);
    if (!result.ok) {
      setError(result.message ?? 'Incorrect password.');
      return;
    }
    setPassword('');
  }

  if (isAdmin) {
    return (
      <Section title="Admin Access" description="Editing is unlocked in this browser.">
        <Button variant="secondary" onClick={logout}>
          <LogOut size={15} /> Lock editing
        </Button>
      </Section>
    );
  }

  return (
    <Section
      title="Admin Access"
      description="Everyone with this link can view everything. Enter the admin password to unlock editing (Add, Edit, Delete, and all fields) in this browser."
    >
      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-ink">Admin password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-56 rounded-xl border border-border bg-surface px-3 py-2 text-sm text-ink focus:border-accent"
            required
          />
        </label>
        <Button type="submit" variant="primary" disabled={isSubmitting}>
          <Lock size={15} /> {isSubmitting ? 'Checking…' : 'Unlock'}
        </Button>
      </form>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
    </Section>
  );
}

function TeamMembersSection() {
  const { data: members, isLoading } = useTeamMembers();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deactivateUser = useDeactivateUser();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'EMPLOYEE' as Role });

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    await createUser.mutateAsync(form);
    setForm({ name: '', email: '', password: '', role: 'EMPLOYEE' });
    setShowAdd(false);
  }

  return (
    <Section title="Team Members" description="Add staff accounts and control who has admin access.">
      {isLoading ? (
        <p className="text-sm text-ink-muted">Loading…</p>
      ) : (
        <ul className="divide-y divide-border">
          {members?.map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className={`truncate text-sm font-medium ${m.active ? 'text-ink' : 'text-ink-faint line-through'}`}>
                  {m.name}
                </p>
                <p className="truncate text-xs text-ink-muted">{m.email}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <select
                  value={m.role}
                  disabled={!m.active}
                  onChange={(e) => updateUser.mutate({ id: m.id, patch: { role: e.target.value as Role } })}
                  className="rounded-lg border border-border bg-surface px-2 py-1 text-xs text-ink disabled:opacity-50"
                >
                  <option value="EMPLOYEE">Employee</option>
                  <option value="ADMIN">Admin</option>
                </select>
                {m.active ? (
                  <button
                    onClick={() => deactivateUser.mutate(m.id)}
                    title="Deactivate"
                    className="rounded-lg p-1.5 text-ink-muted hover:bg-danger-soft hover:text-danger"
                  >
                    <ShieldOff size={15} />
                  </button>
                ) : (
                  <button
                    onClick={() => updateUser.mutate({ id: m.id, patch: { active: true } })}
                    title="Reactivate"
                    className="rounded-lg p-1.5 text-ink-muted hover:bg-success-soft hover:text-success"
                  >
                    <ShieldCheck size={15} />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {showAdd ? (
        <form onSubmit={handleAdd} className="mt-4 grid gap-3 rounded-xl bg-surface-alt p-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-ink">Name</span>
            <input
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className={inputClass}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-ink">Email</span>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className={inputClass}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-ink">Temporary password</span>
            <input
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              className={inputClass}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-ink">Role</span>
            <select
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as Role }))}
              className={inputClass}
            >
              <option value="EMPLOYEE">Employee</option>
              <option value="ADMIN">Admin</option>
            </select>
          </label>
          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit" variant="primary" disabled={createUser.isPending}>
              {createUser.isPending ? 'Adding…' : 'Add member'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setShowAdd(false)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <Button variant="secondary" className="mt-4" onClick={() => setShowAdd(true)}>
          <UserPlus size={15} /> Add team member
        </Button>
      )}
    </Section>
  );
}

function RecentActivitySection() {
  const { data: entries, isLoading } = useRecentActivity();

  return (
    <Section title="Recent Activity" description="The last 50 changes made across all tasks, for accountability.">
      {isLoading ? (
        <p className="text-sm text-ink-muted">Loading…</p>
      ) : entries?.length === 0 ? (
        <p className="text-sm text-ink-muted">No changes recorded yet.</p>
      ) : (
        <ul className="max-h-96 space-y-2 overflow-y-auto text-sm">
          {entries?.map((e) => (
            <li key={e.id} className="rounded-lg px-2 py-1.5 hover:bg-surface-alt">
              <span className="font-medium text-ink">{e.userName ?? 'Someone'}</span>{' '}
              <span className="text-ink-muted">
                changed <span className="font-medium text-ink">{e.field}</span>
                {e.taskFileName ? (
                  <>
                    {' '}
                    on <span className="text-ink">{e.taskFileName}</span>
                    {e.taskCategory ? ` (${CATEGORY_LABELS[e.taskCategory]})` : ''}
                  </>
                ) : null}
              </span>
              <span className="ml-2 text-xs text-ink-faint">{formatDateTime(e.changedAt)}</span>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

const inputClass =
  'w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-ink focus:border-accent';
