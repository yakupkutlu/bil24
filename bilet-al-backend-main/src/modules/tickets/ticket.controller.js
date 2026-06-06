import asyncHandler from '../../utils/asyncHandler.js';
import { sendResponse } from '../../utils/sendResponse.js';
import { streamTicketPdf } from '../../utils/pdf.js';
import { buildTicketEmail, sendEmail } from '../../utils/email.js';
import { writeAuditLog } from '../../utils/audit.js';
import { buildTicketVerificationUrl } from '../../utils/qr.js';
import * as service from './ticket.service.js';

export const myTickets = asyncHandler(async (req, res) => {
  const result = await service.list(req.query, req.user, true);
  sendResponse(res, { data: { items: result.items, tickets: result.items }, meta: result.meta });
});
export const listTickets = asyncHandler(async (req, res) => {
  const result = await service.list(req.query, req.user, false);
  sendResponse(res, { data: { items: result.items, tickets: result.items }, meta: result.meta });
});
export const getTicket = asyncHandler(async (req, res) => {
  const ticket = await service.get(req.params.id, req.user);
  sendResponse(res, { data: { item: ticket, ticket } });
});
export const downloadTicket = asyncHandler(async (req, res) => {
  const ticket = await service.get(req.params.id, req.user);
  await streamTicketPdf(res, ticket);
});
export const verifyTicket = asyncHandler(async (req, res) => {
  const result = req.body.markUsed ? { ...(await service.verify(req.body.qrToken)), state: 'USED', ticket: await service.markUsedByQr(req.body.qrToken, req.user), canEnter: false, alreadyUsed: true } : await service.verify(req.body.qrToken);
  sendResponse(res, { message: 'Ticket verification completed', data: { ...result, item: result.ticket } });
});
export const markUsed = asyncHandler(async (req, res) => {
  const ticket = await service.markUsed(req.params.id, req.user);
  await writeAuditLog({ req, action: 'MARK_TICKET_USED', module: 'tickets', entityId: ticket._id });
  sendResponse(res, { message: 'Ticket marked as used', data: { item: ticket, ticket } });
});
export const resendEmail = asyncHandler(async (req, res) => {
  const ticket = await service.get(req.params.id, req.user);
  const to = req.body?.email || ticket.user?.email || ticket.booking?.customerSnapshot?.email;
  const verifyUrl = buildTicketVerificationUrl(ticket.qrToken);
  const { text, html } = buildTicketEmail({ ticket, verifyUrl });
  const emailResult = await sendEmail({ to, subject: `Your Tiatru ticket ${ticket.ticketNumber}`, text, html });
  sendResponse(res, { message: emailResult.skipped ? 'Ticket email skipped because recipient is missing' : 'Ticket email resent', data: { email: emailResult } });
});
export const publicVerify = asyncHandler(async (req, res) => {
  const result = await service.verify(req.params.qrToken);
  sendResponse(res, { data: { state: result.state, canEnter: result.canEnter, alreadyUsed: result.alreadyUsed, ticket: result.ticket ? { event: result.ticket.event?.title, date: result.ticket.showtime?.date, seatCode: result.ticket.seatCode, status: result.ticket.status } : null } });
});
