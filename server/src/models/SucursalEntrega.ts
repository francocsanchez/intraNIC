import mongoose, { Document, Schema } from "mongoose";

export interface ISucursalEntrega extends Document {
  nombre: string;
  direccion?: string;
  activa: boolean;
  observaciones?: string;
  createdAt: Date;
  updatedAt: Date;
}

const sucursalEntregaSchema = new Schema<ISucursalEntrega>(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
    },
    direccion: {
      type: String,
      default: "",
      trim: true,
    },
    activa: {
      type: Boolean,
      default: true,
    },
    observaciones: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true, collection: "sucursales_entrega" },
);

sucursalEntregaSchema.index({ nombre: 1 }, { unique: true });

const SucursalEntrega = mongoose.model<ISucursalEntrega>(
  "sucursales_entrega",
  sucursalEntregaSchema,
);

export default SucursalEntrega;
