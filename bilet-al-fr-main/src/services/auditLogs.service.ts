import { api, unwrap, unwrapList } from './api';
export interface AuditLog { id: string; actor?: string; action: string; module: string; entityId?: string; createdAt: string }
function normalizeLog(raw: any): AuditLog { return { id: String(raw.id ?? raw._id ?? raw.createdAt ?? ''), actor: raw.actor, action: raw.action ?? '', module: raw.module ?? '', entityId: raw.entityId, createdAt: raw.createdAt ?? new Date().toISOString() }; }
export const auditLogsService = {
  list: (params?: Record<string, unknown>) => api.get('/audit-logs', { params }).then((r) => unwrapList<AuditLog>(r, ['items', 'auditLogs', 'logs']).map(normalizeLog)),
  get: (id: string) => api.get(`/audit-logs/${id}`).then(unwrap<any>).then(normalizeLog)
};
