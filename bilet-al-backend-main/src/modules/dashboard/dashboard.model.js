import mongoose from 'mongoose';

const dashboardSnapshotSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  data: mongoose.Schema.Types.Mixed,
  generatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

const DashboardSnapshot = mongoose.model('DashboardSnapshot', dashboardSnapshotSchema);
export default DashboardSnapshot;
