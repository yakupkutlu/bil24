import Showtime from './showtime.model.js';
import Event from '../events/event.model.js';
import Hall from '../halls/hall.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { getPagination, buildMeta } from '../../utils/pagination.js';

async function assertRefs(eventId, hallId) {
  const [event, hall] = await Promise.all([Event.findById(eventId), Hall.findById(hallId)]);
  if (!event) throw new ApiError(404, 'Event not found');
  if (!hall) throw new ApiError(404, 'Hall not found');
}

export async function list(query) {
  const { page, limit, skip } = getPagination(query);
  const filter = {};
  if (query.event) filter.event = query.event;
  if (query.hall) filter.hall = query.hall;
  if (query.status) filter.status = query.status;
  if (query.dateFrom || query.dateTo) filter.date = { ...(query.dateFrom ? { $gte: query.dateFrom } : {}), ...(query.dateTo ? { $lte: query.dateTo } : {}) };
  const [items, total] = await Promise.all([
    Showtime.find(filter).sort({ date: 1, startTime: 1 }).skip(skip).limit(limit).populate('event hall'),
    Showtime.countDocuments(filter)
  ]);
  return { items, meta: buildMeta({ page, limit, total }) };
}
export async function get(id) { const showtime = await Showtime.findById(id).populate('event hall'); if (!showtime) throw new ApiError(404, 'Showtime not found'); return showtime; }
export async function byEvent(eventId, query) { return list({ ...query, event: eventId }); }
export async function create(payload) { await assertRefs(payload.event, payload.hall); return Showtime.create(payload); }
export async function update(id, payload) { if (payload.event || payload.hall) await assertRefs(payload.event, payload.hall); const showtime = await Showtime.findByIdAndUpdate(id, payload, { new: true, runValidators: true }).populate('event hall'); if (!showtime) throw new ApiError(404, 'Showtime not found'); return showtime; }
export async function remove(id) { const showtime = await Showtime.findByIdAndDelete(id); if (!showtime) throw new ApiError(404, 'Showtime not found'); return showtime; }
export async function changeStatus(id, status) { return update(id, { status }); }
