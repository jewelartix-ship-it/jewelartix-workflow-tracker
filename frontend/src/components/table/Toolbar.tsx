import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { Button } from '../common/Button';

interface ToolbarProps {
  isAdmin: boolean;
  onAdd: () => void;
  onEdit: () => void;
  onDelete: () => void;
  selectedCount: number;
  search: string;
  onSearchChange: (value: string) => void;
}

export function Toolbar({ isAdmin, onAdd, onEdit, onDelete, selectedCount, search, onSearchChange }: ToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {isAdmin && (
        <>
          <Button variant="primary" onClick={onAdd}>
            <Plus size={16} /> Add
          </Button>
          <Button variant="secondary" onClick={onEdit} disabled={selectedCount !== 1}>
            <Pencil size={15} /> Edit
          </Button>
          <Button variant="danger" onClick={onDelete} disabled={selectedCount === 0}>
            <Trash2 size={15} /> Delete{selectedCount > 1 ? ` (${selectedCount})` : ''}
          </Button>
        </>
      )}

      <div className="relative ml-auto w-full sm:w-64">
        <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search…"
          className="w-full rounded-xl border border-border bg-surface py-2 pl-9 pr-3 text-sm text-ink placeholder:text-ink-faint focus:border-accent"
        />
      </div>
    </div>
  );
}
