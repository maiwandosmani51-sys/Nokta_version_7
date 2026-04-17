import mongoose from 'mongoose';
import { createBaseSchema } from '../utils/schema';

const studentSchema = createBaseSchema(
  {
    rollNo: { type: String, unique: true, sparse: true, index: true },
    studentId: { type: String, required: true, unique: true, index: true },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', default: null, index: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    fatherName: { type: String, required: true, trim: true },
    familyPhone: { type: String, required: true, trim: true },
    familyEmail: { type: String, default: '', trim: true, lowercase: true },
    gender: { type: String, enum: ['male', 'female', 'other'], required: true, index: true },
    registrationDate: { type: Date, default: Date.now },
    registrationExpiryDate: { type: Date, default: null, index: true },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true, index: true },
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true, index: true },
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    feeAmount: { type: Number, required: true },
    paidAmount: { type: Number, default: 0 },
    remainingBalance: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'inactive', 'suspended', 'graduated'], default: 'active', index: true },
    familyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Family', required: true, index: true },
    parentProfileId: { type: mongoose.Schema.Types.ObjectId, ref: 'Parent', default: null, index: true },
    profileImage: { type: String, trim: true, default: '' }
  },
  { collection: 'students' }
);

studentSchema.pre('save', function updateBalance(this: any, next) {
  this.remainingBalance = Number(this.feeAmount || 0) - Number(this.paidAmount || 0);
  next();
});

studentSchema.index({ rollNo: 1 }, { unique: true, sparse: true });
studentSchema.index({ teacherId: 1, classId: 1, status: 1 });
studentSchema.index({ familyId: 1, registrationExpiryDate: 1 });

export const Student = mongoose.models.Student ?? mongoose.model('Student', studentSchema);
