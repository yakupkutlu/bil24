import asyncHandler from '../../utils/asyncHandler.js';
import { sendResponse } from '../../utils/sendResponse.js';
import { writeAuditLog } from '../../utils/audit.js';
import * as service from './payment.service.js';

export const checkout = asyncHandler(async (req, res) => {
  const result = await service.checkout(req.body, req.user);
  await writeAuditLog({ req, action: 'PAYMENT_CHECKOUT', module: 'payments', entityId: result.payment._id, newValue: { bookingId: req.body.bookingId, provider: result.payment.provider, status: result.payment.status } });
  sendResponse(res, { statusCode: 201, message: 'Checkout processed', data: { ...result, item: result.payment } });
});
export const iyzicoCallback = asyncHandler(async (req, res) => sendResponse(res, { message: 'Iyzico callback received', data: await service.iyzicoCallback({ ...req.query, ...req.body }) }));
export const callback = asyncHandler(async (req, res) => sendResponse(res, { message: 'Payment callback received', data: await service.callback({ ...req.query, ...req.body }) }));
export const listPayments = asyncHandler(async (req, res) => {
  const result = await service.list(req.query);
  sendResponse(res, { data: { items: result.items, payments: result.items }, meta: result.meta });
});
export const getPayment = asyncHandler(async (req, res) => {
  const payment = await service.get(req.params.id, req.user);
  sendResponse(res, { data: { item: payment, payment } });
});
export const paymentStatus = asyncHandler(async (req, res) => {
  const result = await service.status(req.params.id, req.user);
  sendResponse(res, { data: { ...result, item: result.payment } });
});
