import { AlertCircle } from 'lucide-react';
import type { Task } from '../../types';
import { EditableCell } from './EditableCell';
import { DriveCell } from './DriveCell';
import { WORK_STATUS_ACCENT } from '../../lib/workStatus';
import { isStale } from '../../lib/workStatus';
import { formatDate } from '../../lib/utils';
import { cn } from '../../lib/utils';

interface ProgressField {
  key: 'cadDone' | 'previewSent' | 'cadConfirm' | 'stlSend' | 'renderPhotos' | 'renderVideos';
  label: string;
  owner: string;
}

const PROGRESS_COLUMNS: ProgressField[] = [
  { key: 'cadDone', label: 'CAD Done', owner: 'JewelArtix' },
  { key: 'previewSent', label: 'Preview Sent', owner: 'JewelArtix' },
  { key: 'cadConfirm', label: 'CAD Confirm', owner: 'Polome' },
  { key: 'stlSend', label: 'STL Send', owner: 'JewelArtix' },
  { key: 'renderPhotos', label: 'Render Photos', owner: 'JewelArtix' },
  { key: 'renderVideos', label: 'Render Videos', owner: 'JewelArtix' },
];

interface DataTableProps {
  tasks: Task[];
  isAdmin: boolean;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onFieldEdit: (id: string, field: 'date' | 'sr' | 'lot' | 'fileName' | 'note', value: string) => void;
  onProgressToggle: (id: string, field: ProgressField['key'], value: boolean) => void;
  onCadDriveSave: (id: string, link: string) => void;
  onCadDriveRemove: (id: string) => void;
  onRenderDriveSave: (id: string, link: string) => void;
  onRenderDriveRemove: (id: string) => void;
  onRowDoubleClick: (task: Task) => void;
  emptyMessage: string;
}

export function DataTable({
  tasks,
  isAdmin,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onFieldEdit,
  onProgressToggle,
  onCadDriveSave,
  onCadDriveRemove,
  onRenderDriveSave,
  onRenderDriveRemove,
  onRowDoubleClick,
  emptyMessage,
}: DataTableProps) {
  const allSelected = tasks.length > 0 && tasks.every((t) => selectedIds.has(t.id));

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
        <p className="text-sm text-ink-muted">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
      <table className="w-full min-w-[820px] border-collapse text-left">
        <thead className="sticky top-0 z-10 bg-surface-alt">
          <tr className="divide-x divide-border text-xs font-semibold uppercase tracking-wide text-ink-muted">
            <th className="w-10 px-2 py-2.5">
              {isAdmin && (
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={onToggleSelectAll}
                  className="h-4 w-4 rounded border-border-strong text-accent focus:ring-accent"
                  aria-label="Select all rows"
                />
              )}
            </th>
            <th className="min-w-[54px] px-1.5 py-2.5 text-center">Date</th>
            <th className="min-w-[50px] px-1.5 py-2.5 text-center">SR</th>
            <th className="min-w-[50px] px-1.5 py-2.5 text-center">Lot</th>
            <th className="min-w-[110px] px-1.5 py-2.5 text-center">File Name</th>
            {PROGRESS_COLUMNS.map((c) => (
              <th key={c.key} className="w-[80px] px-1.5 py-2.5 text-center">
                {c.label}
                <span className="mt-0.5 block text-[9px] font-medium normal-case tracking-normal text-ink-faint">
                  by {c.owner}
                </span>
              </th>
            ))}
            <th className="w-14 px-2 py-2.5">CAD Drive</th>
            <th className="w-14 px-2 py-2.5">Render Drive</th>
            <th className="min-w-[160px] px-2 py-2.5">Note</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => {
            const selected = selectedIds.has(task.id);
            const stale = isStale(task);
            return (
              <tr
                key={task.id}
                onDoubleClick={(e) => {
                  if (!isAdmin) return;
                  // Only open the full popup on a double click that isn't
                  // itself targeting an inline-editable cell (those handle
                  // their own double click).
                  const target = e.target as HTMLElement;
                  if (!target.closest('[data-inline-editable]') && !target.closest('[data-no-row-edit]')) {
                    onRowDoubleClick(task);
                  }
                }}
                className={cn(
                  'divide-x divide-border border-t border-border transition-colors hover:bg-surface-alt/60',
                  selected && 'bg-accent-soft/40'
                )}
              >
                <td className={cn('border-l-4 px-2 py-1.5', WORK_STATUS_ACCENT[task.workStatus])}>
                  {isAdmin && (
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => onToggleSelect(task.id)}
                      className="h-4 w-4 rounded border-border-strong text-accent focus:ring-accent"
                      aria-label={`Select row ${task.sr}`}
                    />
                  )}
                </td>
                <td data-inline-editable className="px-1 py-1 text-center tabular">
                  <div className="flex items-center justify-center gap-1.5">
                    {stale && (
                      <span title="No update in over 7 days on this stage">
                        <AlertCircle size={13} className="shrink-0 text-warning" />
                      </span>
                    )}
                    <EditableCell
                      value={formatDate(task.date)}
                      onCommit={(v) => onFieldEdit(task.id, 'date', v)}
                      readOnly={!isAdmin}
                    />
                  </div>
                </td>
                <td data-inline-editable className="px-1 py-1 text-center">
                  <EditableCell value={task.sr} onCommit={(v) => onFieldEdit(task.id, 'sr', v)} readOnly={!isAdmin} />
                </td>
                <td data-inline-editable className="px-1 py-1 text-center">
                  <EditableCell value={task.lot} onCommit={(v) => onFieldEdit(task.id, 'lot', v)} readOnly={!isAdmin} />
                </td>
                <td data-inline-editable className="px-1 py-1 text-center">
                  <EditableCell
                    value={task.fileName}
                    onCommit={(v) => onFieldEdit(task.id, 'fileName', v)}
                    readOnly={!isAdmin}
                  />
                </td>
                {PROGRESS_COLUMNS.map((c) => (
                  <td key={c.key} data-no-row-edit className="px-1.5 py-1.5 text-center">
                    <input
                      type="checkbox"
                      checked={task[c.key]}
                      onChange={(e) => onProgressToggle(task.id, c.key, e.target.checked)}
                      disabled={!isAdmin}
                      className="h-4 w-4 rounded border-border-strong text-accent focus:ring-accent disabled:cursor-not-allowed disabled:opacity-70"
                    />
                  </td>
                ))}
                <td data-no-row-edit className="px-1.5 py-1.5">
                  <DriveCell
                    link={task.cadDriveLink}
                    onSave={(link) => onCadDriveSave(task.id, link)}
                    onRemove={() => onCadDriveRemove(task.id)}
                    readOnly={!isAdmin}
                  />
                </td>
                <td data-no-row-edit className="px-1.5 py-1.5">
                  <DriveCell
                    link={task.renderDriveLink}
                    onSave={(link) => onRenderDriveSave(task.id, link)}
                    onRemove={() => onRenderDriveRemove(task.id)}
                    readOnly={!isAdmin}
                  />
                </td>
                <td data-inline-editable className="px-1 py-1">
                  <EditableCell
                    value={task.note ?? ''}
                    onCommit={(v) => onFieldEdit(task.id, 'note', v)}
                    placeholder="Add note"
                    readOnly={!isAdmin}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
