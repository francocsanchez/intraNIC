import mongoose, { Document, Schema, Types } from "mongoose";

export const solicitudCambioColorAuditAction = {
  CREATED: "created",
  DESTINATION_UPDATED: "destinationUpdated",
  REQUESTED_CHANGED: "requestedChanged",
  COMPLETED_CHANGED: "completedChanged",
  REJECTED: "rejected",
} as const;

export type SolicitudCambioColorAuditAction =
  (typeof solicitudCambioColorAuditAction)[keyof typeof solicitudCambioColorAuditAction];

export interface ISolicitudCambioColorAudit {
  action: SolicitudCambioColorAuditAction;
  actorId: Types.ObjectId;
  actorName: string;
  before: Record<string, unknown>;
  after: Record<string, unknown>;
  createdAt: Date;
}

export interface ISolicitudCambioColor extends Document {
  interno: number;
  nrofab: string;
  versionOrigen: string;
  colorOrigen: string;
  versionDestinoId: Types.ObjectId;
  versionDestinoNombre: string;
  colorDestinoId: Types.ObjectId;
  colorDestinoNombre: string;
  colorDestino2Id?: Types.ObjectId | null;
  colorDestino2Nombre?: string;
  observaciones: string;
  solicitadoPorCodigo: number;
  solicitadoPorNombre: string;
  solicitudPedida: boolean;
  solicitudCompletada: boolean;
  solicitudRechazada: boolean;
  createdBy: Types.ObjectId;
  createdByName: string;
  audit: ISolicitudCambioColorAudit[];
  createdAt: Date;
  updatedAt: Date;
}

const auditSchema = new Schema<ISolicitudCambioColorAudit>(
  {
    action: { type: String, enum: Object.values(solicitudCambioColorAuditAction), required: true },
    actorId: { type: Schema.Types.ObjectId, ref: "users", required: true },
    actorName: { type: String, required: true, trim: true },
    before: { type: Schema.Types.Mixed, required: true, default: {} },
    after: { type: Schema.Types.Mixed, required: true, default: {} },
    createdAt: { type: Date, required: true, default: Date.now },
  },
  { _id: true },
);

const solicitudCambioColorSchema = new Schema<ISolicitudCambioColor>(
  {
    interno: { type: Number, required: true, index: true },
    nrofab: { type: String, required: true, trim: true },
    versionOrigen: { type: String, required: true, trim: true },
    colorOrigen: { type: String, required: true, trim: true },
    versionDestinoId: { type: Schema.Types.ObjectId, ref: "versiones", required: true },
    versionDestinoNombre: { type: String, required: true, trim: true },
    colorDestinoId: { type: Schema.Types.ObjectId, ref: "colores", required: true },
    colorDestinoNombre: { type: String, required: true, trim: true },
    colorDestino2Id: { type: Schema.Types.ObjectId, ref: "colores", default: null },
    colorDestino2Nombre: { type: String, trim: true, default: "" },
    observaciones: { type: String, trim: true, default: "" },
    solicitadoPorCodigo: { type: Number, required: true },
    solicitadoPorNombre: { type: String, required: true, trim: true },
    solicitudPedida: { type: Boolean, default: false },
    solicitudCompletada: { type: Boolean, default: false },
    solicitudRechazada: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: "users", required: true },
    createdByName: { type: String, required: true, trim: true },
    audit: { type: [auditSchema], default: [] },
  },
  { timestamps: true, collection: "solicitudes_cambio_color" },
);

solicitudCambioColorSchema.index({ createdAt: -1 });
solicitudCambioColorSchema.index({ solicitudPedida: 1, solicitudCompletada: 1, createdAt: -1 });

const SolicitudCambioColor = mongoose.model<ISolicitudCambioColor>(
  "solicitudes_cambio_color",
  solicitudCambioColorSchema,
);

export default SolicitudCambioColor;
