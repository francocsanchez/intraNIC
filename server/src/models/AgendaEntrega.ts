import mongoose, { Document, Schema, Types } from "mongoose";

export const AGENDA_ENTREGA_TIPOS = ["turno", "reserva"] as const;
export type AgendaEntregaTipoRegistro = (typeof AGENDA_ENTREGA_TIPOS)[number];

export interface IAgendaEntrega extends Document {
  tipoRegistro: AgendaEntregaTipoRegistro;
  interno?: number | null;
  tipoOperacion?: string;
  sucursal: Types.ObjectId;
  fechaAgenda: string;
  horaAgenda: string;
  equipado: boolean;
  entregaUsado: boolean;
  siniestro: boolean;
  entregadaPorMarcada: boolean;
  entregadaPorUser?: Types.ObjectId | null;
  entregadaPorNombre?: string;
  entregadaPorFecha?: Date | null;
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
    tipoRegistro: {
      type: String,
      enum: AGENDA_ENTREGA_TIPOS,
      default: "turno",
      required: true,
      trim: true,
    },
    interno: {
      type: Number,
      default: null,
    },
    tipoOperacion: {
      type: String,
      default: "",
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
    entregaUsado: {
      type: Boolean,
      default: false,
    },
    siniestro: {
      type: Boolean,
      default: false,
    },
    entregadaPorMarcada: {
      type: Boolean,
      default: false,
    },
    entregadaPorUser: {
      type: Schema.Types.ObjectId,
      ref: "users",
      default: null,
    },
    entregadaPorNombre: {
      type: String,
      default: "",
      trim: true,
    },
    entregadaPorFecha: {
      type: Date,
      default: null,
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

agendaEntregaSchema.index(
  { interno: 1 },
  {
    unique: true,
    partialFilterExpression: { tipoRegistro: "turno" },
  },
);
agendaEntregaSchema.index({ fechaAgenda: 1, sucursal: 1 });

const AgendaEntrega = mongoose.model<IAgendaEntrega>(
  "agendas_entrega",
  agendaEntregaSchema,
);

const LEGACY_SLOT_UNIQUE_INDEX = "sucursal_1_fechaAgenda_1_horaAgenda_1";

export const syncAgendaEntregaIndexes = async () => {
  try {
    await AgendaEntrega.collection.dropIndex(LEGACY_SLOT_UNIQUE_INDEX);
  } catch (error: any) {
    const codeName = typeof error?.codeName === "string" ? error.codeName : "";
    const message = typeof error?.message === "string" ? error.message : "";
    const indexMissing =
      codeName === "IndexNotFound" ||
      message.includes("index not found") ||
      message.includes("ns not found");

    if (!indexMissing) {
      throw error;
    }
  }

  await AgendaEntrega.syncIndexes();
};

export default AgendaEntrega;
