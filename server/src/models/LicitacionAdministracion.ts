import mongoose, { Document, Schema, Types } from "mongoose";

export interface ILicitacionAdministracion extends Document {
  entidad: string;
  cuit: string;
  contactoNombre: string;
  contactoApellido: string;
  contactoTelefono: string;
  fechaApertura: string;
  diasMantenimientoOferta: number;
  tecnica: boolean | null;
  preAdjudicado: boolean | null;
  pagare: boolean;
  oc: boolean;
  unidades: Array<{ _id: Types.ObjectId; interno?: number | null; versionId?: Types.ObjectId | null; versionNombre: string; cantidad: number; asignada: boolean; equipadaTransformada: boolean; arribada: boolean; patentada: boolean; pagada: boolean; entregada: boolean }>;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const licitacionAdministracionSchema = new Schema<ILicitacionAdministracion>({
  entidad: { type: String, required: true, trim: true },
  cuit: { type: String, required: true, trim: true },
  contactoNombre: { type: String, required: true, trim: true },
  contactoApellido: { type: String, required: true, trim: true },
  contactoTelefono: { type: String, required: true, trim: true },
  fechaApertura: { type: String, required: true },
  diasMantenimientoOferta: { type: Number, required: true, min: 1 },
  tecnica: { type: Boolean, default: null },
  preAdjudicado: { type: Boolean, default: null },
  pagare: { type: Boolean, default: false },
  oc: { type: Boolean, default: false },
  unidades: [{
    versionId: { type: Schema.Types.ObjectId, ref: "versiones", default: null },
    versionNombre: { type: String, required: true, trim: true },
    interno: { type: Number, default: null, min: 1 },
    cantidad: { type: Number, required: true, min: 1 },
    asignada: { type: Boolean, default: false, required: true },
    equipadaTransformada: { type: Boolean, default: false, required: true },
    arribada: { type: Boolean, default: false, required: true },
    patentada: { type: Boolean, default: false, required: true },
    pagada: { type: Boolean, default: false, required: true },
    entregada: { type: Boolean, default: false, required: true },
  }],
  deletedAt: { type: Date, default: null },
}, { timestamps: true, collection: "licitaciones_administracion" });

licitacionAdministracionSchema.index({ deletedAt: 1, fechaApertura: -1, createdAt: -1 });

export default mongoose.model<ILicitacionAdministracion>("licitaciones_administracion", licitacionAdministracionSchema);
