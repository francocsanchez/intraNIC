import mongoose, { Document, Schema } from "mongoose";

export interface IAnalisisStockPedido extends Document {
  modelo: string;
  version: string;
  modeloKey: string;
  versionKey: string;
  cantidad: number;
  createdAt: Date;
  updatedAt: Date;
}

const analisisStockPedidoSchema = new Schema<IAnalisisStockPedido>(
  {
    modelo: {
      type: String,
      required: true,
      trim: true,
    },
    version: {
      type: String,
      required: true,
      trim: true,
    },
    modeloKey: {
      type: String,
      required: true,
      trim: true,
    },
    versionKey: {
      type: String,
      required: true,
      trim: true,
    },
    cantidad: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
  },
  { timestamps: true },
);

analisisStockPedidoSchema.index({ modeloKey: 1, versionKey: 1 }, { unique: true });

const AnalisisStockPedido = mongoose.model<IAnalisisStockPedido>(
  "analisis_stock_pedidos",
  analisisStockPedidoSchema,
);

export default AnalisisStockPedido;
