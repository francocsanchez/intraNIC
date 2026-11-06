import mongoose, { Document, Schema, Types } from "mongoose";

export const liessReparacionEstados = ["Pendiente", "Aprobado", "Rechazado"] as const;
export const liessReparacionPrioridades = ["Alta", "Media", "Baja"] as const;
export const liessReparacionEtapas = ["Pendiente de ingreso", "Ingresada", "Diagnostico", "Esperando Repuestos", "En Reparacion", "Reparada (OK)"] as const;
export type LiessReparacionEstado = (typeof liessReparacionEstados)[number];
export type LiessReparacionPrioridad = (typeof liessReparacionPrioridades)[number];

export interface ILiessReparacionPresupuestoV2 extends Document {
  fecha: string;
  unidad: { interno: number; tipo: "nuevo" | "usado"; marca: string; version: string; color: string; chasis: string; anio: number | null; kilometrosBase: number | null };
  kmInformado: number;
  taller: Types.ObjectId;
  tallerNombre: string;
  tallerTipoTrabajo: string;
  numeroPresupuesto: string;
  costo: number;
  prioridad: LiessReparacionPrioridad;
  detalles: string;
  estado: LiessReparacionEstado;
  fechaIngreso: string | null;
  fechaEgreso: string | null;
  etapasReparacion: boolean[];
  createdAt: Date;
  updatedAt: Date;
}

const unidadSchema = new Schema(
  {
    interno: { type: Number, required: true },
    tipo: { type: String, enum: ["nuevo", "usado"], required: true },
    marca: { type: String, required: true, trim: true },
    version: { type: String, required: true, trim: true },
    color: { type: String, default: "", trim: true },
    chasis: { type: String, default: "", trim: true },
    anio: { type: Number, default: null },
    kilometrosBase: { type: Number, default: null },
  },
  { _id: false },
);

const presupuestoSchema = new Schema<ILiessReparacionPresupuestoV2>(
  {
    fecha: { type: String, required: true },
    unidad: { type: unidadSchema, required: true },
    kmInformado: { type: Number, required: true, min: 0 },
    taller: { type: Schema.Types.ObjectId, ref: "liess_talleres", required: true },
    tallerNombre: { type: String, required: true, trim: true },
    tallerTipoTrabajo: { type: String, required: true, trim: true },
    numeroPresupuesto: { type: String, default: "", trim: true },
    costo: { type: Number, required: true, min: 0 },
    prioridad: { type: String, enum: liessReparacionPrioridades, required: true },
    detalles: { type: String, required: true, trim: true },
    estado: { type: String, enum: liessReparacionEstados, required: true, default: "Pendiente" },
    fechaIngreso: { type: String, default: null },
    fechaEgreso: { type: String, default: null },
    etapasReparacion: { type: [Boolean], default: [false, false, false, false, false, false] },
  },
  { timestamps: true, collection: "liess_reparacion_presupuestos_v2" },
);

presupuestoSchema.index({ fecha: -1, createdAt: -1 });
presupuestoSchema.index({ "unidad.interno": 1, createdAt: -1 });

export default mongoose.model<ILiessReparacionPresupuestoV2>(
  "liess_reparacion_presupuestos_v2",
  presupuestoSchema,
);
