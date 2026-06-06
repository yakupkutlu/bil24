import Notification from './notification.model.js';
import User from '../users/user.model.js';
import { buildMeta, getPagination } from '../../utils/pagination.js';
import { NOTIFICATION_STATUS } from '../../utils/constants.js';

export async function list(query, user) {
  const { page, limit, skip } = getPagination(query);
  const filter = { user: user._id };
  if (query.status) filter.status = query.status;
  const [items, total] = await Promise.all([Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit), Notification.countDocuments(filter)]);
  return { items, meta: buildMeta({ page, limit, total }) };
}

export async function markRead(id, user) {
  return Notification.findOneAndUpdate({ _id: id, user: user._id }, { status: NOTIFICATION_STATUS.READ, readAt: new Date() }, { new: true });
}

export async function createCampaign(payload, actor) {
  const filter = {};
  if (payload.userIds?.length) filter._id = { $in: payload.userIds };
  if (payload.role) filter.role = payload.role;
  const users = await User.find(filter).select('_id');
  const docs = users.map((u) => ({ user: u._id, type: payload.type, title: payload.title, message: payload.message, channel: payload.channel || 'in_app', status: payload.type === 'SYSTEM' ? NOTIFICATION_STATUS.SENT : NOTIFICATION_STATUS.PENDING, sentAt: payload.type === 'SYSTEM' ? new Date() : undefined }));
  if (!docs.length) return [];
  return Notification.insertMany(docs);
}
