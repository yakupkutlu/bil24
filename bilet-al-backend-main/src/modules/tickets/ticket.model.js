import mongoose from 'mongoose';
import { SEAT_CATEGORY, TICKET_STATUS } from '../../utils/constants.js';

const ticketSchema = new mongoose.Schema({
  ticketNumber: { type: String, required: true, unique: true, index: true },
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
  showtime: { type: mongoose.Schema.Types.ObjectId, ref: 'Showtime', required: true, index: true },
  hall: { type: mongoose.Schema.Types.ObjectId, ref: 'Hall', required: true, index: true },
  seatCode: { type: String, required: true, uppercase: true, trim: true },
  category: { type: String, enum: Object.values(SEAT_CATEGORY), required: true },
  price: { type: Number, required: true, min: 0 },
  qrToken: { type: String, required: true, unique: true, index: true },
  qrImage: { type: String, default: '' },
  status: { type: String, enum: Object.values(TICKET_STATUS), default: TICKET_STATUS.VALID, index: true },
  usedAt: Date,
  usedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: { createdAt: true, updatedAt: false } });

ticketSchema.index({ ticketNumber: 'text', qrToken: 'text', seatCode: 'text' });

const Ticket = mongoose.model('Ticket', ticketSchema);
export default Ticket;
