import mongoose from 'mongoose';
import { PAYMENT_METHOD, PAYMENT_PROVIDER, PAYMENT_STATUS } from '../../utils/constants.js';

const paymentSchema = new mongoose.Schema({
  paymentNumber: { type: String, required: true, unique: true, index: true },
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  provider: { type: String, enum: Object.values(PAYMENT_PROVIDER), default: PAYMENT_PROVIDER.MOCK, index: true },
  method: { type: String, enum: Object.values(PAYMENT_METHOD), default: PAYMENT_METHOD.CARD, index: true },
  amount: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'TRY' },
  status: { type: String, enum: Object.values(PAYMENT_STATUS), default: PAYMENT_STATUS.PENDING, index: true },
  providerTransactionId: { type: String, default: '' },
  providerResponse: mongoose.Schema.Types.Mixed,
  paidAt: Date
}, { timestamps: { createdAt: true, updatedAt: false } });

paymentSchema.index({ paymentNumber: 'text', providerTransactionId: 'text' });

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;
