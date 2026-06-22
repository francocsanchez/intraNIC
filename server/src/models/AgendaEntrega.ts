import mongoose, { Document, Schema, Types } from "mongoose";

export interface IAgendaEntrega extends Document {
  interno: number;
  tipoOperacion: string;
  sucursal: Types.ObjectId;
  fechaAgenda: string;
  horaAgenda: string;
  equipado: boolean;
  observaciones?: string;
  createdBy: Types.ObjectId;
  createdByName: string;
  updatedBy?: Types.ObjectId | null;
  updatedByName?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const agendaEntregaSchema = new Schema<IAgendaEntrega>(
  {
    interno: {
      type: Number,
      required: true,
    },
    tipoOperacion: {
      type: String,
      required: true,
      trim: true,
    },
    sucursal: {
      type: Schema.Types.ObjectId,
      ref: "sucursales_entrega",
      required: true,
    },
    fechaAgenda: {
      type: String,
      required: true,
      trim: true,
    },
    horaAgenda: {
      type: String,
      required: true,
      trim: true,
    },
    equipado: {
      type: Boolean,
      default: false,
    },
    observaciones: {
      type: String,
      default: "",
      trim: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    createdByName: {
      type: String,
      required: true,
      trim: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "users",
      default: null,
    },
    updatedByName: {
      type: String,
      default: null,
      trim: true,
    },
  },
  { timestamps: true, collection: "agendas_entrega" },
);

agendaEntregaSchema.index({ interno: 1 }, { unique: true });
agendaEntregaSchema.index({ fechaAgenda: 1, sucursal: 1 });

const AgendaEntrega = mongoose.model<IAgendaEntrega>(
  "agendas_entrega",
  agendaEntregaSchema,
);

export default AgendaEntrega;
