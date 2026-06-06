import mongoose from 'mongoose';
import { EVENT_STATUS } from '../../utils/constants.js';
import { makeSlug } from '../../utils/slug.js';

const castSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  role: { type: String, trim: true, default: '' },
  image: { type: String, default: '' }
}, { _id: false });

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 200 },
  slug: { type: String, unique: true, index: true, trim: true },
  description: { type: String, required: true, trim: true },
  shortDescription: { type: String, trim: true, default: '' },
  posterImage: { type: String, default: '' },
  gallery: [{ type: String }],
  trailerUrl: { type: String, default: '' },
  category: { type: String, required: true, trim: true, index: true },
  language: { type: String, enum: ['tr', 'en', 'ar', 'other'], default: 'tr', index: true },
  durationMinutes: { type: Number, required: true, min: 1 },
  ageLimit: { type: Number, default: 0, min: 0 },
  cast: { type: [castSchema], default: [] },
  director: { type: String, trim: true, default: '' },
  status: { type: String, enum: Object.values(EVENT_STATUS), default: EVENT_STATUS.DRAFT, index: true },
  seo: {
    title: String,
    description: String,
    keywords: [{ type: String, trim: true }]
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

eventSchema.pre('validate', function setSlug(next) {
  if (!this.slug && this.title) this.slug = makeSlug(this.title);
  next();
});

eventSchema.index({ title: 'text', description: 'text', shortDescription: 'text', category: 'text' });

const Event = mongoose.model('Event', eventSchema);
export default Event;
