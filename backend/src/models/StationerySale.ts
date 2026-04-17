import mongoose from 'mongoose';
import { createBaseSchema } from '../utils/schema';

const stationerySaleSchema = createBaseSchema(
  {
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', default: null, index: true },
    soldBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    title: { type: String, required: true, trim: true },
    quantity: { type: Number, default: 1 },
    unitPrice: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    saleDate: { type: Date, default: Date.now, index: true }
  },
  { collection: 'stationery_sales' }
);

stationerySaleSchema.index({ branchId: 1, saleDate: -1 });

export const StationerySale = mongoose.models.StationerySale ?? mongoose.model('StationerySale', stationerySaleSchema);
