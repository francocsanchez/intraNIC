import { Response, Request } from "express";
import { sequelizeLIESS, sequelizeNIC } from "../config/database";
import {
  getAnalisisStockConvencional,
  getAsignacionRecepcion,
  getFacturaReventasNic,
  getStockConsolidadoNic,
  getVendedoresActivosNic,
  getVendedoresNic,
} from "./querys/dms.query";
import { QueryTypes } from "sequelize";
import { logError } from "../utils/logError";
import { getReporteAsignacionRecepcion } from "../utils/reporteAsignacionRecepcion";
import { buildResumenLiessMarca, buildResumenStockConsolidado } from "../utils/reportStockConsolidado";
import { getStockConsolidadoLiess } from "./querys/liess.query";
import { buildResumenFacturasReventas } from "../utils/reportFacturaRevetnas";

type AnalisisStockRow = {
  interno: number;
  version: string | null;
  modelo: string | null;
  fechaRecepcion: Date | string | null;
  sa_nrofab: string | null;
  col_nombre: string | null;
};

type AnalisisStockUnit = {
  interno: number;
  nrofab: string;
  color: string;
  fechaRecepcion: string;
};

const MONTH_LABELS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const ANALISIS_STOCK_MODEL_ORDER = [
  "HILUX",
  "SW4",
  "COROLLA",
  "COROLLA CROSS",
  "Y. CROSS",
  "YARIS",
  "HIACE",
  "RAV4",
] as const;

const parseTwoDigitYear = (value: unknown) => {
  const text = String(value ?? "").trim();
  return /^\d{2}$/.test(text) ? text : null;
};

const parseTwoDigitMonth = (value: unknown) => {
  const text = String(value ?? "").trim();
  if (!/^\d{2}$/.test(text)) return null;

  const month = Number(text);
  return month >= 1 && month <= 12 ? text : null;
};

const normalizeAnalisisText = (value: unknown, fallback: string) => {
  if (typeof value !== "string") return fallback;

  const normalized = value.trim();
  return normalized || fallback;
};

const normalizeAnalisisModel = (value: unknown) => {
  const normalized = normalizeAnalisisText(value, "Sin modelo").toUpperCase();

  if (normalized === "C. CROSS") {
    return "COROLLA CROSS";
  }

  if (normalized === "YARIS CROSS" || normalized === "Y. CROSS") {
    return "Y. CROSS";
  }

  return normalized;
};

const parseAnalisisDate = (value: unknown) => {
  if (!value) return null;

  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
};

const buildMonthKey = (year: number, month: number) =>
  `${year}-${String(month).padStart(2, "0")}`;

const buildMonthLabel = (year: number, month: number) =>
  `${MONTH_LABELS[month - 1]}-${String(year).slice(-2)}`;

const formatAnalisisDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const compareAnalisisStockModel = (a: string, b: string) => {
  const indexA = ANALISIS_STOCK_MODEL_ORDER.indexOf(a.toUpperCase() as (typeof ANALISIS_STOCK_MODEL_ORDER)[number]);
  const indexB = ANALISIS_STOCK_MODEL_ORDER.indexOf(b.toUpperCase() as (typeof ANALISIS_STOCK_MODEL_ORDER)[number]);

  if (indexA === -1 && indexB === -1) {
    return a.localeCompare(b, "es");
  }

  if (indexA === -1) return 1;
  if (indexB === -1) return -1;

  return indexA - indexB;
};

export class DmsController {
  static getVendedores = async (_req: Request, res: Response) => {
    try {
      const query = getVendedoresNic();

      const data = await sequelizeNIC.query<any>(query, {
        type: QueryTypes.SELECT,
      });

      return res.status(200).json({ data });
    } catch (error) {
      logError("ConvencionalController.getVendedores");
      console.error(error);
      return res.status(500).json({ message: "Error del servidor SIAC" });
    }
  };

  static getVendedoresActivos = async (_req: Request, res: Response) => {
    try {
      const query = getVendedoresActivosNic();

      const data = await sequelizeNIC.query<any>(query, {
        type: QueryTypes.SELECT,
      });

      return res.status(200).json({ data });
    } catch (error) {
      logError("ConvencionalController.getVendedores");
      console.error(error);
      return res.status(500).json({ message: "Error del servidor SIAC" });
    }
  };

  static getAsignacion = async (req: Request, res: Response) => {
    const { mes, anio } = req.params;
    const mesParam = parseTwoDigitMonth(mes);
    const anioParam = parseTwoDigitYear(anio);

    if (!mesParam || !anioParam) {
      return res.status(400).json({ message: "Periodo no valido" });
    }

    try {
      const query = getAsignacionRecepcion();

      const data = await sequelizeNIC.query<any>(query, {
        type: QueryTypes.SELECT,
        replacements: { mes: mesParam, anio: anioParam },
      });

      const resumen = getReporteAsignacionRecepcion(data);
      
      return res.status(200).json({ data, resumen });
    } catch (error) {
      logError("ConvencionalController.getVendedores");
      console.error(error);
      return res.status(500).json({ message: "Error del servidor SIAC" });
    }
  };

  static getStockConsolidado = async (req: Request, res: Response) => {
    try {
      const queryNIC = getStockConsolidadoNic();
      const queryLiess = getStockConsolidadoLiess();

      const dataNIC = await sequelizeNIC.query<any>(queryNIC, {
        type: QueryTypes.SELECT,
      });

      const dataLiess = await sequelizeLIESS.query<any>(queryLiess, {
        type: QueryTypes.SELECT,
      });

      const resumenNIC = buildResumenStockConsolidado(dataNIC);
      const resumenLiess = buildResumenLiessMarca(dataLiess);

      const resumenGeneral = {
        totales: {
          nic: resumenNIC.total ?? 0,
          liess: resumenLiess.total ?? 0,
          general: (resumenNIC.total ?? 0) + (resumenLiess.total ?? 0),
        },
        nic: resumenNIC,
        liess: resumenLiess,
      };

      return res.status(200).json({ resumen: resumenGeneral });
    } catch (error) {
      logError("ConvencionalController.getStockConsolidado");
      console.error(error);
      return res.status(500).json({ message: "Error del servidor SIAC" });
    }
  };

  static getFactuasReventas = async (req: Request, res: Response) => {
    try {
      const queryNIC = getFacturaReventasNic();

      const dataNIC = await sequelizeNIC.query<any>(queryNIC, {
        type: QueryTypes.SELECT,
      });
 
      const resumenNIC = buildResumenFacturasReventas(dataNIC);

      return res.status(200).json({
        data: dataNIC, 
        resumen: resumenNIC });
    } catch (error) {
      logError("ConvencionalController.getStockConsolidado");
      console.error(error);
      return res.status(500).json({ message: "Error del servidor SIAC" });
    }
  };

  static getAnalisisStock = async (_req: Request, res: Response) => {
    try {
      const rows = await sequelizeNIC.query<AnalisisStockRow>(getAnalisisStockConvencional(), {
        type: QueryTypes.SELECT,
      });

      const monthsMap = new Map<string, { key: string; label: string; month: number; year: number }>();
      const groupsMap = new Map<
        string,
        Map<
          string,
          {
            version: string;
            countsByMonth: Record<string, number>;
            unitsByMonth: Record<string, AnalisisStockUnit[]>;
            unitsTotal: AnalisisStockUnit[];
            total: number;
          }
        >
      >();
      let totalUnidades = 0;

      for (const row of rows) {
        const fechaRecepcion = parseAnalisisDate(row.fechaRecepcion);

        if (!fechaRecepcion) {
          console.warn("DmsController.getAnalisisStock: fechaRecepcion invalida", row);
          continue;
        }

        const modelo = normalizeAnalisisModel(row.modelo);
        const version = normalizeAnalisisText(row.version, "Sin version");
        const month = fechaRecepcion.getMonth() + 1;
        const year = fechaRecepcion.getFullYear();
        const monthKey = buildMonthKey(year, month);
        const unit: AnalisisStockUnit = {
          interno: Number(row.interno),
          nrofab: normalizeAnalisisText(row.sa_nrofab, "-"),
          color: normalizeAnalisisText(row.col_nombre, "-"),
          fechaRecepcion: formatAnalisisDate(fechaRecepcion),
        };

        if (!monthsMap.has(monthKey)) {
          monthsMap.set(monthKey, {
            key: monthKey,
            label: buildMonthLabel(year, month),
            month,
            year,
          });
        }

        const rowsByVersion = groupsMap.get(modelo) ?? new Map();
        const currentVersion = rowsByVersion.get(version) ?? {
          version,
          countsByMonth: {},
          unitsByMonth: {},
          unitsTotal: [],
          total: 0,
        };

        currentVersion.countsByMonth[monthKey] = (currentVersion.countsByMonth[monthKey] ?? 0) + 1;
        currentVersion.unitsByMonth[monthKey] = [...(currentVersion.unitsByMonth[monthKey] ?? []), unit];
        currentVersion.unitsTotal = [...currentVersion.unitsTotal, unit];
        currentVersion.total += 1;
        rowsByVersion.set(version, currentVersion);
        groupsMap.set(modelo, rowsByVersion);
        totalUnidades += 1;
      }

      const months = Array.from(monthsMap.values()).sort((a, b) =>
        a.year === b.year ? a.month - b.month : a.year - b.year,
      );

      const groups = Array.from(groupsMap.entries())
        .sort(([modeloA], [modeloB]) => compareAnalisisStockModel(modeloA, modeloB))
        .map(([modelo, rowsByVersion]) => ({
          modelo,
          rows: Array.from(rowsByVersion.values())
            .sort((a, b) => a.version.localeCompare(b.version, "es"))
            .map((item) => ({
              version: item.version,
              countsByMonth: months.reduce<Record<string, number>>((acc, monthItem) => {
                acc[monthItem.key] = item.countsByMonth[monthItem.key] ?? 0;
                return acc;
              }, {}),
              unitsByMonth: months.reduce<Record<string, AnalisisStockUnit[]>>((acc, monthItem) => {
                acc[monthItem.key] = item.unitsByMonth[monthItem.key] ?? [];
                return acc;
              }, {}),
              unitsTotal: item.unitsTotal,
              total: item.total,
            })),
          total: Array.from(rowsByVersion.values()).reduce((acc, item) => acc + item.total, 0),
        }));

      const totals = {
        modelo: "TOTALES",
        countsByMonth: months.reduce<Record<string, number>>((acc, monthItem) => {
          acc[monthItem.key] = groups.reduce(
            (monthTotal, group) =>
              monthTotal +
              group.rows.reduce((rowTotal, row) => rowTotal + (row.countsByMonth[monthItem.key] ?? 0), 0),
            0,
          );
          return acc;
        }, {}),
        total: groups.reduce(
          (groupTotal, group) => groupTotal + group.rows.reduce((rowTotal, row) => rowTotal + row.total, 0),
          0,
        ),
      };

      return res.status(200).json({
        data: {
          months,
          groups,
          totals,
          meta: {
            totalUnidades,
          },
        },
      });
    } catch (error) {
      logError("DmsController.getAnalisisStock");
      console.error(error);
      return res.status(500).json({ message: "Error del servidor SIAC" });
    }
  };

}
