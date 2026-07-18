import mongoose, { Document, Schema, Types } from "mongoose";

export interface IComercialAgendaAsignacion extends Document {
  fecha: Date;
  unidadNegocio: Types.ObjectId;
  puesto: Types.ObjectId;
  asistentes: Types.ObjectId[];
  createdBy?: Types.ObjectId | null;
  updatedBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const comercialAgendaAsignacionSchema = new Schema<IComercialAgendaAsignacion>(
  {
    fecha: {
      type: Date,
      required: true,
      index: true,
    },
    unidadNegocio: {
      type: Schema.Types.ObjectId,
      ref: "unidades_negocio",
      required: true,
      index: true,
    },
    puesto: {
      type: Schema.Types.ObjectId,
      ref: "comercial_agenda_puestos",
      required: true,
      index: true,
    },
    asistentes: {
      type: [
        {
          type: Schema.Types.ObjectId,
          ref: "users",
          required: true,
        },
      ],
      default: [],
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
  { timestamps: true, collection: "comercial_agenda_asignaciones" },
);

comercialAgendaAsignacionSchema.index(
  { unidadNegocio: 1, fecha: 1, puesto: 1 },
  { unique: true },
);

const ComercialAgendaAsignacion = mongoose.model<IComercialAgendaAsignacion>(
  "comercial_agenda_asignaciones",
  comercialAgendaAsignacionSchema,
);

export default ComercialAgendaAsignacion;
