import { QueryTypes } from "sequelize";
import { sequelizeNIC } from "../config/database";
import { getVendedoresActivosNuevoNic } from "../controllers/querys/dms.query";

type VendedorRow = { vendedor: string; codigo: number | string };
type CobroRow = {
  codigoOperacion: number | string;
  numeroFabrica: string | null;
  cliente: string | null;
  modelo: string | null;
  version: string | null;
  total: number | null;
  anticipos: number | null;
  deudoresVarios: number | null;
  recibosDeudores: number | null;
  usado: number | null;
};
type CobroDetalleOperacionRow = {
  codigoOperacion: number | string;
  clienteCodigo: number | string;
  fechaFactura: Date | string | null;
  fechaAsignacion: Date | string | null;
  venta: number | null;
  gestoria: number | null;
  bonificacion: number | null;
  credito: number | null;
  usado: number | null;
};
type ReciboDetalleRow = { fecha: Date | string | null; caja: number | string | null; comprobante: number | string | null; importe: number | null };

const totalRecibo = `
  ISNULL(mc_impefe, 0) + ISNULL(mc_impban, 0) + ISNULL(mc_imptar, 0)
  + ISNULL(mc_impchen, 0) + ISNULL(mc_impchep, 0) + ISNULL(mc_impret, 0)
  + ISNULL(mc_impext, 0) + ISNULL(mc_impdoc, 0) + ISNULL(mc_imppda, 0)
  + ISNULL(mc_compensa, 0) + ISNULL(mc_impcer, 0)`;

const cobrosVendedorRowsQuery = `
WITH recibos_anticipo AS (
  SELECT DISTINCT
    g.sgl_opera AS codigo_operacion,
    h.mc_nroope,
    h.mc_impefe, h.mc_impban, h.mc_imptar, h.mc_impchen, h.mc_impchep,
    h.mc_impret, h.mc_impext, h.mc_impdoc, h.mc_imppda, h.mc_compensa, h.mc_impcer
  FROM dbo.salglo g
  INNER JOIN dbo.movcajh h ON h.mc_nroope = g.sgl_nroope
  WHERE g.sgl_tipo = 5
    AND g.sgl_tipmov = 105
    AND g.sgl_haber > 0
), recibos_deudores AS (
  SELECT
    g.sgl_cuenta AS clienteCodigo,
    g.sgl_fecmov AS fechaRecibo,
    g.sgl_haber AS importe
  FROM dbo.salglo g
  WHERE g.sgl_tipo = 50
    AND g.sgl_tipmov = 115
    AND g.sgl_opera = 0
    AND g.sgl_haber > 0
), operaciones AS (
  SELECT
    o.ope_codigo AS codigoOperacion,
    o.ope_cliente AS clienteCodigo,
    o.ope_fecfac AS fechaFactura,
    o.ope_fecasig AS fechaAsignacion,
    s.sa_nrofab AS numeroFabrica,
    LTRIM(RTRIM(ISNULL(c.cli_nombre, '-'))) AS cliente,
    LTRIM(RTRIM(ISNULL(f.fam_nombre, ''))) AS modelo,
    LTRIM(RTRIM(ISNULL(a.au_nombre, ''))) AS version,
    ISNULL(csq.Pcio_Venta, 0) + ISNULL(csq.gestoria, 0) - ISNULL(csq.Bonif_Venta, 0) AS total,
    ISNULL(SUM(${totalRecibo}), 0) AS anticipos,
    ISNULL(MAX(csq.total_Cred_banco), 0) AS deudoresVarios,
    ISNULL(MAX(csq.Usado), 0) AS usado
  FROM dbo.opera o
  INNER JOIN dbo.stoauto s ON s.sa_codigo = o.ope_stoauto AND s.sa_tipo = o.ope_tipo
  LEFT JOIN dbo.csqUnidades csq ON csq.Codigo_operacion = o.ope_codigo
  LEFT JOIN dbo.cliente c ON c.cli_codigo = o.ope_cliente
  LEFT JOIN dbo.auto a ON a.au_codigo = o.ope_auto AND a.au_marca = o.ope_marca
  LEFT JOIN dbo.famiauto f ON f.fam_codigo = a.au_familia
  LEFT JOIN recibos_anticipo r ON r.codigo_operacion = o.ope_codigo
  WHERE o.ope_tipo = 5
    AND o.ope_fecbaj IS NULL
    AND (
      (:operacion > 0 AND o.ope_codigo = :operacion)
      OR (
        :operacion = 0
        AND o.ope_fecasig >= DATEFROMPARTS(:anio, :mes, 1)
        AND o.ope_fecasig < DATEADD(MONTH, 1, DATEFROMPARTS(:anio, :mes, 1))
        AND o.ope_vende = :vendedor
      )
    )
    AND s.sa_nrofab LIKE 'NIC%'
  GROUP BY o.ope_codigo, o.ope_cliente, o.ope_fecfac, o.ope_fecasig, s.sa_nrofab, c.cli_nombre, f.fam_nombre, a.au_nombre, csq.Pcio_Venta, csq.gestoria, csq.Bonif_Venta
), operaciones_con_deudores AS (
  SELECT
    o.codigoOperacion, o.numeroFabrica, o.cliente, o.modelo, o.version, o.total, o.anticipos, o.deudoresVarios, o.usado,
    ISNULL(MAX(r.importe), 0) AS recibosDeudores
  FROM operaciones o
  LEFT JOIN recibos_deudores r ON r.clienteCodigo = o.clienteCodigo
    AND r.fechaRecibo >= ISNULL(o.fechaFactura, o.fechaAsignacion)
    AND r.importe = o.total - o.anticipos - o.usado
  GROUP BY o.codigoOperacion, o.numeroFabrica, o.cliente, o.modelo, o.version, o.total, o.anticipos, o.deudoresVarios, o.usado
)
SELECT *
FROM operaciones_con_deudores
ORDER BY codigoOperacion DESC
OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY;
`;

const cobrosVendedorCountQuery = `
SELECT COUNT(*) AS total
FROM dbo.opera o
INNER JOIN dbo.stoauto s ON s.sa_codigo = o.ope_stoauto AND s.sa_tipo = o.ope_tipo
WHERE o.ope_tipo = 5
  AND o.ope_fecbaj IS NULL
  AND (
    (:operacion > 0 AND o.ope_codigo = :operacion)
    OR (
      :operacion = 0
      AND o.ope_fecasig >= DATEFROMPARTS(:anio, :mes, 1)
      AND o.ope_fecasig < DATEADD(MONTH, 1, DATEFROMPARTS(:anio, :mes, 1))
      AND o.ope_vende = :vendedor
    )
  )
  AND s.sa_nrofab LIKE 'NIC%';
`;

const cobrosVendedorDetalleOperacionQuery = `
SELECT
  o.ope_codigo AS codigoOperacion,
  o.ope_cliente AS clienteCodigo,
  o.ope_fecfac AS fechaFactura,
  o.ope_fecasig AS fechaAsignacion,
  ISNULL(csq.Pcio_Venta, 0) AS venta,
  ISNULL(csq.gestoria, 0) AS gestoria,
  ISNULL(csq.Bonif_Venta, 0) AS bonificacion,
  ISNULL(csq.total_Cred_banco, 0) AS credito,
  ISNULL(csq.Usado, 0) AS usado
FROM dbo.opera o
LEFT JOIN dbo.csqUnidades csq ON csq.Codigo_operacion = o.ope_codigo
WHERE o.ope_tipo = 5
  AND o.ope_codigo = :codigoOperacion;
`;

const cobrosVendedorDetalleAnticiposQuery = `
SELECT DISTINCT
  h.mc_fecha AS fecha,
  h.mc_caja AS caja,
  h.mc_nromov AS comprobante,
  ${totalRecibo} AS importe
FROM dbo.salglo g
INNER JOIN dbo.movcajh h ON h.mc_nroope = g.sgl_nroope
WHERE g.sgl_opera = :codigoOperacion
  AND g.sgl_tipo = 5
  AND g.sgl_tipmov = 105
  AND g.sgl_haber > 0
ORDER BY h.mc_fecha, h.mc_nromov;
`;

const cobrosVendedorDetalleDeudoresQuery = `
SELECT
  g.sgl_fecmov AS fecha,
  g.sgl_ptovta AS caja,
  g.sgl_nrocom AS comprobante,
  g.sgl_haber AS importe
FROM dbo.salglo g
WHERE g.sgl_cuenta = :clienteCodigo
  AND g.sgl_tipo = 50
  AND g.sgl_tipmov = 115
  AND g.sgl_opera = 0
  AND g.sgl_haber > 0
  AND g.sgl_fecmov >= CONVERT(datetime, REPLACE(:fechaDesde, '-', ''), 112)
  AND g.sgl_haber = :importePendiente
ORDER BY g.sgl_fecmov, g.sgl_nrocom;
`;

const toNumber = (value: unknown) => Number(value ?? 0);

export class CobrosVendedorService {
  static async searchVendedores(busqueda: string) {
    const query = busqueda.trim().toLocaleLowerCase("es");
    if (query.length < 3) return { data: [] };
    const rows = await sequelizeNIC.query<VendedorRow>(getVendedoresActivosNuevoNic(), { type: QueryTypes.SELECT });
    return {
      data: rows
        .filter((row) => row.vendedor.trim().toLocaleLowerCase("es").includes(query))
        .slice(0, 20)
        .map((row) => ({ codigo: Number(row.codigo), vendedor: row.vendedor.trim() })),
    };
  }

  static async list(params: { vendedor?: number; anio?: number; mes?: number; operacion?: number; page: number; limit: number }) {
    const page = Math.max(1, params.page);
    const limit = Math.min(200, Math.max(1, params.limit));
    const replacements = { vendedor: params.vendedor ?? 0, anio: params.anio ?? 2000, mes: params.mes ?? 1, operacion: params.operacion ?? 0 };
    const [rows, countRows] = await Promise.all([
      sequelizeNIC.query<CobroRow>(cobrosVendedorRowsQuery, { type: QueryTypes.SELECT, replacements: { ...replacements, offset: (page - 1) * limit, limit } }),
      sequelizeNIC.query<{ total: number | string }>(cobrosVendedorCountQuery, { type: QueryTypes.SELECT, replacements }),
    ]);
    const total = Number(countRows[0]?.total ?? 0);
    return {
      data: rows.map((row) => {
        const totalOperacion = toNumber(row.total);
        const anticipos = toNumber(row.anticipos);
        const deudoresVarios = toNumber(row.deudoresVarios);
        const recibosDeudores = toNumber(row.recibosDeudores);
        const usado = toNumber(row.usado);
        const cobrado = anticipos + Math.max(deudoresVarios, recibosDeudores);
        return {
          codigoOperacion: Number(row.codigoOperacion), numeroFabrica: row.numeroFabrica?.trim() ?? "", cliente: row.cliente?.trim() || "-",
          modelo: row.modelo?.trim() || "", version: row.version?.trim() || "", total: totalOperacion, cobrado, usado,
          saldo: totalOperacion - cobrado - usado,
        };
      }),
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)), hasNextPage: page * limit < total },
    };
  }

  static async detail(codigoOperacion: number) {
    const [operacion] = await sequelizeNIC.query<CobroDetalleOperacionRow>(cobrosVendedorDetalleOperacionQuery, {
      type: QueryTypes.SELECT, replacements: { codigoOperacion },
    });
    if (!operacion) throw new Error("La operación no existe o no corresponde a una venta nueva");

    const recibosAnticipos = await sequelizeNIC.query<ReciboDetalleRow>(cobrosVendedorDetalleAnticiposQuery, {
      type: QueryTypes.SELECT, replacements: { codigoOperacion },
    });
    const venta = toNumber(operacion.venta);
    const gestoria = toNumber(operacion.gestoria);
    const bonificacion = toNumber(operacion.bonificacion);
    const credito = toNumber(operacion.credito);
    const usado = toNumber(operacion.usado);
    const total = venta + gestoria - bonificacion;
    const anticipos = recibosAnticipos.reduce((sum, recibo) => sum + toNumber(recibo.importe), 0);
    const importePendiente = total - anticipos - usado;
    const fechaDesdeRaw = operacion.fechaFactura ?? operacion.fechaAsignacion;
    const fechaDesde = fechaDesdeRaw ? new Date(fechaDesdeRaw).toISOString().slice(0, 10) : null;
    const recibosDeudores = importePendiente > 0 && fechaDesde
      ? await sequelizeNIC.query<ReciboDetalleRow>(cobrosVendedorDetalleDeudoresQuery, {
        type: QueryTypes.SELECT,
        replacements: { clienteCodigo: Number(operacion.clienteCodigo), fechaDesde, importePendiente },
      })
      : [];
    const deudoresPorRecibo = recibosDeudores.reduce((sum, recibo) => sum + toNumber(recibo.importe), 0);
    const deudoresVarios = Math.max(credito, deudoresPorRecibo);
    const cobrado = anticipos + deudoresVarios;

    return {
      data: {
        codigoOperacion: Number(operacion.codigoOperacion), venta, gestoria, bonificacion, total, anticipos,
        recibosAnticipos: recibosAnticipos.map((recibo) => ({ fecha: recibo.fecha ? new Date(recibo.fecha).toISOString() : null, caja: Number(recibo.caja ?? 0), comprobante: Number(recibo.comprobante ?? 0), importe: toNumber(recibo.importe) })),
        deudoresVarios,
        recibosDeudores: recibosDeudores.map((recibo) => ({ fecha: recibo.fecha ? new Date(recibo.fecha).toISOString() : null, caja: Number(recibo.caja ?? 0), comprobante: Number(recibo.comprobante ?? 0), importe: toNumber(recibo.importe) })),
        usado, credito, cobrado, saldo: total - cobrado - usado,
      },
    };
  }
}
