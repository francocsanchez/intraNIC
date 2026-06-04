import mongoose, { Document, Schema } from "mongoose";

export interface IUnidadDealer extends Document {
  vin: string;
  fechaCarga: Date | null;
  fechaArribo: Date | null;
  dealer: string;
  estado: string;
  createdAt: Date;
  updatedAt: Date;
}

const unidadDealerSchema = new Schema<IUnidadDealer>(
  {
    vin: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    fechaCarga: {
      type: Date,
      default: null,
    },
    fechaArribo: {
      type: Date,
      default: null,
    },
    dealer: {
      type: String,
      required: true,
      trim: true,
    },
    estado: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true },
);

const UnidadDealer = mongoose.model<IUnidadDealer>("unidades_dealers", unidadDealerSchema);

export default UnidadDealer;
