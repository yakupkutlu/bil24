import mongoose from 'mongoose';

const systemSettingsSchema = new mongoose.Schema({
  singletonKey: { type: String, default: 'default', unique: true, immutable: true },
  websiteName: { type: String, default: 'Tiatru' },
  logo: { type: String, default: '' },
  theme: {
    primaryColor: { type: String, default: '#7A0C0C' },
    accentColor: { type: String, default: '#B8860B' },
    mode: { type: String, enum: ['dark', 'light'], default: 'dark' }
  },
  paymentSettings: {
    defaultProvider: { type: String, default: 'MOCK' },
    currency: { type: String, default: 'TRY' },
    iyzicoEnabled: { type: Boolean, default: false },
    cashEnabled: { type: Boolean, default: true }
  },
  emailSettings: {
    enabled: { type: Boolean, default: false },
    senderName: { type: String, default: 'Tiatru' }
  },
  smsSettings: {
    enabled: { type: Boolean, default: false },
    provider: { type: String, default: '' }
  },
  ticketRules: {
    seatHoldMinutes: { type: Number, default: 10, min: 1 },
    cancellationDeadlineHours: { type: Number, default: 24, min: 0 },
    refundAllowed: { type: Boolean, default: true },
    serviceFee: { type: Number, default: 0, min: 0 },
    taxRate: { type: Number, default: 0, min: 0, max: 1 }
  },
  maintenanceMode: { type: Boolean, default: false },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

const SystemSettings = mongoose.model('SystemSettings', systemSettingsSchema);
export default SystemSettings;
