export const WORK_STATUSES = [
  'PENDING_CAD',
  'PENDING_PREVIEW_SENT',
  'PENDING_CAD_CONFIRMATION',
  'PENDING_STL_SEND',
  'PENDING_RENDER_PHOTOS',
  'PENDING_RENDER_VIDEOS',
  'COMPLETED',
] as const;

export type WorkStatus = (typeof WORK_STATUSES)[number];

export const WORK_STATUS_LABELS: Record<WorkStatus, string> = {
  PENDING_CAD: 'CAD Pending',
  PENDING_PREVIEW_SENT: 'CAD Preview Pending',
  PENDING_CAD_CONFIRMATION: 'CAD Confirmation Pending',
  PENDING_STL_SEND: 'STL Pending',
  PENDING_RENDER_PHOTOS: 'Render Photos Pending',
  PENDING_RENDER_VIDEOS: 'Render Videos Pending',
  COMPLETED: 'Completed',
};

interface ProgressFlags {
  cadDone: boolean | null;
  previewSent: boolean | null;
  cadConfirm: boolean | null;
  stlSend: boolean | null;
  renderPhotos: boolean | null;
  renderVideos: boolean | null;
}

/**
 * Pipeline: CAD Done (JewelArtix) -> Preview Sent (JewelArtix) -> CAD
 * Confirm (client) -> STL Send (JewelArtix) -> Render Photos (JewelArtix)
 * -> Render Videos (JewelArtix).
 *
 * Each stage is tri-state: blank (null, nothing decided yet), done (true),
 * or explicitly marked not done (false — e.g. "no render needed" for this
 * particular task). Only blank counts as pending here; an explicit ✗ means
 * that stage is resolved/not applicable, and the pipeline moves on to check
 * the next one, rather than counting it as something still waiting on.
 *
 * "Render Req." was removed from the visible pipeline. The renderReq column
 * still exists in the database (harmless, unused) — deliberately left in
 * place rather than dropped, to avoid another schema/migration change.
 */
export function computeWorkStatus(t: ProgressFlags): WorkStatus {
  if (t.cadDone === null) return 'PENDING_CAD';
  if (t.previewSent === null) return 'PENDING_PREVIEW_SENT';
  if (t.cadConfirm === null) return 'PENDING_CAD_CONFIRMATION';
  if (t.stlSend === null) return 'PENDING_STL_SEND';
  if (t.renderPhotos === null) return 'PENDING_RENDER_PHOTOS';
  if (t.renderVideos === null) return 'PENDING_RENDER_VIDEOS';
  return 'COMPLETED';
}
