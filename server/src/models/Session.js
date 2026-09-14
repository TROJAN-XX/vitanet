import mongoose from 'mongoose';

const { Schema, model } = mongoose;

/**
 * Session schema — stores hashed refresh tokens.
 * TTL index on expiresAt auto-removes expired sessions.
 */
const sessionSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  tokenHash: {
    type: String,
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 }, // TTL index
  },
  lastUsedAt: {
    type: Date,
    default: Date.now,
  },
  userAgentHash: {
    type: String,
    default: null,
  },
  ipHash: {
    type: String,
    default: null,
  },
  revokedAt: {
    type: Date,
    default: null,
  },
}, {
  timestamps: { createdAt: true, updatedAt: false },
});

const Session = model('Session', sessionSchema);
export default Session;
