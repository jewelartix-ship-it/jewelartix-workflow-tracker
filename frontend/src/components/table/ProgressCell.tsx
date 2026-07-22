import { useEffect, useRef, useState } from 'react';
import { Check, X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ProgressCellProps {
  checked: boolean;
  onChange: (value: boolean) => void;
  readOnly?: boolean;
}

/**
 * Shows the current state as a small check/cross indicator. For admins,
 * clicking it opens a tiny popup with explicit ✓ and ✗ buttons to pick from,
 * rather than a plain checkbox toggle.
 */
export function ProgressCell({ checked, onChange, readOnly }: ProgressCellProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  function pick(value: boolean) {
    onChange(value);
    setOpen(false);
  }

  const indicator = (
    <span
      className={cn(
        'inline-flex h-5 w-5 items-center justify-center rounded-md border',
        checked ? 'border-accent bg-accent text-surface' : 'border-border-strong bg-surface text-ink-faint'
      )}
    >
      {checked ? <Check size={13} strokeWidth={3} /> : <X size={13} strokeWidth={3} />}
    </span>
  );

  if (readOnly) {
    return indicator;
  }

  return (
    <div ref={containerRef} className="relative inline-block" onClick={(e) => e.stopPropagation()}>
      <button onClick={() => setOpen((v) => !v)} aria-label="Set status">
        {indicator}
      </button>

      {open && (
        <div className="absolute left-1/2 top-full z-30 mt-1 flex -translate-x-1/2 gap-1 rounded-xl border border-border bg-surface p-1 shadow-popover">
          <button
            onClick={() => pick(true)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-success hover:bg-success-soft"
            aria-label="Mark done"
          >
            <Check size={16} strokeWidth={3} />
          </button>
          <button
            onClick={() => pick(false)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-danger hover:bg-danger-soft"
            aria-label="Mark not done"
          >
            <X size={16} strokeWidth={3} />
          </button>
        </div>
      )}
    </div>
  );
}
