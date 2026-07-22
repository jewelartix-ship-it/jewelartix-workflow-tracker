export type Category = 'CLIENT' | 'COLLECTION' | 'THEMATIQUE' | 'SPA';

export type WorkStatus =
  | 'PENDING_CAD'
  | 'PENDING_PREVIEW_SENT'
  | 'PENDING_CAD_CONFIRMATION'
  | 'PENDING_STL_SEND'
  | 'PENDING_RENDER_PHOTOS'
  | 'PENDING_RENDER_VIDEOS'
  | 'COMPLETED';

export type Role = 'ADMIN' | 'EMPLOYEE';

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
  createdAt: string;
}

export interface Task {
  id: string;
  category: Category;
  date: string;
  sr: string;
  lot: string;
  fileName: string;
  cadDone: boolean;
  previewSent: boolean;
  cadConfirm: boolean;
  stlSend: boolean;
  renderReq: boolean;
  renderPhotos: boolean;
  renderVideos: boolean;
  cadDriveLink: string | null;
  renderDriveLink: string | null;
  driveLink: string | null;
  note: string | null;
  reason: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  workStatus: WorkStatus;
}

type ProgressFieldKeys = 'cadDone' | 'previewSent' | 'cadConfirm' | 'stlSend' | 'renderPhotos' | 'renderVideos';

export type TaskDraft = Pick<Task, 'category' | 'date' | 'sr' | 'lot' | 'fileName'> &
  Partial<Pick<Task, ProgressFieldKeys | 'cadDriveLink' | 'renderDriveLink' | 'driveLink' | 'note' | 'reason'>>;

export interface TaskSummary {
  total: number;
  pending: number;
  completed: number;
}

export type TaskSummaryByCategory = Record<Category, TaskSummary>;

export interface AuditEntry {
  id: string;
  field: string;
  oldValue: string | null;
  newValue: string | null;
  changedAt: string;
  userName: string | null;
}

export interface RecentActivityEntry extends AuditEntry {
  taskId: string | null;
  taskFileName: string | null;
  taskCategory: Category | null;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: { path: string; message: string }[];
  };
}
