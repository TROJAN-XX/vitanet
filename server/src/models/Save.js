import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const saveSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  postId: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
}, { timestamps: { createdAt: true, updatedAt: false } });

saveSchema.index({ userId: 1, postId: 1 }, { unique: true });
saveSchema.index({ userId: 1, createdAt: -1 });

const Save = model('Save', saveSchema);
export default Save;
