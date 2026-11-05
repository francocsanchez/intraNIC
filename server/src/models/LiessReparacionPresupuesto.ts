import mongoose, { Document, Schema, Types } from "mongoose";

export type LiessReparacionPrioridad = "Alta" | "Media" | "Baja";
export type LiessReparacionEstado = "Pendiente" | "Aprobado" | "Rechazado";

export interface ILiessReparacionPresupuesto extends Document {
  fechaPedido: string;
  unidad: { interno: number; tipo: "nuevo" | "usado"; marca: string; version: string; color: string; chasis: string; anio: number | null; kilometrosBase: number | null };
  taller: Types.ObjectId;
  tallerNombre: string;
  tallerTipoTrabajo: string;
  kmInformados: number;
  costoArs: number;
  numeroPresupuesto: string;
  fechaIngresoTaller: string;
  fechaEgresoTaller: string | null;
  estado: LiessReparacionEstado;
  prioridad: LiessReparacionPrioridad;
  valorInfo: number;
  porcentajeToma: number;
  valorIngreso: number;
  diferencia: number;
  detalle: string;
  observaciones: string;
  createdAt: Date;
  updatedAt: Date;
}

const unidadSchema = new Schema({ interno: { type: Number, required: true }, tipo: { type: String, enum: ["nuevo", "usado"], required: true }, marca: { type: String, required: true, trim: true }, version: { type: String, required: true, trim: true }, color: { type: String, default: "", trim: true }, chasis: { type: String, default: "", trim: true }, anio: { type: Number, default: null }, kilometrosBase: { type: Number, default: null } }, { _id: false });

const presupuestoSchema = new Schema<ILiessReparacionPresupuesto>({
  fechaPedido: { type: String, required: true }, unidad: { type: unidadSchema, required: true },
  taller: { type: Schema.Types.ObjectId, ref: "liess_talleres", required: true }, tallerNombre: { type: String, required: true, trim: true }, tallerTipoTrabajo: { type: String, required: true, trim: true },
  kmInformados: { type: Number, required: true, min: 0 }, costoArs: { type: Number, required: true, min: 0 }, numeroPresupuesto: { type: String, required: true, trim: true }, fechaIngresoTaller: { type: String, required: true }, fechaEgresoTaller: { type: String, default: null }, estado: { type: String, enum: ["Pendiente", "Aprobado", "Rechazado"], default: "Pendiente", required: true },
  prioridad: { type: String, enum: ["Alta", "Media", "Baja"], required: true }, valorInfo: { type: Number, required: true, min: 0 }, porcentajeToma: { type: Number, required: true, min: 0, max: 100 }, valorIngreso: { type: Number, required: true, min: 0 }, diferencia: { type: Number, required: true, min: 0 }, detalle: { type: String, default: "", trim: true }, observaciones: { type: String, default: "", trim: true },
}, { timestamps: true, collection: "liess_reparacion_presupuestos" });

presupuestoSchema.index({ fechaPedido: -1, createdAt: -1 });
presupuestoSchema.index({ "unidad.interno": 1, fechaPedido: -1 });
export default mongoose.model<ILiessReparacionPresupuesto>("liess_reparacion_presupuestos", presupuestoSchema);
