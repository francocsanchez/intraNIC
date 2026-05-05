import mongoose, { Document, Schema, Types } from "mongoose";

export const PEDIDO_UNIDAD_PRIORIDADES = ["normal", "media", "urgente"] as const;
export type PedidoUnidadPrioridad = (typeof PEDIDO_UNIDAD_PRIORIDADES)[number];

export interface IPedidoUnidadPrevia extends Document {
  interno: number;
  clienteNombre: string;
  vendedorNombre: string;
  chasis: string | null;
  version: string;
  modelo: string;
  prioridad: PedidoUnidadPrioridad;
  usuario_id: Types.ObjectId;
  usuario: string;
  createdAt: Date;
  updatedAt: Date;
}

const pedidoUnidadPreviaSchema = new Schema<IPedidoUnidadPrevia>(
  {
    interno: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    clienteNombre: {
      type: String,
      required: true,
      trim: true,
    },
    vendedorNombre: {
      type: String,
      required: true,
      trim: true,
    },
    chasis: {
      type: String,
      default: null,
      trim: true,
    },
    version: {
      type: String,
      required: true,
      trim: true,
    },
    modelo: {
      type: String,
      required: true,
      trim: true,
    },
    prioridad: {
      type: String,
      enum: PEDIDO_UNIDAD_PRIORIDADES,
      default: "normal",
      required: true,
    },
    usuario_id: {
      type: Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    usuario: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true },
);

const PedidoUnidadPrevia = mongoose.model<IPedidoUnidadPrevia>(
  "pedido_unidades_previas",
  pedidoUnidadPreviaSchema,
);

export default PedidoUnidadPrevia;
