import mongoose from 'mongoose';

const { Schema, model } = mongoose;

/**
 * Email token schema — verification and password reset tokens.
 * TTL index auto-removes expired tokens.
 */
const emailTokenSchema = new Schema({
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
  purpose: {
    type: String,
    enum: ['email_verification', 'password_reset'],
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 }, // TTL
  },
  usedAt: {
    type: Date,
    default: null,
  },
}, {
  timestamps: { createdAt: true, updatedAt: false },
});

const EmailToken = model('EmailToken', emailTokenSchema);
export default EmailToken;
