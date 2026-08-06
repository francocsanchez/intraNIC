import type { Request, Response } from "express";
import * as XLSX from "xlsx";
import { QueryTypes } from "sequelize";
import { sequelizeNIC } from "../config/database";
import Configuration from "../models/Config";
import ValorizacionPrecio from "../models/ValorizacionPrecio";
import { logError } from "../utils/logError";
import {
  listaDeEsperaConvencionalQuery,
  miListaDeEsperaConvencionalQuery,
  misOperacionesAnualQuery,
  misOperacionesDescuentoPromedioMensualQuery,
  misOperacionesQuery,
  misReservasConvencionalQuery,
  operacionesConvencional,
  operacionesConvencionalRanking,
  reservasConvencionalQuery,
  stockConvencionalQuery,
} from "./querys/convencional.query";
import { buildResumen, StockRow } from "../utils/reportUnidadesConvencional";
import { buildResumenListaDeEspera, ListaEsperaRow } from "../utils/reportOperacionesConvencional";
import {
  buildResumenMisOperaciones,
  buildResumenMisOperacionesAnual,
  MisOperacionAnualRow,
  MisOperacionRow,
} from "../utils/reportMisOperacionesConvencional";
import { buildReportePromedioOperaciones, PromedioOperacionRow } from "../utils/reportPromedioOperacionesConvencional";
import { buildReporteRankingOperaciones, RankingOperacionRow } from "../utils/reportRankingOperacionesConvencional";

const normalizeNumericList = (values: unknown): number[] => {
  if (!Array.isArray(values)) return [];

  return values
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value) && value > 0);
};

const parsePositiveInt = (value: unknown) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const parseMonth = (value: unknown) => {
  const parsed = parsePositiveInt(value);
  return parsed && parsed <= 12 ? parsed : null;
};

const hasValidExcelExtension = (filename: string) => /\.(xls|xlsx)$/i.test(filename);

const EXCEL_MIME_TYPES = new Set([
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/octet-stream",
]);

const isExcelCompatibleFile = (file: Express.Multer.File) =>
  hasValidExcelExtension(file.originalname) || EXCEL_MIME_TYPES.has(file.mimetype);

type ValorizacionRow = {
  modelo: string;
  stockDisponible: number;
  stockReservado: number;
  stockGuardado: number;
  total: number;
  valorizacion: number;
};

type ValorizacionVersionRow = {
  modelo: string;
  version: string;
  versionKey: string;
  stockDisponible: number;
  stockReservado: number;
  stockGuardado: number;
  total: number;
  valor: number | null;
  valorizacion: number;
};

const normalizeModelName = (value: unknown) =>
  String(value ?? "")
    .trim()
    .replace(/\s+/g, " ") || "SIN MODELO";

const normalizeVersionName = (value: unknown) =>
  String(value ?? "")
    .trim()
    .replace(/\s+/g, " ") || "SIN VERSION";

const normalizeVersionKey = (value: unknown) =>
  normalizeVersionName(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();

const buildValorizacionCompositeKey = (modelo: string, versionKey: string) => `${modelo}::${versionKey}`;

const fetchValorizacionStocks = async () => {
  const config = await Configuration.findOne().lean();

  if (!config) {
    return null;
  }

  const vendedoresDisponibleConvencional = normalizeNumericList(config.vendedoresDisponibleConvencional);
  const vendedoresReservasConvencional = normalizeNumericList(config.vendedoresReservasConvencional);
  const vendedoresStockGuardadoConvencional = normalizeNumericList(config.vendedoresStockGuardadoConvencional);

  const [stockDisponible, stockReservado, stockGuardado] = await Promise.all([
    vendedoresDisponibleConvencional.length
      ? sequelizeNIC.query<StockRow>(stockConvencionalQuery(), {
          type: QueryTypes.SELECT,
          replacements: { vendedores: vendedoresDisponibleConvencional },
        })
      : Promise.resolve([]),
    vendedoresReservasConvencional.length
      ? sequelizeNIC.query<StockRow>(reservasConvencionalQuery(), {
          type: QueryTypes.SELECT,
          replacements: { vendedores: vendedoresReservasConvencional },
        })
      : Promise.resolve([]),
    vendedoresStockGuardadoConvencional.length
      ? sequelizeNIC.query<StockRow>(stockConvencionalQuery(), {
          type: QueryTypes.SELECT,
          replacements: { vendedores: vendedoresStockGuardadoConvencional },
        })
      : Promise.resolve([]),
  ]);

  return {
    stockDisponible,
    stockReservado,
    stockGuardado,
  };
};

const buildValorizacionVersionRows = async (
  stockDisponible: StockRow[],
  stockReservado: StockRow[],
  stockGuardado: StockRow[],
) => {
  const prices = await ValorizacionPrecio.find().lean();
  const pricesByVersionKey = new Map(prices.map((item) => [item.versionKey, item]));
  const grouped = new Map<string, ValorizacionVersionRow>();

  const ensureVersion = (modeloRaw: string, versionRaw: string) => {
    const modelo = normalizeModelName(modeloRaw);
    const version = normalizeVersionName(versionRaw);
    const versionKey = normalizeVersionKey(version);
    const compositeKey = buildValorizacionCompositeKey(modelo, versionKey);
    const existing = grouped.get(compositeKey);

    if (existing) {
      return existing;
    }

    const price = pricesByVersionKey.get(versionKey);
    const created: ValorizacionVersionRow = {
      modelo,
      version,
      versionKey,
      stockDisponible: 0,
      stockReservado: 0,
      stockGuardado: 0,
      total: 0,
      valor: typeof price?.valor === "number" ? price.valor : null,
      valorizacion: 0,
    };

    grouped.set(compositeKey, created);
    return created;
  };

  for (const row of stockDisponible) {
    const item = ensureVersion(row.modelo, row.version);
    item.stockDisponible += 1;
  }

  for (const row of stockReservado) {
    const item = ensureVersion(row.modelo, row.version);
    item.stockReservado += 1;
  }

  for (const row of stockGuardado) {
    const item = ensureVersion(row.modelo, row.version);
    item.stockGuardado += 1;
  }

  return Array.from(grouped.values())
    .map((item) => {
      const total = item.stockDisponible + item.stockReservado + item.stockGuardado;

      return {
        ...item,
        total,
        valorizacion: total * (item.valor ?? 0),
      };
    })
    .sort((a, b) => {
      const modelCompare = a.modelo.localeCompare(b.modelo, "es");
      if (modelCompare !== 0) {
        return modelCompare;
      }

      return a.version.localeCompare(b.version, "es");
    });
};

const buildValorizacionRows = (versionRows: ValorizacionVersionRow[]): ValorizacionRow[] => {
  const grouped = new Map<string, ValorizacionRow>();

  for (const row of versionRows) {
    const current = grouped.get(row.modelo) ?? {
      modelo: row.modelo,
      stockDisponible: 0,
      stockReservado: 0,
      stockGuardado: 0,
      total: 0,
      valorizacion: 0,
    };

    current.stockDisponible += row.stockDisponible;
    current.stockReservado += row.stockReservado;
    current.stockGuardado += row.stockGuardado;
    current.total += row.total;
    current.valorizacion += row.valorizacion;

    grouped.set(row.modelo, current);
  }

  return Array.from(grouped.values()).sort((a, b) => a.modelo.localeCompare(b.modelo, "es"));
};

const buildValorizacionResumen = (rows: ValorizacionRow[], versionRows: ValorizacionVersionRow[]) => ({
  modelos: rows.length,
  stockDisponible: rows.reduce((acc, row) => acc + row.stockDisponible, 0),
  stockReservado: rows.reduce((acc, row) => acc + row.stockReservado, 0),
  stockGuardado: rows.reduce((acc, row) => acc + row.stockGuardado, 0),
  total: rows.reduce((acc, row) => acc + row.total, 0),
  valorizacionTotal: rows.reduce((acc, row) => acc + row.valorizacion, 0),
  versionesSinPrecio: versionRows.filter((row) => row.valor === null).length,
  unidadesSinPrecio: versionRows
    .filter((row) => row.valor === null)
    .reduce((acc, row) => acc + row.total, 0),
});

const buildValorizacionListaPreciosRows = (versionRows: ValorizacionVersionRow[]) =>
  versionRows.map((row) => ({
    version: row.version,
    modelo: row.modelo,
    cantidadUnidades: row.total,
    valor: row.valor,
    tienePrecio: row.valor !== null,
  }));

const normalizeSpreadsheetText = (value: unknown) =>
  String(value ?? "")
    .trim()
    .replace(/\s+/g, " ");

const normalizePrecio = (value: unknown) => {
  if (typeof value === "string") {
    const normalized = value.replace(/\./g, "").replace(/,/g, ".").replace(/\$/g, "").trim();
    const parsed = Number(normalized);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
};

export class ConvencionalController {
  static stockDisponible = async (_req: Request, res: Response) => {
    try {
      const config = await Configuration.findOne().lean();

      if (!config) {
        return res.status(404).json({ message: "No existe configuracion inicial" });
      }

      const vendedoresDisponibleConvencional = normalizeNumericList(config.vendedoresDisponibleConvencional);

      if (!vendedoresDisponibleConvencional.length) {
        return res.status(200).json({ data: [], resumen: buildResumen([]) });
      }

      const data = await sequelizeNIC.query<StockRow>(stockConvencionalQuery(), {
        type: QueryTypes.SELECT,
        replacements: { vendedores: vendedoresDisponibleConvencional },
      });

      const resumen = buildResumen(data);

      return res.status(200).json({ data, resumen });
    } catch (error) {
      logError("ConvencionalController.stockDisponible");
      console.error(error);
      return res.status(500).json({ message: "Error del servidor SIAC" });
    }
  };

  static stockGuardado = async (_req: Request, res: Response) => {
    try {
      const config = await Configuration.findOne().lean();

      if (!config) {
        return res.status(404).json({ message: "No existe configuracion inicial" });
      }

      const vendedoresStockGuardadoConvencional = normalizeNumericList(config.vendedoresStockGuardadoConvencional);

      if (!vendedoresStockGuardadoConvencional.length) {
        return res.status(200).json({ data: [], resumen: buildResumen([]) });
      }

      const data = await sequelizeNIC.query<StockRow>(stockConvencionalQuery(), {
        type: QueryTypes.SELECT,
        replacements: { vendedores: vendedoresStockGuardadoConvencional },
      });

      const resumen = buildResumen(data);

      return res.status(200).json({ data, resumen });
    } catch (error) {
      logError("ConvencionalController.stockGuardado");
      console.error(error);
      return res.status(500).json({ message: "Error del servidor SIAC" });
    }
  };

  static stockReservado = async (_req: Request, res: Response) => {
    try {
      const config = await Configuration.findOne().lean();

      if (!config) {
        return res.status(404).json({ message: "No existe configuracion inicial" });
      }

      const vendedoresReservasConvencional = normalizeNumericList(config.vendedoresReservasConvencional);

      if (!vendedoresReservasConvencional.length) {
        return res.status(200).json({
          data: {},
          resumen: {
            total: 0,
            sucursales: {},
          },
        });
      }

      const data = await sequelizeNIC.query<StockRow>(reservasConvencionalQuery(), {
        type: QueryTypes.SELECT,
        replacements: { vendedores: vendedoresReservasConvencional },
      });

      const resumenPorSucursal: Record<string, number> = {};
      const tablasPorSucursal: Record<string, StockRow[]> = {};

      for (const row of data) {
        const sucursal = row.sucursal ?? "SIN ASIGNAR";

        if (!resumenPorSucursal[sucursal]) {
          resumenPorSucursal[sucursal] = 0;
        }

        if (!tablasPorSucursal[sucursal]) {
          tablasPorSucursal[sucursal] = [];
        }

        resumenPorSucursal[sucursal] += 1;
        tablasPorSucursal[sucursal].push(row);
      }

      return res.status(200).json({
        data: tablasPorSucursal,
        resumen: {
          total: data.length,
          sucursales: resumenPorSucursal,
        },
      });
    } catch (error) {
      logError("ConvencionalController.stockReservado");
      console.error(error);
      return res.status(500).json({ message: "Error del servidor SIAC" });
    }
  };

  static stockValorizacion = async (_req: Request, res: Response) => {
    try {
      const stocks = await fetchValorizacionStocks();

      if (!stocks) {
        return res.status(404).json({ message: "No existe configuracion inicial" });
      }

      const versionRows = await buildValorizacionVersionRows(
        stocks.stockDisponible,
        stocks.stockReservado,
        stocks.stockGuardado,
      );
      const data = buildValorizacionRows(versionRows);
      const resumen = buildValorizacionResumen(data, versionRows);
      const faltantes = versionRows
        .filter((row) => row.valor === null)
        .map((row) => ({
          modelo: row.modelo,
          version: row.version,
          cantidadUnidades: row.total,
        }));

      return res.status(200).json({ data, resumen, faltantes });
    } catch (error) {
      logError("ConvencionalController.stockValorizacion");
      console.error(error);
      return res.status(500).json({ message: "Error del servidor SIAC" });
    }
  };

  static stockValorizacionListaPrecios = async (_req: Request, res: Response) => {
    try {
      const stocks = await fetchValorizacionStocks();

      if (!stocks) {
        return res.status(404).json({ message: "No existe configuracion inicial" });
      }

      const versionRows = await buildValorizacionVersionRows(
        stocks.stockDisponible,
        stocks.stockReservado,
        stocks.stockGuardado,
      );

      return res.status(200).json({
        data: buildValorizacionListaPreciosRows(versionRows),
      });
    } catch (error) {
      logError("ConvencionalController.stockValorizacionListaPrecios");
      console.error(error);
      return res.status(500).json({ message: "Error al listar los precios de valorizacion" });
    }
  };

  static exportStockValorizacionPreciosExcel = async (_req: Request, res: Response) => {
    try {
      const stocks = await fetchValorizacionStocks();

      if (!stocks) {
        return res.status(404).json({ message: "No existe configuracion inicial" });
      }

      const versionRows = await buildValorizacionVersionRows(
        stocks.stockDisponible,
        stocks.stockReservado,
        stocks.stockGuardado,
      );
      const rows = buildValorizacionListaPreciosRows(versionRows);
      const sheetRows = [
        ["VERSION", "MODELO", "UNIDADES", "PRECIO UNIDAD"],
        ...rows.map((row) => [row.version, row.modelo, row.cantidadUnidades, row.valor ?? ""]),
      ];

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet(sheetRows);
      XLSX.utils.book_append_sheet(workbook, worksheet, "LISTA DE PRECIOS");

      const fileBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });

      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", 'attachment; filename="valorizacion-lista-precios.xlsx"');
      return res.status(200).send(fileBuffer);
    } catch (error) {
      logError("ConvencionalController.exportStockValorizacionPreciosExcel");
      console.error(error);
      return res.status(500).json({ message: "Error al exportar la lista de precios de valorizacion" });
    }
  };

  static importStockValorizacionPreciosExcel = async (req: Request, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ error: "Debes seleccionar un archivo para importar" });
    }

    if (!isExcelCompatibleFile(req.file)) {
      return res.status(400).json({ error: "El archivo debe ser .xls o .xlsx" });
    }

    try {
      const stocks = await fetchValorizacionStocks();

      if (!stocks) {
        return res.status(404).json({ message: "No existe configuracion inicial" });
      }

      const currentVersionRows = await buildValorizacionVersionRows(
        stocks.stockDisponible,
        stocks.stockReservado,
        stocks.stockGuardado,
      );
      const currentModelsByVersionKey = new Map(currentVersionRows.map((row) => [row.versionKey, row.modelo]));

      const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
      const firstSheetName = workbook.SheetNames[0];

      if (!firstSheetName) {
        return res.status(400).json({ error: "El archivo no contiene hojas para importar" });
      }

      const worksheet = workbook.Sheets[firstSheetName];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: "" });

      if (!rows.length) {
        return res.status(400).json({ error: "El archivo no contiene filas de datos" });
      }

      let created = 0;
      let updated = 0;

      for (const [index, row] of rows.entries()) {
        const version =
          normalizeSpreadsheetText(row.VERSION) ||
          normalizeSpreadsheetText(row.Version) ||
          normalizeSpreadsheetText(row.version) ||
          normalizeSpreadsheetText(row.MODELO) ||
          normalizeSpreadsheetText(row.Modelo) ||
          normalizeSpreadsheetText(row.modelo);
        const valor =
          normalizePrecio(row["PRECIO UNIDAD"]) ??
          normalizePrecio(row["Precio Unidad"]) ??
          normalizePrecio(row.precioUnidad) ??
          normalizePrecio(row.VALOR) ??
          normalizePrecio(row.Valor) ??
          normalizePrecio(row.valor) ??
          normalizePrecio(row.PRECIO) ??
          normalizePrecio(row.Precio) ??
          normalizePrecio(row.precio);

        if (!version || version === "SIN VERSION") {
          return res.status(400).json({ error: `La fila ${index + 2} no tiene una version valida.` });
        }

        if (valor === null) {
          return res.status(400).json({ error: `La fila ${index + 2} tiene un precio invalido.` });
        }

        const versionKey = normalizeVersionKey(version);
        const existing = await ValorizacionPrecio.findOne({ versionKey });
        const spreadsheetModel = normalizeSpreadsheetText(row.MODELO_REAL);
        const resolvedModel =
          currentModelsByVersionKey.get(versionKey) ||
          existing?.modelo ||
          (spreadsheetModel ? normalizeModelName(spreadsheetModel) : "") ||
          "SIN MODELO";

        if (existing) {
          existing.version = version;
          existing.modelo = resolvedModel;
          existing.valor = valor;
          await existing.save();
          updated += 1;
          continue;
        }

        await ValorizacionPrecio.create({
          version,
          versionKey,
          modelo: resolvedModel,
          valor,
        });
        created += 1;
      }

      return res.status(200).json({
        message: `Importacion completada. ${created} creados y ${updated} actualizados.`,
        data: { created, updated, processed: rows.length },
      });
    } catch (error) {
      logError("ConvencionalController.importStockValorizacionPreciosExcel");
      console.error(error);
      return res.status(500).json({ message: "Error al importar la lista de precios de valorizacion" });
    }
  };

  static saveStockValorizacionPrecio = async (req: Request, res: Response) => {
    const version = normalizeVersionName(req.body?.version);
    const modelo = normalizeModelName(req.body?.modelo);
    const versionKey = normalizeVersionKey(version);
    const valor = Number(req.body?.valor);

    if (!version || version === "SIN VERSION") {
      return res.status(400).json({ error: "La version es obligatoria" });
    }

    if (!modelo || modelo === "SIN MODELO") {
      return res.status(400).json({ error: "El modelo es obligatorio" });
    }

    if (!Number.isFinite(valor) || valor < 0) {
      return res.status(400).json({ error: "El valor debe ser mayor o igual a 0" });
    }

    try {
      const data = await ValorizacionPrecio.findOneAndUpdate(
        { versionKey },
        {
          version,
          versionKey,
          modelo,
          valor,
        },
        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true,
        },
      ).lean();

      return res.status(200).json({
        message: "Precio guardado correctamente",
        data: {
          version: data?.version ?? version,
          modelo: data?.modelo ?? modelo,
          cantidadUnidades: 0,
          valor: data?.valor ?? valor,
          tienePrecio: true,
        },
      });
    } catch (error) {
      logError("ConvencionalController.saveStockValorizacionPrecio");
      console.error(error);
      return res.status(500).json({ message: "Error al guardar el precio de valorizacion" });
    }
  };

  static misReservas = async (req: Request, res: Response) => {
    try {
      const { numberSaleNic } = req.user;
      const numeroVendedor = parsePositiveInt(numberSaleNic);

      if (!numeroVendedor) {
        return res.status(200).json({
          data: [],
          resumen: buildResumenListaDeEspera([]),
        });
      }

      const query = misReservasConvencionalQuery();
      const data = await sequelizeNIC.query<any>(query, {
        type: QueryTypes.SELECT,
        replacements: { numeroVendedor },
      });

      const resumen = buildResumenListaDeEspera(data);

      return res.status(200).json({ data, resumen });
    } catch (error) {
      logError("ConvencionalController.misReservas");
      console.error(error);
      return res.status(500).json({ message: "Error del servidor SIAC" });
    }
  };

  static miListaDeEspera = async (req: Request, res: Response) => {
    try {
      const numeroVendedor = parsePositiveInt(req.user.numberSaleNic);

      if (!numeroVendedor) {
        return res.status(400).json({ message: "Numero de vendedor no valido" });
      }

      const query = miListaDeEsperaConvencionalQuery();
      const data = await sequelizeNIC.query<any>(query, {
        type: QueryTypes.SELECT,
        replacements: { numeroVendedor },
      });

      const resumen = buildResumenListaDeEspera(data);

      return res.status(200).json({ data, resumen });
    } catch (error) {
      logError("ConvencionalController.misReservas");
      console.error(error);
      return res.status(500).json({ message: "Error del servidor SIAC" });
    }
  };

  static listaDeEspera = async (_req: Request, res: Response) => {
    try {
      const query = listaDeEsperaConvencionalQuery();

      const data = await sequelizeNIC.query<ListaEsperaRow>(query, {
        type: QueryTypes.SELECT,
      });

      const resumen = buildResumenListaDeEspera(data);

      return res.status(200).json({ data, resumen });
    } catch (error) {
      logError("ConvencionalController.listaDeEspera");
      console.error(error);
      return res.status(500).json({ message: "Error del servidor SIAC" });
    }
  };

  static misOperaciones = async (req: Request, res: Response) => {
    const { mes, ano } = req.params;
    const mesNumber = parseMonth(mes);
    const anoNumber = parsePositiveInt(ano);

    if (!mesNumber || !anoNumber) {
      return res.status(400).json({ message: "Periodo no valido" });
    }

    const numberSaleNic = parsePositiveInt(req.user.numberSaleNic);

    if (!numberSaleNic) {
      return res.status(400).json({ message: "Numero de vendedor no valido" });
    }

    try {
      const query = misOperacionesQuery();

      const data = await sequelizeNIC.query<MisOperacionRow>(query, {
        type: QueryTypes.SELECT,
        replacements: { mes: mesNumber, ano: anoNumber, numberSaleNic },
      });

      const resumen = buildResumenMisOperaciones(data);
      const annualData = await sequelizeNIC.query<MisOperacionAnualRow>(misOperacionesAnualQuery(), {
        type: QueryTypes.SELECT,
        replacements: { ano: anoNumber, numberSaleNic },
      });
      const descuentoPromedioRows = await sequelizeNIC.query<{ descuentoPromedio: number | null }>(
        misOperacionesDescuentoPromedioMensualQuery(),
        {
          type: QueryTypes.SELECT,
          replacements: { mes: mesNumber, ano: anoNumber, numberSaleNic },
        },
      );

      return res.status(200).json({
        data,
        resumen: {
          ...resumen,
          anual: buildResumenMisOperacionesAnual(annualData),
          descuentoPromedioMes: descuentoPromedioRows[0]?.descuentoPromedio ?? null,
        },
      });
    } catch (error) {
      logError("ConvencionalController.misOperaciones");
      console.error(error);
      return res.status(500).json({ message: "Error del servidor SIAC" });
    }
  };

  static promedioOperaciones = async (req: Request, res: Response) => {
    const { mes, ano } = req.params;
    const mesNumber = parseMonth(mes);
    const anoNumber = parsePositiveInt(ano);

    if (!mesNumber || !anoNumber) {
      return res.status(400).json({ message: "Periodo no valido" });
    }

    try {
      const query = operacionesConvencional();

      const data = await sequelizeNIC.query<PromedioOperacionRow>(query, {
        type: QueryTypes.SELECT,
        replacements: { mes: mesNumber, ano: anoNumber },
      });

      const resumen = buildReportePromedioOperaciones(data, mesNumber, anoNumber);

      return res.status(200).json({ resumen });
    } catch (error) {
      logError("ConvencionalController.promedioOperaciones");
      console.error(error);
      return res.status(500).json({ message: "Error del servidor SIAC" });
    }
  };

  static rankingOperaciones = async (req: Request, res: Response) => {
    const { ano } = req.params;
    const anoNumber = parsePositiveInt(ano);

    if (!anoNumber) {
      return res.status(400).json({ message: "Periodo no valido" });
    }

    try {
      const query = operacionesConvencionalRanking();

      const data = await sequelizeNIC.query<RankingOperacionRow>(query, {
        type: QueryTypes.SELECT,
        replacements: { ano: anoNumber },
      });

      const resumen = buildReporteRankingOperaciones(data, anoNumber);

      return res.status(200).json({ resumen });
    } catch (error) {
      logError("ConvencionalController.rankingOperaciones");
      console.error(error);
      return res.status(500).json({ message: "Error del servidor SIAC" });
    }
  };
}
