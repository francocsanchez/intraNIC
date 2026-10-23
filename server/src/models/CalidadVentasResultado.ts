import mongoose, { Document, Schema, Types } from "mongoose";

export const CALIDAD_VENTAS_RESULT_VALUES = ["cumple", "noCumple"] as const;
export type CalidadVentasResult = (typeof CALIDAD_VENTAS_RESULT_VALUES)[number];

export interface ICalidadVentasAudit {
  action: "CREATED" | "UPDATED";
  actorId: Types.ObjectId;
  actorName: string;
  before: Record<string, unknown>;
  after: Record<string, unknown>;
  createdAt: Date;
}

export interface ICalidadVentasResultado extends Document {
  vendedorCodigo: number;
  vendedorNombre: string;
  sucursal: string;
  anio: number;
  mes: number;
  oportunidadesPresupuesto: CalidadVentasResult;
  entregaUsado: CalidadVentasResult;
  tcfa: CalidadVentasResult;
  ssiInterno: CalidadVentasResult;
  ssiValor: number;
  puntosOportunidades: number;
  puntosEntregaUsado: number;
  puntosTcfa: number;
  puntosSsi: number;
  puntosTotal: number;
  createdBy?: Types.ObjectId;
  createdByName?: string;
  updatedBy?: Types.ObjectId;
  updatedByName?: string;
  auditoria: ICalidadVentasAudit[];
  createdAt: Date;
  updatedAt: Date;
}

const auditSchema = new Schema<ICalidadVentasAudit>(
  {
    action: { type: String, enum: ["CREATED", "UPDATED"], required: true },
    actorId: { type: Schema.Types.ObjectId, ref: "users", required: true },
    actorName: { type: String, required: true, trim: true },
    before: { type: Schema.Types.Mixed, required: true },
    after: { type: Schema.Types.Mixed, required: true },
  },
  { _id: false, timestamps: { createdAt: true, updatedAt: false } },
);

const calidadVentasResultadoSchema = new Schema<ICalidadVentasResultado>(
  {
    vendedorCodigo: { type: Number, required: true },
    vendedorNombre: { type: String, required: true, trim: true },
    sucursal: { type: String, required: true, trim: true },
    anio: { type: Number, required: true, min: 2000, max: 2100 },
    mes: { type: Number, required: true, min: 1, max: 12 },
    oportunidadesPresupuesto: { type: String, enum: CALIDAD_VENTAS_RESULT_VALUES, required: true },
    entregaUsado: { type: String, enum: CALIDAD_VENTAS_RESULT_VALUES, required: true },
    tcfa: { type: String, enum: CALIDAD_VENTAS_RESULT_VALUES, required: true },
    ssiInterno: { type: String, enum: CALIDAD_VENTAS_RESULT_VALUES, required: true },
    ssiValor: { type: Number, required: true, min: 0, max: 100 },
    puntosOportunidades: { type: Number, required: true, min: 0, max: 3 },
    puntosEntregaUsado: { type: Number, required: true, min: 0, max: 1 },
    puntosTcfa: { type: Number, required: true, min: 0, max: 1 },
    puntosSsi: { type: Number, required: true, min: 0, max: 3 },
    puntosTotal: { type: Number, required: true, min: 0, max: 8 },
    createdBy: { type: Schema.Types.ObjectId, ref: "users", default: null },
    createdByName: { type: String, default: null, trim: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: "users", default: null },
    updatedByName: { type: String, default: null, trim: true },
    auditoria: { type: [auditSchema], default: [] },
  },
  { timestamps: true, collection: "calidad_ventas_resultados" },
);

calidadVentasResultadoSchema.index({ vendedorCodigo: 1, anio: 1, mes: 1 }, { unique: true });
calidadVentasResultadoSchema.index({ anio: 1, mes: 1, vendedorNombre: 1 });

export default mongoose.model<ICalidadVentasResultado>("calidad_ventas_resultados", calidadVentasResultadoSchema);
