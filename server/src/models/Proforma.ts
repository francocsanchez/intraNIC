import mongoose, { Document, Schema, Types } from "mongoose";

export interface IProformaUnidad extends Types.Subdocument {
  versionId: Types.ObjectId;
  versionNombre: string;
  cantidad: number;
  ivaUnidad: number;
  totalUnidad: number;
  descuentoUnidad: number;
  totalPatentamiento: number;
  totalFlete: number;
}

export interface IProforma extends Document {
  numeroProforma: number;
  fecha: Date;
  senores: string;
  cliente: string;
  cuit: string;
  observaciones: string;
  asesorComercial: string;
  emailAsesor: string;
  usuarioId: Types.ObjectId;
  unidades: Types.DocumentArray<IProformaUnidad>;
}

const proformaUnidadSchema = new Schema<IProformaUnidad>(
  {
    versionId: {
      type: Schema.Types.ObjectId,
      ref: "versiones",
      required: true,
    },
    versionNombre: {
      type: String,
      required: true,
      trim: true,
    },
    cantidad: {
      type: Number,
      required: true,
      min: 1,
    },
    ivaUnidad: {
      type: Number,
      required: true,
      min: 0,
    },
    totalUnidad: {
      type: Number,
      required: true,
      min: 0,
    },
    descuentoUnidad: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    totalPatentamiento: {
      type: Number,
      required: true,
      min: 0,
    },
    totalFlete: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: true },
);

const proformaSchema = new Schema<IProforma>(
  {
    numeroProforma: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    fecha: {
      type: Date,
      default: Date.now,
      required: true,
    },
    senores: {
      type: String,
      required: true,
      trim: true,
    },
    cliente: {
      type: String,
      default: "",
      trim: true,
    },
    cuit: {
      type: String,
      default: "",
      trim: true,
    },
    observaciones: {
      type: String,
      default: "",
      trim: true,
    },
    asesorComercial: {
      type: String,
      required: true,
      trim: true,
    },
    emailAsesor: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    usuarioId: {
      type: Schema.Types.ObjectId,
      ref: "users",
      required: true,
      index: true,
    },
    unidades: {
      type: [proformaUnidadSchema],
      default: [],
      validate: {
        validator: (value: unknown[]) => Array.isArray(value) && value.length > 0,
        message: "La proforma debe tener al menos una unidad",
      },
    },
  },
  { timestamps: true },
);

const Proforma = mongoose.model<IProforma>("proformas", proformaSchema);

export default Proforma;
