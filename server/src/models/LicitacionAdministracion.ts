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
  unidades: Array<{ _id: Types.ObjectId; interno?: number | null; versionId?: Types.ObjectId | null; versionNombre: string; colorNombre: string; cantidad: number; estado: "PENDIENTE_ASIGNAR" | "ASIGNADA" | "ENTREGADA"; patentamiento: boolean; flete: boolean; cantidadServicios: number; acc: boolean; conversionId?: Types.ObjectId | null; conversionTipo: string; conversionProveedor: string; estadoConversion?: "PENDIENTE" | "EN_PROVEEDOR" | "CONVERTIDA" | null }>;
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
    colorNombre: { type: String, default: "", trim: true },
    cantidad: { type: Number, required: true, min: 1 },
    estado: { type: String, enum: ["PENDIENTE_ASIGNAR", "ASIGNADA", "ENTREGADA"], default: "PENDIENTE_ASIGNAR", required: true },
    patentamiento: { type: Boolean, default: false, required: true },
    flete: { type: Boolean, default: false, required: true },
    cantidadServicios: { type: Number, default: 0, min: 0, required: true },
    acc: { type: Boolean, default: false, required: true },
    conversionId: { type: Schema.Types.ObjectId, ref: "conversiones", default: null },
    conversionTipo: { type: String, default: "", trim: true },
    conversionProveedor: { type: String, default: "", trim: true },
    estadoConversion: { type: String, enum: ["PENDIENTE", "EN_PROVEEDOR", "CONVERTIDA"], default: null },
  }],
  deletedAt: { type: Date, default: null },
}, { timestamps: true, collection: "licitaciones_administracion" });

licitacionAdministracionSchema.index({ deletedAt: 1, fechaApertura: -1, createdAt: -1 });

export default mongoose.model<ILicitacionAdministracion>("licitaciones_administracion", licitacionAdministracionSchema);
