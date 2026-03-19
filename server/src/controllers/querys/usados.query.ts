export const stockUsadoQuery = (vendedoresDisponible: string[]) => `
SELECT
	stoauto.sa_codigo AS "interno",
	auto.au_nombre AS "version",
	marca.mar_nombre as "marca",
	stoauto.sa_observa as "observaciones",
	anexusa.aus_color as color,
	anexusa.aus_anio as anio,
	anexusa.aus_precio as precioVenta,
	anexusa.aus_fecrep as fechaRecepcion,
	anexusa.aus_km as kilometros
FROM
	reserva
INNER JOIN stoauto ON
	reserva.res_stoauto = stoauto.sa_codigo
	AND reserva.res_tipo = stoauto.sa_tipo
INNER JOIN auto ON
	auto.au_codigo = stoauto.sa_auto
	AND auto.au_marca = stoauto.sa_marca
INNER JOIN anexusa ON
	anexusa.aus_codigo = stoauto.sa_codigo
INNER JOIN marca ON
	marca.mar_codigo = auto.au_marca
INNER JOIN vendedor ON
	reserva.res_vendedor = vendedor.ven_codigo
WHERE
    reserva.res_vendedor IN (${vendedoresDisponible})
	AND reserva.res_tipo = 10
	AND reserva.res_anulada = 0
ORDER BY
	marca.mar_nombre,
    auto.au_nombre
    `;

export const reservasUsadoQuery = (vendedoresReservas: string[]) => `
SELECT
	reserva.res_stoauto AS "interno",
	ISNULL(auto.au_nombre, '') AS "version",
	ISNULL(auto.au_nombre, '') AS "modelo",
	ISNULL(marca.mar_nombre, '') AS "marca",
	CAST('' AS VARCHAR(255)) AS "observaciones",
	ISNULL(anexusa.aus_color, '') AS "color",
	ISNULL(anexusa.aus_anio, 0) AS "anio",
	ISNULL(anexusa.aus_precio, 0) AS "precioVenta",
	ISNULL(CONVERT(VARCHAR(30), anexusa.aus_fecrep, 126), '') AS "fechaRecepcion",
	ISNULL(anexusa.aus_km, 0) AS "kilometros",
	ISNULL(vendedor.ven_nombre, '') AS "vendedorReserva",
	ISNULL(sucursal.suc_nombre, 'SIN ASIGNAR') AS "sucursal"
FROM
	reserva
INNER JOIN stoauto ON
	reserva.res_stoauto = stoauto.sa_codigo
	AND reserva.res_tipo = stoauto.sa_tipo
INNER JOIN auto ON
	auto.au_codigo = stoauto.sa_auto
	AND auto.au_marca = stoauto.sa_marca
INNER JOIN marca ON
	marca.mar_codigo = auto.au_marca
INNER JOIN anexusa ON
	anexusa.aus_codigo = stoauto.sa_codigo
INNER JOIN vendedor ON
	reserva.res_vendedor = vendedor.ven_codigo
LEFT JOIN sucursal ON
	vendedor.ven_sucur = sucursal.suc_codigo
WHERE
	reserva.res_vendedor IN (${vendedoresReservas})
	AND reserva.res_tipo = 10
	AND reserva.res_anulada = 0
ORDER BY
	marca.mar_nombre,
	auto.au_nombre
`;

export const reservasSucursalesUsadoQuery = (vendedoresReservas: string[]) => `
SELECT
  ISNULL(sucursal.suc_nombre, 'SIN ASIGNAR') AS sucursal,
  COUNT(*) AS cantidad
FROM
  stoauto
INNER JOIN movnped ON
  stoauto.sa_codigo = movnped.mnp_stoauto
INNER JOIN auto ON
  stoauto.sa_auto = auto.au_codigo
  AND stoauto.sa_marca = auto.au_marca
INNER JOIN famiauto ON
  auto.au_familia = famiauto.fam_codigo
INNER JOIN reserva ON
  stoauto.sa_codigo = reserva.res_stoauto
  AND stoauto.sa_tipo = reserva.res_tipo
INNER JOIN vendedor ON
  reserva.res_vendedor = vendedor.ven_codigo
INNER JOIN color ON
  movnped.mnp_col1 = color.col_codigo
LEFT JOIN sucursal ON
  vendedor.ven_sucur = sucursal.suc_codigo
WHERE
  reserva.res_anulada = 0
  AND reserva.res_tipo = 5
  AND reserva.res_vendedor IN (${vendedoresReservas})
GROUP BY
  sucursal.suc_nombre
ORDER BY
  sucursal.suc_nombre
`;

export const misReservasUsadoQuery = (numeroVendedor: number) => `
SELECT
    stoauto.sa_codigo as "interno",
    vendedor.ven_nombre as "vendedorReserva",
    auto.au_nombre as "version",
    famiauto.fam_nombre as "modelo",
    color.col_nombre AS "color",
    CASE
        WHEN stoauto.sa_estado IN (5, 10, 15) THEN 'STOCK CONCESIONARIO'
        WHEN movnped.mnp_status IN ('STOCK CONCESIONARIO', 'TRANSITO TASA-CONCESIONARIO') THEN 'FURLONG'
        ELSE movnped.mnp_status
    END AS "ubicacion",
    ISNULL(movnped.mnp_chasis, '-') AS "chasis",
    sucursal.suc_nombre AS "sucursal",
    reserva.res_fecregistro AS "fechaReserva",
    DATEADD(DAY, 5, movnped.mnp_fecrec) AS "fechaRecepcion"
FROM
    stoauto
INNER JOIN movnped ON
    stoauto.sa_codigo = movnped.mnp_stoauto
INNER JOIN auto ON
    stoauto.sa_auto = auto.au_codigo
    AND stoauto.sa_marca = auto.au_marca
INNER JOIN famiauto ON
    auto.au_familia = famiauto.fam_codigo
INNER JOIN reserva ON
    stoauto.sa_codigo = reserva.res_stoauto
    AND stoauto.sa_tipo = reserva.res_tipo
INNER JOIN vendedor ON
    reserva.res_vendedor = vendedor.ven_codigo
INNER JOIN color ON
    movnped.mnp_col1 = color.col_codigo
INNER JOIN sucursal ON
    vendedor.ven_sucur = sucursal.suc_codigo
WHERE
    reserva.res_anulada = 0
    AND reserva.res_tipo = 5
    AND reserva.res_vendedor IN (${numeroVendedor})
ORDER BY
    sucursal.suc_nombre,
    vendedor.ven_nombre,
    famiauto.fam_nombre,
    auto.au_nombre
`;

export const miListaDeEsperaUsadoQuery = (numeroVendedor: number) => `
SELECT
    ope.ope_codigo as "opera",
    ope.ope_fecha as "fecha",
    cli.cli_nombre as "clienteNombre",
    auto.au_nombre AS "version",
    color1.col_nombre as "color1",
    color2.col_nombre as "color2",
    famiauto.fam_nombre AS "modelo"
FROM
    opera ope
INNER JOIN cliente cli ON
    ope.ope_cliente = cli.cli_codigo
INNER JOIN auto ON
    auto.au_codigo = ope.ope_auto
    AND auto.au_marca = ope.ope_marca
INNER JOIN color color1 ON
    ope.ope_col1 = color1.col_codigo
LEFT JOIN color color2 ON
    ope.ope_col2 = color2.col_codigo
INNER JOIN famiauto ON
    auto.au_familia = famiauto.fam_codigo
WHERE
    ope.ope_fecbaj IS NULL
    AND
        ope.ope_vende = ${numeroVendedor}
    AND
        ope.ope_stoauto = 0
ORDER BY
    ope.ope_codigo DESC
`;

export const listaDeEsperaUsadoQuery = () => `
SELECT
    ope.ope_codigo as "opera",
    ope.ope_fecha as "fecha",
    cli.cli_nombre as "clienteNombre",
    auto.au_nombre AS "version",
    color1.col_nombre as "color1",
    color2.col_nombre as "color2",
    famiauto.fam_nombre AS "modelo",
    v.ven_nombre AS "vendedor"
FROM
    opera ope
INNER JOIN cliente cli ON
    ope.ope_cliente = cli.cli_codigo
INNER JOIN vendedor v ON
    ope.ope_vende  = v.ven_codigo 
INNER JOIN auto ON
    auto.au_codigo = ope.ope_auto
    AND auto.au_marca = ope.ope_marca
INNER JOIN color color1 ON
    ope.ope_col1 = color1.col_codigo
LEFT JOIN color color2 ON
    ope.ope_col2 = color2.col_codigo
INNER JOIN famiauto ON
    auto.au_familia = famiauto.fam_codigo
WHERE
    ope.ope_fecbaj IS NULL
    AND
        ope.ope_stoauto = 0
ORDER BY
v.ven_nombre ,
ope.ope_codigo
`;

export const misOperacionesQuery = (mes: number, ano: number, numberSaleNic: number) => `
SELECT
    ope.ope_codigo as "opera",
    ope.ope_stoauto as "interno",
    ope.ope_fecfac as "fechaFactura",
    ope.ope_fecha as "fecha",
    cli.cli_nombre as "clienteNombre",
    ope.ope_fecent as "fechaEntrega",
    ope.ope_fecasig as "fechaAsignacion",
    auto.au_nombre AS "version",
    famiauto.fam_nombre AS "modelo",
    vende.ven_nombre as "vendedor",
    color.col_nombre AS "color"
FROM
    opera ope
INNER JOIN cliente cli ON
    ope.ope_cliente = cli.cli_codigo
INNER JOIN vendedor vende ON
    ope.ope_vende = vende.ven_codigo
INNER JOIN auto ON
    auto.au_codigo = ope.ope_auto
    AND auto.au_marca = ope.ope_marca
INNER JOIN stoauto ON
    stoauto.sa_codigo = ope.ope_stoauto
INNER JOIN movnped ON
    movnped.mnp_stoauto = stoauto.sa_codigo
INNER JOIN color ON
    movnped.mnp_col1 = color.col_codigo
INNER JOIN famiauto ON
    auto.au_familia = famiauto.fam_codigo
WHERE
    ope.ope_fecbaj IS NULL
    AND ope.ope_tipo = 5
    AND MONTH(ope.ope_fecasig) = ${mes}
    AND YEAR(ope.ope_fecasig) = ${ano}
    AND ope.ope_vende = ${numberSaleNic}
ORDER BY
    cli.cli_nombre
`;
