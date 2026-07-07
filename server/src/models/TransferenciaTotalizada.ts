import mongoose, { Document, Schema } from "mongoose";

export interface ITransferenciaTotalizada extends Document {
  anio: number;
  mes: number;
  dia: number;
  marca: string;
  modelo: string;
  anioModelo: number;
  registroProvincia: string;
  registroLocalidad: string;
  total: number;
  sourceUpdatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const transferenciaTotalizadaSchema = new Schema<ITransferenciaTotalizada>(
  {
    anio: { type: Number, required: true, index: true },
    mes: { type: Number, required: true, index: true },
    dia: { type: Number, required: true, index: true },
    marca: { type: String, required: true, trim: true, index: true },
    modelo: { type: String, required: true, trim: true, index: true, default: "SIN MODELO" },
    anioModelo: { type: Number, required: true, index: true },
    registroProvincia: { type: String, required: true, trim: true, index: true, default: "SIN PROVINCIA" },
    registroLocalidad: { type: String, required: true, trim: true, default: "SIN LOCALIDAD" },
    total: { type: Number, required: true, default: 0 },
    sourceUpdatedAt: { type: Date, required: true, default: Date.now, index: true },
  },
  { timestamps: true },
);

transferenciaTotalizadaSchema.index({ anio: 1, mes: 1, dia: 1 });
transferenciaTotalizadaSchema.index({ marca: 1, anio: 1, mes: 1 });
transferenciaTotalizadaSchema.index({ modelo: 1, anio: 1, mes: 1 });
transferenciaTotalizadaSchema.index({ anioModelo: 1, anio: 1, mes: 1 });
transferenciaTotalizadaSchema.index({ registroProvincia: 1, anio: 1, mes: 1 });
transferenciaTotalizadaSchema.index(
  {
    anio: 1,
    mes: 1,
    dia: 1,
    marca: 1,
    modelo: 1,
    anioModelo: 1,
    registroProvincia: 1,
    registroLocalidad: 1,
  },
  { unique: true, name: "transferencias_totalizadas_unique_dim_idx" },
);

const TransferenciaTotalizada = mongoose.model<ITransferenciaTotalizada>(
  "transferencias_totalizadas",
  transferenciaTotalizadaSchema,
);

export default TransferenciaTotalizada;
