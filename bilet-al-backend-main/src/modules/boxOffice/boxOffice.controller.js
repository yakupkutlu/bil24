import asyncHandler from '../../utils/asyncHandler.js';
import { sendResponse } from '../../utils/sendResponse.js';
import { writeAuditLog } from '../../utils/audit.js';
import * as service from './boxOffice.service.js';

export const sellTicket = asyncHandler(async (req, res) => {
  const result = await service.sellTicket(req.body, req.user);
  await writeAuditLog({ req, action: 'BOX_OFFICE_SELL_TICKET', module: 'box-office', entityId: result.booking._id, newValue: { bookingId: result.booking._id, paymentId: result.payment._id, ticketCount: result.tickets.length } });
  sendResponse(res, { statusCode: 201, message: 'Box-office ticket sold', data: { ...result, item: result.booking } });
});
