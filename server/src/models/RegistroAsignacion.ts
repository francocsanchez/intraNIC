import mongoose, { Document, Schema, Types } from "mongoose";

export const registroAsignacionTipo = {
  ASIGNADO: "Asignado",
  DESASIGNADO: "Desasignado",
} as const;

export type RegistroAsignacionTipo =
  (typeof registroAsignacionTipo)[keyof typeof registroAsignacionTipo];

export interface IRegistroAsignacion extends Document {
  fecha: string;
  usuario_id: Types.ObjectId;
  usuarioNombre: string;
  operacion: number;
  interno: number;
  cliente: string;
  modelo: string;
  version: string;
  chasis: string;
  sucursal: string;
  vendedor: string;
  observaciones?: string;
  tipo: RegistroAsignacionTipo;
  createdAt: Date;
  updatedAt: Date;
}

const registroAsignacionSchema = new Schema<IRegistroAsignacion>(
  {
    fecha: {
      type: String,
      required: true,
      trim: true,
    },
    usuario_id: {
      type: Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    usuarioNombre: {
      type: String,
      required: true,
      trim: true,
    },
    operacion: {
      type: Number,
      required: true,
    },
    interno: {
      type: Number,
      required: true,
    },
    cliente: {
      type: String,
      required: true,
      trim: true,
    },
    modelo: {
      type: String,
      required: true,
      trim: true,
    },
    version: {
      type: String,
      required: true,
      trim: true,
    },
    chasis: {
      type: String,
      required: true,
      trim: true,
    },
    sucursal: {
      type: String,
      required: true,
      trim: true,
    },
    vendedor: {
      type: String,
      required: true,
      trim: true,
    },
    observaciones: {
      type: String,
      trim: true,
      default: "",
    },
    tipo: {
      type: String,
      enum: Object.values(registroAsignacionTipo),
      required: true,
    },
  },
  { timestamps: true },
);

const RegistroAsignacion = mongoose.model<IRegistroAsignacion>(
  "registro_asignaciones",
  registroAsignacionSchema,
);

export default RegistroAsignacion;
