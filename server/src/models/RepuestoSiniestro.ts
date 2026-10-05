import mongoose, { Document, Schema, Types } from "mongoose";

export const repuestoSiniestroAuditAction = {
  CREATED: "created",
  NOTE_UPDATED: "noteUpdated",
  REQUEST_CHANGED: "requestChanged",
  ARRIVAL_CHANGED: "arrivalChanged",
  WITHDRAWAL_CHANGED: "withdrawalChanged",
  COMPLETED: "completed",
  DELETED: "deleted",
} as const;

export type RepuestoSiniestroAuditAction =
  (typeof repuestoSiniestroAuditAction)[keyof typeof repuestoSiniestroAuditAction];

interface IAudit {
  action: RepuestoSiniestroAuditAction;
  actorId: Types.ObjectId;
  actorName: string;
  before: Record<string, unknown>;
  after: Record<string, unknown>;
  createdAt: Date;
}

export interface IRepuestoSiniestro extends Document {
  interno: number;
  unidad: { modelo: string; version: string; chasis: string; cliente: string };
  nota: { operacion: number; numero: number; fecha: string; cuenta: number; cliente: string; sucursal: string };
  articulos: Array<{ renglon: number; articulo: string; denominacion: string; cantidad: number; pedido: boolean; arribado: boolean; retirado: boolean }>;
  estado: "pendiente" | "completado" | "eliminado";
  activo: boolean;
  createdBy: Types.ObjectId;
  createdByName: string;
  deletedAt?: Date;
  audit: IAudit[];
  createdAt: Date;
  updatedAt: Date;
}

const auditSchema = new Schema<IAudit>({
  action: { type: String, enum: Object.values(repuestoSiniestroAuditAction), required: true },
  actorId: { type: Schema.Types.ObjectId, ref: "users", required: true },
  actorName: { type: String, required: true, trim: true },
  before: { type: Schema.Types.Mixed, required: true, default: {} },
  after: { type: Schema.Types.Mixed, required: true, default: {} },
  createdAt: { type: Date, required: true, default: Date.now },
}, { _id: true });

const articuloSchema = new Schema({
  renglon: { type: Number, required: true },
  articulo: { type: String, required: true, trim: true },
  denominacion: { type: String, required: true, trim: true },
  cantidad: { type: Number, required: true },
  pedido: { type: Boolean, default: false },
  arribado: { type: Boolean, default: false },
  retirado: { type: Boolean, default: false },
}, { _id: false });

const repuestoSiniestroSchema = new Schema<IRepuestoSiniestro>({
  interno: { type: Number, required: true, index: true },
  unidad: {
    modelo: { type: String, required: true, trim: true }, version: { type: String, required: true, trim: true },
    chasis: { type: String, default: "", trim: true }, cliente: { type: String, required: true, trim: true },
  },
  nota: {
    operacion: { type: Number, required: true }, numero: { type: Number, required: true }, fecha: { type: String, required: true },
    cuenta: { type: Number, required: true }, cliente: { type: String, required: true, trim: true }, sucursal: { type: String, required: true, trim: true },
  },
  articulos: { type: [articuloSchema], default: [] },
  estado: { type: String, enum: ["pendiente", "completado", "eliminado"], default: "pendiente", index: true },
  activo: { type: Boolean, default: true },
  createdBy: { type: Schema.Types.ObjectId, ref: "users", required: true },
  createdByName: { type: String, required: true, trim: true },
  deletedAt: { type: Date, default: null },
  audit: { type: [auditSchema], default: [] },
}, { timestamps: true, collection: "repuestos_siniestros" });

repuestoSiniestroSchema.index({ interno: 1, "nota.operacion": 1 }, { unique: true, partialFilterExpression: { activo: true } });
repuestoSiniestroSchema.index({ estado: 1, createdAt: -1 });

export default mongoose.model<IRepuestoSiniestro>("repuestos_siniestros", repuestoSiniestroSchema);
