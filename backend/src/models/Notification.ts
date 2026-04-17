import mongoose from 'mongoose';
import { createBaseSchema } from '../utils/schema';

const notificationSchema = createBaseSchema(
  {
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', default: null, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    image: { type: String, default: '', trim: true },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', default: null, index: true },
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', default: null, index: true },
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    publishDate: { type: Date, default: null, index: true },
    publishStatus: { type: String, enum: ['draft', 'published'], default: 'draft', index: true },
    recipientRoles: [{ type: String, required: true, trim: true }],
    recipientIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    severity: { type: String, enum: ['info', 'warning', 'critical'], default: 'info' }
  },
  { collection: 'notifications' }
);

notificationSchema.pre('validate', function syncDescription(this: any, next) {
  const description = String(this.description || this.message || '').trim();
  this.description = description;
  this.message = description;

  if (this.publishStatus === 'published' && !this.publishDate) {
    this.publishDate = new Date();
  }

  next();
});

notificationSchema.index({ recipientRoles: 1 });
notificationSchema.index({ recipientIds: 1 });
notificationSchema.index({ branchId: 1, createdAt: -1 });
notificationSchema.index({ classId: 1, subjectId: 1, teacherId: 1 });
notificationSchema.index({ publishStatus: 1, publishDate: -1 });

export const Notification = mongoose.models.Notification ?? mongoose.model('Notification', notificationSchema);
