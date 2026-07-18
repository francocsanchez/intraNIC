import mongoose, { Document, Schema, Types } from "mongoose";

export interface IComercialAgendaPuesto extends Document {
  unidadNegocio: Types.ObjectId;
  nombre: string;
  orden: number;
  activo: boolean;
  createdBy?: Types.ObjectId | null;
  updatedBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const comercialAgendaPuestoSchema = new Schema<IComercialAgendaPuesto>(
  {
    unidadNegocio: {
      type: Schema.Types.ObjectId,
      ref: "unidades_negocio",
      required: true,
      index: true,
    },
    nombre: {
      type: String,
      required: true,
      trim: true,
    },
    orden: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
      index: true,
    },
    activo: {
      type: Boolean,
      default: true,
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "users",
      default: null,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "users",
      default: null,
    },
  },
  { timestamps: true, collection: "comercial_agenda_puestos" },
);

comercialAgendaPuestoSchema.index({ unidadNegocio: 1, activo: 1, orden: 1, nombre: 1 });

const ComercialAgendaPuesto = mongoose.model<IComercialAgendaPuesto>(
  "comercial_agenda_puestos",
  comercialAgendaPuestoSchema,
);

export default ComercialAgendaPuesto;
