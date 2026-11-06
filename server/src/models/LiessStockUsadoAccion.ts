import mongoose, { Document, Schema } from "mongoose";

export const liessStockUsadoAcciones = ["OK", "Reparacion"] as const;
export type LiessStockUsadoAccion = (typeof liessStockUsadoAcciones)[number];

export interface ILiessStockUsadoAccion extends Document {
  interno: number;
  accion: LiessStockUsadoAccion;
  createdAt: Date;
  updatedAt: Date;
}

const liessStockUsadoAccionSchema = new Schema<ILiessStockUsadoAccion>(
  {
    interno: { type: Number, required: true, unique: true, index: true, min: 1 },
    accion: { type: String, enum: liessStockUsadoAcciones, required: true, default: "OK" },
  },
  { timestamps: true, collection: "liess_stock_usados_acciones" },
);

export default mongoose.model<ILiessStockUsadoAccion>(
  "liess_stock_usados_acciones",
  liessStockUsadoAccionSchema,
);
