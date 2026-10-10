import type { Request, Response } from "express";
import * as XLSX from "xlsx";
import { SaldoOperacionSnapshotService, type SnapshotSortKey } from "../services/saldoOperacionSnapshot.service";
import { CobrosVendedorService } from "../services/cobrosVendedor.service";

const optionalString = (value: unknown) => (typeof value === "string" && value.trim() ? value.trim() : null);
const positiveInt = (value: unknown, fallback: number) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};
const snapshotSortKeys = new Set([
  "codigoOperacion", "clienteNombre", "sucursal", "vendedor", "nombreUsuarioOperacion",
  "modeloGeneral", "version", "ubicacion", "fechaAsignacion", "diasAsignada",
  "fechaCancelacion", "diasHastaCancelacion", "saldo",
]);

const parseFilters = (req: Request) => ({
  section: optionalString(req.query.section),
  entrega: optionalString(req.query.entrega),
  ubicacion: optionalString(req.query.ubicacion),
  sucursal: optionalString(req.query.sucursal),
  usuario: optionalString(req.query.usuario),
  vendedor: optionalString(req.query.vendedor),
  operacion: optionalString(req.query.operacion),
});

export class SaldoOperacionSnapshotController {
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
    try { return res.status(200).json(await SaldoOperacionSnapshotService.cancelacionAnalysis(month, year)); }
    catch (error) { return res.status(500).json({ message: error instanceof Error ? error.message : "No se pudo obtener el analisis de cancelacion" }); }
  };

  static noCanceladasAnalysis = async (req: Request, res: Response) => {
    const month = optionalString(req.query.mesAsignacion);
    const year = optionalString(req.query.anioAsignacion);
    if (month && !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) return res.status(400).json({ message: "El mes de asignacion debe tener formato AAAA-MM" });
    if (year && !/^\d{4}$/.test(year)) return res.status(400).json({ message: "El año de asignacion debe tener formato AAAA" });
    if (month && year && !month.startsWith(`${year}-`)) return res.status(400).json({ message: "El mes debe pertenecer al año de asignacion seleccionado" });
    try { return res.status(200).json(await SaldoOperacionSnapshotService.noCanceladasAnalysis(month, year)); }
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

  static export = async (req: Request, res: Response) => {
    try {
      const filters = parseFilters(req);
      if (filters.operacion && (!/^\d+$/.test(filters.operacion) || Number(filters.operacion) <= 0)) return res.status(400).json({ message: "La operación debe ser un número positivo" });
      const items = await SaldoOperacionSnapshotService.exportRows(filters);
      const rows = items.map((item) => ({
        op: item.codigoOperacion, numero_fabrica: item.numeroFabrica, version: item.version, modelo: item.modeloGeneral,
        cliente: item.clienteNombre, sucursal: item.sucursal, vendedor: item.vendedor, usuario_operacion: item.usuarioOperacion,
        nombre_usuario_operacion: item.nombreUsuarioOperacion, usuario_operacion_siac: item.usuarioOperacionOriginal,
        nombre_usuario_operacion_siac: item.nombreUsuarioOperacionOriginal, ubicacion: item.ubicacion, estado: item.estado,
        fecha_asignacion: item.fechaAsignacion ?? "", dias_asignada: item.diasAsignada ?? "", fecha_cancelacion: item.fechaCancelacion ?? "",
        dias_hasta_cancelacion: item.diasHastaCancelacion ?? "", total: item.total ?? 0, bonificacion: item.bonificacion ?? 0,
        gestoria: item.gestoria ?? 0, senas: item.senas ?? 0, usado: item.usado ?? 0, credito: item.creditoBanco ?? 0, saldo: item.saldo,
      }));
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), "SaldoOperacion");
      const fileBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename="saldo-operacion-${new Date().toISOString().slice(0, 10)}.xlsx"`);
      return res.status(200).send(fileBuffer);
    } catch (error) { return res.status(500).json({ message: error instanceof Error ? error.message : "No se pudo exportar el tablero" }); }
  };
}
