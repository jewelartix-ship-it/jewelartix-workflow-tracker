import { useState } from 'react';
import { Check, X, Minus } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Popover } from './Popover';

interface ProgressCellProps {
  checked: boolean | null;
  onChange: (value: boolean | null) => void;
  readOnly?: boolean;
}

/**
 * Three states: null (blank — the default for a new task, nothing decided
 * yet), true (done), false (explicitly marked not done). Clicking (admin
 * only) opens a popup with ✓, ✗, and a third "clear" option to reset back to
 * blank in case of a mistake.
 */
export function ProgressCell({ checked, onChange, readOnly }: ProgressCellProps) {
  const [open, setOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  function pick(value: boolean | null) {
    onChange(value);
    setOpen(false);
  }

  const indicator = (
    <span
      className={cn(
        'inline-flex h-5 w-5 items-center justify-center rounded-md border',
        checked === true && 'border-accent bg-accent text-surface',
        checked === false && 'border-danger/40 bg-danger-soft text-danger',
        checked === null && 'border-dashed border-border-strong bg-surface text-transparent'
      )}
    >
      {checked === true && <Check size={13} strokeWidth={3} />}
      {checked === false && <X size={13} strokeWidth={3} />}
    </span>
  );

  if (readOnly) {
    return indicator;
  }

  return (
    <div className="inline-block" onClick={(e) => e.stopPropagation()}>
      <button ref={setAnchorEl} onClick={() => setOpen((v) => !v)} aria-label="Set status">
        {indicator}
      </button>

      {open && (
        <Popover anchorEl={anchorEl} onClose={() => setOpen(false)} align="center">
          <div className="flex gap-1 rounded-xl border border-border bg-surface p-1 shadow-popover">
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
            <button
              onClick={() => pick(null)}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-faint hover:bg-surface-alt"
              aria-label="Clear (reset to blank)"
              title="Clear"
            >
              <Minus size={16} strokeWidth={3} />
            </button>
          </div>
        </Popover>
      )}
    </div>
  );
}
