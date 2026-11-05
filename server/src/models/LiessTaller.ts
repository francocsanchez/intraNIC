import mongoose, { Document, Schema } from "mongoose";

export interface ILiessTaller extends Document {
  nombre: string;
  tipoTrabajo: string;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const liessTallerSchema = new Schema<ILiessTaller>(
  {
    nombre: { type: String, required: true, trim: true },
    tipoTrabajo: { type: String, required: true, trim: true },
    activo: { type: Boolean, default: true, index: true },
  },
  { timestamps: true, collection: "liess_talleres" },
);

liessTallerSchema.index({ activo: 1, nombre: 1 });

export default mongoose.model<ILiessTaller>("liess_talleres", liessTallerSchema);
