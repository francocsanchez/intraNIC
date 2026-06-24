import mongoose, { Document, Schema } from "mongoose";

export interface ISegUnidadFabrica extends Document {
  orderNumber: string;
  modelo: string | null;
  version: string | null;
  ubicacion: string | null;
  fechaLimiteDePago: string | null;
  habilitacionFinanzas: string | null;
  usuarioImportacion: string;
  fechaImportacion: Date;
  createdAt: Date;
  updatedAt: Date;
}

const segUnidadFabricaSchema = new Schema<ISegUnidadFabrica>(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    modelo: {
      type: String,
      default: null,
      trim: true,
    },
    version: {
      type: String,
      default: null,
      trim: true,
    },
    ubicacion: {
      type: String,
      default: null,
      trim: true,
    },
    fechaLimiteDePago: {
      type: String,
      default: null,
      trim: true,
    },
    habilitacionFinanzas: {
      type: String,
      default: null,
      trim: true,
    },
    usuarioImportacion: {
      type: String,
      required: true,
      trim: true,
    },
    fechaImportacion: {
      type: Date,
      required: true,
      default: () => new Date(),
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

const SegUnidadFabrica = mongoose.model<ISegUnidadFabrica>(
  "seg_unidades_fabrica",
  segUnidadFabricaSchema,
);

export default SegUnidadFabrica;
