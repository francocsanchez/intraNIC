import mongoose, { Document, Schema } from "mongoose";

export interface IPatentamientoTotalizado extends Document {
  anio: number;
  mes: number;
  dia: number;
  marca: string;
  ranger: boolean;
  registroProvincia: string;
  registroLocalidad: string;
  prendado: boolean | null;
  tipoAcreedorPrendario: string;
  total: number;
  sourceUpdatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const patentamientoTotalizadoSchema = new Schema<IPatentamientoTotalizado>(
  {
    anio: { type: Number, required: true, index: true },
    mes: { type: Number, required: true, index: true },
    dia: { type: Number, required: true, index: true },
    marca: { type: String, required: true, trim: true, index: true },
    ranger: { type: Boolean, required: true, index: true, default: false },
    registroProvincia: { type: String, required: true, trim: true, index: true, default: "SIN PROVINCIA" },
    registroLocalidad: { type: String, required: true, trim: true, default: "SIN LOCALIDAD" },
    prendado: { type: Boolean, default: null, index: true },
    tipoAcreedorPrendario: { type: String, required: true, trim: true, index: true, default: "SIN ACREEDOR" },
    total: { type: Number, required: true, default: 0 },
    sourceUpdatedAt: { type: Date, required: true, default: Date.now, index: true },
  },
  { timestamps: true },
);

patentamientoTotalizadoSchema.index({ anio: 1, mes: 1, dia: 1 });
patentamientoTotalizadoSchema.index({ marca: 1, anio: 1, mes: 1 });
patentamientoTotalizadoSchema.index({ ranger: 1, anio: 1, mes: 1 });
patentamientoTotalizadoSchema.index({ registroProvincia: 1, anio: 1, mes: 1 });
patentamientoTotalizadoSchema.index({ prendado: 1, anio: 1, mes: 1 });
patentamientoTotalizadoSchema.index({ tipoAcreedorPrendario: 1, anio: 1, mes: 1 });

const PatentamientoTotalizado = mongoose.model<IPatentamientoTotalizado>(
  "patentamientos_totalizados",
  patentamientoTotalizadoSchema,
);

export default PatentamientoTotalizado;
