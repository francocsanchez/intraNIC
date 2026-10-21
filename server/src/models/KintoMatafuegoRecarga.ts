import mongoose, { Document, Schema, Types } from "mongoose";

export interface IKintoMatafuegoRecarga extends Document {
  flota: Types.ObjectId;
  fechaRecarga: string;
  fechaVencimiento: string;
  importeRecarga: number;
  observaciones: string;
  actorId: Types.ObjectId;
  actorNombre: string;
  createdAt: Date;
  updatedAt: Date;
}

const kintoMatafuegoRecargaSchema = new Schema<IKintoMatafuegoRecarga>({
  flota: { type: Schema.Types.ObjectId, ref: "kinto_flota", required: true, index: true },
  fechaRecarga: { type: String, required: true, trim: true },
  fechaVencimiento: { type: String, required: true, trim: true, index: true },
  importeRecarga: { type: Number, required: true, min: 0 },
  observaciones: { type: String, trim: true, default: "" },
  actorId: { type: Schema.Types.ObjectId, ref: "users", required: true },
  actorNombre: { type: String, required: true, trim: true },
}, { timestamps: true, collection: "kinto_matafuego_recargas" });

kintoMatafuegoRecargaSchema.index({ flota: 1, fechaRecarga: -1, createdAt: -1 });

export default mongoose.model<IKintoMatafuegoRecarga>("kinto_matafuego_recargas", kintoMatafuegoRecargaSchema);
