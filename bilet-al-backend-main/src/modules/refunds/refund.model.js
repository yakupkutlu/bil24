import mongoose from 'mongoose';
import { REFUND_STATUS } from '../../utils/constants.js';

const refundSchema = new mongoose.Schema({
  refundNumber: { type: String, required: true, unique: true, index: true },
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
  payment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', required: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  amount: { type: Number, required: true, min: 0 },
  reason: { type: String, required: true, trim: true },
  status: { type: String, enum: Object.values(REFUND_STATUS), default: REFUND_STATUS.REQUESTED, index: true },
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rejectionReason: { type: String, default: '' },
  processedAt: Date
}, { timestamps: true });

const Refund = mongoose.model('Refund', refundSchema);
export default Refund;
