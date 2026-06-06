import fs from 'fs/promises';
import path from 'path';
import Media from './media.model.js';
import Event from '../events/event.model.js';
import { env } from '../../config/env.js';
import { ApiError } from '../../utils/ApiError.js';
import { buildMeta, getPagination } from '../../utils/pagination.js';

function publicUploadUrl(filename) {
  return `${env.PUBLIC_BASE_URL.replace(/\/$/, '')}/${env.UPLOAD_DIR.replace(/^\//, '').replace(/\/$/, '')}/${filename}`;
}

export async function uploadFile(file, user, module = 'media') {
  if (!file) throw new ApiError(400, 'File is required');
  const url = publicUploadUrl(file.filename);
  return Media.create({ originalName: file.originalname, filename: file.filename, mimetype: file.mimetype, size: file.size, url, uploadedBy: user._id, module });
}

export async function list(query) {
  const { page, limit, skip } = getPagination(query);
  const filter = {};
  if (query.module) filter.module = query.module;
  if (query.mimetype) filter.mimetype = query.mimetype;
  const [items, total] = await Promise.all([
    Media.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('uploadedBy', 'fullName email'),
    Media.countDocuments(filter)
  ]);
  return { items, meta: buildMeta({ page, limit, total }) };
}

export async function remove(id) {
  const media = await Media.findById(id);
  if (!media) throw new ApiError(404, 'Media not found');
  await fs.rm(path.resolve(env.UPLOAD_DIR, media.filename), { force: true });
  await media.deleteOne();
  return media;
}

export async function uploadEventPoster(eventId, file, user) {
  const event = await Event.findById(eventId);
  if (!event) throw new ApiError(404, 'Event not found');
  const media = await uploadFile(file, user, 'events/poster');
  event.posterImage = media.url;
  event.updatedBy = user._id;
  await event.save();
  return { media, event };
}

export async function uploadEventGallery(eventId, files, user) {
  const event = await Event.findById(eventId);
  if (!event) throw new ApiError(404, 'Event not found');
  const medias = [];
  for (const file of files || []) medias.push(await uploadFile(file, user, 'events/gallery'));
  event.gallery = [...(event.gallery || []), ...medias.map((media) => media.url)];
  event.updatedBy = user._id;
  await event.save();
  return { media: medias, event };
}
