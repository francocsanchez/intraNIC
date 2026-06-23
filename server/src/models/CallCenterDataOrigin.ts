import mongoose, { Document, Schema } from "mongoose";

export interface ICallCenterDataOrigin extends Document {
  origen: string;
  origenResumido: string;
  origenResumidoId: mongoose.Types.ObjectId | null;
}

const callCenterDataOriginSchema = new Schema<ICallCenterDataOrigin>(
  {
    origen: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    origenResumido: {
      type: String,
      default: "",
      trim: true,
    },
    origenResumidoId: {
      type: Schema.Types.ObjectId,
      ref: "call_center_origenes_resumidos",
      default: null,
      index: true,
    },
  },
  { timestamps: true },
);

const CallCenterDataOrigin = mongoose.model<ICallCenterDataOrigin>(
  "call_center_origenes_datos",
  callCenterDataOriginSchema,
);

export default CallCenterDataOrigin;
