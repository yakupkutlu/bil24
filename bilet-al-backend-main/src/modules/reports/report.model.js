import mongoose from 'mongoose';

const reportExportSchema = new mongoose.Schema({
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type: { type: String, required: true },
  format: { type: String, enum: ['json', 'csv', 'pdf', 'excel'], default: 'json' },
  filters: mongoose.Schema.Types.Mixed,
  status: { type: String, enum: ['PENDING', 'READY', 'FAILED'], default: 'READY' },
  fileUrl: String
}, { timestamps: true });

const ReportExport = mongoose.model('ReportExport', reportExportSchema);
export default ReportExport;
