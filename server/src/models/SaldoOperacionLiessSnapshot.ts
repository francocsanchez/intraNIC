import mongoose, { Document, Schema } from "mongoose";

export interface ISaldoOperacionLiessSnapshot extends Document {
  operacionId: string;
  codigoOperacion: number;
  tipoOperacion: number;
  clienteNombre: string;
  tipoCliente: "Particular" | "Leasing" | "Reventa" | "Empresa" | "Licitación" | null;
  vendedor: string;
  sucursal: string;
  marca: string;
  version: string;
  chasis: string;
  total: number | null;
  gestoria: number | null;
  bonificacion: number | null;
  senas: number | null;
  usado: number | null;
  creditoBanco: number | null;
  creditoLiquidadoMonto: number | null;
  creditoLiquidadoEn: Date | null;
  creditoLiquidadoManual: boolean;
  fechaAsignacion: string | null;
  fechaFactura: string | null;
  diasAsignada: number | null;
  entregada: boolean;
  fechaEntregaDetectada: Date | null;
  fechaCancelacion: string | null;
  diasHastaCancelacion: number | null;
  observacion: string;
  sincronizadoEn: Date;
}

const nullableNumber = { type: Number, default: null };
const schema = new Schema<ISaldoOperacionLiessSnapshot>({
  operacionId: { type: String, required: true, unique: true, index: true },
  codigoOperacion: { type: Number, required: true, index: true },
  tipoOperacion: { type: Number, required: true, default: 5 },
  clienteNombre: { type: String, default: "", trim: true },
  tipoCliente: { type: String, enum: ["Particular", "Leasing", "Reventa", "Empresa", "Licitación"], default: null },
  vendedor: { type: String, default: "", trim: true },
  sucursal: { type: String, default: "SIN SUCURSAL", trim: true },
  marca: { type: String, default: "SIN MARCA", trim: true },
  version: { type: String, default: "SIN VERSION", trim: true },
  chasis: { type: String, default: "", trim: true, uppercase: true, index: true },
  total: nullableNumber, gestoria: nullableNumber, bonificacion: nullableNumber, senas: nullableNumber, usado: nullableNumber,
  creditoBanco: nullableNumber, creditoLiquidadoMonto: nullableNumber,
  creditoLiquidadoEn: { type: Date, default: null },
  creditoLiquidadoManual: { type: Boolean, default: false, index: true },
  fechaAsignacion: { type: String, default: null }, fechaFactura: { type: String, default: null }, diasAsignada: nullableNumber,
  entregada: { type: Boolean, default: false, index: true }, fechaEntregaDetectada: { type: Date, default: null },
  fechaCancelacion: { type: String, default: null }, diasHastaCancelacion: nullableNumber,
  observacion: { type: String, default: "", trim: true, maxlength: 2000 },
  sincronizadoEn: { type: Date, required: true, default: Date.now },
}, { timestamps: true, collection: "saldo_operacion_liess_snapshots" });
schema.index({ entregada: 1, fechaCancelacion: 1, sucursal: 1, vendedor: 1 });
schema.index({ entregada: 1, version: 1 });
export default mongoose.model<ISaldoOperacionLiessSnapshot>("saldo_operacion_liess_snapshots", schema);
