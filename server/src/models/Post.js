import mongoose from 'mongoose';

const { Schema, model } = mongoose;

/**
 * Media item sub-schema for posts (embedded in Post.media array).
 */
const mediaItemSchema = new Schema({
  mediaId: { type: String, required: true },
  objectKey: { type: String, required: true },
  mimeType: { type: String, required: true },
  bytes: { type: Number, required: true },
  width: { type: Number, default: null },
  height: { type: Number, default: null },
  durationSeconds: { type: Number, default: null },
  order: { type: Number, default: 0 },
}, { _id: false });

/**
 * Post schema — content metadata only (media lives in R2).
 */
const postSchema = new Schema({
  authorId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  caption: {
    type: String,
    trim: true,
    maxlength: 2200,
    default: '',
  },
  media: {
    type: [mediaItemSchema],
    validate: [arr => arr.length <= 4, 'Maximum 4 media items per post'],
  },
  visibility: {
    type: String,
    enum: ['public', 'followers_only'],
    default: 'public',
  },
  moderationStatus: {
    type: String,
    enum: ['approved', 'pending', 'removed'],
    default: 'approved',
  },
  contentWarning: {
    type: String,
    trim: true,
    maxlength: 200,
    default: null,
  },
  topics: {
    type: [String],
    default: [],
    validate: [arr => arr.length <= 10, 'Maximum 10 topics per post'],
  },
  likeCount: { type: Number, default: 0, min: 0 },
  saveCount: { type: Number, default: 0, min: 0 },
  commentCount: { type: Number, default: 0, min: 0 },
  deletedAt: { type: Date, default: null },
}, {
  timestamps: true,
  toJSON: {
    transform(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
});

// Compound indexes for feeds
postSchema.index({ authorId: 1, createdAt: -1 });
postSchema.index({ visibility: 1, moderationStatus: 1, createdAt: -1 });
postSchema.index({ createdAt: -1 });

const Post = model('Post', postSchema);
export default Post;
