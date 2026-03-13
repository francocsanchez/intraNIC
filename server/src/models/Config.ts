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

  sistemaActivoLIESS: boolean;
  vendedoresDisponibleLIESS: string[];
  vendedoresStockGuardadoLIESS: string[];
  vendedoresReservasLIESS: string[];
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

    sistemaActivoLIESS: { type: Boolean, default: true },
    vendedoresDisponibleLIESS: { type: [String] },
    vendedoresStockGuardadoLIESS: { type: [String] },
    vendedoresReservasLIESS: { type: [String] },
  },
  { timestamps: true },
);

const Configuration = mongoose.model<IConfiguration>(
  "configuration",
  configSchema,
);
export default Configuration;
