import mongoose from 'mongoose';
import { createBaseSchema } from '../utils/schema';

function generateClassCode() {
  const year = new Date().getFullYear();
  const prefix = `CLS-${year}-`;
  return `${prefix}${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
}

const classSchema = createBaseSchema(
  {
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', default: null, index: true },
    className: { type: String, required: true, trim: true, unique: true, index: true },
    name: { type: String, trim: true, index: true },
    classCode: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      default: generateClassCode,
      set: (value: string | null | undefined) => {
        if (value === null || value === undefined || value === '') return undefined;
        return value;
      }
    },
    genderRestriction: { type: String, enum: ['male', 'female', 'coed'], default: 'coed', index: true },
    feeAmount: { type: Number, default: 0, min: 0 },
    assignedSubjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }],
    assignedTeachers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    studentCount: { type: Number, default: 0 },
    examSchedule: [{ type: Date }],
    capacity: { type: Number, default: 30 },
    active: { type: Boolean, default: true, index: true },
    ownerApprovalRequiredForDeletion: { type: Boolean, default: true },
    ownerDeleteApprovedAt: { type: Date, default: null }
  },
  { collection: 'classes' }
);

classSchema.pre('validate', function ensureCodeAndName(this: any, next) {
  if (!this.classCode) {
    this.classCode = generateClassCode();
  }
  if (this.className) {
    this.name = this.className;
  }
  next();
});

classSchema.index({ className: 1 }, { unique: true });
classSchema.index({ classCode: 1 }, { unique: true });
classSchema.index({ branchId: 1, genderRestriction: 1, active: 1 });

export const ClassModel = mongoose.models.Class ?? mongoose.model('Class', classSchema);
