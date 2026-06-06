import mongoose from 'mongoose';

const mediaSchema = new mongoose.Schema({
  originalName: { type: String, required: true },
  filename: { type: String, required: true },
  mimetype: { type: String, required: true },
  size: { type: Number, required: true },
  url: { type: String, required: true },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  module: { type: String, default: 'media' }
}, { timestamps: true });

const Media = mongoose.model('Media', mediaSchema);
export default Media;
