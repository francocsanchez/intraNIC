import mongoose, { Document, Schema, Types } from "mongoose";

export interface IPreventa extends Document {
  vendedor: number;
  vendedorNombre: string;
  numero_op?: number | null;
  cliente: string;
  version: Types.ObjectId;
  colores: Types.ObjectId[];
  monto_reserva?: number | null;
  observaciones?: string;
  mes_asigna: Date;
  asignado: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const preventaSchema = new Schema<IPreventa>(
  {
    vendedor: {
      type: Number,
      required: true,
    },
    vendedorNombre: {
      type: String,
      required: true,
      trim: true,
    },
    numero_op: {
      type: Number,
      default: null,
    },
    cliente: {
      type: String,
      required: true,
      trim: true,
    },
    version: {
      type: Schema.Types.ObjectId,
      ref: "versiones",
      required: true,
    },
    colores: {
      type: [{ type: Schema.Types.ObjectId, ref: "colores" }],
      default: [],
    },
    monto_reserva: {
      type: Number,
      default: null,
    },
    observaciones: {
      type: String,
      default: "",
      trim: true,
    },
    mes_asigna: {
      type: Date,
      required: true,
    },
    asignado: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

preventaSchema.index({ asignado: 1, mes_asigna: 1 });
preventaSchema.index({ vendedor: 1, mes_asigna: 1 });

const Preventa = mongoose.model<IPreventa>("preventas", preventaSchema);

export default Preventa;
