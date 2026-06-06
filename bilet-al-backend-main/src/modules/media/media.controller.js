import asyncHandler from '../../utils/asyncHandler.js';
import { sendResponse } from '../../utils/sendResponse.js';
import { writeAuditLog } from '../../utils/audit.js';
import * as service from './media.service.js';

export const uploadMedia = asyncHandler(async (req, res) => {
  const media = await service.uploadFile(req.file, req.user, req.body?.module);
  sendResponse(res, { statusCode: 201, message: 'Media uploaded', data: { item: media, media } });
});

export const listMedia = asyncHandler(async (req, res) => {
  const result = await service.list(req.query);
  sendResponse(res, { data: { items: result.items, media: result.items }, meta: result.meta });
});

export const deleteMedia = asyncHandler(async (req, res) => {
  const media = await service.remove(req.params.id);
  sendResponse(res, { message: 'Media deleted', data: { item: media, media } });
});

export const uploadEventPoster = asyncHandler(async (req, res) => {
  const result = await service.uploadEventPoster(req.params.eventId, req.file, req.user);
  await writeAuditLog({ req, action: 'UPLOAD_EVENT_POSTER', module: 'media', entityId: req.params.eventId, newValue: { mediaId: result.media._id, url: result.media.url } });
  sendResponse(res, { statusCode: 201, message: 'Event poster uploaded', data: { ...result, item: result.event } });
});

export const uploadEventGallery = asyncHandler(async (req, res) => {
  const files = Array.isArray(req.files) ? req.files : [...(req.files?.files || []), ...(req.files?.file || [])];
  const result = await service.uploadEventGallery(req.params.eventId, files, req.user);
  await writeAuditLog({ req, action: 'UPLOAD_EVENT_GALLERY', module: 'media', entityId: req.params.eventId, newValue: { count: result.media.length } });
  sendResponse(res, { statusCode: 201, message: 'Event gallery uploaded', data: { ...result, item: result.event } });
});
