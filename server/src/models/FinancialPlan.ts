import mongoose, { Document, Schema } from "mongoose";

export type FinancialValueType = "porcentaje" | "monto";

export interface IFinancialPlanTerm {
  _id?: mongoose.Types.ObjectId;
  plazo: number;
  tna: number;
  quebrantoTipo: FinancialValueType;
  quebrantoValor: number;
  maxFinanciacionTipo: FinancialValueType;
  maxFinanciacionValor: number;
  activo: boolean;
}

export interface IFinancialPlan extends Document {
  entidad: string;
  nombre: string;
  activo: boolean;
  plazos: IFinancialPlanTerm[];
  createdAt: Date;
  updatedAt: Date;
}

const planTermSchema = new Schema<IFinancialPlanTerm>(
  {
    plazo: {
      type: Number,
      required: true,
      min: 1,
    },
    tna: {
      type: Number,
      required: true,
      min: 0,
    },
    quebrantoTipo: {
      type: String,
      enum: ["porcentaje", "monto"],
      required: true,
    },
    quebrantoValor: {
      type: Number,
      required: true,
      min: 0,
    },
    maxFinanciacionTipo: {
      type: String,
      enum: ["porcentaje", "monto"],
      required: true,
    },
    maxFinanciacionValor: {
      type: Number,
      required: true,
      min: 0,
    },
    activo: {
      type: Boolean,
      default: true,
    },
  },
  { _id: true },
);

const financialPlanSchema = new Schema<IFinancialPlan>(
  {
    entidad: {
      type: String,
      required: true,
      trim: true,
    },
    nombre: {
      type: String,
      required: true,
      trim: true,
    },
    activo: {
      type: Boolean,
      default: true,
    },
    plazos: {
      type: [planTermSchema],
      default: [],
    },
  },
  { timestamps: true },
);

financialPlanSchema.index({ entidad: 1, nombre: 1 }, { unique: true });

const FinancialPlan = mongoose.model<IFinancialPlan>("planes_financieros", financialPlanSchema);

export default FinancialPlan;
