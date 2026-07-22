export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export const CATEGORY_LABELS: Record<string, string> = {
  CLIENT: 'Client',
  COLLECTION: 'Collection',
  THEMATIQUE: 'Thematique',
  SPA: 'Spa Francorchamps',
};
