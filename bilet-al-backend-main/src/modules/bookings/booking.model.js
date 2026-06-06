import mongoose from 'mongoose';
import { BOOKING_SOURCE, BOOKING_STATUS, SEAT_CATEGORY } from '../../utils/constants.js';

const bookingSeatSchema = new mongoose.Schema({
  seatCode: { type: String, required: true, uppercase: true, trim: true },
  category: { type: String, enum: Object.values(SEAT_CATEGORY), required: true },
  price: { type: Number, required: true, min: 0 }
}, { _id: false });

const bookingSchema = new mongoose.Schema({
  bookingNumber: { type: String, required: true, unique: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  showtime: { type: mongoose.Schema.Types.ObjectId, ref: 'Showtime', required: true, index: true },
  seats: { type: [bookingSeatSchema], required: true },
  status: { type: String, enum: Object.values(BOOKING_STATUS), default: BOOKING_STATUS.RESERVED, index: true },
  subtotal: { type: Number, required: true, min: 0 },
  serviceFee: { type: Number, default: 0, min: 0 },
  discount: { type: Number, default: 0, min: 0 },
  tax: { type: Number, default: 0, min: 0 },
  total: { type: Number, required: true, min: 0 },
  expiresAt: Date,
  payment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
  tickets: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Ticket' }],
  source: { type: String, enum: Object.values(BOOKING_SOURCE), default: BOOKING_SOURCE.ONLINE, index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  customerSnapshot: {
    fullName: String,
    email: String,
    phone: String
  }
}, { timestamps: true });

bookingSchema.index({ showtime: 1, 'seats.seatCode': 1, status: 1 });
bookingSchema.index({ bookingNumber: 'text', 'customerSnapshot.email': 'text', 'customerSnapshot.fullName': 'text' });

const Booking = mongoose.model('Booking', bookingSchema);
export default Booking;
