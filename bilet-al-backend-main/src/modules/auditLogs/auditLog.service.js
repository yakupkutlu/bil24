import AuditLog from './auditLog.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { buildMeta, getPagination } from '../../utils/pagination.js';

export async function list(query) {
  const { page, limit, skip } = getPagination(query);
  const filter = {};
  if (query.module) filter.module = query.module;
  if (query.action) filter.action = query.action;
  if (query.search) filter.$text = { $search: query.search };
  const [items, total] = await Promise.all([AuditLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('actor', 'fullName email role'), AuditLog.countDocuments(filter)]);
  return { items, meta: buildMeta({ page, limit, total }) };
}
export async function get(id) { const log = await AuditLog.findById(id).populate('actor', 'fullName email role'); if (!log) throw new ApiError(404, 'Audit log not found'); return log; }
