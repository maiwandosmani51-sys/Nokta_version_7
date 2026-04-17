import mongoose from 'mongoose';
import { createBaseSchema, auditHistorySchema } from '../utils/schema';

const paymentSchema = createBaseSchema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', default: null, index: true },
    enrollmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Enrollment', default: null, index: true },
    collectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'AFN', trim: true },
    paymentDate: { type: Date, default: Date.now, index: true },
    method: { type: String, enum: ['cash', 'bank_transfer', 'mobile_money', 'card'], default: 'cash' },
    referenceNumber: { type: String, default: '', trim: true },
    notes: { type: String, default: '', trim: true },
    immutableRecord: { type: Boolean, default: true },
    auditHistory: { type: [auditHistorySchema], default: [] }
  },
  { collection: 'payments' }
);

paymentSchema.index({ studentId: 1, paymentDate: -1 });
paymentSchema.index({ referenceNumber: 1 }, { sparse: true });

export const Payment = mongoose.models.Payment ?? mongoose.model('Payment', paymentSchema);
