const ssiVentasBaseQuery = `
FROM libivav lib
LEFT JOIN opera o
  ON o.ope_codigo = lib.li_opera
  AND o.ope_tipo = lib.li_tipo
LEFT JOIN cliente c
  ON c.cli_codigo = o.ope_cliente
LEFT JOIN vendedor v
  ON v.ven_codigo = o.ope_vende
LEFT JOIN sucursal s
  ON s.suc_codigo = o.ope_sucur
LEFT JOIN auto
  ON o.ope_auto = auto.au_codigo
  AND o.ope_marca = auto.au_marca
INNER JOIN famiauto
  ON auto.au_familia = famiauto.fam_codigo
WHERE
  lib.li_tipmov = 205
  AND lib.li_tipo = 5
  AND lib.li_fecha >= '2026-01-01'
`;

const ssiVentasSelect = `
SELECT
  lib.li_opera AS "operacion",
  CONVERT(VARCHAR(10), lib.li_fecha, 23) AS "fechaEntrega",
  v.ven_codigo AS "vendedorCodigo",
  v.ven_nombre AS "vendedor",
  c.cli_nombre AS "cliente",
  c.cli_telefo AS "telefonoCliente",
  famiauto.fam_nombre AS "modelo",
  s.suc_nombre AS "sucursal"
`;

export const ssiVentasListQuery = () => `
${ssiVentasSelect}
${ssiVentasBaseQuery}
  AND CONVERT(date, lib.li_fecha) = :deliveryDate
ORDER BY
  lib.li_fecha DESC
OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY;
`;

export const ssiVentasCountQuery = () => `
SELECT COUNT(*) AS total
${ssiVentasBaseQuery}
  AND CONVERT(date, lib.li_fecha) = :deliveryDate;
`;

export const ssiVentasByOperacionQuery = () => `
${ssiVentasSelect}
${ssiVentasBaseQuery}
  AND lib.li_opera = :operacion
ORDER BY
  lib.li_fecha DESC;
`;
