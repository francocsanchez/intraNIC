import { QueryTypes } from "sequelize";
import { sequelizeNIC } from "../config/database";

type CobranzaDiariaRow = {
  dia: number;
  efectivo: number | null;
  acreditacionBancaria: number | null;
  tarjetas: number | null;
  chequesTerceros: number | null;
  chequesPropios: number | null;
  retenciones: number | null;
  divisas: number | null;
  documentos: number | null;
  prenda: number | null;
  compensaciones: number | null;
  certificados: number | null;
  total: number | null;
};

export type CobranzaDiaria = {
  dia: number;
  efectivo: number;
  acreditacionBancaria: number;
  tarjetas: number;
  chequesTerceros: number;
  chequesPropios: number;
  retenciones: number;
  divisas: number;
  documentos: number;
  prenda: number;
  compensaciones: number;
  certificados: number;
  total: number;
};

type CobranzaDetalleRow = {
  codigoOperacion: number | string;
  cliente: string | null;
  modelo: string | null;
  version: string | null;
  monto: number | null;
};

export type CobranzaDetalle = {
  codigoOperacion: number;
  cliente: string;
  modelo: string;
  version: string;
  monto: number;
};

type CobranzaReciboRow = {
  fecha: string;
  comprobante: number | string;
  efectivo: number | null;
  acreditacionBancaria: number | null;
  tarjetas: number | null;
  chequesTerceros: number | null;
  chequesPropios: number | null;
  retenciones: number | null;
  documentos: number | null;
  prenda: number | null;
  compensaciones: number | null;
  certificados: number | null;
  total: number | null;
};

export type CobranzaRecibo = {
  fecha: string;
  comprobante: number;
  efectivo: number;
  acreditacionBancaria: number;
  tarjetas: number;
  chequesTerceros: number;
  chequesPropios: number;
  retenciones: number;
  documentos: number;
  prenda: number;
  compensaciones: number;
  certificados: number;
  total: number;
};

const getMonthBounds = (anio: number, mes: number) => ({
  inicio: new Date(Date.UTC(anio, mes - 1, 1)).toISOString().slice(0, 10),
  fin: new Date(Date.UTC(anio, mes, 1)).toISOString().slice(0, 10),
});

const toNumber = (value: unknown) => Number(value ?? 0);

const totalRecibo = `
  ISNULL(mc_impefe, 0) + ISNULL(mc_impban, 0) + ISNULL(mc_imptar, 0)
  + ISNULL(mc_impchen, 0) + ISNULL(mc_impchep, 0) + ISNULL(mc_impret, 0)
  + ISNULL(mc_impext, 0) + ISNULL(mc_impdoc, 0) + ISNULL(mc_imppda, 0)
  + ISNULL(mc_compensa, 0) + ISNULL(mc_impcer, 0)`;

const cobranzaDiariaQuery = `
WITH operaciones_elegibles AS (
  SELECT o.ope_codigo, o.ope_tipo
  FROM dbo.opera o
  INNER JOIN dbo.stoauto s
    ON s.sa_codigo = o.ope_stoauto
    AND s.sa_tipo = o.ope_tipo
  WHERE o.ope_tipo = 5
    AND o.ope_fecbaj IS NULL
    AND o.ope_fecasig IS NOT NULL
    AND s.sa_nrofab LIKE 'NIC%'
),
recibos_imputados AS (
  SELECT DISTINCT
    o.ope_codigo,
    h.mc_nroope,
    h.mc_fecha,
    h.mc_impefe,
    h.mc_impban,
    h.mc_imptar,
    h.mc_impchen,
    h.mc_impchep,
    h.mc_impret,
    h.mc_impext,
    h.mc_impdoc,
    h.mc_imppda,
    h.mc_compensa,
    h.mc_impcer
  FROM operaciones_elegibles o
  INNER JOIN dbo.salglo g
    ON g.sgl_opera = o.ope_codigo
    AND g.sgl_tipo = o.ope_tipo
    AND g.sgl_tipmov = 105
    AND g.sgl_haber > 0
  INNER JOIN dbo.movcajh h ON h.mc_nroope = g.sgl_nroope
  WHERE h.mc_fecha >= :inicio
    AND h.mc_fecha < :fin
)
SELECT
  DAY(mc_fecha) AS dia,
  SUM(ISNULL(mc_impefe, 0)) AS efectivo,
  SUM(ISNULL(mc_impban, 0)) AS acreditacionBancaria,
  SUM(ISNULL(mc_imptar, 0)) AS tarjetas,
  SUM(ISNULL(mc_impchen, 0)) AS chequesTerceros,
  SUM(ISNULL(mc_impchep, 0)) AS chequesPropios,
  SUM(ISNULL(mc_impret, 0)) AS retenciones,
  SUM(ISNULL(mc_impext, 0)) AS divisas,
  SUM(ISNULL(mc_impdoc, 0)) AS documentos,
  SUM(ISNULL(mc_imppda, 0)) AS prenda,
  SUM(ISNULL(mc_compensa, 0)) AS compensaciones,
  SUM(ISNULL(mc_impcer, 0)) AS certificados,
  SUM(${totalRecibo}) AS total
FROM recibos_imputados
GROUP BY DAY(mc_fecha)
ORDER BY dia;
`;

const cobranzaDetalleOperacionesQuery = `
WITH operaciones_elegibles AS (
  SELECT
    o.ope_codigo,
    o.ope_tipo,
    LTRIM(RTRIM(c.cli_nombre)) AS cliente,
    LTRIM(RTRIM(ISNULL(f.fam_nombre, ''))) AS modelo,
    LTRIM(RTRIM(ISNULL(a.au_nombre, ''))) AS version
  FROM dbo.opera o
  INNER JOIN dbo.stoauto s
    ON s.sa_codigo = o.ope_stoauto
    AND s.sa_tipo = o.ope_tipo
  INNER JOIN dbo.cliente c ON c.cli_codigo = o.ope_cliente
  LEFT JOIN dbo.auto a
    ON a.au_codigo = o.ope_auto
    AND a.au_marca = o.ope_marca
  LEFT JOIN dbo.famiauto f ON f.fam_codigo = a.au_familia
  WHERE o.ope_tipo = 5
    AND o.ope_fecbaj IS NULL
    AND o.ope_fecasig IS NOT NULL
    AND s.sa_nrofab LIKE 'NIC%'
),
recibos_imputados AS (
  SELECT DISTINCT
    e.ope_codigo,
    e.cliente,
    e.modelo,
    e.version,
    h.mc_nroope,
    h.mc_impefe,
    h.mc_impban,
    h.mc_imptar,
    h.mc_impchen,
    h.mc_impchep,
    h.mc_impret,
    h.mc_impext,
    h.mc_impdoc,
    h.mc_imppda,
    h.mc_compensa,
    h.mc_impcer
  FROM operaciones_elegibles e
  INNER JOIN dbo.salglo g
    ON g.sgl_opera = e.ope_codigo
    AND g.sgl_tipo = e.ope_tipo
    AND g.sgl_tipmov = 105
    AND g.sgl_haber > 0
  INNER JOIN dbo.movcajh h ON h.mc_nroope = g.sgl_nroope
  WHERE h.mc_fecha >= :inicio
    AND h.mc_fecha < :fin
    AND DAY(h.mc_fecha) = :dia
)
SELECT
  ope_codigo AS codigoOperacion,
  cliente,
  modelo,
  version,
  SUM(${totalRecibo}) AS monto
FROM recibos_imputados
GROUP BY ope_codigo, cliente, modelo, version
ORDER BY ope_codigo;
`;

const cobranzaRecibosOperacionQuery = `
WITH operacion_elegible AS (
  SELECT o.ope_codigo, o.ope_tipo
  FROM dbo.opera o
  INNER JOIN dbo.stoauto s
    ON s.sa_codigo = o.ope_stoauto
    AND s.sa_tipo = o.ope_tipo
  WHERE o.ope_codigo = :operacion
    AND o.ope_tipo = 5
    AND o.ope_fecbaj IS NULL
    AND o.ope_fecasig IS NOT NULL
    AND s.sa_nrofab LIKE 'NIC%'
)
SELECT DISTINCT
  CONVERT(char(10), h.mc_fecha, 23) AS fecha,
  h.mc_nromov AS comprobante,
  h.mc_impefe AS efectivo,
  h.mc_impban AS acreditacionBancaria,
  h.mc_imptar AS tarjetas,
  h.mc_impchen AS chequesTerceros,
  h.mc_impchep AS chequesPropios,
  h.mc_impret AS retenciones,
  h.mc_impdoc AS documentos,
  h.mc_imppda AS prenda,
  h.mc_compensa AS compensaciones,
  h.mc_impcer AS certificados,
  ${totalRecibo} AS total
FROM operacion_elegible o
INNER JOIN dbo.salglo g
  ON g.sgl_opera = o.ope_codigo
  AND g.sgl_tipo = o.ope_tipo
  AND g.sgl_tipmov = 105
  AND g.sgl_haber > 0
INNER JOIN dbo.movcajh h ON h.mc_nroope = g.sgl_nroope
ORDER BY fecha, comprobante;
`;

export class TableroCobranzasService {
  static async getDiario(anio: number, mes: number) {
    const { inicio, fin } = getMonthBounds(anio, mes);
    const rows = await sequelizeNIC.query<CobranzaDiariaRow>(cobranzaDiariaQuery, {
      type: QueryTypes.SELECT,
      replacements: { inicio, fin },
    });
    const byDay = new Map(rows.map((row) => [Number(row.dia), row]));

    const dias = Array.from({ length: 31 }, (_, index): CobranzaDiaria => {
      const row = byDay.get(index + 1);
      return {
        dia: index + 1,
        efectivo: toNumber(row?.efectivo),
        acreditacionBancaria: toNumber(row?.acreditacionBancaria),
        tarjetas: toNumber(row?.tarjetas),
        chequesTerceros: toNumber(row?.chequesTerceros),
        chequesPropios: toNumber(row?.chequesPropios),
        retenciones: toNumber(row?.retenciones),
        divisas: toNumber(row?.divisas),
        documentos: toNumber(row?.documentos),
        prenda: toNumber(row?.prenda),
        compensaciones: toNumber(row?.compensaciones),
        certificados: toNumber(row?.certificados),
        total: toNumber(row?.total),
      };
    });

    return { anio, mes, dias };
  }

  static async getDetalleDiario(anio: number, mes: number, dia: number) {
    const { inicio, fin } = getMonthBounds(anio, mes);
    const rows = await sequelizeNIC.query<CobranzaDetalleRow>(cobranzaDetalleOperacionesQuery, {
      type: QueryTypes.SELECT,
      replacements: { inicio, fin, dia },
    });

    const operaciones: CobranzaDetalle[] = rows.map((row) => ({
      codigoOperacion: Number(row.codigoOperacion),
      cliente: row.cliente?.trim() || "-",
      modelo: row.modelo?.trim() || "-",
      version: row.version?.trim() || "-",
      monto: toNumber(row.monto),
    }));

    return { anio, mes, dia, operaciones };
  }

  static async getRecibosOperacion(operacion: number) {
    const rows = await sequelizeNIC.query<CobranzaReciboRow>(cobranzaRecibosOperacionQuery, {
      type: QueryTypes.SELECT,
      replacements: { operacion },
    });

    const recibos: CobranzaRecibo[] = rows.map((row) => ({
      fecha: row.fecha,
      comprobante: Number(row.comprobante),
      efectivo: toNumber(row.efectivo),
      acreditacionBancaria: toNumber(row.acreditacionBancaria),
      tarjetas: toNumber(row.tarjetas),
      chequesTerceros: toNumber(row.chequesTerceros),
      chequesPropios: toNumber(row.chequesPropios),
      retenciones: toNumber(row.retenciones),
      documentos: toNumber(row.documentos),
      prenda: toNumber(row.prenda),
      compensaciones: toNumber(row.compensaciones),
      certificados: toNumber(row.certificados),
      total: toNumber(row.total),
    }));

    return { operacion, recibos };
  }
}
