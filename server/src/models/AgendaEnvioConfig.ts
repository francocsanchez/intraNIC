import mongoose, { Document, Schema, Types } from "mongoose";

export interface IAgendaEnvioConfig extends Document {
  sucursal: Types.ObjectId;
  emails: string[];
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const agendaEnvioConfigSchema = new Schema<IAgendaEnvioConfig>(
  {
    sucursal: {
      type: Schema.Types.ObjectId,
      ref: "sucursales_entrega",
      required: true,
      unique: true,
    },
    emails: {
      type: [String],
      default: [],
    },
    activo: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true, collection: "agenda_envio_config" },
);

agendaEnvioConfigSchema.index({ sucursal: 1 }, { unique: true });

const AgendaEnvioConfig = mongoose.model<IAgendaEnvioConfig>(
  "agenda_envio_config",
  agendaEnvioConfigSchema,
);

export default AgendaEnvioConfig;
