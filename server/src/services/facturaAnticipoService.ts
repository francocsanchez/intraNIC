import { QueryTypes } from "sequelize";
import { sequelizeNIC } from "../config/database";
import { datoOpera, facturasAnticipoEstadoQuery } from "../controllers/querys/convencional.query";

type DatoOperaRow = {
  opera: number;
  clienteNombre: string;
  version: string;
  vendedor: string;
  chasis: string | null;
  fechaFactura: string | null;
};

type FacturaAnticipoEstadoRow = {
  numeroOp: number;
};

export type OperacionFacturaAnticipoInfo = {
  numeroOp: number;
  cliente: string;
  version: string;
  vendedor: string;
  chasis: string;
  estaFacturada: boolean;
};

const normalizeText = (value: unknown) => {
  if (typeof value !== "string") return "-";

  const normalized = value.trim();
  return normalized.length ? normalized : "-";
};

const normalizeChasis = (value: unknown) => {
  if (typeof value !== "string") return "-";

  const normalized = value.trim();
  return normalized.length ? normalized : "-";
};

export const getOperacionFacturaAnticipoInfo = async (
  numeroOp: number,
): Promise<OperacionFacturaAnticipoInfo | null> => {
  const rows = await sequelizeNIC.query<DatoOperaRow>(datoOpera(), {
    type: QueryTypes.SELECT,
    replacements: { opera: numeroOp },
  });

  const operacion = rows[0];
  if (!operacion) {
    return null;
  }

  return {
    numeroOp: operacion.opera,
    cliente: normalizeText(operacion.clienteNombre),
    version: normalizeText(operacion.version),
    vendedor: normalizeText(operacion.vendedor),
    chasis: normalizeChasis(operacion.chasis),
    estaFacturada: Boolean(operacion.fechaFactura),
  };
};

export const getFacturadasByNumeroOp = async (numeroOps: number[]) => {
  const numeroOpsUnicos = Array.from(
    new Set(numeroOps.filter((numeroOp) => Number.isInteger(numeroOp) && numeroOp > 0)),
  );

  if (!numeroOpsUnicos.length) {
    return new Set<number>();
  }

  const query = facturasAnticipoEstadoQuery(numeroOpsUnicos.join(", "));
  const rows = await sequelizeNIC.query<FacturaAnticipoEstadoRow>(query, {
    type: QueryTypes.SELECT,
  });

  return new Set(rows.map((row) => Number(row.numeroOp)).filter((numeroOp) => Number.isInteger(numeroOp)));
};
