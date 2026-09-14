import mongoose from 'mongoose';

const { Schema, model } = mongoose;

/**
 * User schema — core identity document.
 * Indexes: unique usernameNormalized, unique emailNormalized.
 */
const userSchema = new Schema({
  username: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 30,
  },
  usernameNormalized: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
  },
  emailNormalized: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  passwordHash: {
    type: String,
    required: true,
    select: false, // Never returned in queries by default
  },
  displayName: {
    type: String,
    trim: true,
    maxlength: 50,
    default: '',
  },
  bio: {
    type: String,
    trim: true,
    maxlength: 160,
    default: '',
  },
  avatarMediaId: {
    type: String,
    default: null,
  },
  accountStatus: {
    type: String,
    enum: ['pending_verification', 'active', 'suspended', 'banned', 'deleted'],
    default: 'pending_verification',
  },
  role: {
    type: String,
    enum: ['user', 'moderator', 'admin'],
    default: 'user',
  },
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  followersCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  followingCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  postsCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  lastLoginAt: {
    type: Date,
    default: null,
  },
  deletedAt: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true, // createdAt, updatedAt
  toJSON: {
    transform(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      delete ret.passwordHash;
      delete ret.emailNormalized;
      delete ret.usernameNormalized;
      return ret;
    },
  },
});

// Indexes
userSchema.index({ accountStatus: 1 });
userSchema.index({ createdAt: -1 });

const User = model('User', userSchema);
export default User;
