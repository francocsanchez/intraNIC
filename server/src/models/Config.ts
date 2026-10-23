import mongoose, { Schema, Document } from "mongoose";

export interface IConfiguration extends Document {
  sistemaActivoConvencional: boolean;
  vendedoresReservasConvencional: string[];
  vendedoresDisponibleConvencional: string[];
  vendedoresStockGuardadoConvencional: string[];

  sistemaActivoUsados: boolean;
  vendedoresReservasUsados: string[];
  vendedoresDisponibleUsados: string[];
  vendedoresStockGuardadoUsados: string[];
  vendedoresStockNoReparadoUsados: string[];
  vendedoresStockPendDocuUsados: string[];

  sistemaActivoBelgrano: boolean;
  vendedoresDisponibleBelgrano: string[];

  sistemaActivoLIESS: boolean;
  vendedoresDisponibleLIESS: string[];
  vendedoresStockGuardadoLIESS: string[];
  vendedoresReservasLIESS: string[];

  objetivosVendedoresDashboardSalon: Array<{
    sucursalCodigo: number;
    anio: number;
    mes: number;
    objetivo: number;
  }>;
  objetivosOperacionesTotalesDashboardSalon: Array<{
    anio: number;
    mes: number;
    objetivo: number;
  }>;
  imagenesModelosDashboardSalon: Array<{
    modelo: string;
    imagePath: string;
  }>;
}

const configSchema: Schema = new Schema(
  {
    sistemaActivoConvencional: { type: Boolean, default: true },
    vendedoresReservasConvencional: { type: [String] },
    vendedoresDisponibleConvencional: { type: [String] },
    vendedoresStockGuardadoConvencional: { type: [String] },

    sistemaActivoUsados: { type: Boolean, default: true },
    vendedoresReservasUsados: { type: [String] },
    vendedoresDisponibleUsados: { type: [String] },
    vendedoresStockGuardadoUsados: { type: [String] },
    vendedoresStockNoReparadoUsados: { type: [String] },
    vendedoresStockPendDocuUsados: { type: [String] },

    sistemaActivoBelgrano: { type: Boolean, default: true },
    vendedoresDisponibleBelgrano: { type: [String] },

    sistemaActivoLIESS: { type: Boolean, default: true },
    vendedoresDisponibleLIESS: { type: [String] },
    vendedoresStockGuardadoLIESS: { type: [String] },
    vendedoresReservasLIESS: { type: [String] },

    objetivosVendedoresDashboardSalon: {
      type: [
        {
          sucursalCodigo: { type: Number, required: true, min: 1 },
          anio: { type: Number, required: true, min: 2000 },
          mes: { type: Number, required: true, min: 1, max: 12 },
          objetivo: { type: Number, required: true, min: 1 },
        },
      ],
      default: [],
    },
    objetivosOperacionesTotalesDashboardSalon: {
      type: [{
        anio: { type: Number, required: true, min: 2000 },
        mes: { type: Number, required: true, min: 1, max: 12 },
        objetivo: { type: Number, required: true, min: 1 },
      }],
      default: [],
    },
    imagenesModelosDashboardSalon: {
      type: [{
        modelo: { type: String, required: true, trim: true },
        imagePath: { type: String, required: true, trim: true },
      }],
      default: [],
    },
  },
  { timestamps: true },
);

const Configuration = mongoose.model<IConfiguration>(
  "configuration",
  configSchema,
);
export default Configuration;
