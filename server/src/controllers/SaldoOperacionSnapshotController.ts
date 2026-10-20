import type { Request, Response } from "express";
import * as XLSX from "xlsx";
import { SaldoOperacionSnapshotService, analysisDimensions, defaultAnalysisDimensionOrder, tiposCliente, type AnalysisDimension, type SnapshotSortKey, type TipoCliente } from "../services/saldoOperacionSnapshot.service";
import { CobrosVendedorService } from "../services/cobrosVendedor.service";
import { SaldoOperacionCreditoLiquidadoService } from "../services/saldoOperacionCreditoLiquidado.service";

const optionalString = (value: unknown) => (typeof value === "string" && value.trim() ? value.trim() : null);
const positiveInt = (value: unknown, fallback: number) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};
const snapshotSortKeys = new Set([
  "codigoOperacion", "clienteNombre", "sucursal", "vendedor", "nombreUsuarioOperacion",
  "tipoCliente",
  "modeloGeneral", "version", "ubicacion", "fechaAsignacion", "diasAsignada",
  "fechaCancelacion", "diasHastaCancelacion", "creditoEstado", "saldo",
]);
const excelMimeTypes = new Set([
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/octet-stream",
]);
// El identificador regional ya incorpora el símbolo monetario; agregar otro `$` lo duplica en Excel.
const pesoFormat = '[$$-es-AR] #,##0.00;[Red]-[$$-es-AR] #,##0.00';
const sheetWithPesoColumns = (rows: Record<string, unknown>[], monetaryColumns: string[]) => {
  const sheet = XLSX.utils.json_to_sheet(rows);
  if (!rows.length) return sheet;
  const columns = Object.keys(rows[0]);
  monetaryColumns.forEach((column) => {
    const columnIndex = columns.indexOf(column);
    if (columnIndex < 0) return;
    for (let rowIndex = 1; rowIndex <= rows.length; rowIndex += 1) {
      const cell = sheet[XLSX.utils.encode_cell({ r: rowIndex, c: columnIndex })];
      if (cell?.t === "n") cell.z = pesoFormat;
    }
  });
  return sheet;
};

const parseFilters = (req: Request) => ({
  section: optionalString(req.query.section),
  entrega: optionalString(req.query.entrega),
  ubicacion: optionalString(req.query.ubicacion),
  sucursal: optionalString(req.query.sucursal),
  usuario: optionalString(req.query.usuario),
  vendedor: optionalString(req.query.vendedor),
  operacion: optionalString(req.query.operacion),
});
const parseAnalysisDimensions = (value: unknown): AnalysisDimension[] => {
  if (value === undefined) return defaultAnalysisDimensionOrder;
  if (typeof value !== "string") throw new Error("El orden de dimensiones debe ser una lista separada por comas");
  const dimensions = value.split(",").map((item) => item.trim()).filter(Boolean);
  if (!dimensions.length || new Set(dimensions).size !== dimensions.length || dimensions.some((item) => !analysisDimensions.includes(item as AnalysisDimension))) {
    throw new Error("Indicá al menos una dimensión sin repetir: T. Cliente, Vendedor, Usuario o Sucursal");
  }
  return dimensions as AnalysisDimension[];
};

export class SaldoOperacionSnapshotController {
  static importCreditosLiquidados = async (req: Request, res: Response) => {
    if (!req.file?.buffer?.length) return res.status(400).json({ message: "Seleccioná un archivo Excel" });
    if (!/\.(xls|xlsx)$/i.test(req.file.originalname) && !excelMimeTypes.has(req.file.mimetype)) {
      return res.status(400).json({ message: "El archivo debe tener formato .xls o .xlsx" });
    }
    try {
      const data = await SaldoOperacionCreditoLiquidadoService.importWorkbook(req.file, req.user!);
      return res.status(200).json({ message: "Créditos liquidados importados", data });
    } catch (error) {
      return res.status(400).json({ message: error instanceof Error ? error.message : "No se pudieron importar los créditos liquidados" });
    }
  };

  static searchVendedoresCobros = async (req: Request, res: Response) => {
    try { return res.status(200).json(await CobrosVendedorService.searchVendedores(optionalString(req.query.buscar) ?? "")); }
    catch (error) { return res.status(500).json({ message: error instanceof Error ? error.message : "No se pudieron buscar los vendedores" }); }
  };

  static listCobrosVendedor = async (req: Request, res: Response) => {
    const vendedor = positiveInt(req.query.vendedor, 0);
    const operacion = positiveInt(req.query.operacion, 0);
    const anio = positiveInt(req.query.anio, 0);
    const mes = positiveInt(req.query.mes, 0);
    if (!vendedor && !operacion) return res.status(400).json({ message: "Ingresá un vendedor o una operación válida" });
    if (!operacion && (anio < 2000 || anio > 2100)) return res.status(400).json({ message: "El año debe ser válido" });
    if (!operacion && (mes < 1 || mes > 12)) return res.status(400).json({ message: "El mes debe estar entre 1 y 12" });
    try {
      return res.status(200).json(await CobrosVendedorService.list({
        vendedor: vendedor || undefined, operacion: operacion || undefined, anio: anio || undefined, mes: mes || undefined,
        page: positiveInt(req.query.page, 1), limit: positiveInt(req.query.limit, 60),
      }));
    } catch (error) { return res.status(500).json({ message: error instanceof Error ? error.message : "No se pudieron obtener los cobros del vendedor" }); }
  };

  static detailCobrosVendedor = async (req: Request, res: Response) => {
    const codigoOperacion = positiveInt(req.params.codigoOperacion, 0);
    if (!codigoOperacion) return res.status(400).json({ message: "La operación debe ser válida" });
    try { return res.status(200).json(await CobrosVendedorService.detail(codigoOperacion)); }
    catch (error) { return res.status(404).json({ message: error instanceof Error ? error.message : "No se pudo obtener el detalle de cobros" }); }
  };

  static list = async (req: Request, res: Response) => {
    const filters = parseFilters(req);
    if (filters.operacion && (!/^\d+$/.test(filters.operacion) || Number(filters.operacion) <= 0)) return res.status(400).json({ message: "La operación debe ser un número positivo" });
    try {
      const requestedSort = optionalString(req.query.sortKey);
      const sortKey = (requestedSort && snapshotSortKeys.has(requestedSort) ? requestedSort : "saldo") as SnapshotSortKey;
      const sortDirection = req.query.sortDirection === "desc" ? "desc" : "asc";
      const response = await SaldoOperacionSnapshotService.list({ ...filters, page: positiveInt(req.query.page, 1), limit: positiveInt(req.query.limit, 60), sortKey, sortDirection });
      return res.status(200).json(response);
    } catch (error) { return res.status(500).json({ message: error instanceof Error ? error.message : "No se pudo obtener el tablero" }); }
  };

  static filters = async (_req: Request, res: Response) => {
    try { return res.status(200).json(await SaldoOperacionSnapshotService.filters()); }
    catch (error) { return res.status(500).json({ message: error instanceof Error ? error.message : "No se pudieron obtener los filtros" }); }
  };

  static summary = async (req: Request, res: Response) => {
    try { return res.status(200).json(await SaldoOperacionSnapshotService.summary(parseFilters(req))); }
    catch (error) { return res.status(500).json({ message: error instanceof Error ? error.message : "No se pudo obtener el resumen" }); }
  };

  static cancelacionAnalysis = async (req: Request, res: Response) => {
    const month = optionalString(req.query.mesAsignacion);
    const year = optionalString(req.query.anioAsignacion);
    if (month && !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) return res.status(400).json({ message: "El mes de asignacion debe tener formato AAAA-MM" });
    if (year && !/^\d{4}$/.test(year)) return res.status(400).json({ message: "El año de asignacion debe tener formato AAAA" });
    if (month && year && !month.startsWith(`${year}-`)) return res.status(400).json({ message: "El mes debe pertenecer al año de asignacion seleccionado" });
    let dimensions: AnalysisDimension[];
    try { dimensions = parseAnalysisDimensions(req.query.dimensionOrder); }
    catch (error) { return res.status(400).json({ message: error instanceof Error ? error.message : "El orden de dimensiones no es valido" }); }
    try { return res.status(200).json(await SaldoOperacionSnapshotService.cancelacionAnalysis(month, year, dimensions)); }
    catch (error) { return res.status(500).json({ message: error instanceof Error ? error.message : "No se pudo obtener el analisis de cancelacion" }); }
  };

  static noCanceladasAnalysis = async (req: Request, res: Response) => {
    const month = optionalString(req.query.mesAsignacion);
    const year = optionalString(req.query.anioAsignacion);
    if (month && !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) return res.status(400).json({ message: "El mes de asignacion debe tener formato AAAA-MM" });
    if (year && !/^\d{4}$/.test(year)) return res.status(400).json({ message: "El año de asignacion debe tener formato AAAA" });
    if (month && year && !month.startsWith(`${year}-`)) return res.status(400).json({ message: "El mes debe pertenecer al año de asignacion seleccionado" });
    let dimensions: AnalysisDimension[];
    try { dimensions = parseAnalysisDimensions(req.query.dimensionOrder); }
    catch (error) { return res.status(400).json({ message: error instanceof Error ? error.message : "El orden de dimensiones no es valido" }); }
    try { return res.status(200).json(await SaldoOperacionSnapshotService.noCanceladasAnalysis(month, year, dimensions)); }
    catch (error) { return res.status(500).json({ message: error instanceof Error ? error.message : "No se pudo obtener el analisis de no canceladas" }); }
  };

  static updateFechaCancelacion = async (req: Request, res: Response) => {
    const codigoOperacion = positiveInt(req.params.codigoOperacion, 0);
    const anularFechaCancelacion = req.body?.fechaCancelacion === null;
    const fechaCancelacion = anularFechaCancelacion ? null : optionalString(req.body?.fechaCancelacion);
    if (!codigoOperacion) return res.status(400).json({ message: "El codigo de operacion debe ser valido" });
    if (!anularFechaCancelacion && !fechaCancelacion) return res.status(400).json({ message: "La fecha de cancelacion es obligatoria" });
    try {
      const data = await SaldoOperacionSnapshotService.updateFechaCancelacion(codigoOperacion, fechaCancelacion);
      return res.status(200).json({ message: anularFechaCancelacion ? "Fecha de cancelacion anulada" : "Fecha de cancelacion actualizada", data });
    } catch (error) { return res.status(400).json({ message: error instanceof Error ? error.message : "No se pudo actualizar la cancelacion" }); }
  };

  static listUsuariosOperacion = async (req: Request, res: Response) => {
    try { return res.status(200).json(await SaldoOperacionSnapshotService.listUsuariosOperacion(optionalString(req.query.buscar) ?? "")); }
    catch (error) { return res.status(500).json({ message: error instanceof Error ? error.message : "No se pudieron obtener los usuarios SIAC" }); }
  };

  static updateUsuarioOperacion = async (req: Request, res: Response) => {
    const codigoOperacion = positiveInt(req.params.codigoOperacion, 0);
    const codigoUsuario = optionalString(req.body?.codigoUsuario);
    if (!codigoOperacion) return res.status(400).json({ message: "El codigo de operacion debe ser valido" });
    if (!codigoUsuario) return res.status(400).json({ message: "El usuario SIAC es obligatorio" });
    try {
      const data = await SaldoOperacionSnapshotService.updateUsuarioOperacion(codigoOperacion, codigoUsuario);
      return res.status(200).json({ message: "Usuario de operacion actualizado", data });
    } catch (error) { return res.status(400).json({ message: error instanceof Error ? error.message : "No se pudo actualizar el usuario" }); }
  };

  static updateTipoCliente = async (req: Request, res: Response) => {
    const codigoOperacion = positiveInt(req.params.codigoOperacion, 0);
    const tipoCliente = req.body?.tipoCliente === null ? null : optionalString(req.body?.tipoCliente);
    if (!codigoOperacion) return res.status(400).json({ message: "El codigo de operacion debe ser valido" });
    if (tipoCliente !== null && !tiposCliente.includes(tipoCliente as TipoCliente)) {
      return res.status(400).json({ message: "El tipo de cliente no es valido" });
    }
    try {
      const data = await SaldoOperacionSnapshotService.updateTipoCliente(codigoOperacion, tipoCliente as TipoCliente | null);
      return res.status(200).json({ message: "Tipo de cliente actualizado", data });
    } catch (error) { return res.status(400).json({ message: error instanceof Error ? error.message : "No se pudo actualizar el tipo de cliente" }); }
  };

  static export = async (req: Request, res: Response) => {
    try {
      const filters = parseFilters(req);
      if (filters.operacion && (!/^\d+$/.test(filters.operacion) || Number(filters.operacion) <= 0)) return res.status(400).json({ message: "La operación debe ser un número positivo" });
      const items = await SaldoOperacionSnapshotService.exportRows(filters);
      const rows = items.map((item) => ({
        op: item.codigoOperacion, numero_fabrica: item.numeroFabrica, chasis: item.chasis, version: item.version, modelo: item.modeloGeneral,
        cliente: item.clienteNombre, tipo_cliente: item.tipoCliente ?? "", sucursal: item.sucursal, vendedor: item.vendedor, usuario_operacion: item.usuarioOperacion,
        nombre_usuario_operacion: item.nombreUsuarioOperacion, usuario_operacion_siac: item.usuarioOperacionOriginal,
        nombre_usuario_operacion_siac: item.nombreUsuarioOperacionOriginal, ubicacion: item.ubicacion, estado: item.estado,
        fecha_asignacion: item.fechaAsignacion ?? "", dias_asignada: item.diasAsignada ?? "", fecha_cancelacion: item.fechaCancelacion ?? "",
        dias_hasta_cancelacion: item.diasHastaCancelacion ?? "", total: item.total ?? 0, bonificacion: item.bonificacion ?? 0,
        gestoria: item.gestoria ?? 0, senas: item.senas ?? 0, usado: item.usado ?? 0, credito: item.creditoBanco ?? 0,
        estado_credito: item.creditoEstado, credito_liquidado: item.creditoLiquidadoMonto ?? 0, saldo: item.saldo,
      }));
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, sheetWithPesoColumns(rows, ["total", "bonificacion", "gestoria", "senas", "usado", "credito", "credito_liquidado", "saldo"]), "SaldoOperacion");
      const fileBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename="saldo-operacion-${new Date().toISOString().slice(0, 10)}.xlsx"`);
      return res.status(200).send(fileBuffer);
    } catch (error) { return res.status(500).json({ message: error instanceof Error ? error.message : "No se pudo exportar el tablero" }); }
  };

  static exportResumen = async (req: Request, res: Response) => {
    try {
      // El saldo y usado corresponden a no canceladas; crédito pendiente incluye también canceladas aún no liquidadas.
      const filters = parseFilters(req);
      const items = await SaldoOperacionSnapshotService.exportSummaryRows(filters);
      const rows = items.map((item) => ({
        op: item.codigoOperacion, cliente: item.clienteNombre, tipo_cliente: item.tipoCliente ?? "", modelo: item.modeloGeneral, version: item.version,
        sucursal: item.sucursal, vendedor: item.vendedor, usuario_operacion: item.nombreUsuarioOperacion,
        fecha_cancelacion: item.fechaCancelacion ?? "", total_venta: item.total ?? 0, senas: item.senas ?? 0,
        usado_no_cancelado: item.incluyeSaldoModelo ? item.usado ?? 0 : 0,
        credito_siac: item.creditoBanco ?? 0, estado_credito: item.creditoEstado,
        credito_liquidado: item.creditoLiquidadoMonto ?? 0,
        credito_pendiente: item.creditoEstado === "pendiente" ? item.creditoBanco ?? 0 : 0,
        saldo_que_suma_al_modelo: item.incluyeSaldoModelo ? item.saldo : 0,
        fecha_asignacion: item.fechaAsignacion ?? "", chasis: item.chasis,
      }));
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, sheetWithPesoColumns(rows, ["total_venta", "senas", "usado_no_cancelado", "credito_siac", "credito_liquidado", "credito_pendiente", "saldo_que_suma_al_modelo"]), "Detalle cuadros");
      const fileBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename="saldo-operacion-detalle-cuadros-${new Date().toISOString().slice(0, 10)}.xlsx"`);
      return res.status(200).send(fileBuffer);
    } catch (error) { return res.status(500).json({ message: error instanceof Error ? error.message : "No se pudo exportar el detalle de los cuadros" }); }
  };
}
