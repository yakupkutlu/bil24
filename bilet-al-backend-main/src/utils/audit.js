import AuditLog from '../modules/auditLogs/auditLog.model.js';

export async function writeAuditLog({ req, action, module, entityId, oldValue, newValue }) {
  try {
    await AuditLog.create({
      actor: req.user?._id,
      action,
      module,
      entityId,
      oldValue,
      newValue,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });
  } catch (error) {
    // Do not break business flow because of audit logging failure.
    console.error('Audit log failed:', error.message);
  }
}
