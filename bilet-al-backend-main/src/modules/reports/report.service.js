import Booking from '../bookings/booking.model.js';
import Payment from '../payments/payment.model.js';
import Ticket from '../tickets/ticket.model.js';
import Event from '../events/event.model.js';
import User from '../users/user.model.js';
import Refund from '../refunds/refund.model.js';
import Showtime from '../showtimes/showtime.model.js';
import ReportExport from './report.model.js';
import { BOOKING_STATUS, PAYMENT_STATUS, TICKET_STATUS } from '../../utils/constants.js';

function dateFilter(query) {
  if (!query.dateFrom && !query.dateTo) return {};
  const createdAt = {};
  if (query.dateFrom) createdAt.$gte = new Date(query.dateFrom);
  if (query.dateTo) createdAt.$lte = new Date(query.dateTo);
  return { createdAt };
}

export async function dashboard() {
  const now = new Date();
  const [revenue, ticketsSold, users, newUsers, events, refunds, upcomingShows, allTickets, occupiedTickets] = await Promise.all([
    Payment.aggregate([{ $match: { status: PAYMENT_STATUS.SUCCESS } }, { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }]),
    Ticket.countDocuments({ status: { $in: [TICKET_STATUS.VALID, TICKET_STATUS.USED] } }),
    User.countDocuments(),
    User.countDocuments({ createdAt: { $gte: new Date(now.getFullYear(), now.getMonth(), 1) } }),
    Event.countDocuments(),
    Refund.countDocuments({ status: 'REQUESTED' }),
    Showtime.countDocuments({ date: { $gte: now } }),
    Ticket.countDocuments(),
    Ticket.countDocuments({ status: { $in: [TICKET_STATUS.VALID, TICKET_STATUS.USED] } })
  ]);
  const occupancyRate = allTickets ? Math.round((occupiedTickets / allTickets) * 100) : 0;
  return {
    totalRevenue: revenue[0]?.total || 0,
    successfulPayments: revenue[0]?.count || 0,
    ticketsSold,
    users,
    newUsers,
    events,
    refundRequests: refunds,
    upcomingShows,
    occupancyRate
  };
}

export async function sales(query) {
  return Payment.aggregate([
    { $match: { status: PAYMENT_STATUS.SUCCESS, ...dateFilter(query) } },
    { $group: { _id: { day: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } } }, name: { $first: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } } }, date: { $first: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } } }, revenue: { $sum: '$amount' }, sales: { $sum: '$amount' }, count: { $sum: 1 } } },
    { $sort: { '_id.day': 1 } }
  ]);
}

export async function eventsReport() {
  return Booking.aggregate([
    { $match: { status: BOOKING_STATUS.PAID } },
    { $lookup: { from: 'showtimes', localField: 'showtime', foreignField: '_id', as: 'showtimeDoc' } },
    { $unwind: '$showtimeDoc' },
    { $lookup: { from: 'events', localField: 'showtimeDoc.event', foreignField: '_id', as: 'eventDoc' } },
    { $unwind: '$eventDoc' },
    { $group: { _id: '$eventDoc._id', name: { $first: '$eventDoc.title' }, title: { $first: '$eventDoc.title' }, eventTitle: { $first: '$eventDoc.title' }, revenue: { $sum: '$total' }, bookings: { $sum: 1 }, tickets: { $sum: { $size: '$seats' } } } },
    { $sort: { revenue: -1 } }
  ]);
}

export async function occupancy() {
  return Booking.aggregate([
    { $match: { status: BOOKING_STATUS.PAID } },
    { $lookup: { from: 'showtimes', localField: 'showtime', foreignField: '_id', as: 'showtimeDoc' } },
    { $unwind: '$showtimeDoc' },
    { $lookup: { from: 'halls', localField: 'showtimeDoc.hall', foreignField: '_id', as: 'hallDoc' } },
    { $unwind: '$hallDoc' },
    { $group: { _id: '$showtime', name: { $first: '$hallDoc.name' }, hallName: { $first: '$hallDoc.name' }, capacity: { $first: '$hallDoc.capacity' }, soldSeats: { $sum: { $size: '$seats' } } } },
    { $project: { name: 1, hallName: 1, capacity: 1, soldSeats: 1, value: { $cond: [{ $eq: ['$capacity', 0] }, 0, { $round: [{ $multiply: [{ $divide: ['$soldSeats', '$capacity'] }, 100] }, 0] }] }, occupancyRate: { $cond: [{ $eq: ['$capacity', 0] }, 0, { $round: [{ $multiply: [{ $divide: ['$soldSeats', '$capacity'] }, 100] }, 0] }] } } }
  ]);
}

export async function usersReport() {
  return User.aggregate([{ $group: { _id: '$role', name: { $first: '$role' }, value: { $sum: 1 }, count: { $sum: 1 }, tickets: { $sum: 1 } } }, { $sort: { count: -1 } }]);
}

export async function exportReport(query, user) {
  const report = await ReportExport.create({ requestedBy: user._id, type: query.type || 'dashboard', format: query.format || query.type || 'json', filters: query });
  return report;
}
