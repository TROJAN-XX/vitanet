import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const auditEventSchema = new Schema({
  actorUserId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  action: { type: String, required: true },
  targetType: { type: String, enum: ['user', 'post', 'comment', 'report', 'media', 'system'], required: true },
  targetId: { type: Schema.Types.ObjectId, default: null },
  metadata: { type: Schema.Types.Mixed, default: {} },
}, {
  timestamps: { createdAt: true, updatedAt: false },
  toJSON: {
    transform(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
});

auditEventSchema.index({ createdAt: -1 });
auditEventSchema.index({ action: 1, createdAt: -1 });
auditEventSchema.index({ actorUserId: 1, createdAt: -1 });

const AuditEvent = model('AuditEvent', auditEventSchema);
export default AuditEvent;
