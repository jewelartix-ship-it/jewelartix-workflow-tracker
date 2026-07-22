import type { WorkStatus } from '../../types';
import { WORK_STATUS_LABELS, WORK_STATUS_PILL } from '../../lib/workStatus';
import { cn } from '../../lib/utils';

export function StatusPill({ status }: { status: WorkStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium',
        WORK_STATUS_PILL[status]
      )}
    >
      {WORK_STATUS_LABELS[status]}
    </span>
  );
}
