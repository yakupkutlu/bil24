import { api, unwrap, unwrapList } from './api';
import type { Role, User } from '@/types';
import { normalizeUser, pickPayload } from '@/utils/apiAdapters';
export const usersService = {
  list: (params?: Record<string, unknown>) => api.get('/users', { params }).then((r) => unwrapList<User>(r, ['items', 'users']).map(normalizeUser)),
  get: (id: string) => api.get(`/users/${id}`).then(unwrap<any>).then((raw) => normalizeUser(pickPayload(raw, ['user']))),
  update: (id: string, payload: Partial<User>) => api.put(`/users/${id}`, payload).then(unwrap<any>).then((raw) => normalizeUser(pickPayload(raw, ['user']))),
  remove: (id: string) => api.delete(`/users/${id}`).then(unwrap),
  updateStatus: (id: string, status: User['status']) => api.patch(`/users/${id}/status`, { status }).then(unwrap<any>).then((raw) => normalizeUser(pickPayload(raw, ['user']))),
  updateRole: (id: string, role: Role) => api.patch(`/users/${id}/role`, { role }).then(unwrap<any>).then((raw) => normalizeUser(pickPayload(raw, ['user'])))
};
