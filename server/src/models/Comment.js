import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const commentSchema = new Schema({
  postId: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
  authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  body: { type: String, required: true, trim: true, maxlength: 1000 },
  status: { type: String, enum: ['active', 'removed'], default: 'active' },
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

commentSchema.index({ postId: 1, createdAt: 1 });
commentSchema.index({ authorId: 1 });

const Comment = model('Comment', commentSchema);
export default Comment;
