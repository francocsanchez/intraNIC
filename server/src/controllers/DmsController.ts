import { Response, Request } from "express";
import { sequelizeLIESS, sequelizeNIC } from "../config/database";
import {
  getAnalisisStockConvencional,
  getAnalisisStockPromedioVenta,
  getAnalisisStockVersionesDisponibles,
  getAsignacionRecepcion,
  getFacturaReventasNic,
  getPendFacConvencional,
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
import FsanchezOperacionEstado from "../models/FsanchezOperacionEstado";
import * as XLSX from "xlsx";

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

type PendFacRow = {
  interno: number | string | null;
  nrofab: string | null;
  version: string | null;
  modelo: string | null;
  chasis: string | null;
  color: string | null;
  cliente: string | null;
  vendedor: string | null;
  ubicacion: string | null;
  opera: number | string | null;
  diasAsignado: number | string | null;
};

type PendFacUnit = {
  interno: string;
  nrofab: string;
  version: string;
  modelo: string;
  chasis: string;
  color: string;
  cliente: string;
  vendedor: string;
  ubicacion: string;
  opera: string;
  diasAsignado: number;
};

type PendFacLocation = {
  key: string;
  label: string;
};

type PendFacResponseRow = {
  version: string;
  versionKey: string;
  countsByLocation: Record<string, number>;
  unitsByLocation: Record<string, PendFacUnit[]>;
  unitsTotal: PendFacUnit[];
  total: number;
};

type PendFacResponseGroup = {
  modelo: string;
  rows: PendFacResponseRow[];
};

type PendFacResponseData = {
  locations: PendFacLocation[];
  groups: PendFacResponseGroup[];
  totals: {
    modelo: string;
    countsByLocation: Record<string, number>;
    total: number;
  };
  meta: {
    totalUnidades: number;
  };
};

type FsanchezOperacionItem = PendFacUnit & {
  cancelada: boolean;
  alerta: "normal" | "media" | "alta";
  comentario: string;
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

const normalizePendFacText = (value: unknown, fallback: string) => {
  const normalized = String(value ?? "").trim();
  return normalized || fallback;
};

const normalizePendFacNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
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

const formatFileDate = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const buildAnalisisCompositeKey = (modelo: string, versionKey: string) => `${modelo}::${versionKey}`;

const buildPendFacData = (rows: PendFacRow[]): PendFacResponseData => {
  const locationsMap = new Map<string, PendFacLocation>();
  const groupsMap = new Map<
    string,
    Map<
      string,
      {
        version: string;
        versionKey: string;
        countsByLocation: Record<string, number>;
        unitsByLocation: Record<string, PendFacUnit[]>;
        unitsTotal: PendFacUnit[];
        total: number;
      }
    >
  >();

  for (const row of rows) {
    const modelo = normalizeAnalisisModel(row.modelo);
    const version = normalizeAnalisisText(row.version, "Sin version");
    const versionKey = normalizeAnalisisVersionKey(version);
    const ubicacion = normalizeAnalisisText(row.ubicacion, "Sin ubicacion");
    const ubicacionKey = normalizeAnalisisVersionKey(ubicacion);

    const unit: PendFacUnit = {
      interno: normalizePendFacText(row.interno, "-"),
      nrofab: normalizePendFacText(row.nrofab, "-"),
      version,
      modelo,
      chasis: normalizePendFacText(row.chasis, "-"),
      color: normalizePendFacText(row.color, "-"),
      cliente: normalizePendFacText(row.cliente, "-"),
      vendedor: normalizePendFacText(row.vendedor, "-"),
      ubicacion,
      opera: normalizePendFacText(row.opera, "-"),
      diasAsignado: normalizePendFacNumber(row.diasAsignado, 0),
    };

    if (!locationsMap.has(ubicacionKey)) {
      locationsMap.set(ubicacionKey, { key: ubicacionKey, label: ubicacion });
    }

    const rowsByVersion = groupsMap.get(modelo) ?? new Map();
    const currentVersion = rowsByVersion.get(versionKey) ?? {
      version,
      versionKey,
      countsByLocation: {},
      unitsByLocation: {},
      unitsTotal: [],
      total: 0,
    };

    currentVersion.countsByLocation[ubicacionKey] = (currentVersion.countsByLocation[ubicacionKey] ?? 0) + 1;
    currentVersion.unitsByLocation[ubicacionKey] = [...(currentVersion.unitsByLocation[ubicacionKey] ?? []), unit];
    currentVersion.unitsTotal = [...currentVersion.unitsTotal, unit];
    currentVersion.total += 1;

    rowsByVersion.set(versionKey, currentVersion);
    groupsMap.set(modelo, rowsByVersion);
  }

  const locations = Array.from(locationsMap.values()).sort((a, b) => a.label.localeCompare(b.label, "es"));
  const groups = Array.from(groupsMap.entries())
    .sort(([modeloA], [modeloB]) => compareAnalisisStockModel(modeloA, modeloB))
    .map(([modelo, rowsByVersion]) => ({
      modelo,
      rows: Array.from(rowsByVersion.values())
        .sort((a, b) => a.version.localeCompare(b.version, "es"))
        .map((item) => ({
          version: item.version,
          versionKey: item.versionKey,
          countsByLocation: locations.reduce<Record<string, number>>((acc, location) => {
            acc[location.key] = item.countsByLocation[location.key] ?? 0;
            return acc;
          }, {}),
          unitsByLocation: locations.reduce<Record<string, PendFacUnit[]>>((acc, location) => {
            acc[location.key] = item.unitsByLocation[location.key] ?? [];
            return acc;
          }, {}),
          unitsTotal: item.unitsTotal,
          total: item.total,
        })),
    }));

  const totals = {
    modelo: "TOTALES",
    countsByLocation: locations.reduce<Record<string, number>>((acc, location) => {
      acc[location.key] = groups.reduce(
        (groupTotal, group) =>
          groupTotal + group.rows.reduce((rowTotal, row) => rowTotal + (row.countsByLocation[location.key] ?? 0), 0),
        0,
      );
      return acc;
    }, {}),
    total: groups.reduce(
      (groupTotal, group) => groupTotal + group.rows.reduce((rowTotal, row) => rowTotal + row.total, 0),
      0,
    ),
  };

  return {
    locations,
    groups,
    totals,
    meta: {
      totalUnidades: totals.total,
    },
  };
};

const serializeFsanchezOperacionEstado = (item: any) => ({
  _id: String(item._id),
  opera: normalizePendFacText(item.opera, ""),
  cancelada: item.cancelada === true,
  alerta: item.alerta === "media" || item.alerta === "alta" ? item.alerta : "normal",
  comentario: typeof item.comentario === "string" ? item.comentario : "",
  updatedBy: item.updatedBy ? String(item.updatedBy) : null,
  updatedByName: typeof item.updatedByName === "string" ? item.updatedByName : "",
  createdAt: item.createdAt instanceof Date ? item.createdAt.toISOString() : String(item.createdAt),
  updatedAt: item.updatedAt instanceof Date ? item.updatedAt.toISOString() : String(item.updatedAt),
});

const buildFsanchezOperaciones = (
  rows: PendFacRow[],
  stateByOpera: Map<string, { cancelada: boolean; alerta: "normal" | "media" | "alta"; comentario: string }>,
): FsanchezOperacionItem[] =>
  rows.map((row) => {
    const opera = normalizePendFacText(row.opera, "-");
    const currentState = stateByOpera.get(opera);

    return {
      interno: normalizePendFacText(row.interno, "-"),
      nrofab: normalizePendFacText(row.nrofab, "-"),
      version: normalizeAnalisisText(row.version, "Sin version"),
      modelo: normalizeAnalisisModel(row.modelo),
      chasis: normalizePendFacText(row.chasis, "-"),
      color: normalizePendFacText(row.color, "-"),
      cliente: normalizePendFacText(row.cliente, "-"),
      vendedor: normalizePendFacText(row.vendedor, "-"),
      ubicacion: normalizeAnalisisText(row.ubicacion, "Sin ubicacion"),
      opera,
      diasAsignado: normalizePendFacNumber(row.diasAsignado, 0),
      cancelada: currentState?.cancelada ?? false,
      alerta: currentState?.alerta ?? "normal",
      comentario: currentState?.comentario ?? "",
    };
  });

const filterFsanchezOperaciones = (
  items: FsanchezOperacionItem[],
  section?: string,
  location?: string,
) => {
  const normalizedSection = String(section ?? "").trim().toLowerCase();
  const normalizedLocation = String(location ?? "").trim();

  return items.filter((item) => {
    const matchesSection =
      normalizedSection === "canceladas"
        ? item.cancelada
        : normalizedSection === "consaldo"
          ? !item.cancelada
          : true;
    const matchesLocation =
      normalizedLocation && normalizedLocation.toLowerCase() !== "todas" ? item.ubicacion === normalizedLocation : true;

    return matchesSection && matchesLocation;
  });
};

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

  static getPendFac = async (_req: Request, res: Response) => {
    try {
      const rows = await sequelizeNIC.query<PendFacRow>(getPendFacConvencional(), {
        type: QueryTypes.SELECT,
      });
      const data = buildPendFacData(rows);

      return res.status(200).json({
        data,
      });
    } catch (error) {
      logError("DmsController.getPendFac");
      console.error(error);
      return res.status(500).json({ message: "Error del servidor SIAC" });
    }
  };

  static exportPendFac = async (_req: Request, res: Response) => {
    try {
      const rows = await sequelizeNIC.query<PendFacRow>(getPendFacConvencional(), {
        type: QueryTypes.SELECT,
      });
      const data = buildPendFacData(rows);
      const detailRows = data.groups.flatMap((group) =>
        group.rows.flatMap((row) =>
          row.unitsTotal.map((unit) => ({
            interno: unit.interno,
            "nro fab": unit.nrofab,
            version: unit.version,
            modelo: unit.modelo,
            chasis: unit.chasis,
            color: unit.color,
            cliente: unit.cliente,
            vendedor: unit.vendedor,
            ubicacion: unit.ubicacion,
            opera: unit.opera,
            "dias asignado": unit.diasAsignado,
          })),
        ),
      );

      const worksheet = XLSX.utils.json_to_sheet(detailRows);
      worksheet["!cols"] = [
        { wch: 12 },
        { wch: 18 },
        { wch: 32 },
        { wch: 18 },
        { wch: 22 },
        { wch: 16 },
        { wch: 28 },
        { wch: 22 },
        { wch: 18 },
        { wch: 14 },
        { wch: 14 },
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Pend Fac Detalle");

      const fileBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });
      const filename = `pend-fac-detalle-${formatFileDate()}.xlsx`;

      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename=\"${filename}\"`);
      return res.status(200).send(fileBuffer);
    } catch (error) {
      logError("DmsController.exportPendFac");
      console.error(error);
      return res.status(500).json({ message: "Error al exportar Pend Fac" });
    }
  };

  static getFsanchezOperaciones = async (_req: Request, res: Response) => {
    try {
      const [rows, estados] = await Promise.all([
        sequelizeNIC.query<PendFacRow>(getPendFacConvencional(), {
          type: QueryTypes.SELECT,
        }),
        FsanchezOperacionEstado.find().lean(),
      ]);

      const stateByOpera = estados.reduce<
        Map<string, { cancelada: boolean; alerta: "normal" | "media" | "alta"; comentario: string }>
      >((acc, item) => {
        const opera = normalizePendFacText(item.opera, "");

        if (opera) {
          acc.set(opera, {
            cancelada: item.cancelada === true,
            alerta: item.alerta === "media" || item.alerta === "alta" ? item.alerta : "normal",
            comentario: typeof item.comentario === "string" ? item.comentario : "",
          });
        }

        return acc;
      }, new Map());

      const data = buildFsanchezOperaciones(rows, stateByOpera);
      const canceladas = data.filter((item) => item.cancelada).length;

      return res.status(200).json({
        data,
        meta: {
          total: data.length,
          conSaldo: data.length - canceladas,
          canceladas,
        },
      });
    } catch (error) {
      logError("DmsController.getFsanchezOperaciones");
      console.error(error);
      return res.status(500).json({ message: "Error al obtener las operaciones FSANCHEZ" });
    }
  };

  static exportFsanchezOperaciones = async (req: Request, res: Response) => {
    try {
      const [rows, estados] = await Promise.all([
        sequelizeNIC.query<PendFacRow>(getPendFacConvencional(), {
          type: QueryTypes.SELECT,
        }),
        FsanchezOperacionEstado.find().lean(),
      ]);

      const stateByOpera = estados.reduce<
        Map<string, { cancelada: boolean; alerta: "normal" | "media" | "alta"; comentario: string }>
      >((acc, item) => {
        const opera = normalizePendFacText(item.opera, "");

        if (opera) {
          acc.set(opera, {
            cancelada: item.cancelada === true,
            alerta: item.alerta === "media" || item.alerta === "alta" ? item.alerta : "normal",
            comentario: typeof item.comentario === "string" ? item.comentario : "",
          });
        }

        return acc;
      }, new Map());

      const data = buildFsanchezOperaciones(rows, stateByOpera);
      const filtered = filterFsanchezOperaciones(
        data,
        typeof req.query.section === "string" ? req.query.section : undefined,
        typeof req.query.location === "string" ? req.query.location : undefined,
      );
      const detailRows = filtered.map((item) => ({
        opera: item.opera,
        modelo: item.modelo,
        version: item.version,
        cliente: item.cliente,
        vendedor: item.vendedor,
        ubicacion: item.ubicacion,
        alerta: item.alerta,
        comentario: item.comentario || "",
        "dias asignado": item.diasAsignado,
        color: item.color,
        estado: item.cancelada ? "Cancelada" : "Con saldo",
      }));

      const worksheet = XLSX.utils.json_to_sheet(detailRows);
      worksheet["!cols"] = [
        { wch: 14 },
        { wch: 18 },
        { wch: 34 },
        { wch: 30 },
        { wch: 24 },
        { wch: 24 },
        { wch: 12 },
        { wch: 42 },
        { wch: 14 },
        { wch: 16 },
        { wch: 14 },
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "FSANCHEZ");

      const fileBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });
      const filename = `fsanchez-${formatFileDate()}.xlsx`;

      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename=\"${filename}\"`);
      return res.status(200).send(fileBuffer);
    } catch (error) {
      logError("DmsController.exportFsanchezOperaciones");
      console.error(error);
      return res.status(500).json({ message: "Error al exportar FSANCHEZ" });
    }
  };

  static updateFsanchezOperacionEstado = async (req: Request, res: Response) => {
    const opera = normalizePendFacText(req.params.opera, "");
    const cancelada = req.body?.cancelada;
    const alertaRaw = typeof req.body?.alerta === "string" ? req.body.alerta.trim().toLowerCase() : undefined;
    const comentario = req.body?.comentario;

    if (!opera || opera === "-") {
      return res.status(400).json({ error: "La operacion es obligatoria" });
    }

    if (cancelada !== undefined && typeof cancelada !== "boolean") {
      return res.status(400).json({ error: "El estado cancelada debe ser booleano" });
    }

    if (alertaRaw !== undefined && !["normal", "media", "alta"].includes(alertaRaw)) {
      return res.status(400).json({ error: "La alerta debe ser normal, media o alta" });
    }

    if (comentario !== undefined && typeof comentario !== "string") {
      return res.status(400).json({ error: "El comentario debe ser texto" });
    }

    if (!req.user) {
      return res.status(401).json({ error: "Usuario no autenticado" });
    }

    try {
      const existing = await FsanchezOperacionEstado.findOne({ opera }).lean();
      const data = await FsanchezOperacionEstado.findOneAndUpdate(
        { opera },
        {
          opera,
          cancelada: typeof cancelada === "boolean" ? cancelada : existing?.cancelada ?? false,
          alerta: alertaRaw ?? existing?.alerta ?? "normal",
          comentario: typeof comentario === "string" ? comentario.trim() : existing?.comentario ?? "",
          updatedBy: req.user._id,
          updatedByName: `${req.user.lastName} ${req.user.name}`.trim(),
        },
        { new: true, upsert: true, setDefaultsOnInsert: true },
      ).lean();

      let message = "Operacion actualizada";
      if (typeof cancelada === "boolean") {
        message = cancelada ? "Operacion marcada como cancelada" : "Operacion marcada como con saldo";
      } else if (alertaRaw !== undefined) {
        message = "Alerta actualizada correctamente";
      } else if (typeof comentario === "string") {
        message = "Comentario actualizado correctamente";
      }

      return res.status(200).json({
        message,
        data: serializeFsanchezOperacionEstado(data),
      });
    } catch (error) {
      logError("DmsController.updateFsanchezOperacionEstado");
      console.error(error);
      return res.status(500).json({ message: "Error al actualizar el estado de la operacion" });
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
