import mongoose, { Document, Schema } from "mongoose";

export interface IPlanNegocio extends Document {
  modelo: string;
  anio: number;
  objetivo: number;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const planNegocioSchema = new Schema<IPlanNegocio>(
  {
    modelo: {
      type: String,
      required: true,
      trim: true,
    },
    anio: {
      type: Number,
      required: true,
      min: 2000,
      max: 2100,
    },
    objetivo: {
      type: Number,
      required: true,
      min: 0,
    },
    activo: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

planNegocioSchema.index({ modelo: 1, anio: 1 }, { unique: true });

const PlanNegocio = mongoose.model<IPlanNegocio>("plan_negocio", planNegocioSchema);

export default PlanNegocio;
