import { QueryTypes } from "sequelize";
import { sequelizeNIC } from "../config/database";
import { kintoFlotaLookupQuery } from "../controllers/querys/kintoFlota.query";

type KintoLookupRow = {
  modelo: string | null;
  anio: number | null;
  vin: string | null;
};

export type KintoVehicleLookup = {
  modelo: string;
  anio: number | null;
  vin: string;
};

const normalizeText = (value: unknown) => (typeof value === "string" ? value.trim() : "");

export class KintoFlotaService {
  static async lookupVehicle(patente: string): Promise<KintoVehicleLookup[]> {
    const rows = await sequelizeNIC.query<KintoLookupRow>(kintoFlotaLookupQuery(), {
      // anexnvo is the current-operation source and avoids the expensive
      // viewunidades definition while preserving its model, year and VIN data.
      replacements: { patente },
      type: QueryTypes.SELECT,
    });

    const uniqueRows = new Map<string, KintoVehicleLookup>();
    for (const row of rows) {
      const vehicle = {
        modelo: normalizeText(row.modelo),
        anio: Number.isInteger(row.anio) ? row.anio : null,
        vin: normalizeText(row.vin).toUpperCase(),
      };
      uniqueRows.set(`${vehicle.modelo}|${vehicle.anio ?? ""}|${vehicle.vin}`, vehicle);
    }

    return [...uniqueRows.values()].slice(0, 2);
  }
}
