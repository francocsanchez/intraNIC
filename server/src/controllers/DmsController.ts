import { Response, Request } from "express";
import { sequelizeLIESS, sequelizeNIC } from "../config/database";
import {
  getAnalisisStockConvencional,
  getAnalisisStockPromedioVenta,
  getAnalisisStockVersionesDisponibles,
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
import AnalisisStockPedido from "../models/AnalisisStockPedido";
import AnalisisStockVersionDictionary from "../models/AnalisisStockVersionDictionary";

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

type AnalisisStockVentaRow = {
  version: string | null;
  modelo: string | null;
  ventas: number | string | null;
};

type AnalisisStockVersionDisponibleRow = {
  modelo: string | null;
  marca: string | null;
  version: string | null;
};

type AnalisisStockDictionaryPayload = {
  modelo?: unknown;
  versionRaw?: unknown;
  versionCanonica?: unknown;
  activa?: unknown;
};

type AnalisisStockCanonicalVersion = {
  versionCanonica: string;
  versionCanonicaKey: string;
  activa: boolean;
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

const normalizeAnalisisVersionKey = (value: unknown) =>
  normalizeAnalisisText(value, "Sin version").toUpperCase();

const buildAnalisisCompositeKey = (modelo: string, versionKey: string) => `${modelo}::${versionKey}`;

const getAnalisisCanonicalVersion = (
  modelo: string,
  version: string,
  dictionaryByKey: Map<string, AnalisisStockCanonicalVersion>,
) => {
  const versionRawKey = normalizeAnalisisVersionKey(version);
  const dictionaryItem = dictionaryByKey.get(buildAnalisisCompositeKey(modelo, versionRawKey));

  if (dictionaryItem) {
    return dictionaryItem;
  }

  return {
    versionCanonica: version,
    versionCanonicaKey: versionRawKey,
    activa: true,
  };
};

const buildAnalisisStockDictionaryPayload = (payload: AnalisisStockDictionaryPayload) => {
  const modelo = normalizeAnalisisModel(payload.modelo);
  const versionRaw = normalizeAnalisisText(payload.versionRaw, "");
  const versionCanonica = normalizeAnalisisText(payload.versionCanonica, "");

  return {
    modelo,
    modeloKey: modelo,
    versionRaw,
    versionRawKey: normalizeAnalisisVersionKey(payload.versionRaw),
    versionCanonica,
    versionCanonicaKey: normalizeAnalisisVersionKey(payload.versionCanonica),
    activa: payload.activa === undefined ? true : Boolean(payload.activa),
  };
};

const getAnalisisClosedQuarterRange = (referenceDate = new Date()) => {
  const fechaHasta = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
  const fechaDesde = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - 3, 1);

  return {
    anioDesde: fechaDesde.getFullYear(),
    mesDesde: fechaDesde.getMonth() + 1,
    anioHasta: fechaHasta.getFullYear(),
    mesHasta: fechaHasta.getMonth() + 1,
  };
};

const serializeAnalisisStockDictionaryItem = (item: any) => ({
  _id: String(item._id),
  modelo: item.modelo,
  modeloKey: item.modeloKey,
  versionRaw: item.versionRaw,
  versionRawKey: item.versionRawKey,
  versionCanonica: item.versionCanonica,
  versionCanonicaKey: item.versionCanonicaKey,
  activa: item.activa !== false,
  createdAt: item.createdAt instanceof Date ? item.createdAt.toISOString() : String(item.createdAt),
  updatedAt: item.updatedAt instanceof Date ? item.updatedAt.toISOString() : String(item.updatedAt),
});

export class DmsController {
  static listAnalisisStockVersionDictionary = async (_req: Request, res: Response) => {
    try {
      const rows = await AnalisisStockVersionDictionary.find()
        .sort({ modelo: 1, versionRaw: 1 })
        .lean();
      const data = rows.map(serializeAnalisisStockDictionaryItem);

      return res.status(200).json({ data });
    } catch (error) {
      logError("DmsController.listAnalisisStockVersionDictionary");
      console.error(error);
      return res.status(500).json({ message: "Error al listar el diccionario de versiones" });
    }
  };

  static createAnalisisStockVersionDictionary = async (req: Request, res: Response) => {
    const payload = buildAnalisisStockDictionaryPayload(req.body ?? {});

    if (!payload.modelo || payload.modelo === "SIN MODELO") {
      return res.status(400).json({ error: "El modelo es obligatorio" });
    }

    if (!payload.versionRaw) {
      return res.status(400).json({ error: "La version cruda es obligatoria" });
    }

    if (!payload.versionCanonica) {
      return res.status(400).json({ error: "La version unificada es obligatoria" });
    }

    try {
      const existing = await AnalisisStockVersionDictionary.findOne({
        modeloKey: payload.modeloKey,
        versionRawKey: payload.versionRawKey,
      }).lean();

      if (existing) {
        return res.status(400).json({ error: "Ya existe un diccionario para esa version cruda" });
      }

      const created = await AnalisisStockVersionDictionary.create(payload);
      const data = serializeAnalisisStockDictionaryItem(created.toObject());
      return res.status(201).json({ message: "Version unificada creada correctamente", data });
    } catch (error) {
      logError("DmsController.createAnalisisStockVersionDictionary");
      console.error(error);
      return res.status(500).json({ message: "Error al crear la version unificada" });
    }
  };

  static updateAnalisisStockVersionDictionary = async (req: Request, res: Response) => {
    const payload = buildAnalisisStockDictionaryPayload(req.body ?? {});

    if (!payload.modelo || payload.modelo === "SIN MODELO") {
      return res.status(400).json({ error: "El modelo es obligatorio" });
    }

    if (!payload.versionRaw) {
      return res.status(400).json({ error: "La version cruda es obligatoria" });
    }

    if (!payload.versionCanonica) {
      return res.status(400).json({ error: "La version unificada es obligatoria" });
    }

    try {
      const item = await AnalisisStockVersionDictionary.findById(req.params.id);

      if (!item) {
        return res.status(404).json({ error: "Version unificada no encontrada" });
      }

      const existing = await AnalisisStockVersionDictionary.findOne({
        _id: { $ne: item._id },
        modeloKey: payload.modeloKey,
        versionRawKey: payload.versionRawKey,
      }).lean();

      if (existing) {
        return res.status(400).json({ error: "Ya existe un diccionario para esa version cruda" });
      }

      item.modelo = payload.modelo;
      item.modeloKey = payload.modeloKey;
      item.versionRaw = payload.versionRaw;
      item.versionRawKey = payload.versionRawKey;
      item.versionCanonica = payload.versionCanonica;
      item.versionCanonicaKey = payload.versionCanonicaKey;
      item.activa = payload.activa;
      await item.save();

      return res.status(200).json({
        message: "Version unificada actualizada correctamente",
        data: serializeAnalisisStockDictionaryItem(item.toObject()),
      });
    } catch (error) {
      logError("DmsController.updateAnalisisStockVersionDictionary");
      console.error(error);
      return res.status(500).json({ message: "Error al actualizar la version unificada" });
    }
  };

  static deleteAnalisisStockVersionDictionary = async (req: Request, res: Response) => {
    try {
      const data = await AnalisisStockVersionDictionary.findByIdAndDelete(req.params.id).lean();

      if (!data) {
        return res.status(404).json({ error: "Version unificada no encontrada" });
      }

      return res.status(200).json({ message: "Version unificada eliminada correctamente", data });
    } catch (error) {
      logError("DmsController.deleteAnalisisStockVersionDictionary");
      console.error(error);
      return res.status(500).json({ message: "Error al eliminar la version unificada" });
    }
  };

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
      const { anioDesde, mesDesde, anioHasta, mesHasta } = getAnalisisClosedQuarterRange();
      const [rows, pedidosPed, ventasRows, dictionaryItems] = await Promise.all([
        sequelizeNIC.query<AnalisisStockRow>(getAnalisisStockConvencional(), {
          type: QueryTypes.SELECT,
        }),
        AnalisisStockPedido.find().lean(),
        sequelizeNIC.query<AnalisisStockVentaRow>(getAnalisisStockPromedioVenta(), {
          type: QueryTypes.SELECT,
          replacements: { anioDesde, mesDesde, anioHasta, mesHasta },
        }),
        AnalisisStockVersionDictionary.find().lean(),
      ]);

      const monthsMap = new Map<string, { key: string; label: string; month: number; year: number }>();
      const groupsMap = new Map<
        string,
        Map<
          string,
          {
            version: string;
            versionKey: string;
            versionCanonica: string;
            versionOriginales: Set<string>;
            countsByMonth: Record<string, number>;
            unitsByMonth: Record<string, AnalisisStockUnit[]>;
            unitsTotal: AnalisisStockUnit[];
            stockTotal: number;
            ped: number;
            ventasUltimos3Meses: number;
          }
        >
      >();
      const canonicalDictionaryGroups = new Map<
        string,
        {
          modelo: string;
          versionCanonica: string;
          versionCanonicaKey: string;
          activa: boolean;
          versionOriginales: Set<string>;
        }
      >();
      const dictionaryByKey = new Map(
        dictionaryItems.map((item) => [
          buildAnalisisCompositeKey(item.modeloKey, item.versionRawKey),
          {
            versionCanonica: item.versionCanonica,
            versionCanonicaKey: item.versionCanonicaKey,
            activa: item.activa !== false,
          },
        ]),
      );

      for (const item of dictionaryItems) {
        const key = buildAnalisisCompositeKey(item.modeloKey, item.versionCanonicaKey);
        const current = canonicalDictionaryGroups.get(key) ?? {
          modelo: item.modelo,
          versionCanonica: item.versionCanonica,
          versionCanonicaKey: item.versionCanonicaKey,
          activa: false,
          versionOriginales: new Set<string>(),
        };

        current.activa = current.activa || item.activa !== false;
        current.versionOriginales.add(item.versionRaw);
        canonicalDictionaryGroups.set(key, current);
      }

      const pedByKey = pedidosPed.reduce<Map<string, number>>((acc, item) => {
        const canonicalVersion = getAnalisisCanonicalVersion(item.modeloKey, item.version, dictionaryByKey);
        if (!canonicalVersion.activa) {
          return acc;
        }

        const rowKey = buildAnalisisCompositeKey(item.modeloKey, canonicalVersion.versionCanonicaKey);

        acc.set(rowKey, (acc.get(rowKey) ?? 0) + Number(item.cantidad ?? 0));
        return acc;
      }, new Map<string, number>());
      const ventasByKey = ventasRows.reduce<Map<string, number>>((acc, row) => {
        const modelo = normalizeAnalisisModel(row.modelo);
        const version = normalizeAnalisisText(row.version, "Sin version");
        const canonicalVersion = getAnalisisCanonicalVersion(modelo, version, dictionaryByKey);
        if (!canonicalVersion.activa) {
          return acc;
        }

        const ventas = Number(row.ventas ?? 0);
        const rowKey = buildAnalisisCompositeKey(modelo, canonicalVersion.versionCanonicaKey);

        acc.set(rowKey, (acc.get(rowKey) ?? 0) + (Number.isFinite(ventas) ? ventas : 0));
        return acc;
      }, new Map<string, number>());
      const dictionaryResponse = dictionaryItems.map(serializeAnalisisStockDictionaryItem);
      let totalUnidades = 0;

      const groupVersionKey = (modelo: string, versionKey: string) => buildAnalisisCompositeKey(modelo, versionKey);

      for (const row of rows) {
        const fechaRecepcion = parseAnalisisDate(row.fechaRecepcion);

        if (!fechaRecepcion) {
          console.warn("DmsController.getAnalisisStock: fechaRecepcion invalida", row);
          continue;
        }

        const modelo = normalizeAnalisisModel(row.modelo);
        const version = normalizeAnalisisText(row.version, "Sin version");
        const { versionCanonica, versionCanonicaKey, activa } = getAnalisisCanonicalVersion(modelo, version, dictionaryByKey);
        if (!activa) {
          continue;
        }

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
        const currentVersion = rowsByVersion.get(versionCanonicaKey) ?? {
          version: versionCanonica,
          versionKey: versionCanonicaKey,
          versionCanonica,
          versionOriginales: new Set<string>(),
          countsByMonth: {},
          unitsByMonth: {},
          unitsTotal: [],
          stockTotal: 0,
          ped: pedByKey.get(groupVersionKey(modelo, versionCanonicaKey)) ?? 0,
          ventasUltimos3Meses: ventasByKey.get(groupVersionKey(modelo, versionCanonicaKey)) ?? 0,
        };

        currentVersion.countsByMonth[monthKey] = (currentVersion.countsByMonth[monthKey] ?? 0) + 1;
        currentVersion.unitsByMonth[monthKey] = [...(currentVersion.unitsByMonth[monthKey] ?? []), unit];
        currentVersion.unitsTotal = [...currentVersion.unitsTotal, unit];
        currentVersion.stockTotal += 1;
        currentVersion.versionOriginales.add(version);
        rowsByVersion.set(versionCanonicaKey, currentVersion);
        groupsMap.set(modelo, rowsByVersion);
        totalUnidades += 1;
      }

      for (const dictionaryGroup of canonicalDictionaryGroups.values()) {
        if (!dictionaryGroup.activa) {
          continue;
        }

        const rowsByVersion = groupsMap.get(dictionaryGroup.modelo) ?? new Map();

        if (!rowsByVersion.has(dictionaryGroup.versionCanonicaKey)) {
          rowsByVersion.set(dictionaryGroup.versionCanonicaKey, {
            version: dictionaryGroup.versionCanonica,
            versionKey: dictionaryGroup.versionCanonicaKey,
            versionCanonica: dictionaryGroup.versionCanonica,
            versionOriginales: new Set(dictionaryGroup.versionOriginales),
            countsByMonth: {},
            unitsByMonth: {},
            unitsTotal: [],
            stockTotal: 0,
            ped: pedByKey.get(groupVersionKey(dictionaryGroup.modelo, dictionaryGroup.versionCanonicaKey)) ?? 0,
            ventasUltimos3Meses: ventasByKey.get(groupVersionKey(dictionaryGroup.modelo, dictionaryGroup.versionCanonicaKey)) ?? 0,
          });
        }

        groupsMap.set(dictionaryGroup.modelo, rowsByVersion);
      }

      const months = Array.from(monthsMap.values()).sort((a, b) =>
        a.year === b.year ? a.month - b.month : a.year - b.year,
      );

      const groups = Array.from(groupsMap.entries())
        .sort(([modeloA], [modeloB]) => compareAnalisisStockModel(modeloA, modeloB))
        .map(([modelo, rowsByVersion]) => {
          const rows = Array.from(rowsByVersion.values())
            .sort((a, b) => a.version.localeCompare(b.version, "es"))
            .map((item) => ({
              version: item.version,
              versionKey: item.versionKey,
              versionCanonica: item.versionCanonica,
              versionOriginales: Array.from(item.versionOriginales).sort((a, b) => a.localeCompare(b, "es")),
              countsByMonth: months.reduce<Record<string, number>>((acc, monthItem) => {
                acc[monthItem.key] = item.countsByMonth[monthItem.key] ?? 0;
                return acc;
              }, {}),
              unitsByMonth: months.reduce<Record<string, AnalisisStockUnit[]>>((acc, monthItem) => {
                acc[monthItem.key] = item.unitsByMonth[monthItem.key] ?? [];
                return acc;
              }, {}),
              unitsTotal: item.unitsTotal,
              stockTotal: item.stockTotal,
              ped: item.ped,
              promedioVenta: Number((item.ventasUltimos3Meses / 3).toFixed(1)),
              total: item.stockTotal + item.ped,
            }));
          const total = rows.reduce((acc, item) => acc + item.total, 0);
          const promedioVenta = Number(rows.reduce((acc, item) => acc + item.promedioVenta, 0).toFixed(1));
          const mesesStock = Number((promedioVenta > 0 ? total / promedioVenta : 0).toFixed(1));

          return {
            modelo,
            rows,
            total,
            promedioVenta,
            mesesStock,
          };
        });

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
        ped: groups.reduce(
          (groupTotal, group) => groupTotal + group.rows.reduce((rowTotal, row) => rowTotal + row.ped, 0),
          0,
        ),
        promedioVenta: Number(
          (
            Array.from(ventasByKey.values()).reduce((totalVentas, ventas) => totalVentas + ventas, 0) / 3
          ).toFixed(1),
        ),
        total: groups.reduce(
          (groupTotal, group) => groupTotal + group.rows.reduce((rowTotal, row) => rowTotal + row.total, 0),
          0,
        ),
      };
      const totalsWithMesesStock = {
        ...totals,
        mesesStock: Number((totals.promedioVenta > 0 ? totals.total / totals.promedioVenta : 0).toFixed(1)),
      };

      return res.status(200).json({
        data: {
          months,
          groups,
          totals: totalsWithMesesStock,
          dictionary: dictionaryResponse,
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

  static getAnalisisStockVersionesDisponibles = async (_req: Request, res: Response) => {
    try {
      const rows = await sequelizeNIC.query<AnalisisStockVersionDisponibleRow>(getAnalisisStockVersionesDisponibles(), {
        type: QueryTypes.SELECT,
      });

      const grouped = rows.reduce<
        Map<
          string,
          {
            modelo: string;
            marca: string;
            versionsByKey: Map<string, string>;
          }
        >
      >((acc, row) => {
        const modelo = normalizeAnalisisModel(row.modelo);
        const version = normalizeAnalisisText(row.version, "");
        const marca = normalizeAnalisisText(row.marca, "-");
        const versionKey = normalizeAnalisisVersionKey(version);

        if (!version || !versionKey || !modelo || modelo === "SIN MODELO") {
          return acc;
        }

        const current = acc.get(modelo) ?? {
          modelo,
          marca,
          versionsByKey: new Map<string, string>(),
        };

        if (!current.versionsByKey.has(versionKey)) {
          current.versionsByKey.set(versionKey, version);
        }

        acc.set(modelo, current);
        return acc;
      }, new Map());

      const data = Array.from(grouped.values())
        .sort((a, b) => compareAnalisisStockModel(a.modelo, b.modelo))
        .map((item) => ({
          modelo: item.modelo,
          marca: item.marca,
          versions: Array.from(item.versionsByKey.values()).sort((a, b) => a.localeCompare(b, "es")),
        }));

      return res.status(200).json({ data });
    } catch (error) {
      logError("DmsController.getAnalisisStockVersionesDisponibles");
      console.error(error);
      return res.status(500).json({ message: "Error al listar las versiones disponibles" });
    }
  };

  static saveAnalisisStockPed = async (req: Request, res: Response) => {
    const modelo = normalizeAnalisisModel(req.body?.modelo);
    const requestedVersion = normalizeAnalisisText(req.body?.version, "");
    const cantidad = Number(req.body?.cantidad);

    if (!modelo || modelo === "SIN MODELO") {
      return res.status(400).json({ error: "El modelo es obligatorio" });
    }

    if (!requestedVersion) {
      return res.status(400).json({ error: "La version es obligatoria" });
    }

    if (!Number.isFinite(cantidad) || cantidad < 0 || !Number.isInteger(cantidad)) {
      return res.status(400).json({ error: "La cantidad PED debe ser un entero mayor o igual a 0" });
    }

    try {
      const dictionaryItem = await AnalisisStockVersionDictionary.findOne({
        modeloKey: modelo,
        versionRawKey: normalizeAnalisisVersionKey(requestedVersion),
      }).lean();

      const version = dictionaryItem?.versionCanonica ?? requestedVersion;
      const versionKey = dictionaryItem?.versionCanonicaKey ?? normalizeAnalisisVersionKey(requestedVersion);

      if (cantidad === 0) {
        await AnalisisStockPedido.findOneAndDelete({
          modeloKey: modelo,
          versionKey,
        });

        return res.status(200).json({
          message: "PED eliminado correctamente",
          data: {
            modelo,
            version,
            cantidad: 0,
          },
        });
      }

      const data = await AnalisisStockPedido.findOneAndUpdate(
        {
          modeloKey: modelo,
          versionKey,
        },
        {
          modelo,
          version,
          modeloKey: modelo,
          versionKey,
          cantidad,
        },
        { new: true, upsert: true, setDefaultsOnInsert: true },
      ).lean();

      return res.status(200).json({
        message: "PED guardado correctamente",
        data: {
          modelo: data?.modelo ?? modelo,
          version: data?.version ?? version,
          cantidad: Number(data?.cantidad ?? cantidad),
        },
      });
    } catch (error) {
      logError("DmsController.saveAnalisisStockPed");
      console.error(error);
      return res.status(500).json({ message: "Error al guardar el PED" });
    }
  };

}
