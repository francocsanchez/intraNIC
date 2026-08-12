import mongoose, { Document, Schema, Types } from "mongoose";
import type { SsiVentasIdentifier } from "./SsiVentasAttempt";

export const SSI_VENTAS_STATUS_VALUES = [
  "pendiente",
  "enGestion",
  "encuestada",
  "imposibleComunicarse",
] as const;

export const SSI_VENTAS_CLOSED_REASON_VALUES = [
  "encuestaRespondida",
  "imposibleComunicarse",
] as const;

export type SsiVentasStatus = (typeof SSI_VENTAS_STATUS_VALUES)[number];
export type SsiVentasClosedReason = (typeof SSI_VENTAS_CLOSED_REASON_VALUES)[number];

export interface ISsiVentasCase extends Document {
  operacion: number;
  surveyType: "convencional";
  status: SsiVentasStatus;
  attemptsCount: number;
  noAnswerCount: number;
  closedAt?: Date | null;
  closedReason?: SsiVentasClosedReason | null;
  fechaEntrega?: Date | null;
  vendedorCodigo?: number | null;
  vendedor?: string | null;
  cliente?: string | null;
  telefonoCliente?: string | null;
  modelo?: string | null;
  sucursal?: string | null;
  hotAlert?: boolean;
  centralTelefonica?: boolean;
  identificadorCliente?: SsiVentasIdentifier | null;
  administrativaId?: Types.ObjectId | null;
  administrativaNombre?: string | null;
  createdBy?: Types.ObjectId | null;
  createdByName?: string | null;
  updatedBy?: Types.ObjectId | null;
  updatedByName?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const ssiVentasCaseSchema = new Schema<ISsiVentasCase>(
  {
    operacion: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    surveyType: {
      type: String,
      enum: ["convencional"],
      default: "convencional",
      required: true,
    },
    status: {
      type: String,
      enum: SSI_VENTAS_STATUS_VALUES,
      default: "pendiente",
      required: true,
    },
    attemptsCount: {
      type: Number,
      default: 0,
      required: true,
      min: 0,
    },
    noAnswerCount: {
      type: Number,
      default: 0,
      required: true,
      min: 0,
    },
    closedAt: {
      type: Date,
      default: null,
    },
    closedReason: {
      type: String,
      enum: SSI_VENTAS_CLOSED_REASON_VALUES,
      default: null,
    },
    fechaEntrega: {
      type: Date,
      default: null,
    },
    vendedorCodigo: {
      type: Number,
      default: null,
    },
    vendedor: {
      type: String,
      default: null,
      trim: true,
    },
    cliente: {
      type: String,
      default: null,
      trim: true,
    },
    telefonoCliente: {
      type: String,
      default: null,
      trim: true,
    },
    modelo: {
      type: String,
      default: null,
      trim: true,
    },
    sucursal: {
      type: String,
      default: null,
      trim: true,
    },
    hotAlert: {
      type: Boolean,
      default: false,
    },
    centralTelefonica: {
      type: Boolean,
      default: false,
    },
    identificadorCliente: {
      type: String,
      enum: ["promotor", "neutro", "detractor"],
      default: null,
    },
    administrativaId: {
      type: Schema.Types.ObjectId,
      ref: "users",
      default: null,
    },
    administrativaNombre: {
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
  { timestamps: true, collection: "ssi_ventas_cases" },
);

ssiVentasCaseSchema.index({ operacion: 1 }, { unique: true });
ssiVentasCaseSchema.index({ status: 1, updatedAt: -1 });

const SsiVentasCase = mongoose.model<ISsiVentasCase>("ssi_ventas_cases", ssiVentasCaseSchema);
export default SsiVentasCase;
