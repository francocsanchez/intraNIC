import mongoose, { Document, Schema } from "mongoose";

export interface IKintoNpsShare extends Document {
  anio: number;
  mes: number;
  promotores: number;
  pasivos: number;
  detractores: number;
  createdAt: Date;
  updatedAt: Date;
}

const kintoNpsShareSchema = new Schema<IKintoNpsShare>({
  anio: { type: Number, required: true, min: 2000, max: 2100 },
  mes: { type: Number, required: true, min: 1, max: 12 },
  promotores: { type: Number, required: true, min: 0, max: 100 },
  pasivos: { type: Number, required: true, min: 0, max: 100 },
  detractores: { type: Number, required: true, min: 0, max: 100 },
}, { timestamps: true, collection: "kinto_nps_share" });

kintoNpsShareSchema.index({ anio: 1, mes: 1 }, { unique: true });

export default mongoose.model<IKintoNpsShare>("kinto_nps_share", kintoNpsShareSchema);
