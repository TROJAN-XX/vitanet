import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const reportSchema = new Schema({
  reporterId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  targetType: { type: String, enum: ['post', 'comment', 'user'], required: true },
  targetId: { type: Schema.Types.ObjectId, required: true },
  reason: {
    type: String,
    enum: [
      'spam', 'harassment', 'hate', 'sexual_content', 'violence',
      'illegal_activity', 'impersonation', 'copyright',
      'privacy_violation', 'self_harm', 'other',
    ],
    required: true,
  },
  details: { type: String, trim: true, maxlength: 1000, default: '' },
  status: { type: String, enum: ['pending', 'reviewed', 'resolved', 'dismissed'], default: 'pending' },
  reviewedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  reviewedAt: { type: Date, default: null },
  resolution: { type: String, enum: ['no_action', 'warning', 'remove_content', 'suspend_user', 'ban_user'], default: null },
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

reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ reporterId: 1 });

const Report = model('Report', reportSchema);
export default Report;
