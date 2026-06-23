import mongoose, { Document, Schema } from "mongoose";

export interface ICallCenterOpportunity extends Document {
  opportunityId: string;
  fechaCreacion: Date | null;
  nombreOportunidad: string;
  tipoRegistroOportunidad: string;
  origenOportunidad: string;
  nombreCuenta: string;
  etapa: string;
  fechaCierre: Date | null;
  fechaUltimaModificacionEtapa: Date | null;
  fechaUltimaActividad: Date | null;
  fechaFirmaContrato: Date | null;
  fechaVenta: Date | null;
  aliasCreado: string;
  aliasPropietarioOportunidad: string;
  propietarioOportunidad: string;
  creadoPor: string;
}

const callCenterOpportunitySchema = new Schema<ICallCenterOpportunity>(
  {
    opportunityId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    fechaCreacion: {
      type: Date,
      default: null,
    },
    nombreOportunidad: {
      type: String,
      default: "",
      trim: true,
    },
    tipoRegistroOportunidad: {
      type: String,
      default: "",
      trim: true,
    },
    origenOportunidad: {
      type: String,
      default: "",
      trim: true,
    },
    nombreCuenta: {
      type: String,
      default: "",
      trim: true,
    },
    etapa: {
      type: String,
      default: "",
      trim: true,
    },
    fechaCierre: {
      type: Date,
      default: null,
    },
    fechaUltimaModificacionEtapa: {
      type: Date,
      default: null,
    },
    fechaUltimaActividad: {
      type: Date,
      default: null,
    },
    fechaFirmaContrato: {
      type: Date,
      default: null,
    },
    fechaVenta: {
      type: Date,
      default: null,
    },
    aliasCreado: {
      type: String,
      default: "",
      trim: true,
    },
    aliasPropietarioOportunidad: {
      type: String,
      default: "",
      trim: true,
    },
    propietarioOportunidad: {
      type: String,
      default: "",
      trim: true,
    },
    creadoPor: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true },
);

const CallCenterOpportunity = mongoose.model<ICallCenterOpportunity>(
  "call_center_oportunidades",
  callCenterOpportunitySchema,
);

export default CallCenterOpportunity;
