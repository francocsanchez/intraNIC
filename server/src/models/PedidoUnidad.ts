import mongoose, { Document, Schema, Types } from "mongoose";

export interface IPedidoUnidadItem {
  interno: number;
  version: string;
  order: string;
  cliente: string;
  vendedor: string;
  chasis: string;
  PDI: boolean;
}

export interface IPedidoUnidad extends Document {
  fecha: string;
  usuario_id: Types.ObjectId;
  usuarioNombre: string;
  items: IPedidoUnidadItem[];
  createdAt: Date;
  updatedAt: Date;
}

const pedidoUnidadItemSchema = new Schema<IPedidoUnidadItem>(
  {
    interno: {
      type: Number,
      required: true,
    },
    version: {
      type: String,
      required: true,
      trim: true,
    },
    order: {
      type: String,
      required: true,
      trim: true,
    },
    cliente: {
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
    PDI: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false },
);

const pedidoUnidadSchema = new Schema<IPedidoUnidad>(
  {
    fecha: {
      type: String,
      required: true,
      trim: true,
    },
    usuario_id: {
      type: Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    usuarioNombre: {
      type: String,
      required: true,
      trim: true,
    },
    items: {
      type: [pedidoUnidadItemSchema],
      required: true,
      validate: {
        validator: (value: IPedidoUnidadItem[]) => value.length > 0 && value.length <= 8,
        message: "El pedido debe contener entre 1 y 8 unidades",
      },
    },
  },
  { timestamps: true },
);

const PedidoUnidad = mongoose.model<IPedidoUnidad>("pedido_unidades", pedidoUnidadSchema);

export default PedidoUnidad;
