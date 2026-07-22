import { useEffect, useRef, useState } from 'react';
import { Plus, Link2, ExternalLink, Pencil, Trash2 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface DriveCellProps {
  link: string | null;
  onSave: (link: string) => void;
  onRemove: () => void;
  readOnly?: boolean;
}

export function DriveCell({ link, onSave, onRemove, readOnly }: DriveCellProps) {
  const [mode, setMode] = useState<'closed' | 'menu' | 'edit'>('closed');
  const [draft, setDraft] = useState(link ?? '');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setMode('closed');
      }
    }
    if (mode !== 'closed') document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [mode]);

  function openEdit() {
    setDraft(link ?? '');
    setMode('edit');
  }

  function save() {
    if (!draft.trim()) return;
    onSave(draft.trim());
    setMode('closed');
  }

  // Viewers (not admin): clicking the icon shows a small popup with just an
  // "Open" button — same click-to-open experience as admin mode, minus the
  // Edit/Remove options they shouldn't have.
  if (readOnly) {
    if (!link) {
      return <span className="inline-block px-2 py-1 text-ink-faint">—</span>;
    }
    return (
      <div ref={containerRef} className="relative inline-block" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => setMode(mode === 'menu' ? 'closed' : 'menu')}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-accent hover:bg-accent-soft"
          title={link}
        >
          <Link2 size={15} />
        </button>

        {mode === 'menu' && (
          <div className="absolute left-0 top-full z-30 mt-1 w-40 overflow-hidden rounded-xl border border-border bg-surface py-1 shadow-popover">
            <a
              href={link}
              target="_blank"
              rel="noreferrer"
              onClick={() => setMode('closed')}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-ink hover:bg-surface-alt"
            >
              <ExternalLink size={14} /> Open
            </a>
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative inline-block" onClick={(e) => e.stopPropagation()}>
      {link ? (
        <button
          onClick={() => setMode(mode === 'menu' ? 'closed' : 'menu')}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-accent hover:bg-accent-soft"
          title={link}
        >
          <Link2 size={15} />
        </button>
      ) : (
        <button
          onClick={openEdit}
          className="inline-flex items-center justify-center rounded-lg p-1.5 text-ink-faint hover:bg-surface-alt hover:text-ink-muted"
          aria-label="Add Drive link"
        >
          <Plus size={15} />
        </button>
      )}

      {mode === 'menu' && link && (
        <div className="absolute left-0 top-full z-30 mt-1 w-40 overflow-hidden rounded-xl border border-border bg-surface py-1 shadow-popover">
          <a
            href={link}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-ink hover:bg-surface-alt"
          >
            <ExternalLink size={14} /> Open
          </a>
          <button
            onClick={openEdit}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-ink hover:bg-surface-alt"
          >
            <Pencil size={14} /> Edit
          </button>
          <button
            onClick={() => {
              onRemove();
              setMode('closed');
            }}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-danger hover:bg-danger-soft"
          >
            <Trash2 size={14} /> Remove
          </button>
        </div>
      )}

      {mode === 'edit' && (
        <div className="absolute left-0 top-full z-30 mt-1 w-72 rounded-xl border border-border bg-surface p-3 shadow-popover">
          <input
            autoFocus
            type="url"
            placeholder="https://drive.google.com/…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && save()}
            className="w-full rounded-lg border border-border px-2.5 py-1.5 text-sm focus:border-accent"
          />
          <div className="mt-2 flex justify-end gap-2">
            <button
              onClick={() => setMode('closed')}
              className="rounded-lg px-2.5 py-1 text-xs font-medium text-ink-muted hover:bg-surface-alt"
            >
              Cancel
            </button>
            <button
              onClick={save}
              className={cn(
                'rounded-lg px-2.5 py-1 text-xs font-medium text-surface',
                draft.trim() ? 'bg-accent hover:bg-accent-hover' : 'bg-ink-faint'
              )}
              disabled={!draft.trim()}
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
