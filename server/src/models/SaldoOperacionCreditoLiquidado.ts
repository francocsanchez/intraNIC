import mongoose, { Document, Schema } from "mongoose";

export interface ISaldoOperacionCreditoLiquidadoHistorial {
  montoAnterior: number | null;
  montoNuevo: number;
  archivo: string;
  usuarioId: string;
  usuarioNombre: string;
  importadoEn: Date;
}

export interface ISaldoOperacionCreditoLiquidado extends Document {
  chasisNormalizado: string;
  chasisOriginal: string;
  montoLiquidado: number;
  archivoUltimo: string;
  usuarioIdUltimo: string;
  usuarioNombreUltimo: string;
  liquidadoEn: Date;
  historial: ISaldoOperacionCreditoLiquidadoHistorial[];
}

const historialSchema = new Schema<ISaldoOperacionCreditoLiquidadoHistorial>(
  {
    montoAnterior: { type: Number, default: null },
    montoNuevo: { type: Number, required: true },
    archivo: { type: String, required: true, trim: true },
    usuarioId: { type: String, required: true, trim: true },
    usuarioNombre: { type: String, required: true, trim: true },
    importadoEn: { type: Date, required: true },
  },
  { _id: false },
);

const saldoOperacionCreditoLiquidadoSchema = new Schema<ISaldoOperacionCreditoLiquidado>(
  {
    chasisNormalizado: { type: String, required: true, unique: true, index: true, trim: true, uppercase: true },
    chasisOriginal: { type: String, required: true, trim: true },
    montoLiquidado: { type: Number, required: true, min: 0 },
    archivoUltimo: { type: String, required: true, trim: true },
    usuarioIdUltimo: { type: String, required: true, trim: true },
    usuarioNombreUltimo: { type: String, required: true, trim: true },
    liquidadoEn: { type: Date, required: true },
    historial: { type: [historialSchema], default: [] },
  },
  { timestamps: true, collection: "saldo_operacion_creditos_liquidados" },
);

const SaldoOperacionCreditoLiquidado = mongoose.model<ISaldoOperacionCreditoLiquidado>(
  "saldo_operacion_creditos_liquidados",
  saldoOperacionCreditoLiquidadoSchema,
);

export default SaldoOperacionCreditoLiquidado;
