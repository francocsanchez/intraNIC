import { QueryTypes } from "sequelize";
import { sequelizeNIC } from "../config/database";
import {
  saldoOperacionEstadosEntregadosQuery,
  saldoOperacionSnapshotSourceQuery,
  saldoOperacionUbicacionesQuery,
} from "../controllers/querys/saldoOperacionSnapshot.query";
import SaldoOperacionSnapshot from "../models/SaldoOperacionSnapshot";

type SourceRow = Record<string, unknown>;
type SnapshotSection = "conSaldo" | "canceladas";

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

const baseFilter = (params: { section?: string | null; ubicacion?: string | null; sucursal?: string | null }) => {
  const filter: Record<string, unknown> = { entregada: false };
  filter.fechaCancelacion = normalizeSection(params.section) === "canceladas" ? { $ne: null } : null;
  const ubicacion = trim(params.ubicacion);
  const sucursal = trim(params.sucursal);
  if (ubicacion) filter.ubicacion = ubicacion;
  if (sucursal) filter.sucursal = sucursal;
  return filter;
};

const serialize = (item: any) => ({
  codigoOperacion: Number(item.codigoOperacion),
  clienteNombre: item.clienteNombre ?? "",
  vendedor: item.vendedor ?? "",
  sucursal: item.sucursal ?? "SIN SUCURSAL",
  usuarioOperacion: item.usuarioOperacion ?? "",
  nombreUsuarioOperacion: item.nombreUsuarioOperacion ?? "",
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
  saldo: calculateSaldo(item),
  sincronizadoEn: item.sincronizadoEn?.toISOString?.() ?? null,
});

export class SaldoOperacionSnapshotService {
  static async syncFromSiac() {
    const [sourceRows, ubicacionRows] = await Promise.all([
      sequelizeNIC.query<SourceRow>(saldoOperacionSnapshotSourceQuery(), { type: QueryTypes.SELECT }),
      sequelizeNIC.query<SourceRow>(saldoOperacionUbicacionesQuery(), { type: QueryTypes.SELECT }),
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
          usuarioOperacion: trim(row.usuario_operacion),
          nombreUsuarioOperacion: trim(row.nombre_usuario_operacion),
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

    return { total: operations.length, createdOrUpdated: operations.length, entregadas };
  }

  static async list(params: { section?: string | null; ubicacion?: string | null; sucursal?: string | null; page: number; limit: number }) {
    const filter = baseFilter(params);
    const page = Math.max(1, params.page);
    const limit = Math.min(200, Math.max(1, params.limit));
    const rows = await SaldoOperacionSnapshot.find(filter).lean();
    const sorted = rows.sort((a, b) => calculateSaldo(a) - calculateSaldo(b) || a.codigoOperacion - b.codigoOperacion);
    const start = (page - 1) * limit;
    return {
      data: sorted.slice(start, start + limit).map(serialize),
      pagination: { page, limit, total: sorted.length, totalPages: Math.max(1, Math.ceil(sorted.length / limit)), hasNextPage: start + limit < sorted.length },
    };
  }

  static async filters() {
    const rows = await SaldoOperacionSnapshot.find({ entregada: false }, { sucursal: 1, ubicacion: 1 }).lean();
    return {
      meta: {
        sucursales: [...new Set(rows.map((item) => trim(item.sucursal, "SIN SUCURSAL")))].sort(),
        ubicaciones: [...new Set(rows.map((item) => trim(item.ubicacion, "STOCK CONCESIONARIO")))].sort(),
      },
    };
  }

  static async summary(params: { ubicacion?: string | null; sucursal?: string | null }) {
    const rows = await SaldoOperacionSnapshot.find({ ...baseFilter({ ...params, section: "conSaldo" }) }).lean();
    const grouped = new Map<string, number>();
    let creditoTotal = 0;
    let usadoTotal = 0;
    rows.forEach((row) => {
      const modelo = trim(row.modeloGeneral, "SIN MODELO");
      grouped.set(modelo, (grouped.get(modelo) ?? 0) + calculateSaldo(row));
      creditoTotal += row.creditoBanco ?? 0;
      usadoTotal += row.usado ?? 0;
    });
    return {
      data: [...grouped.entries()].map(([modelo, saldo]) => ({ modelo, saldo })).sort((a, b) => b.saldo - a.saldo),
      creditoTotal,
      usadoTotal,
    };
  }

  static async exportRows(params: { section?: string | null; ubicacion?: string | null; sucursal?: string | null }) {
    const rows = await SaldoOperacionSnapshot.find(baseFilter(params)).lean();
    return rows.sort((a, b) => calculateSaldo(a) - calculateSaldo(b) || a.codigoOperacion - b.codigoOperacion).map(serialize);
  }

  static async updateFechaCancelacion(codigoOperacion: number, fechaCancelacion: string) {
    if (!dateOnlyOrNull(fechaCancelacion)) throw new Error("La fecha de cancelacion debe ser una fecha valida con formato AAAA-MM-DD");
    const snapshot = await SaldoOperacionSnapshot.findOne({ codigoOperacion, entregada: false });
    if (!snapshot) throw new Error("La operacion no existe en el snapshot activo");
    if (!snapshot.fechaAsignacion) throw new Error("La operacion no tiene una fecha de asignacion valida en SIAC");
    const diasHastaCancelacion = calculateDays(snapshot.fechaAsignacion, fechaCancelacion);
    if (diasHastaCancelacion < 0) throw new Error("La fecha de cancelacion no puede ser anterior a la fecha de asignacion");
    snapshot.fechaCancelacion = fechaCancelacion;
    snapshot.diasHastaCancelacion = diasHastaCancelacion;
    await snapshot.save();
    return serialize(snapshot);
  }
}
