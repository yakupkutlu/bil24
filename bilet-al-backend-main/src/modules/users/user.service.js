import User from './user.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { getPagination, buildMeta } from '../../utils/pagination.js';
import { USER_STATUS } from '../../utils/constants.js';

export async function list(query) {
  const { page, limit, skip } = getPagination(query);
  const filter = {};
  if (query.search) filter.$text = { $search: query.search };
  if (query.role) filter.role = query.role;
  if (query.status) filter.status = query.status;
  const [items, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter)
  ]);
  return { items, meta: buildMeta({ page, limit, total }) };
}

export async function getById(id) {
  const user = await User.findById(id);
  if (!user) throw new ApiError(404, 'User not found');
  return user;
}

export async function update(id, payload) {
  const user = await User.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
  if (!user) throw new ApiError(404, 'User not found');
  return user;
}

export async function softDelete(id) {
  const user = await User.findByIdAndUpdate(id, { status: USER_STATUS.DELETED }, { new: true });
  if (!user) throw new ApiError(404, 'User not found');
  return user;
}

export async function changeStatus(id, status) {
  const user = await User.findByIdAndUpdate(id, { status }, { new: true, runValidators: true });
  if (!user) throw new ApiError(404, 'User not found');
  return user;
}

export async function changeRole(id, role) {
  const user = await User.findByIdAndUpdate(id, { role }, { new: true, runValidators: true });
  if (!user) throw new ApiError(404, 'User not found');
  return user;
}
