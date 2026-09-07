import mongoose, { Document, Schema } from "mongoose";

export interface IColorUnidad extends Document {
  nombre: string;
  hex: string;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const colorUnidadSchema = new Schema<IColorUnidad>(
  {
    nombre: { type: String, required: true, trim: true },
    hex: { type: String, required: true, trim: true, match: [/^#[0-9A-Fa-f]{6}$/, "El color visual debe usar el formato #RRGGBB"] },
    activo: { type: Boolean, default: true },
  },
  { timestamps: true },
);

colorUnidadSchema.index({ nombre: 1 }, { unique: true });

export default mongoose.model<IColorUnidad>("colores_unidades", colorUnidadSchema);
