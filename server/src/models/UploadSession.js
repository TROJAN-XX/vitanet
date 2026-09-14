import mongoose from 'mongoose';
const { Schema, model } = mongoose;

/**
 * Upload session — tracks presigned upload lifecycle.
 * TTL index auto-cleans expired sessions.
 */
const uploadSessionSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  uploadId: { type: String, required: true, unique: true },
  objectKey: { type: String, required: true },
  mimeType: { type: String, required: true },
  expectedBytes: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'completed', 'expired', 'failed'], default: 'pending' },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 }, // TTL
  },
  completedAt: { type: Date, default: null },
}, {
  timestamps: { createdAt: true, updatedAt: false },
});

uploadSessionSchema.index({ status: 1, expiresAt: 1 });

const UploadSession = model('UploadSession', uploadSessionSchema);
export default UploadSession;
