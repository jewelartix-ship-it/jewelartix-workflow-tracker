import type { Task } from '../../types';
import { EditableCell } from './EditableCell';
import { formatDate, cn } from '../../lib/utils';

interface ReasonTableProps {
  tasks: Task[];
  isAdmin: boolean;
  onReasonEdit: (id: string, value: string) => void;
  emptyMessage: string;
}

export function ReasonTable({ tasks, isAdmin, onReasonEdit, emptyMessage }: ReasonTableProps) {
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
        <p className="text-sm text-ink-muted">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
      <table className="w-full min-w-[900px] border-collapse text-left">
        <thead className="sticky top-0 z-10 bg-surface-alt">
          <tr className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
            <th className="min-w-[112px] px-3 py-2.5">Date</th>
            <th className="min-w-[100px] px-3 py-2.5">SR</th>
            <th className="min-w-[100px] px-3 py-2.5">Lot</th>
            <th className="min-w-[160px] px-3 py-2.5">File Name</th>
            <th className="min-w-[240px] px-3 py-2.5">Reason</th>
            <th className="min-w-[180px] px-3 py-2.5">Note</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => {
            const flagged = !!task.reason?.trim();
            return (
              <tr
                key={task.id}
                className={cn(
                  'border-t border-border transition-colors hover:bg-surface-alt/60',
                  flagged && 'bg-warning-soft/40'
                )}
              >
                <td className={cn('border-l-4 px-3 py-1.5 tabular', flagged ? 'border-warning' : 'border-transparent')}>
                  {formatDate(task.date)}
                </td>
                <td className="px-3 py-1.5 text-sm text-ink">{task.sr}</td>
                <td className="px-3 py-1.5 text-sm text-ink">{task.lot}</td>
                <td className="px-3 py-1.5 text-sm text-ink">{task.fileName}</td>
                <td className="px-1 py-1">
                  <EditableCell
                    value={task.reason ?? ''}
                    onCommit={(v) => onReasonEdit(task.id, v)}
                    placeholder="Add reason"
                    readOnly={!isAdmin}
                  />
                </td>
                <td className="px-3 py-1.5 text-sm text-ink-muted">{task.note || '—'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
