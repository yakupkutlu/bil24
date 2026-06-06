import asyncHandler from '../../utils/asyncHandler.js';
import { sendResponse } from '../../utils/sendResponse.js';
import * as service from './dashboard.service.js';
export const getDashboard = asyncHandler(async (req, res) => { const dashboard = await service.getAdminDashboard(); sendResponse(res, { data: { item: dashboard, dashboard, report: dashboard } }); });
