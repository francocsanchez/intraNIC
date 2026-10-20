import mongoose, { Document, Schema, Types } from "mongoose";

export const kintoGeotabStatuses = ["Reportando", "Sin Conexion"] as const;
export type KintoGeotabStatus = (typeof kintoGeotabStatuses)[number];
export const kintoFlotaAuditActions = ["KM_UPDATED", "DEACTIVATED", "REACTIVATED", "GEOTAB_CHANGED"] as const;
export type KintoFlotaAuditAction = (typeof kintoFlotaAuditActions)[number];

export interface IKintoFlota extends Document {
  dominio: string;
  modelo: string;
  anio: number;
  vin: string;
  kmIniciales: number;
  kmActual: number;
  geotab: KintoGeotabStatus;
  activo: boolean;
  sucursalEntrega?: Types.ObjectId | null;
  historialKm: Array<{ kmAnterior: number; kmActual: number; actorId: Types.ObjectId; actorNombre: string; createdAt: Date }>;
  auditoria: Array<{ accion: KintoFlotaAuditAction; actorId: Types.ObjectId; actorNombre: string; before: Record<string, unknown>; after: Record<string, unknown>; createdAt: Date }>;
  createdAt: Date;
  updatedAt: Date;
}

const kintoFlotaSchema = new Schema<IKintoFlota>(
  {
    dominio: { type: String, required: true, trim: true, uppercase: true },
    modelo: { type: String, required: true, trim: true },
    anio: { type: Number, required: true },
    vin: { type: String, required: true, trim: true, uppercase: true },
    kmIniciales: { type: Number, required: true, min: 0 },
    kmActual: { type: Number, required: true, min: 0 },
    geotab: { type: String, enum: kintoGeotabStatuses, required: true },
    activo: { type: Boolean, default: true },
    sucursalEntrega: { type: Schema.Types.ObjectId, ref: "sucursales_entrega", default: null },
    historialKm: [{
      kmAnterior: { type: Number, required: true },
      kmActual: { type: Number, required: true },
      actorId: { type: Schema.Types.ObjectId, ref: "users", required: true },
      actorNombre: { type: String, required: true, trim: true },
      createdAt: { type: Date, required: true },
    }],
    auditoria: [{
      accion: { type: String, enum: kintoFlotaAuditActions, required: true },
      actorId: { type: Schema.Types.ObjectId, ref: "users", required: true },
      actorNombre: { type: String, required: true, trim: true },
      before: { type: Schema.Types.Mixed, required: true },
      after: { type: Schema.Types.Mixed, required: true },
      createdAt: { type: Date, required: true },
    }],
  },
  { timestamps: true, collection: "kinto_flota" },
);

kintoFlotaSchema.index({ dominio: 1 }, { unique: true });
kintoFlotaSchema.index({ vin: 1 }, { unique: true });

const KintoFlota = mongoose.model<IKintoFlota>("kinto_flota", kintoFlotaSchema);

/** Removes the legacy unique chasis index created before the field was renamed to VIN. */
export const syncKintoFlotaIndexes = async () => {
  try {
    await KintoFlota.collection.dropIndex("chasis_1");
  } catch (error: any) {
    if (error?.code !== 27 && error?.codeName !== "IndexNotFound") throw error;
  }
  await KintoFlota.syncIndexes();
};

export default KintoFlota;
