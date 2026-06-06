import asyncHandler from '../../utils/asyncHandler.js';
import { sendResponse } from '../../utils/sendResponse.js';
import * as service from './report.service.js';

export const dashboard = asyncHandler(async (req, res) => {
  const report = await service.dashboard();
  sendResponse(res, { data: { ...report, item: report, report, dashboard: report } });
});
export const sales = asyncHandler(async (req, res) => {
  const rows = await service.sales(req.query);
  sendResponse(res, { data: { items: rows, sales: rows, report: rows } });
});
export const events = asyncHandler(async (req, res) => {
  const rows = await service.eventsReport(req.query);
  sendResponse(res, { data: { items: rows, events: rows, report: rows } });
});
export const occupancy = asyncHandler(async (req, res) => {
  const rows = await service.occupancy(req.query);
  sendResponse(res, { data: { items: rows, occupancy: rows, report: rows } });
});
export const users = asyncHandler(async (req, res) => {
  const rows = await service.usersReport(req.query);
  sendResponse(res, { data: { items: rows, users: rows, report: rows } });
});
export const exportReport = asyncHandler(async (req, res) => {
  const exported = await service.exportReport(req.query, req.user);
  sendResponse(res, { statusCode: 201, message: 'Report export created', data: { item: exported, export: exported } });
});
