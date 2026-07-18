import mongoose, { Document, Schema } from "mongoose";

export interface IUnidadNegocio extends Document {
  nombre: string;
  activo: boolean;
  orden: number;
  createdAt: Date;
  updatedAt: Date;
}

const unidadNegocioSchema = new Schema(
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
    orden: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

unidadNegocioSchema.index({ orden: 1, nombre: 1 });

const UnidadNegocio = mongoose.model<IUnidadNegocio>(
  "unidades_negocio",
  unidadNegocioSchema,
);

export default UnidadNegocio;
