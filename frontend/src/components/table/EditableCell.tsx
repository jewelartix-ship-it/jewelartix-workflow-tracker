import { useEffect, useRef, useState } from 'react';

interface EditableCellProps {
  value: string;
  onCommit: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  className?: string;
  readOnly?: boolean;
}

/**
 * Double-click turns the cell into an input; Enter or blur saves, Escape
 * cancels. This is the one interaction pattern behind every "double click to
 * edit" column in the spec (Date, SR, Lot, File Name, Note, Reason).
 */
export function EditableCell({ value, onCommit, placeholder, multiline, className, readOnly }: EditableCellProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLInputElement & HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing) {
      ref.current?.focus();
      ref.current?.select();
    }
  }, [editing]);

  function commit() {
    setEditing(false);
    if (draft !== value) onCommit(draft);
  }

  function cancel() {
    setDraft(value);
    setEditing(false);
  }

  if (editing) {
    const shared = {
      ref,
      value: draft,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDraft(e.target.value),
      onBlur: commit,
      onKeyDown: (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !multiline) commit();
        if (e.key === 'Escape') cancel();
      },
      className: 'w-full rounded-lg border border-accent bg-surface px-1.5 py-1 text-sm text-ink outline-none',
    };
    return multiline ? <textarea {...shared} rows={2} /> : <input {...shared} type="text" />;
  }

  return (
    <div
      onDoubleClick={() => !readOnly && setEditing(true)}
      className={`min-h-[1.75rem] truncate rounded-lg px-1.5 py-1 text-sm ${readOnly ? '' : 'cursor-text'} ${
        value ? 'text-ink' : 'text-ink-faint'
      } ${className ?? ''}`}
      title={readOnly ? undefined : 'Double-click to edit'}
    >
      {value || placeholder || '—'}
    </div>
  );
}
