import mongoose from 'mongoose';
import { createBaseSchema } from '../utils/schema';

const attendanceSchema = createBaseSchema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true, index: true },
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', default: null, index: true },
    policyId: { type: mongoose.Schema.Types.ObjectId, ref: 'AttendancePolicy', default: null },
    attendanceDate: { type: Date, required: true, index: true },
    session: { type: String, enum: ['morning', 'afternoon', 'evening', 'online'], default: 'morning' },
    status: { type: String, enum: ['present', 'absent', 'late', 'excused', 'online_auto_marked'], required: true, index: true },
    source: { type: String, enum: ['manual', 'automation', 'mobile', 'web'], default: 'web' },
    notes: { type: String, default: '', trim: true },
    markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
  },
  { collection: 'attendance' }
);

attendanceSchema.index({ studentId: 1, attendanceDate: 1, session: 1 }, { unique: true });
attendanceSchema.index({ classId: 1, attendanceDate: 1 });

export const Attendance = mongoose.models.Attendance ?? mongoose.model('Attendance', attendanceSchema);
