import mongoose from 'mongoose';

const { Schema, model } = mongoose;

/**
 * Follow relationship — unique (follower, following) pairs.
 */
const followSchema = new Schema({
  followerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  followingId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: { createdAt: true, updatedAt: false },
});

followSchema.index({ followerId: 1, followingId: 1 }, { unique: true });
followSchema.index({ followingId: 1, createdAt: -1 });
followSchema.index({ followerId: 1, createdAt: -1 });

const Follow = model('Follow', followSchema);
export default Follow;
