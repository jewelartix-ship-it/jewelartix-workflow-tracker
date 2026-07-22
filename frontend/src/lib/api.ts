import type { ApiErrorBody } from '../types';

export class ApiRequestError extends Error {
  status: number;
  code: string;
  details?: ApiErrorBody['error']['details'];

  constructor(status: number, body: ApiErrorBody) {
    super(body.error?.message ?? 'Request failed');
    this.status = status;
    this.code = body.error?.code ?? 'UNKNOWN';
    this.details = body.error?.details;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  // Same storage key as AuthContext.ADMIN_PASSWORD_STORAGE_KEY, inlined here
  // to avoid a circular import (AuthContext itself imports this file).
  const adminPassword = sessionStorage.getItem('admin-password');

  const res = await fetch(`/api${path}`, {
    credentials: 'include',
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      'X-Requested-With': 'workflow-frontend',
      ...(adminPassword ? { 'X-Admin-Password': adminPassword } : {}),
    },
    ...options,
  });

  if (res.status === 204) return undefined as T;

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const body = isJson ? await res.json() : undefined;

  if (!res.ok) {
    throw new ApiRequestError(res.status, body ?? { error: { code: 'UNKNOWN', message: res.statusText } });
  }

  return body as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, data?: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(data) }),
  patch: <T>(path: string, data?: unknown) => request<T>(path, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
