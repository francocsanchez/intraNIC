import mongoose, { Document, Schema, Types } from "mongoose";

export interface IPendienteTurnar extends Document {
  interno: number;
  tipoOperacion?: string;
  sucursal: Types.ObjectId;
  equipado: boolean;
  entregaUsado: boolean;
  siniestro: boolean;
  observaciones?: string;
  createdBy: Types.ObjectId;
  createdByName: string;
  updatedBy?: Types.ObjectId | null;
  updatedByName?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const pendienteTurnarSchema = new Schema<IPendienteTurnar>(
  {
    interno: {
      type: Number,
      required: true,
      unique: true,
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
  { timestamps: true, collection: "pendientes_turnar" },
);

pendienteTurnarSchema.index({ sucursal: 1, createdAt: 1 });

const PendienteTurnar = mongoose.model<IPendienteTurnar>(
  "pendientes_turnar",
  pendienteTurnarSchema,
);

export const syncPendienteTurnarIndexes = async () => {
  await PendienteTurnar.syncIndexes();
};

export default PendienteTurnar;
