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
  cadDone: boolean;
  previewSent: boolean;
  cadConfirm: boolean;
  stlSend: boolean;
  renderPhotos: boolean;
  renderVideos: boolean;
}

/**
 * Pipeline: CAD Done (JewelArtix) -> Preview Sent (JewelArtix) -> CAD
 * Confirm (client) -> STL Send (JewelArtix) -> Render Photos (JewelArtix)
 * -> Render Videos (JewelArtix).
 *
 * "Render Req." was removed from the visible pipeline. The renderReq column
 * still exists in the database (harmless, unused) — deliberately left in
 * place rather than dropped, to avoid another schema/migration change.
 */
export function computeWorkStatus(t: ProgressFlags): WorkStatus {
  if (!t.cadDone) return 'PENDING_CAD';
  if (!t.previewSent) return 'PENDING_PREVIEW_SENT';
  if (!t.cadConfirm) return 'PENDING_CAD_CONFIRMATION';
  if (!t.stlSend) return 'PENDING_STL_SEND';
  if (!t.renderPhotos) return 'PENDING_RENDER_PHOTOS';
  if (!t.renderVideos) return 'PENDING_RENDER_VIDEOS';
  return 'COMPLETED';
}
