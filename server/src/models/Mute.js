import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const muteSchema = new Schema({
  muterId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  mutedId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: { createdAt: true, updatedAt: false } });

muteSchema.index({ muterId: 1, mutedId: 1 }, { unique: true });

const Mute = model('Mute', muteSchema);
export default Mute;
