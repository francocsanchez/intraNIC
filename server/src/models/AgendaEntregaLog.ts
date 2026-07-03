import mongoose, { Document, Schema, Types } from "mongoose";

export const AGENDA_ENTREGA_LOG_ACTIONS = [
  "CREADA",
  "MODIFICADA",
  "ELIMINADA",
  "PENDIENTE_CREADA",
  "PENDIENTE_MODIFICADA",
  "PENDIENTE_ELIMINADA",
  "PENDIENTE_TURNADA",
  "RESERVA_CREADA",
  "RESERVA_MODIFICADA",
  "RESERVA_ELIMINADA",
  "RESERVA_CONVERTIDA",
  "ENTREGA_MARCADA",
  "ENTREGA_DESMARCADA",
] as const;
export type AgendaEntregaLogAction = (typeof AGENDA_ENTREGA_LOG_ACTIONS)[number];

export interface IAgendaEntregaLog extends Document {
  agendaEntrega: Types.ObjectId | null;
  interno?: number | null;
  accion: AgendaEntregaLogAction;
  usuario: Types.ObjectId;
  usuarioNombre: string;
  fecha: Date;
  detalle?: string;
  createdAt: Date;
  updatedAt: Date;
}

const agendaEntregaLogSchema = new Schema<IAgendaEntregaLog>(
  {
    agendaEntrega: {
      type: Schema.Types.ObjectId,
      ref: "agendas_entrega",
      default: null,
    },
    interno: {
      type: Number,
      default: null,
    },
    accion: {
      type: String,
      enum: AGENDA_ENTREGA_LOG_ACTIONS,
      required: true,
    },
    usuario: {
      type: Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    usuarioNombre: {
      type: String,
      required: true,
      trim: true,
    },
    fecha: {
      type: Date,
      default: Date.now,
      required: true,
    },
    detalle: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true, collection: "agendas_entrega_logs" },
);

agendaEntregaLogSchema.index({ agendaEntrega: 1, fecha: -1 });
agendaEntregaLogSchema.index({ interno: 1, fecha: -1 });

const AgendaEntregaLog = mongoose.model<IAgendaEntregaLog>(
  "agendas_entrega_logs",
  agendaEntregaLogSchema,
);

export default AgendaEntregaLog;
