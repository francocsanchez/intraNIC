import { QueryTypes } from "sequelize";
import { sequelizeNIC } from "../config/database";
import {
  saldoOperacionEstadosEntregadosQuery,
  saldoOperacionSnapshotSourceQuery,
  saldoOperacionUbicacionesQuery,
  saldoOperacionUsuariosQuery,
} from "../controllers/querys/saldoOperacionSnapshot.query";
import SaldoOperacionSnapshot from "../models/SaldoOperacionSnapshot";
import SaldoOperacionUsuario from "../models/SaldoOperacionUsuario";

type SourceRow = Record<string, unknown>;
type SnapshotSection = "conSaldo" | "canceladas";
type SnapshotEntrega = "todas" | "entregadas" | "sinEntregar";
export type SnapshotSortKey = "codigoOperacion" | "clienteNombre" | "sucursal" | "vendedor" | "nombreUsuarioOperacion" | "modeloGeneral" | "version" | "ubicacion" | "fechaAsignacion" | "diasAsignada" | "fechaCancelacion" | "diasHastaCancelacion" | "saldo";
type CancelacionAnalysisNode = {
  name: string;
  averageDays: number;
  operations: number;
  saldoTotal?: number;
  children?: CancelacionAnalysisNode[];
};

type CancelacionAnalysisGroup = {
  _id: { sucursal: string; usuario: string; vendedor: string };
  averageDays: number;
  operations: number;
  saldoTotal?: number;
};

type CancelacionMonthlyGroup = {
  _id: string;
  averageDays: number;
  operations: number;
};

type CancelacionSucursalMonthlyGroup = {
  _id: { month: string; sucursal: string };
  averageDays: number;
  operations: number;
};

const trim = (value: unknown, fallback = "") => {
  const normalized = String(value ?? "").trim();
  return normalized || fallback;
};

const numberOrNull = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const dateOnlyOrNull = (value: unknown) => {
  const normalized = trim(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return null;
  const [year, month, day] = normalized.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day ? normalized : null;
};

const calculateSaldo = (row: { total?: number | null; senas?: number | null; usado?: number | null; creditoBanco?: number | null }) =>
  (row.total ?? 0) - (row.senas ?? 0) - (row.usado ?? 0) - (row.creditoBanco ?? 0);

const calculateDays = (fechaAsignacion: string, fechaCancelacion: string) => {
  const [asignacionYear, asignacionMonth, asignacionDay] = fechaAsignacion.split("-").map(Number);
  const [cancelacionYear, cancelacionMonth, cancelacionDay] = fechaCancelacion.split("-").map(Number);
  return Math.round(
    (Date.UTC(cancelacionYear, cancelacionMonth - 1, cancelacionDay) -
      Date.UTC(asignacionYear, asignacionMonth - 1, asignacionDay)) /
      86_400_000,
  );
};

const normalizeSection = (value: string | null | undefined): SnapshotSection =>
  String(value ?? "").trim().toLowerCase() === "canceladas" ? "canceladas" : "conSaldo";

const normalizeEntrega = (value: string | null | undefined): SnapshotEntrega => {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (normalized === "entregadas") return "entregadas";
  if (normalized === "sin-entregar") return "sinEntregar";
  return "todas";
};

const nodeName = (value: unknown, fallback: string) => trim(value, fallback);
const buildAnalysisNode = (name: string, groups: CancelacionAnalysisGroup[], children?: CancelacionAnalysisNode[]): CancelacionAnalysisNode => {
  const operations = groups.reduce((total, group) => total + group.operations, 0);
  const averageDays = operations
    ? groups.reduce((total, group) => total + group.averageDays * group.operations, 0) / operations
    : 0;
  const hasSaldo = groups.some((group) => typeof group.saldoTotal === "number");
  const saldoTotal = groups.reduce((total, group) => total + (group.saldoTotal ?? 0), 0);
  return { name, averageDays, operations, ...(hasSaldo ? { saldoTotal } : {}), ...(children?.length ? { children } : {}) };
};

const buildAnalysisResponse = (groups: CancelacionAnalysisGroup[], months: CancelacionMonthlyGroup[], sucursalesPorMes: CancelacionSucursalMonthlyGroup[]) => {
  const branches = new Map<string, Map<string, CancelacionAnalysisGroup[]>>();
  groups.forEach((group) => {
    const sucursal = nodeName(group._id.sucursal, "Sin sucursal");
    const usuario = nodeName(group._id.usuario, "Sin usuario");
    const byUser = branches.get(sucursal) ?? new Map<string, CancelacionAnalysisGroup[]>();
    byUser.set(usuario, [...(byUser.get(usuario) ?? []), group]);
    branches.set(sucursal, byUser);
  });

  const children = [...branches.entries()]
    .sort(([left], [right]) => left.localeCompare(right, "es"))
    .map(([sucursal, users]) => {
      const userNodes = [...users.entries()]
        .sort(([left], [right]) => left.localeCompare(right, "es"))
        .map(([usuario, userGroups]) => {
          const sellers = userGroups
            .sort((left, right) => nodeName(left._id.vendedor, "Sin vendedor").localeCompare(nodeName(right._id.vendedor, "Sin vendedor"), "es"))
            .map((group) => buildAnalysisNode(nodeName(group._id.vendedor, "Sin vendedor"), [group]));
          return buildAnalysisNode(usuario, userGroups, sellers);
        });
      return buildAnalysisNode(sucursal, [...users.values()].flat(), userNodes);
    });

  const tree = buildAnalysisNode("Tiempo total", groups, children);
  return {
    data: {
      averageDays: tree.averageDays,
      operations: tree.operations,
      tree,
      months: months.map((item) => ({ month: item._id, averageDays: item.averageDays, operations: item.operations })),
      sucursalesPorMes: [...new Map(sucursalesPorMes.map((item) => [nodeName(item._id.sucursal, "Sin sucursal"), item._id.sucursal])).keys()]
        .sort((left, right) => left.localeCompare(right, "es"))
        .map((sucursal) => ({
          sucursal,
          months: sucursalesPorMes
            .filter((item) => nodeName(item._id.sucursal, "Sin sucursal") === sucursal)
            .map((item) => ({ month: item._id.month, averageDays: item.averageDays, operations: item.operations })),
        })),
    },
  };
};

const effectiveUsuario = (item: { nombreUsuarioOperacionManual?: string | null; nombreUsuarioOperacionSiac?: string | null; nombreUsuarioOperacion?: string | null }) =>
  trim(item.nombreUsuarioOperacionManual ?? item.nombreUsuarioOperacionSiac ?? item.nombreUsuarioOperacion, "SIN USUARIO");

// Un snapshot entregado solo deja de ser visible en el tablero cuando su cancelacion fue registrada.
// `fechaCancelacion: null` tambien contempla documentos previos que aun no tengan el campo.
const visibleSnapshotMatch = () => ({
  $or: [
    { entregada: { $ne: true } },
    { fechaCancelacion: null },
  ],
});

const baseFilter = (params: { section?: string | null; entrega?: string | null; soloEntregadas?: boolean; ubicacion?: string | null; sucursal?: string | null; usuario?: string | null; vendedor?: string | null; operacion?: string | null }) => {
  const filter: Record<string, unknown> = params.soloEntregadas ? { entregada: true } : visibleSnapshotMatch();
  if (!params.soloEntregadas) {
    filter.fechaCancelacion = normalizeSection(params.section) === "canceladas" ? { $ne: null } : null;
    const entrega = normalizeEntrega(params.entrega);
    if (entrega === "entregadas") filter.entregada = true;
    if (entrega === "sinEntregar") filter.entregada = { $ne: true };
  }
  const ubicacion = trim(params.ubicacion);
  const sucursal = trim(params.sucursal);
  const usuario = trim(params.usuario);
  const vendedor = trim(params.vendedor);
  const operacion = Number(params.operacion);
  if (ubicacion) filter.ubicacion = ubicacion;
  if (sucursal) filter.sucursal = sucursal;
  if (vendedor) filter.vendedor = vendedor;
  if (Number.isInteger(operacion) && operacion > 0) filter.codigoOperacion = operacion;
  if (usuario) {
    filter.$expr = {
      $eq: [
        { $ifNull: ["$nombreUsuarioOperacionManual", { $ifNull: ["$nombreUsuarioOperacionSiac", "$nombreUsuarioOperacion"] }] },
        usuario,
      ],
    };
  }
  return filter;
};

const serialize = (item: any) => ({
  codigoOperacion: Number(item.codigoOperacion),
  clienteNombre: item.clienteNombre ?? "",
  vendedor: item.vendedor ?? "",
  sucursal: item.sucursal ?? "SIN SUCURSAL",
  usuarioOperacion: item.usuarioOperacionManual ?? item.usuarioOperacionSiac ?? item.usuarioOperacion ?? "",
  nombreUsuarioOperacion: item.nombreUsuarioOperacionManual ?? item.nombreUsuarioOperacionSiac ?? item.nombreUsuarioOperacion ?? "",
  usuarioOperacionOriginal: item.usuarioOperacionSiac ?? item.usuarioOperacion ?? "",
  nombreUsuarioOperacionOriginal: item.nombreUsuarioOperacionSiac ?? item.nombreUsuarioOperacion ?? "",
  usuarioOperacionCorregido: Boolean(item.usuarioOperacionManual),
  numeroFabrica: item.numeroFabrica ?? "",
  total: item.total ?? null,
  bonificacion: item.bonificacion ?? null,
  gestoria: item.gestoria ?? null,
  senas: item.senas ?? null,
  usado: item.usado ?? null,
  creditoBanco: item.creditoBanco ?? null,
  version: item.version ?? "",
  modeloGeneral: item.modeloGeneral ?? "SIN MODELO",
  fechaAsignacion: item.fechaAsignacion ?? null,
  diasAsignada: item.diasAsignada ?? null,
  estado: item.estado ?? "Sin estado",
  ubicacion: item.ubicacion ?? "STOCK CONCESIONARIO",
  fechaCancelacion: item.fechaCancelacion ?? null,
  diasHastaCancelacion: item.diasHastaCancelacion ?? null,
  entregada: Boolean(item.entregada),
  saldo: calculateSaldo(item),
  sincronizadoEn: item.sincronizadoEn?.toISOString?.() ?? null,
});

const compareSnapshotValues = (left: unknown, right: unknown) => {
  if (left == null && right == null) return 0;
  if (left == null) return 1;
  if (right == null) return -1;
  if (typeof left === "number" && typeof right === "number") return left - right;
  return String(left).localeCompare(String(right), "es", { numeric: true, sensitivity: "base" });
};

export class SaldoOperacionSnapshotService {
  static async syncFromSiac() {
    const [sourceRows, ubicacionRows, usuarioRows] = await Promise.all([
      sequelizeNIC.query<SourceRow>(saldoOperacionSnapshotSourceQuery(), { type: QueryTypes.SELECT }),
      sequelizeNIC.query<SourceRow>(saldoOperacionUbicacionesQuery(), { type: QueryTypes.SELECT }),
      sequelizeNIC.query<SourceRow>(saldoOperacionUsuariosQuery(), { type: QueryTypes.SELECT }),
    ]);
    const ubicaciones = new Map<string, string>();
    ubicacionRows.forEach((row) => {
      const numeroFabrica = trim(row.numero_fabrica);
      if (numeroFabrica) ubicaciones.set(numeroFabrica, trim(row.ubicacion, "STOCK CONCESIONARIO"));
    });

    const now = new Date();
    const operations = sourceRows
      .map((row) => {
        const codigoOperacion = numberOrNull(row.codigo_operacion);
        if (!codigoOperacion || codigoOperacion <= 0) return null;
        const numeroFabrica = trim(row.numero_fabrica);
        return {
          codigoOperacion,
          clienteNombre: trim(row.cliente_nombre),
          vendedor: trim(row.vendedor),
          sucursal: trim(row.sucursal, "SIN SUCURSAL"),
          usuarioOperacionSiac: trim(row.usuario_operacion),
          nombreUsuarioOperacionSiac: trim(row.nombre_usuario_operacion),
          numeroFabrica,
          total: numberOrNull(row.pcio_venta),
          bonificacion: numberOrNull(row.bonif_venta),
          gestoria: numberOrNull(row.gestoria),
          senas: numberOrNull(row.senas),
          usado: numberOrNull(row.usado),
          creditoBanco: numberOrNull(row.total_cred_banco),
          version: trim(row.version),
          modeloGeneral: trim(row.modelo_general, "SIN MODELO"),
          fechaAsignacion: dateOnlyOrNull(row.fecha_asignacion),
          fechaFactura: dateOnlyOrNull(row.fecha_factura),
          diasAsignada: numberOrNull(row.dias_asignada),
          estado: trim(row.estado, "Sin estado"),
          ubicacion: ubicaciones.get(numeroFabrica) ?? "STOCK CONCESIONARIO",
          entregada: false,
          fechaEntregaDetectada: null,
          sincronizadoEn: now,
        };
      })
      .filter((row): row is NonNullable<typeof row> => row !== null);

    if (operations.length) {
      await SaldoOperacionSnapshot.bulkWrite(
        operations.map((row) => ({
          updateOne: {
            filter: { codigoOperacion: row.codigoOperacion },
            update: { $set: row, $setOnInsert: { fechaCancelacion: null, diasHastaCancelacion: null } },
            upsert: true,
          },
        })),
        { ordered: false },
      );
    }

    const usuarios = usuarioRows
      .map((row) => ({ codigo: trim(row.codigo), nombre: trim(row.nombre), habilitado: true, sincronizadoEn: now }))
      .filter((usuario) => Boolean(usuario.codigo && usuario.nombre));
    if (usuarios.length) {
      await SaldoOperacionUsuario.bulkWrite(
        usuarios.map((usuario) => ({ updateOne: { filter: { codigo: usuario.codigo }, update: { $set: usuario }, upsert: true } })),
        { ordered: false },
      );
      await SaldoOperacionUsuario.updateMany({ codigo: { $nin: usuarios.map((usuario) => usuario.codigo) } }, { $set: { habilitado: false, sincronizadoEn: now } });
    }

    const activos = await SaldoOperacionSnapshot.find({ entregada: false }, { codigoOperacion: 1 }).lean();
    const codigos = activos.map((item) => Number(item.codigoOperacion)).filter((item) => Number.isInteger(item));
    let entregadas = 0;
    if (codigos.length) {
      const statusRows = await sequelizeNIC.query<SourceRow>(saldoOperacionEstadosEntregadosQuery(), {
        type: QueryTypes.SELECT,
        replacements: { codigos },
      });
      const codigosEntregados = statusRows
        .filter((row) => /^ENT/i.test(trim(row.estado)))
        .map((row) => numberOrNull(row.codigo_operacion))
        .filter((codigo): codigo is number => Boolean(codigo));
      if (codigosEntregados.length) {
        const result = await SaldoOperacionSnapshot.updateMany(
          { codigoOperacion: { $in: codigosEntregados }, entregada: false },
          { $set: { entregada: true, fechaEntregaDetectada: now } },
        );
        entregadas = result.modifiedCount;
      }
    }

    return { total: operations.length, createdOrUpdated: operations.length, usuariosSincronizados: usuarios.length, entregadas };
  }

  static async list(params: { section?: string | null; entrega?: string | null; soloEntregadas?: boolean; ubicacion?: string | null; sucursal?: string | null; usuario?: string | null; vendedor?: string | null; operacion?: string | null; page: number; limit: number; sortKey: SnapshotSortKey; sortDirection: "asc" | "desc" }) {
    const filter = baseFilter(params);
    const page = Math.max(1, params.page);
    const limit = Math.min(200, Math.max(1, params.limit));
    const rows = (await SaldoOperacionSnapshot.find(filter).lean()).map(serialize);
    const direction = params.sortDirection === "desc" ? -1 : 1;
    const sorted = rows.sort((left, right) => {
      const comparison = compareSnapshotValues(left[params.sortKey], right[params.sortKey]);
      return comparison ? comparison * direction : left.codigoOperacion - right.codigoOperacion;
    });
    const start = (page - 1) * limit;
    return {
      data: sorted.slice(start, start + limit),
      pagination: { page, limit, total: sorted.length, totalPages: Math.max(1, Math.ceil(sorted.length / limit)), hasNextPage: start + limit < sorted.length },
    };
  }

  static async filters() {
    const rows = await SaldoOperacionSnapshot.find(visibleSnapshotMatch(), { sucursal: 1, ubicacion: 1, vendedor: 1, nombreUsuarioOperacion: 1, nombreUsuarioOperacionSiac: 1, nombreUsuarioOperacionManual: 1 }).lean();
    return {
      meta: {
        sucursales: [...new Set(rows.map((item) => trim(item.sucursal, "SIN SUCURSAL")))].sort(),
        ubicaciones: [...new Set(rows.map((item) => trim(item.ubicacion, "STOCK CONCESIONARIO")))].sort(),
        usuarios: [...new Set(rows.map(effectiveUsuario))].sort((left, right) => left.localeCompare(right, "es")),
        vendedores: [...new Set(rows.map((item) => trim(item.vendedor, "SIN VENDEDOR")))].sort((left, right) => left.localeCompare(right, "es")),
      },
    };
  }

  static async summary(params: { soloEntregadas?: boolean; ubicacion?: string | null; sucursal?: string | null; usuario?: string | null; vendedor?: string | null }) {
    const rows = await SaldoOperacionSnapshot.find({ ...baseFilter({ ...params, section: "conSaldo" }) }).lean();
    const grouped = new Map<string, number>();
    let creditoTotal = 0;
    let usadoTotal = 0;
    rows.forEach((row) => {
      const modelo = trim(row.modeloGeneral, "SIN MODELO");
      grouped.set(modelo, (grouped.get(modelo) ?? 0) + calculateSaldo(row));
      if (!row.fechaFactura) creditoTotal += row.creditoBanco ?? 0;
      usadoTotal += row.usado ?? 0;
    });
    return {
      data: [...grouped.entries()].map(([modelo, saldo]) => ({ modelo, saldo })).sort((a, b) => b.saldo - a.saldo),
      creditoTotal,
      usadoTotal,
    };
  }

  static async cancelacionAnalysis(month?: string | null, year?: string | null) {
    const cancelacionMatch = {
      fechaCancelacion: { $type: "string" },
      fechaAsignacion: { $regex: "^[0-9]{4}-[0-9]{2}-[0-9]{2}$" },
      diasHastaCancelacion: { $type: "number" },
    };
    const selectedMatch = month
      ? { ...cancelacionMatch, fechaAsignacion: { $regex: `^${month}-` } }
      : year ? { ...cancelacionMatch, fechaAsignacion: { $regex: `^${year}-` } } : cancelacionMatch;
    const [groups, months, sucursalesPorMes] = await Promise.all([
      SaldoOperacionSnapshot.aggregate<CancelacionAnalysisGroup>([
      { $match: selectedMatch },
      {
        $project: {
          diasHastaCancelacion: 1,
          sucursal: {
            $let: {
              vars: { value: { $trim: { input: { $ifNull: ["$sucursal", ""] } } } },
              in: { $cond: [{ $eq: ["$$value", ""] }, "Sin sucursal", "$$value"] },
            },
          },
          usuario: {
            $let: {
              vars: {
                value: {
                  $trim: {
                    input: {
                      $ifNull: [
                        "$nombreUsuarioOperacionManual",
                        { $ifNull: ["$nombreUsuarioOperacionSiac", { $ifNull: ["$nombreUsuarioOperacion", ""] }] },
                      ],
                    },
                  },
                },
              },
              in: { $cond: [{ $eq: ["$$value", ""] }, "Sin usuario", "$$value"] },
            },
          },
          vendedor: {
            $let: {
              vars: { value: { $trim: { input: { $ifNull: ["$vendedor", ""] } } } },
              in: { $cond: [{ $eq: ["$$value", ""] }, "Sin vendedor", "$$value"] },
            },
          },
        },
      },
      {
        $group: {
          _id: { sucursal: "$sucursal", usuario: "$usuario", vendedor: "$vendedor" },
          averageDays: { $avg: "$diasHastaCancelacion" },
          operations: { $sum: 1 },
        },
      },
      ]),
      SaldoOperacionSnapshot.aggregate<CancelacionMonthlyGroup>([
        { $match: cancelacionMatch },
        { $project: { month: { $substrBytes: ["$fechaAsignacion", 0, 7] }, diasHastaCancelacion: 1 } },
        { $group: { _id: "$month", averageDays: { $avg: "$diasHastaCancelacion" }, operations: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      SaldoOperacionSnapshot.aggregate<CancelacionSucursalMonthlyGroup>([
        { $match: cancelacionMatch },
        {
          $project: {
            month: { $substrBytes: ["$fechaAsignacion", 0, 7] },
            diasHastaCancelacion: 1,
            sucursal: {
              $let: {
                vars: { value: { $trim: { input: { $ifNull: ["$sucursal", ""] } } } },
                in: { $cond: [{ $eq: ["$$value", ""] }, "Sin sucursal", "$$value"] },
              },
            },
          },
        },
        { $group: { _id: { month: "$month", sucursal: "$sucursal" }, averageDays: { $avg: "$diasHastaCancelacion" }, operations: { $sum: 1 } } },
        { $sort: { "_id.sucursal": 1, "_id.month": 1 } },
      ]),
    ]);

    return buildAnalysisResponse(groups, months, sucursalesPorMes);
  }

  static async noCanceladasAnalysis(month?: string | null, year?: string | null) {
    const noCanceladasMatch = {
      fechaCancelacion: null,
      fechaAsignacion: { $regex: "^[0-9]{4}-[0-9]{2}-[0-9]{2}$" },
      diasAsignada: { $type: "number" },
    };
    const selectedMatch = month
      ? { ...noCanceladasMatch, fechaAsignacion: { $regex: `^${month}-` } }
      : year ? { ...noCanceladasMatch, fechaAsignacion: { $regex: `^${year}-` } } : noCanceladasMatch;
    const projection = {
      sucursal: {
        $let: {
          vars: { value: { $trim: { input: { $ifNull: ["$sucursal", ""] } } } },
          in: { $cond: [{ $eq: ["$$value", ""] }, "Sin sucursal", "$$value"] },
        },
      },
      usuario: {
        $let: {
          vars: { value: { $trim: { input: { $ifNull: ["$nombreUsuarioOperacionManual", { $ifNull: ["$nombreUsuarioOperacionSiac", { $ifNull: ["$nombreUsuarioOperacion", ""] }] }] } } } },
          in: { $cond: [{ $eq: ["$$value", ""] }, "Sin usuario", "$$value"] },
        },
      },
      vendedor: {
        $let: {
          vars: { value: { $trim: { input: { $ifNull: ["$vendedor", ""] } } } },
          in: { $cond: [{ $eq: ["$$value", ""] }, "Sin vendedor", "$$value"] },
        },
      },
    };
    const [groups, months, sucursalesPorMes] = await Promise.all([
      SaldoOperacionSnapshot.aggregate<CancelacionAnalysisGroup>([
        { $match: selectedMatch },
        {
          $project: {
            dias: "$diasAsignada",
            saldo: {
              $add: [
                { $ifNull: ["$total", 0] },
                { $multiply: [{ $ifNull: ["$senas", 0] }, -1] },
                { $multiply: [{ $ifNull: ["$usado", 0] }, -1] },
                { $multiply: [{ $ifNull: ["$creditoBanco", 0] }, -1] },
              ],
            },
            ...projection,
          },
        },
        { $group: { _id: { sucursal: "$sucursal", usuario: "$usuario", vendedor: "$vendedor" }, averageDays: { $avg: "$dias" }, operations: { $sum: 1 }, saldoTotal: { $sum: "$saldo" } } },
      ]),
      SaldoOperacionSnapshot.aggregate<CancelacionMonthlyGroup>([
        { $match: noCanceladasMatch },
        { $project: { month: { $substrBytes: ["$fechaAsignacion", 0, 7] }, dias: "$diasAsignada" } },
        { $group: { _id: "$month", averageDays: { $avg: "$dias" }, operations: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      SaldoOperacionSnapshot.aggregate<CancelacionSucursalMonthlyGroup>([
        { $match: noCanceladasMatch },
        { $project: { month: { $substrBytes: ["$fechaAsignacion", 0, 7] }, dias: "$diasAsignada", sucursal: projection.sucursal } },
        { $group: { _id: { month: "$month", sucursal: "$sucursal" }, averageDays: { $avg: "$dias" }, operations: { $sum: 1 } } },
        { $sort: { "_id.sucursal": 1, "_id.month": 1 } },
      ]),
    ]);
    return buildAnalysisResponse(groups, months, sucursalesPorMes);
  }

  static async exportRows(params: { section?: string | null; entrega?: string | null; ubicacion?: string | null; sucursal?: string | null; usuario?: string | null; vendedor?: string | null; operacion?: string | null }) {
    const rows = await SaldoOperacionSnapshot.find(baseFilter(params)).lean();
    return rows.sort((a, b) => calculateSaldo(a) - calculateSaldo(b) || a.codigoOperacion - b.codigoOperacion).map(serialize);
  }

  static async updateFechaCancelacion(codigoOperacion: number, fechaCancelacion: string | null) {
    if (fechaCancelacion !== null && !dateOnlyOrNull(fechaCancelacion)) throw new Error("La fecha de cancelacion debe ser una fecha valida con formato AAAA-MM-DD");
    const snapshot = await SaldoOperacionSnapshot.findOne(fechaCancelacion === null ? { codigoOperacion } : { codigoOperacion, ...visibleSnapshotMatch() });
    if (!snapshot) throw new Error("La operacion no existe en el snapshot visible");
    if (fechaCancelacion === null) {
      snapshot.fechaCancelacion = null;
      snapshot.diasHastaCancelacion = null;
      await snapshot.save();
      return serialize(snapshot);
    }
    if (!snapshot.fechaAsignacion) throw new Error("La operacion no tiene una fecha de asignacion valida en SIAC");
    const diasHastaCancelacion = calculateDays(snapshot.fechaAsignacion, fechaCancelacion);
    if (diasHastaCancelacion < 0) throw new Error("La fecha de cancelacion no puede ser anterior a la fecha de asignacion");
    snapshot.fechaCancelacion = fechaCancelacion;
    snapshot.diasHastaCancelacion = diasHastaCancelacion;
    await snapshot.save();
    return serialize(snapshot);
  }

  static async listUsuariosOperacion(busqueda: string) {
    const normalizedSearch = trim(busqueda);
    if (normalizedSearch.length < 3) return { data: [] };
    const expression = new RegExp(normalizedSearch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    const usuarios = await SaldoOperacionUsuario.find(
      { habilitado: true, $or: [{ codigo: expression }, { nombre: expression }] },
      { codigo: 1, nombre: 1 },
    ).sort({ nombre: 1, codigo: 1 }).limit(30).lean();
    return { data: usuarios.map((usuario) => ({ codigo: usuario.codigo, nombre: usuario.nombre })) };
  }

  static async updateUsuarioOperacion(codigoOperacion: number, codigoUsuario: string) {
    const usuario = await SaldoOperacionUsuario.findOne({ codigo: codigoUsuario, habilitado: true }).lean();
    if (!usuario) throw new Error("El usuario SIAC seleccionado no existe o no esta habilitado");
    const snapshot = await SaldoOperacionSnapshot.findOne({ codigoOperacion, ...visibleSnapshotMatch() });
    if (!snapshot) throw new Error("La operacion no existe en el snapshot visible");
    snapshot.usuarioOperacionManual = usuario.codigo;
    snapshot.nombreUsuarioOperacionManual = usuario.nombre;
    await snapshot.save();
    return serialize(snapshot);
  }
}
