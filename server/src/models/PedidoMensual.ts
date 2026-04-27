import mongoose, { Document, Schema, Types } from "mongoose";

export interface IPedidoMensual extends Document {
  version: Types.ObjectId;
  cantidad: number;
  createdAt: Date;
  updatedAt: Date;
}

const pedidoMensualSchema = new Schema<IPedidoMensual>(
  {
    version: {
      type: Schema.Types.ObjectId,
      ref: "versiones",
      required: true,
      unique: true,
    },
    cantidad: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { timestamps: true },
);

const PedidoMensual = mongoose.model<IPedidoMensual>("pedido_mensual", pedidoMensualSchema);

export default PedidoMensual;
