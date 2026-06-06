import mongoose from 'mongoose';
import { SHOWTIME_STATUS } from '../../utils/constants.js';

const showtimeSchema = new mongoose.Schema({
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
  hall: { type: mongoose.Schema.Types.ObjectId, ref: 'Hall', required: true, index: true },
  date: { type: Date, required: true, index: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  status: { type: String, enum: Object.values(SHOWTIME_STATUS), default: SHOWTIME_STATUS.SCHEDULED, index: true },
  pricing: {
    VIP: { type: Number, required: true, min: 0 },
    STANDARD: { type: Number, required: true, min: 0 },
    STUDENT: { type: Number, required: true, min: 0 }
  },
  availableFrom: Date,
  availableUntil: Date,
  cancellationPolicy: { type: String, default: '' }
}, { timestamps: true });

showtimeSchema.index({ event: 1, date: 1 });
showtimeSchema.index({ hall: 1, date: 1, startTime: 1 }, { unique: true });

const Showtime = mongoose.model('Showtime', showtimeSchema);
export default Showtime;
