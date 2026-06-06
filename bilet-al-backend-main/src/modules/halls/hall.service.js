import Hall from './hall.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { getPagination, buildMeta } from '../../utils/pagination.js';
import { SEAT_CATEGORY } from '../../utils/constants.js';

export function generateSeatMap(rows, seatsPerRow, defaultCategory = SEAT_CATEGORY.STANDARD) {
  const seats = [];
  for (let i = 0; i < rows; i += 1) {
    const row = String.fromCharCode(65 + i);
    for (let number = 1; number <= seatsPerRow; number += 1) {
      let category = defaultCategory;
      if (i < 2) category = SEAT_CATEGORY.VIP;
      if (i >= rows - 2) category = SEAT_CATEGORY.STUDENT;
      seats.push({ row, number, code: `${row}${number}`, category, position: { x: number, y: i + 1 } });
    }
  }
  return seats;
}

export async function list(query) {
  const { page, limit, skip } = getPagination(query);
  const filter = {};
  if (query.search) filter.$text = { $search: query.search };
  if (query.status) filter.status = query.status;
  const [items, total] = await Promise.all([Hall.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit), Hall.countDocuments(filter)]);
  return { items, meta: buildMeta({ page, limit, total }) };
}

export async function get(id) { const hall = await Hall.findById(id); if (!hall) throw new ApiError(404, 'Hall not found'); return hall; }
export async function create(payload) { if (!payload.seatMap?.length) payload.seatMap = generateSeatMap(payload.rows, payload.seatsPerRow); payload.capacity = payload.seatMap.length; return Hall.create(payload); }
export async function update(id, payload) { const hall = await Hall.findByIdAndUpdate(id, payload, { new: true, runValidators: true }); if (!hall) throw new ApiError(404, 'Hall not found'); return hall; }
export async function remove(id) { const hall = await Hall.findByIdAndDelete(id); if (!hall) throw new ApiError(404, 'Hall not found'); return hall; }
export async function generateSeats(id, payload = {}) { const hall = await get(id); const rows = payload.rows || hall.rows; const seatsPerRow = payload.seatsPerRow || hall.seatsPerRow; hall.rows = rows; hall.seatsPerRow = seatsPerRow; hall.seatMap = generateSeatMap(rows, seatsPerRow, payload.defaultCategory); hall.capacity = hall.seatMap.length; await hall.save(); return hall; }
export async function updateSeats(id, seatMap) { const hall = await get(id); hall.seatMap = seatMap; hall.capacity = seatMap.length; await hall.save(); return hall; }
