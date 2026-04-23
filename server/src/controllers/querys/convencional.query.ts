export const stockConvencionalQuery = (vendedoresDisponible: string[]) => `
    SELECT
        stoauto.sa_codigo AS "interno",
        vendedor.ven_nombre AS "vendedorReserva",
        auto.au_nombre AS "version",
        famiauto.fam_nombre AS "modelo",
        color.col_nombre AS "color",
        CASE
            WHEN stoauto.sa_estado IN (5, 10, 15) THEN 'STOCK CONCESIONARIO'
            WHEN movnped.mnp_status IN ('STOCK CONCESIONARIO', 'TRANSITO TASA-CONCESIONARIO') THEN 'FURLONG'
            ELSE movnped.mnp_status
        END AS "ubicacion",
        ISNULL(movnped.mnp_chasis, '-') AS "chasis",
        DATEADD(DAY, 5, movnped.mnp_fecrec) AS "fechaRecepcion"
    FROM
        reserva
    INNER JOIN stoauto ON
        reserva.res_stoauto = stoauto.sa_codigo
        AND reserva.res_tipo = stoauto.sa_tipo
    INNER JOIN movnped ON
        movnped.mnp_stoauto = stoauto.sa_codigo
    INNER JOIN auto ON
        auto.au_codigo = stoauto.sa_auto
        AND auto.au_marca = stoauto.sa_marca
    INNER JOIN famiauto ON
        auto.au_familia = famiauto.fam_codigo
    INNER JOIN vendedor ON
        reserva.res_vendedor = vendedor.ven_codigo
    INNER JOIN color ON
        movnped.mnp_col1 = color.col_codigo
    WHERE
        reserva.res_anulada = 0
		AND stoauto.sa_tipo = 5
        AND reserva.res_vendedor IN (${vendedoresDisponible})
    ORDER BY
        famiauto.fam_nombre,
        auto.au_nombre,
        color.col_nombre
    `;

export const reservasConvencionalQuery = (vendedoresReservas: string[]) => `
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
    ISNULL(sucursal.suc_nombre, 'SIN ASIGNAR') AS "sucursal",
    reserva.res_fecregistro AS "fechaReserva",
    movnped.mnp_fecrec AS "fechaRecepcion"
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
    -- Cambiado a LEFT JOIN para permitir sucursales null
    vendedor.ven_sucur = sucursal.suc_codigo
WHERE
    reserva.res_anulada = 0
    AND reserva.res_tipo = 5
    AND reserva.res_vendedor IN (${vendedoresReservas})
ORDER BY
    sucursal.suc_nombre,
    vendedor.ven_nombre,
    famiauto.fam_nombre,
    auto.au_nombre
`;

export const reservasSucursalesConvencionalQuery = (vendedoresReservas: string[]) => `
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

export const misReservasConvencionalQuery = (numeroVendedor: number) => `
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
	reserva.res_nombrecliente as "clienteReserva",
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

export const miListaDeEsperaConvencionalQuery = (numeroVendedor: number) => `
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

export const listaDeEsperaConvencionalQuery = () => `
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

export const operacionesConvencional = (mes: number, ano: number) => `
SELECT
	ope.ope_codigo AS "opera",
	ope.ope_fecasig AS "fechaAsignacion",
	famiauto.fam_nombre AS "modelo",
	vende.ven_nombre AS "vendedor",
	ISNULL(sucursal.suc_nombre, 'SIN ASIGNAR') AS "sucursal"
FROM
	opera ope
INNER JOIN vendedor vende ON
	ope.ope_vende = vende.ven_codigo
LEFT JOIN sucursal ON
	vende.ven_sucur = sucursal.suc_codigo
INNER JOIN auto ON
	auto.au_codigo = ope.ope_auto
	AND auto.au_marca = ope.ope_marca
INNER JOIN famiauto ON
	auto.au_familia = famiauto.fam_codigo
WHERE
	ope.ope_fecbaj IS NULL
	AND ope.ope_tipo = 5
	AND ope.ope_fecasig >= DATEADD(MONTH, -5, DATEFROMPARTS(${ano}, ${mes}, 1))
	AND ope.ope_fecasig < DATEADD(MONTH, 1, DATEFROMPARTS(${ano}, ${mes}, 1))
	AND ope.ope_vende NOT IN (74, 432,66,253,24,1,168,61)
ORDER BY
	sucursal.suc_nombre,
	vende.ven_nombre,
	ope.ope_fecasig
`;

export const operacionesConvencionalRanking = ( ano: number) => `
SELECT
	ope.ope_codigo AS "opera",
	ope.ope_fecasig AS "fechaAsignacion",
	famiauto.fam_nombre AS "modelo",
	vende.ven_nombre AS "vendedor",
	ISNULL(sucursal.suc_nombre, 'SIN ASIGNAR') AS "sucursal"
FROM
	opera ope
INNER JOIN vendedor vende ON
	ope.ope_vende = vende.ven_codigo
LEFT JOIN sucursal ON
	vende.ven_sucur = sucursal.suc_codigo
INNER JOIN auto ON
	auto.au_codigo = ope.ope_auto
	AND auto.au_marca = ope.ope_marca
INNER JOIN famiauto ON
	auto.au_familia = famiauto.fam_codigo
WHERE
	ope.ope_fecbaj IS NULL
	AND ope.ope_tipo = 5
	AND YEAR(ope.ope_fecasig) = ${ano}
	AND ope.ope_vende NOT IN (74, 432,66,253)
ORDER BY
	sucursal.suc_nombre,
	vende.ven_nombre,
	ope.ope_fecasig
`;

export const stockReventaQuery = (vendedoresReventas: string[]) => `
    SELECT
        stoauto.sa_codigo AS "interno",
        vendedor.ven_nombre AS "vendedorReserva",
        auto.au_nombre AS "version",
        famiauto.fam_nombre AS "modelo",
        color.col_nombre AS "color",
        CASE
            WHEN stoauto.sa_estado IN (5, 10, 15) THEN 'STOCK CONCESIONARIO'
            WHEN movnped.mnp_status IN ('STOCK CONCESIONARIO', 'TRANSITO TASA-CONCESIONARIO') THEN 'FURLONG'
            ELSE movnped.mnp_status
        END AS "ubicacion",
        ISNULL(movnped.mnp_chasis, '-') AS "chasis",
        DATEADD(DAY, 5, movnped.mnp_fecrec) AS "fechaRecepcion"
    FROM
        reserva
    INNER JOIN stoauto ON
        reserva.res_stoauto = stoauto.sa_codigo
        AND reserva.res_tipo = stoauto.sa_tipo
    INNER JOIN movnped ON
        movnped.mnp_stoauto = stoauto.sa_codigo
    INNER JOIN auto ON
        auto.au_codigo = stoauto.sa_auto
        AND auto.au_marca = stoauto.sa_marca
    INNER JOIN famiauto ON
        auto.au_familia = famiauto.fam_codigo
    INNER JOIN vendedor ON
        reserva.res_vendedor = vendedor.ven_codigo
    INNER JOIN color ON
        movnped.mnp_col1 = color.col_codigo
    WHERE
        reserva.res_anulada = 0
		AND stoauto.sa_tipo = 5
        AND reserva.res_vendedor IN (${vendedoresReventas})
    ORDER BY
        famiauto.fam_nombre,
        auto.au_nombre,
        color.col_nombre
    `;

export const infoInternoQuery = (interno: number) => `
 SELECT
	stoauto.sa_codigo as "interno",
	auto.au_nombre as "version",
	stoauto.sa_nrofab as "order",
	ISNULL(c.cli_nombre, '-') as cliente,
	ISNULL(v.ven_nombre, '-') as vendedor,
	ISNULL(movnped.mnp_chasis, '-') AS "chasis"
FROM
	stoauto
LEFT JOIN opera ON
	stoauto.sa_opera = opera.ope_codigo
LEFT JOIN vendedor v ON
	opera.ope_vende = v.ven_codigo
LEFT JOIN cliente c ON
	opera.ope_cliente = c.cli_codigo
INNER JOIN movnped ON
	stoauto.sa_codigo = movnped.mnp_stoauto
INNER JOIN auto ON
	stoauto.sa_auto = auto.au_codigo
	AND stoauto.sa_marca = auto.au_marca
WHERE
	stoauto.sa_tipo = 5
	AND stoauto.sa_codigo = ${interno}
ORDER BY
	auto.au_nombre
    `;

export const infoOperaRegistroQuery = (operacion: number) => `
SELECT
	ope.ope_codigo as "opera",
	ope.ope_stoauto as "interno",
	cli.cli_nombre as "clienteNombre",
	auto.au_nombre AS "version",
	s.suc_nombre as "sucursal",
	famiauto.fam_nombre AS "modelo",
	ISNULL(movnped.mnp_chasis, '-') AS "chasis",
	vende.ven_nombre as "vendedor"
FROM
	opera ope
INNER JOIN cliente cli ON
	ope.ope_cliente = cli.cli_codigo
	INNER JOIN sucursal s ON
	ope.ope_sucur = s.suc_codigo 
INNER JOIN vendedor vende ON
	ope.ope_vende = vende.ven_codigo
INNER JOIN auto ON
	auto.au_codigo = ope.ope_auto
	AND auto.au_marca = ope.ope_marca
INNER JOIN stoauto ON
	stoauto.sa_codigo = ope.ope_stoauto
INNER JOIN movnped ON
	movnped.mnp_stoauto = stoauto.sa_codigo
INNER JOIN famiauto ON
	auto.au_familia = famiauto.fam_codigo
WHERE
	ope.ope_fecbaj IS NULL
	AND ope.ope_tipo = 5
	AND ope.ope_codigo = ${operacion}
ORDER BY
	cli.cli_nombre
    `;