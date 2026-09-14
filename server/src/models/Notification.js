import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const notificationSchema = new Schema({
  recipientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  actorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['like', 'comment', 'follow', 'mention', 'moderation'], required: true },
  postId: { type: Schema.Types.ObjectId, ref: 'Post', default: null },
  commentId: { type: Schema.Types.ObjectId, ref: 'Comment', default: null },
  readAt: { type: Date, default: null },
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

notificationSchema.index({ recipientId: 1, createdAt: -1 });
notificationSchema.index({ recipientId: 1, readAt: 1 });

const Notification = model('Notification', notificationSchema);
export default Notification;
