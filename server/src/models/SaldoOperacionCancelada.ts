import mongoose, { Document, Schema, Types } from "mongoose";

export interface ISaldoOperacionCancelada extends Document {
  codigoOperacion: number;
  numeroFabrica: string;
  updatedBy?: Types.ObjectId | null;
  updatedByName?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const saldoOperacionCanceladaSchema = new Schema<ISaldoOperacionCancelada>(
  {
    codigoOperacion: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    numeroFabrica: {
      type: String,
      required: true,
      trim: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "users",
      default: null,
    },
    updatedByName: {
      type: String,
      default: null,
      trim: true,
    },
  },
  { timestamps: true, collection: "saldo_operacion_canceladas" },
);

saldoOperacionCanceladaSchema.index({ codigoOperacion: 1 }, { unique: true });

const SaldoOperacionCancelada = mongoose.model<ISaldoOperacionCancelada>(
  "saldo_operacion_canceladas",
  saldoOperacionCanceladaSchema,
);

export default SaldoOperacionCancelada;
