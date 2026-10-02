import mongoose, { Document, Schema } from "mongoose";

export interface ISaldoOperacionSnapshot extends Document {
  codigoOperacion: number;
  clienteNombre: string;
  vendedor: string;
  sucursal: string;
  usuarioOperacion: string;
  nombreUsuarioOperacion: string;
  numeroFabrica: string;
  total: number | null;
  bonificacion: number | null;
  gestoria: number | null;
  senas: number | null;
  usado: number | null;
  creditoBanco: number | null;
  version: string;
  modeloGeneral: string;
  fechaAsignacion: string | null;
  diasAsignada: number | null;
  estado: string;
  ubicacion: string;
  fechaCancelacion: string | null;
  diasHastaCancelacion: number | null;
  entregada: boolean;
  fechaEntregaDetectada: Date | null;
  sincronizadoEn: Date;
}

const nullableNumber = { type: Number, default: null };

const saldoOperacionSnapshotSchema = new Schema<ISaldoOperacionSnapshot>(
  {
    codigoOperacion: { type: Number, required: true, unique: true, index: true },
    clienteNombre: { type: String, default: "", trim: true },
    vendedor: { type: String, default: "", trim: true },
    sucursal: { type: String, default: "SIN SUCURSAL", trim: true },
    usuarioOperacion: { type: String, default: "", trim: true },
    nombreUsuarioOperacion: { type: String, default: "", trim: true },
    numeroFabrica: { type: String, default: "", trim: true },
    total: nullableNumber,
    bonificacion: nullableNumber,
    gestoria: nullableNumber,
    senas: nullableNumber,
    usado: nullableNumber,
    creditoBanco: nullableNumber,
    version: { type: String, default: "", trim: true },
    modeloGeneral: { type: String, default: "SIN MODELO", trim: true },
    fechaAsignacion: { type: String, default: null },
    diasAsignada: nullableNumber,
    estado: { type: String, default: "Sin estado", trim: true },
    ubicacion: { type: String, default: "STOCK CONCESIONARIO", trim: true },
    fechaCancelacion: { type: String, default: null },
    diasHastaCancelacion: nullableNumber,
    entregada: { type: Boolean, default: false, index: true },
    fechaEntregaDetectada: { type: Date, default: null },
    sincronizadoEn: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true, collection: "saldo_operacion_snapshots" },
);

saldoOperacionSnapshotSchema.index({ entregada: 1, fechaCancelacion: 1, sucursal: 1, ubicacion: 1 });
saldoOperacionSnapshotSchema.index({ entregada: 1, modeloGeneral: 1 });

const SaldoOperacionSnapshot = mongoose.model<ISaldoOperacionSnapshot>(
  "saldo_operacion_snapshots",
  saldoOperacionSnapshotSchema,
);

export default SaldoOperacionSnapshot;
