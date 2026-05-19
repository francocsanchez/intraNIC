import mongoose, { Document, Schema } from "mongoose";

export interface IOperacionFacturaAnticipo extends Document {
  numeroOp: number;
  cliente: string;
  version: string;
  vendedor: string;
  chasis: string;
  usuarioCarga: string;
  fechaCarga: Date;
}

const operacionFacturaAnticipoSchema = new Schema<IOperacionFacturaAnticipo>(
  {
    numeroOp: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    cliente: {
      type: String,
      required: true,
      trim: true,
    },
    version: {
      type: String,
      required: true,
      trim: true,
    },
    vendedor: {
      type: String,
      required: true,
      trim: true,
    },
    chasis: {
      type: String,
      required: true,
      trim: true,
    },
    usuarioCarga: {
      type: String,
      required: true,
      trim: true,
    },
    fechaCarga: {
      type: Date,
      required: true,
      default: () => new Date(),
    },
  },
  {
    versionKey: false,
  },
);

const OperacionFacturaAnticipo = mongoose.model<IOperacionFacturaAnticipo>(
  "operaciones_facturas_anticipo",
  operacionFacturaAnticipoSchema,
);

export default OperacionFacturaAnticipo;
