import mongoose from 'mongoose';
import { NOTIFICATION_STATUS } from '../../utils/constants.js';

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  type: { type: String, enum: ['EMAIL', 'SMS', 'SYSTEM'], default: 'SYSTEM', index: true },
  title: { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true },
  channel: { type: String, default: 'in_app' },
  status: { type: String, enum: Object.values(NOTIFICATION_STATUS), default: NOTIFICATION_STATUS.PENDING, index: true },
  relatedEntity: {
    module: String,
    id: mongoose.Schema.Types.ObjectId
  },
  readAt: Date,
  sentAt: Date
}, { timestamps: { createdAt: true, updatedAt: false } });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
