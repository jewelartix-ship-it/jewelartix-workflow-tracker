import type { Task, WorkStatus } from '../types';

export const WORK_STATUS_LABELS: Record<WorkStatus, string> = {
  PENDING_CAD: 'CAD Pending',
  PENDING_PREVIEW_SENT: 'CAD Preview Pending',
  PENDING_CAD_CONFIRMATION: 'CAD Confirmation Pending',
  PENDING_STL_SEND: 'STL Pending',
  PENDING_RENDER_PHOTOS: 'Render Photos Pending',
  PENDING_RENDER_VIDEOS: 'Render Videos Pending',
  COMPLETED: 'Completed',
};

export const DASHBOARD_CARD_STATUSES: WorkStatus[] = [
  'PENDING_CAD',
  'PENDING_PREVIEW_SENT',
  'PENDING_CAD_CONFIRMATION',
  'PENDING_STL_SEND',
  'PENDING_RENDER_PHOTOS',
  'PENDING_RENDER_VIDEOS',
];

export const WORK_STATUS_ACCENT: Record<WorkStatus, string> = {
  PENDING_CAD: 'bg-ink-faint',
  PENDING_PREVIEW_SENT: 'bg-ink-faint',
  PENDING_CAD_CONFIRMATION: 'bg-warning',
  PENDING_STL_SEND: 'bg-warning',
  PENDING_RENDER_PHOTOS: 'bg-accent',
  PENDING_RENDER_VIDEOS: 'bg-accent',
  COMPLETED: 'bg-success',
};

export const WORK_STATUS_PILL: Record<WorkStatus, string> = {
  PENDING_CAD: 'bg-surface-alt text-ink-muted',
  PENDING_PREVIEW_SENT: 'bg-surface-alt text-ink-muted',
  PENDING_CAD_CONFIRMATION: 'bg-warning-soft text-warning',
  PENDING_STL_SEND: 'bg-warning-soft text-warning',
  PENDING_RENDER_PHOTOS: 'bg-accent-soft text-accent-hover',
  PENDING_RENDER_VIDEOS: 'bg-accent-soft text-accent-hover',
  COMPLETED: 'bg-success-soft text-success',
};

// Pipeline: CAD Done -> Preview Sent -> CAD Confirm -> STL Send -> Render
// Photos -> Render Videos. "Render Req." was removed from the visible
// pipeline; the renderReq column still exists in the database (unused).
export function computeWorkStatus(
  t: Pick<Task, 'cadDone' | 'previewSent' | 'cadConfirm' | 'stlSend' | 'renderPhotos' | 'renderVideos'>
): WorkStatus {
  if (!t.cadDone) return 'PENDING_CAD';
  if (!t.previewSent) return 'PENDING_PREVIEW_SENT';
  if (!t.cadConfirm) return 'PENDING_CAD_CONFIRMATION';
  if (!t.stlSend) return 'PENDING_STL_SEND';
  if (!t.renderPhotos) return 'PENDING_RENDER_PHOTOS';
  if (!t.renderVideos) return 'PENDING_RENDER_VIDEOS';
  return 'COMPLETED';
}

const STALE_AFTER_DAYS = 7;

export function isStale(task: Task): boolean {
  if (task.workStatus === 'COMPLETED') return false;
  const updated = new Date(task.updatedAt).getTime();
  const days = (Date.now() - updated) / (1000 * 60 * 60 * 24);
  return days > STALE_AFTER_DAYS;
}
