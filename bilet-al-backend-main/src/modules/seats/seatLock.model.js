import mongoose from 'mongoose';
import { SEAT_LOCK_STATUS } from '../../utils/constants.js';

const seatLockSchema = new mongoose.Schema({
  showtime: { type: mongoose.Schema.Types.ObjectId, ref: 'Showtime', required: true, index: true },
  seatCode: { type: String, required: true, uppercase: true, trim: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  sessionId: { type: String, default: '', index: true },
  expiresAt: { type: Date, required: true },
  status: { type: String, enum: Object.values(SEAT_LOCK_STATUS), default: SEAT_LOCK_STATUS.ACTIVE, index: true }
}, { timestamps: true });

seatLockSchema.index(
  { showtime: 1, seatCode: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: 'ACTIVE' } }
);
seatLockSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 3600 });

const SeatLock = mongoose.model('SeatLock', seatLockSchema);
export default SeatLock;
