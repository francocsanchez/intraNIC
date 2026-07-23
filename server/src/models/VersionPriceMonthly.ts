import mongoose, { Document, Schema, Types } from "mongoose";

export interface IVersionPriceMonthly extends Document {
  version: Types.ObjectId;
  mes: string;
  precio: number;
  descuentoReferenciaPct: number;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const versionPriceMonthlySchema = new Schema<IVersionPriceMonthly>(
  {
    version: {
      type: Schema.Types.ObjectId,
      ref: "versiones",
      required: true,
    },
    mes: {
      type: String,
      required: true,
      trim: true,
    },
    precio: {
      type: Number,
      required: true,
      min: 0,
    },
    descuentoReferenciaPct: {
      type: Number,
      required: true,
      min: 0,
      default: 8,
    },
    activo: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

versionPriceMonthlySchema.index({ version: 1, mes: 1 }, { unique: true });

const VersionPriceMonthly = mongoose.model<IVersionPriceMonthly>("versiones_precios_mensuales", versionPriceMonthlySchema);

export default VersionPriceMonthly;
