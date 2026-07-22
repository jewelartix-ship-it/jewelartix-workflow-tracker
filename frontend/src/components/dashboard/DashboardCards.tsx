import type { Task, WorkStatus } from '../../types';
import { DASHBOARD_CARD_STATUSES, WORK_STATUS_LABELS } from '../../lib/workStatus';
import { cn } from '../../lib/utils';

interface DashboardCardsProps {
  tasks: Task[];
  activeFilter: WorkStatus | null;
  onFilterChange: (status: WorkStatus | null) => void;
}

export function DashboardCards({ tasks, activeFilter, onFilterChange }: DashboardCardsProps) {
  const counts = new Map<WorkStatus, number>();
  for (const status of DASHBOARD_CARD_STATUSES) counts.set(status, 0);
  for (const task of tasks) {
    if (counts.has(task.workStatus)) counts.set(task.workStatus, (counts.get(task.workStatus) ?? 0) + 1);
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {DASHBOARD_CARD_STATUSES.map((status) => {
        const isActive = activeFilter === status;
        return (
          <button
            key={status}
            onClick={() => onFilterChange(isActive ? null : status)}
            className={cn(
              'rounded-xl sm:rounded-2xl border px-2.5 py-2 sm:px-4 sm:py-3 text-left transition-colors',
              isActive
                ? 'border-accent bg-accent-soft'
                : 'border-border bg-surface hover:border-border-strong hover:bg-surface-hover'
            )}
            aria-pressed={isActive}
          >
            <p className={cn('tabular text-lg sm:text-2xl font-semibold', isActive ? 'text-accent-hover' : 'text-ink')}>
              {counts.get(status)}
            </p>
            <p className={cn('mt-0.5 text-[10px] sm:text-xs font-medium leading-tight', isActive ? 'text-accent-hover' : 'text-ink-muted')}>
              {WORK_STATUS_LABELS[status]}
            </p>
          </button>
        );
      })}
    </div>
  );
}
