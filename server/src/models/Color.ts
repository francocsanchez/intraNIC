import mongoose, { Document, Schema } from "mongoose";

export interface IColor extends Document {
  nombre: string;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const colorSchema = new Schema<IColor>(
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

colorSchema.index({ nombre: 1 }, { unique: true });

const Color = mongoose.model<IColor>("colores", colorSchema);

export default Color;
