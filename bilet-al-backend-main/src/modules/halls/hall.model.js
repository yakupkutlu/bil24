import mongoose from 'mongoose';
import { HALL_STATUS, SEAT_CATEGORY } from '../../utils/constants.js';

const seatSchema = new mongoose.Schema({
  row: { type: String, required: true, trim: true },
  number: { type: Number, required: true, min: 1 },
  code: { type: String, required: true, trim: true, uppercase: true },
  category: { type: String, enum: Object.values(SEAT_CATEGORY), default: SEAT_CATEGORY.STANDARD },
  isAccessible: { type: Boolean, default: false },
  isBlocked: { type: Boolean, default: false },
  position: {
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 }
  }
}, { _id: false });

const hallSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  description: { type: String, default: '' },
  capacity: { type: Number, required: true, min: 1 },
  rows: { type: Number, required: true, min: 1 },
  seatsPerRow: { type: Number, required: true, min: 1 },
  seatMap: { type: [seatSchema], default: [] },
  status: { type: String, enum: Object.values(HALL_STATUS), default: HALL_STATUS.ACTIVE, index: true }
}, { timestamps: true });

hallSchema.index({ name: 'text', description: 'text' });

const Hall = mongoose.model('Hall', hallSchema);
export default Hall;
