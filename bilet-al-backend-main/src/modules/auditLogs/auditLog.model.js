import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  action: { type: String, required: true, index: true },
  module: { type: String, required: true, index: true },
  entityId: { type: mongoose.Schema.Types.ObjectId, index: true },
  oldValue: mongoose.Schema.Types.Mixed,
  newValue: mongoose.Schema.Types.Mixed,
  ipAddress: String,
  userAgent: String
}, { timestamps: { createdAt: true, updatedAt: false } });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;
