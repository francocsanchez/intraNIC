import mongoose, { Document, Schema } from "mongoose";

export interface IValorizacionPrecio extends Document {
  version: string;
  versionKey: string;
  modelo: string;
  valor: number;
  createdAt: Date;
  updatedAt: Date;
}

const valorizacionPrecioSchema = new Schema<IValorizacionPrecio>(
  {
    version: {
      type: String,
      required: true,
      trim: true,
    },
    versionKey: {
      type: String,
      required: true,
      trim: true,
    },
    modelo: {
      type: String,
      required: true,
      trim: true,
    },
    valor: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { timestamps: true },
);

valorizacionPrecioSchema.index({ versionKey: 1 }, { unique: true });

const ValorizacionPrecio = mongoose.model<IValorizacionPrecio>("valorizacion_precios", valorizacionPrecioSchema);

export default ValorizacionPrecio;
