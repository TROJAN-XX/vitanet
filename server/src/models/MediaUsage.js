import mongoose from 'mongoose';
const { Schema, model } = mongoose;

/**
 * Tracks per-user media storage in R2 for quota enforcement.
 */
const mediaUsageSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  objectKey: { type: String, required: true, unique: true },
  bytes: { type: Number, required: true },
  mediaType: { type: String, enum: ['image', 'video', 'avatar'], required: true },
  status: { type: String, enum: ['active', 'pending_delete', 'deleted'], default: 'active' },
  deletedAt: { type: Date, default: null },
}, {
  timestamps: { createdAt: true, updatedAt: false },
});

mediaUsageSchema.index({ userId: 1, status: 1 });
mediaUsageSchema.index({ status: 1 });

const MediaUsage = model('MediaUsage', mediaUsageSchema);
export default MediaUsage;
