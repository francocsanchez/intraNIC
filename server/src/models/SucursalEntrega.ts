import mongoose, { Document, Schema } from "mongoose";

export interface ISucursalEntrega extends Document {
  nombre: string;
  direccion?: string;
  activa: boolean;
  horariosHabilitados: string[];
  observaciones?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DEFAULT_TIME_SLOTS = Array.from({ length: 21 }, (_, index) => {
  const totalMinutes = 8 * 60 + index * 30;
  const hours = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
  const minutes = String(totalMinutes % 60).padStart(2, "0");
  return `${hours}:${minutes}`;
});

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
    horariosHabilitados: {
      type: [String],
      default: () => [...DEFAULT_TIME_SLOTS],
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
