import mongoose from 'mongoose';
import Event from './event.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { getPagination, buildMeta } from '../../utils/pagination.js';
import { EVENT_STATUS, STAFF_ROLES } from '../../utils/constants.js';

export async function list(query, user) {
  const { page, limit, skip } = getPagination(query);
  const filter = {};
  if (!user || !STAFF_ROLES.includes(user.role)) filter.status = EVENT_STATUS.PUBLISHED;
  if (query.search) filter.$text = { $search: query.search };
  if (query.status && user && STAFF_ROLES.includes(user.role)) filter.status = query.status;
  if (query.category) filter.category = query.category;
  if (query.language) filter.language = query.language;
  const sort = query.sort === 'oldest' ? { createdAt: 1 } : { createdAt: -1 };
  const [items, total] = await Promise.all([
    Event.find(filter).sort(sort).skip(skip).limit(limit).populate('createdBy updatedBy', 'fullName email'),
    Event.countDocuments(filter)
  ]);
  return { items, meta: buildMeta({ page, limit, total }) };
}

export async function getBySlug(slug, user) {
  const base = mongoose.Types.ObjectId.isValid(slug) ? { $or: [{ slug }, { _id: slug }] } : { slug };
  const filter = { ...base };
  if (!user || !STAFF_ROLES.includes(user.role)) filter.status = EVENT_STATUS.PUBLISHED;
  const event = await Event.findOne(filter).populate('createdBy updatedBy', 'fullName email');
  if (!event) throw new ApiError(404, 'Event not found');
  return event;
}

export async function create(payload, user) {
  return Event.create({ ...payload, createdBy: user._id, updatedBy: user._id });
}

export async function update(id, payload, user) {
  const event = await Event.findByIdAndUpdate(id, { ...payload, updatedBy: user._id }, { new: true, runValidators: true });
  if (!event) throw new ApiError(404, 'Event not found');
  return event;
}

export async function remove(id) {
  const event = await Event.findByIdAndDelete(id);
  if (!event) throw new ApiError(404, 'Event not found');
  return event;
}

export async function changeStatus(id, status, user) {
  return update(id, { status }, user);
}
