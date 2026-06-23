import mongoose, { Document, Schema } from "mongoose";

export interface ICallCenterSummaryOrigin extends Document {
  nombre: string;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const callCenterSummaryOriginSchema = new Schema<ICallCenterSummaryOrigin>(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
    },
    activo: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

callCenterSummaryOriginSchema.index({ nombre: 1 }, { unique: true });

const CallCenterSummaryOrigin = mongoose.model<ICallCenterSummaryOrigin>(
  "call_center_origenes_resumidos",
  callCenterSummaryOriginSchema,
);

export default CallCenterSummaryOrigin;
