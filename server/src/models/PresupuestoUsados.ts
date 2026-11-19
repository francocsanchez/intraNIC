import mongoose, { Schema } from "mongoose";

const PresupuestoUsadosSchema = new Schema({
  interno: { type: String, default: "", trim: true },
  esExterno: { type: Boolean, default: false },
  esReingreso: { type: Boolean, default: false },
  dominio: { type: String, required: true, trim: true },
  marca: { type: String, required: true, trim: true },
  modelo: { type: String, required: true, trim: true },
  km: { type: Number, required: true, min: 0 },
  costo: { type: Number, required: true, min: 0 },
  costoConIva: { type: Number, required: true, min: 0 },
  valorInfo: { type: Number, required: true, min: 0 },
  porcentajeToma: { type: Number, required: true, min: 0, max: 100 },
  valorIngreso: { type: Number, required: true, min: 0 },
  diferencia: { type: Number, required: true, min: 0 },
  observaciones: { type: String, default: "", trim: true },
  estado: { type: String, enum: ["Pendiente", "Aprobado", "Rechazado", "Revisar"], default: "Pendiente" },
  tallerId: { type: Schema.Types.ObjectId, ref: "TallerUsados", required: true },
  tallerNombre: { type: String, required: true, trim: true },
  nroPresupuesto: { type: String, default: "", trim: true },
  prioridad: { type: String, enum: ["Alta", "Media", "Baja"], default: "Media" },
  detalle: { type: String, default: "", trim: true },
  fechaPedido: { type: Date, required: true },
  fechaIngresoTaller: { type: Date, default: null },
  fechaEgresoTaller: { type: Date, default: null },
  legacySourceId: { type: String, unique: true, sparse: true },
}, { collection: "usados_presupuestos", timestamps: true });

PresupuestoUsadosSchema.index({ fechaPedido: -1, createdAt: -1 });
PresupuestoUsadosSchema.index({ estado: 1, tallerId: 1, interno: 1, dominio: 1 });

export default mongoose.model("PresupuestoUsados", PresupuestoUsadosSchema);
