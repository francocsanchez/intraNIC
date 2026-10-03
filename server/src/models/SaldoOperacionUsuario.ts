import mongoose, { Document, Schema } from "mongoose";

export interface ISaldoOperacionUsuario extends Document {
  codigo: string;
  nombre: string;
  habilitado: boolean;
  sincronizadoEn: Date;
}

const saldoOperacionUsuarioSchema = new Schema<ISaldoOperacionUsuario>(
  {
    codigo: { type: String, required: true, unique: true, trim: true },
    nombre: { type: String, required: true, trim: true },
    habilitado: { type: Boolean, required: true, default: true, index: true },
    sincronizadoEn: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true, collection: "saldo_operacion_usuarios" },
);

saldoOperacionUsuarioSchema.index({ habilitado: 1, nombre: 1 });

const SaldoOperacionUsuario = mongoose.model<ISaldoOperacionUsuario>(
  "saldo_operacion_usuarios",
  saldoOperacionUsuarioSchema,
);

export default SaldoOperacionUsuario;
