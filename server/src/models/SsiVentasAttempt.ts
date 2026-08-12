import mongoose, { Document, Schema, Types } from "mongoose";

export const SSI_VENTAS_ATTEMPT_RESULT_VALUES = ["respondio", "noAtendio"] as const;
export const SSI_VENTAS_BINARY_RESPONSE_VALUES = ["si", "no", "noSabe"] as const;
export const SSI_VENTAS_IDENTIFIER_VALUES = ["promotor", "neutro", "detractor"] as const;

export type SsiVentasAttemptResult = (typeof SSI_VENTAS_ATTEMPT_RESULT_VALUES)[number];
export type SsiVentasBinaryResponse = (typeof SSI_VENTAS_BINARY_RESPONSE_VALUES)[number];
export type SsiVentasIdentifier = (typeof SSI_VENTAS_IDENTIFIER_VALUES)[number];

export interface ISsiVentasAttempt extends Document {
  caseId: Types.ObjectId;
  operacion: number;
  attemptNumber: number;
  result: SsiVentasAttemptResult;
  surveyData?: {
    numeric: {
      instalacionesConcesionario: number;
      atencionVendedor: number;
      atencionAdministrativa: number;
      informacionFechaEntrega: number;
      atencionAsesorEntregas: number;
      recomendariaConcesionario: number;
    };
    binary: {
      usadoPartePago: SsiVentasBinaryResponse;
      financiacionCompra: SsiVentasBinaryResponse;
      seguroVehiculo: SsiVentasBinaryResponse;
      accesoriosVehiculo: SsiVentasBinaryResponse;
      aplicacionToyota: SsiVentasBinaryResponse;
      toyotaServiciosConectados: SsiVentasBinaryResponse;
    };
    hotAlert?: boolean;
    observaciones?: string;
  } | null;
  observaciones?: string | null;
  createdBy?: Types.ObjectId | null;
  createdByName?: string | null;
  centralTelefonica?: boolean;
  identificadorCliente?: SsiVentasIdentifier | null;
  importMetadata?: {
    fechaEnvio?: string | null;
    fechaRespuesta?: string | null;
    categoriaOriginal?: string | null;
    nps?: number | null;
    contactoNombre?: string | null;
  } | null;
  createdAt: Date;
  updatedAt: Date;
}

const numericSchema = new Schema(
  {
    instalacionesConcesionario: { type: Number, min: 1, max: 10, required: true },
    atencionVendedor: { type: Number, min: 1, max: 10, required: true },
    atencionAdministrativa: { type: Number, min: 1, max: 10, required: true },
    informacionFechaEntrega: { type: Number, min: 1, max: 10, required: true },
    atencionAsesorEntregas: { type: Number, min: 1, max: 10, required: true },
    recomendariaConcesionario: { type: Number, min: 1, max: 10, required: true },
  },
  { _id: false },
);

const binarySchema = new Schema(
  {
    usadoPartePago: { type: String, enum: SSI_VENTAS_BINARY_RESPONSE_VALUES, required: true },
    financiacionCompra: { type: String, enum: SSI_VENTAS_BINARY_RESPONSE_VALUES, required: true },
    seguroVehiculo: { type: String, enum: SSI_VENTAS_BINARY_RESPONSE_VALUES, required: true },
    accesoriosVehiculo: { type: String, enum: SSI_VENTAS_BINARY_RESPONSE_VALUES, required: true },
    aplicacionToyota: { type: String, enum: SSI_VENTAS_BINARY_RESPONSE_VALUES, required: true },
    toyotaServiciosConectados: { type: String, enum: SSI_VENTAS_BINARY_RESPONSE_VALUES, required: true },
  },
  { _id: false },
);

const surveyDataSchema = new Schema(
  {
    numeric: { type: numericSchema, required: true },
    binary: { type: binarySchema, required: true },
    hotAlert: { type: Boolean, default: false },
    observaciones: { type: String, default: "", trim: true },
  },
  { _id: false },
);

const importMetadataSchema = new Schema(
  {
    fechaEnvio: { type: String, default: null, trim: true },
    fechaRespuesta: { type: String, default: null, trim: true },
    categoriaOriginal: { type: String, default: null, trim: true },
    nps: { type: Number, default: null },
    contactoNombre: { type: String, default: null, trim: true },
  },
  { _id: false },
);

const ssiVentasAttemptSchema = new Schema<ISsiVentasAttempt>(
  {
    caseId: {
      type: Schema.Types.ObjectId,
      ref: "ssi_ventas_cases",
      required: true,
      index: true,
    },
    operacion: {
      type: Number,
      required: true,
      index: true,
    },
    attemptNumber: {
      type: Number,
      required: true,
      min: 1,
    },
    result: {
      type: String,
      enum: SSI_VENTAS_ATTEMPT_RESULT_VALUES,
      required: true,
    },
    surveyData: {
      type: surveyDataSchema,
      default: null,
    },
    observaciones: {
      type: String,
      default: null,
      trim: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "users",
      default: null,
    },
    createdByName: {
      type: String,
      default: null,
      trim: true,
    },
    centralTelefonica: {
      type: Boolean,
      default: false,
    },
    identificadorCliente: {
      type: String,
      enum: SSI_VENTAS_IDENTIFIER_VALUES,
      default: null,
    },
    importMetadata: {
      type: importMetadataSchema,
      default: null,
    },
  },
  { timestamps: true, collection: "ssi_ventas_attempts" },
);

ssiVentasAttemptSchema.index({ operacion: 1, attemptNumber: 1 }, { unique: true });
ssiVentasAttemptSchema.index({ caseId: 1, createdAt: -1 });

const SsiVentasAttempt = mongoose.model<ISsiVentasAttempt>("ssi_ventas_attempts", ssiVentasAttemptSchema);
export default SsiVentasAttempt;
