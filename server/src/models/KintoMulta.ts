import mongoose, { Document, Schema, Types } from "mongoose";

export const kintoMultaAuditActions = ["CARGO_CREATED", "UPDATED", "STATUS_CHANGED", "DELETED"] as const;
export type KintoMultaAuditAction = (typeof kintoMultaAuditActions)[number];

export interface IKintoMulta extends Document {
  flota: Types.ObjectId;
  dominio: string;
  sucursal: string;
  fecha: string;
  booking: string;
  monto: number;
  cobrado: boolean;
  facturado: boolean;
  pagado: boolean;
  deletedAt?: Date | null;
  auditoria: Array<{ accion: KintoMultaAuditAction; actorId: Types.ObjectId; actorNombre: string; before: Record<string, unknown>; after: Record<string, unknown>; createdAt: Date }>;
  createdAt: Date;
  updatedAt: Date;
}

const kintoMultaSchema = new Schema<IKintoMulta>({
  flota: { type: Schema.Types.ObjectId, ref: "kinto_flota", required: true, index: true },
  dominio: { type: String, required: true, trim: true, uppercase: true },
  sucursal: { type: String, required: true, trim: true },
  fecha: { type: String, required: true },
  booking: { type: String, required: true, trim: true },
  monto: { type: Number, required: true, min: 0 },
  cobrado: { type: Boolean, default: false },
  facturado: { type: Boolean, default: false },
  pagado: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null },
  auditoria: [{
    accion: { type: String, enum: kintoMultaAuditActions, required: true },
    actorId: { type: Schema.Types.ObjectId, ref: "users", required: true },
    actorNombre: { type: String, required: true, trim: true },
    before: { type: Schema.Types.Mixed, required: true },
    after: { type: Schema.Types.Mixed, required: true },
    createdAt: { type: Date, required: true },
  }],
}, { timestamps: true, collection: "kinto_multas" });

kintoMultaSchema.index({ deletedAt: 1, fecha: -1, createdAt: -1 });
kintoMultaSchema.index({ flota: 1, deletedAt: 1 });

export default mongoose.model<IKintoMulta>("kinto_multas", kintoMultaSchema);
