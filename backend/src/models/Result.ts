import mongoose from 'mongoose';
import { createBaseSchema, auditHistorySchema } from '../utils/schema';

const resultSchema = createBaseSchema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    exam: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true, index: true },
    score: { type: Number, required: true },
    grade: { type: String, required: true, trim: true },
    remarks: { type: String, default: '', trim: true },
    gradedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    publishedAt: { type: Date, default: null, index: true },
    immutableAfterPublish: { type: Boolean, default: true },
    auditHistory: { type: [auditHistorySchema], default: [] }
  },
  { collection: 'results' }
);

resultSchema.index({ student: 1, exam: 1 }, { unique: true });

export const Result = mongoose.models.Result ?? mongoose.model('Result', resultSchema);
