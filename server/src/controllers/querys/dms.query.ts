export const getVendedoresNic = () => `
SELECT
	v.ven_nombre AS "vendedor",
	v.ven_codigo AS "codigo",
	v.ven_vennvo as "tpoNuevo",
	v.ven_venusa as "tipoUsado",
	v.ven_venpla as "tipoPlan",
	v.ven_venpvta as "tipoPosventa",
	v.ven_idtecnom as "emailTecnom",
	v.ven_estado as "estado",
	ISNULL(sucursal.suc_nombre, 'SIN ASIGNAR') AS sucursal
FROM
	vendedor v
LEFT JOIN sucursal ON
	v.ven_sucur = sucursal.suc_codigo
ORDER BY
	v.ven_estado,
	v.ven_nombre`;

export const getVendedoresActivosNic = () => `
SELECT
	v.ven_nombre AS "vendedor",
	v.ven_codigo AS "codigo",
	v.ven_vennvo as "tpoNuevo",
	v.ven_venusa as "tipoUsado",
	v.ven_venpla as "tipoPlan",
	v.ven_venpvta as "tipoPosventa",
	v.ven_idtecnom as "emailTecnom",
	v.ven_estado as "estado",
	ISNULL(sucursal.suc_nombre, 'SIN ASIGNAR') AS sucursal
FROM
	vendedor v
LEFT JOIN sucursal ON
	v.ven_sucur = sucursal.suc_codigo
WHERE 
v.ven_estado = 1
ORDER BY
	v.ven_nombre
`;

export const getVendedoresActivosNuevoNic = () => `
SELECT
	v.ven_nombre AS "vendedor",
	v.ven_codigo AS "codigo",
	v.ven_vennvo as "tpoNuevo",
	v.ven_venusa as "tipoUsado",
	v.ven_venpla as "tipoPlan",
	v.ven_venpvta as "tipoPosventa",
	v.ven_idtecnom as "emailTecnom",
	v.ven_estado as "estado",
	ISNULL(sucursal.suc_nombre, 'SIN ASIGNAR') AS sucursal
FROM
	vendedor v
LEFT JOIN sucursal ON
	v.ven_sucur = sucursal.suc_codigo
WHERE 
	v.ven_estado = 1
	AND v.ven_vennvo = 1
ORDER BY
	v.ven_nombre
`;

export const getAsignacionRecepcion = () => `
SELECT
	stoauto.sa_codigo AS interno,
	stoauto.sa_nrofab AS nrofab,
	auto.au_nombre AS version,
	famiauto.fam_nombre AS modelo,
	movnped.mnp_chasis AS chasis,
	movnped.mnp_fecrec AS fechaProblableRecep,
	li.li_fecha AS fechaRecepcionRemito,
	color.col_nombre as color,
	stoauto.sa_opera as opera,
	sucursal.suc_nombre as sucursal,
	DATEDIFF(DAY, movnped.mnp_fecrec, li.li_fecha) AS diferenciaDias
FROM
	stoauto
INNER JOIN movnped
    ON
	stoauto.sa_codigo = movnped.mnp_stoauto
INNER JOIN auto
    ON
	stoauto.sa_auto = auto.au_codigo
	AND stoauto.sa_marca = auto.au_marca
INNER JOIN famiauto
    ON
	auto.au_familia = famiauto.fam_codigo
INNER JOIN color
    ON
	movnped.mnp_col1 = color.col_codigo
LEFT JOIN opera
    ON
	stoauto.sa_opera = opera.ope_codigo
	AND stoauto.sa_tipo = opera.ope_tipo
LEFT JOIN sucursal
    ON
	opera.ope_sucur = sucursal.suc_codigo
LEFT JOIN anexnvo an
    ON
	an.an_stoauto = stoauto.sa_codigo
LEFT JOIN libivac li
    ON
	li.li_nroope = an.an_nrooper
WHERE
	stoauto.sa_nrofab LIKE 'NIC%'
	AND movnped.mnp_fecbaj IS NULL
	AND SUBSTRING(stoauto.sa_nrofab, 5, 2) = :anio
	AND SUBSTRING(stoauto.sa_nrofab, 7, 2) = :mes
ORDER BY
	auto.au_nombre,
	li.li_fecha
`;

export const getStockConsolidadoNic = () => `
SELECT
	stoauto.sa_codigo as "interno",
	famiauto.fam_nombre as "modelo",
	marca.mar_nombre as "marca",
	stoauto.sa_nrofab as "order",
	stoauto.sa_estado,
	CASE 
		WHEN stoauto.sa_estado = 5 THEN 'Fis. Disp'
		WHEN stoauto.sa_estado = 10 THEN 'Fis. Disp. Res. s/B'
		WHEN stoauto.sa_estado = 15 THEN 'Fis. Res. c/B'
		WHEN stoauto.sa_estado = 20 THEN 'No Fis. Disp.'
		WHEN stoauto.sa_estado = 25 THEN 'No Fis. Disp. Res. s/B'
		WHEN stoauto.sa_estado = 30 THEN 'No Fis. Res. c/B'
		ELSE 'anulado'
	END as "estado",
	CASE 
		WHEN stoauto.sa_tipo = 5 THEN 'nuevo'
		WHEN stoauto.sa_tipo = 10 THEN 'usado'
		ELSE 'otro'
	END as "tipoStock",
	CASE
		WHEN stoauto.sa_nrofab LIKE 'NIC%' THEN 'convencional'
		WHEN stoauto.sa_nrofab LIKE 'F0%' THEN 'v. especiales'
		WHEN stoauto.sa_nrofab LIKE 'TPA%' THEN 'plan de ahorro'
		ELSE 'otro'
	END as "tipoOrder"
FROM
	stoauto
INNER JOIN auto ON
	stoauto.sa_auto = auto.au_codigo
	AND stoauto.sa_marca = auto.au_marca
	AND stoauto.sa_bienuso = 0
INNER JOIN marca ON
	marca.mar_codigo = auto.au_marca
LEFT JOIN famiauto ON
	auto.au_familia = famiauto.fam_codigo
WHERE
	stoauto.sa_estado NOT IN (40, 35)
ORDER BY
	famiauto.fam_nombre
`

export const getFacturaReventasNic = () => `
SELECT
	ope.ope_codigo as "opera",
	ope.ope_stoauto as "interno",
	ope.ope_fecha as "fecha",
	cli.cli_nombre as "clienteNombre",
	ope.ope_fecent as "fechaEntrega",
	DATEDIFF(DAY, ope.ope_fecent, GETDATE()) as "diasDesdeEntrega",
	DATEDIFF(DAY, ope.ope_fecasig, GETDATE()) as "diasDesdeAsignado",
	ope.ope_fecasig as "fechaAsignacion",
	auto.au_nombre AS "version",
	famiauto.fam_nombre AS "modelo",
	vende.ven_nombre as "vendedor",
	movnped.mnp_chasis as "chasis"
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
	AND ope.ope_fecent IS NOT NULL
	AND ope.ope_fecfac IS NULL
	AND ope.ope_stoauto IS NOT NULL
	AND stoauto.sa_nrofab LIKE 'NIC%'
	AND cli.cli_codigo NOT IN (5722, 78) 
	AND vende.ven_codigo NOT IN (74, 265)
	AND ope.ope_codigo NOT IN (29426, 37313, 50602)
ORDER BY
	cli.cli_nombre
`

export const getModelosPlanNegocio = () => `
SELECT DISTINCT
	LTRIM(RTRIM(famiauto.fam_nombre)) AS modelo
FROM
	stoauto
INNER JOIN auto
	ON stoauto.sa_auto = auto.au_codigo
	AND stoauto.sa_marca = auto.au_marca
INNER JOIN famiauto
	ON auto.au_familia = famiauto.fam_codigo
WHERE
	stoauto.sa_nrofab LIKE 'NIC%'
	AND ISNULL(famiauto.fam_nombre, '') <> ''
ORDER BY
	modelo
`;

export const getAsignacionesPlanNegocio = () => `
SELECT
	LTRIM(RTRIM(famiauto.fam_nombre)) AS modelo,
	CAST(SUBSTRING(stoauto.sa_nrofab, 7, 2) AS INT) AS mes,
	COUNT(*) AS cantidad
FROM
	stoauto
INNER JOIN movnped
	ON stoauto.sa_codigo = movnped.mnp_stoauto
INNER JOIN auto
	ON stoauto.sa_auto = auto.au_codigo
	AND stoauto.sa_marca = auto.au_marca
INNER JOIN famiauto
	ON auto.au_familia = famiauto.fam_codigo
WHERE
	stoauto.sa_nrofab LIKE 'NIC%'
	AND movnped.mnp_fecbaj IS NULL
	AND SUBSTRING(stoauto.sa_nrofab, 5, 2) = :anio
	AND ISNULL(famiauto.fam_nombre, '') <> ''
GROUP BY
	LTRIM(RTRIM(famiauto.fam_nombre)),
	CAST(SUBSTRING(stoauto.sa_nrofab, 7, 2) AS INT)
ORDER BY
	modelo,
	mes
`;

export const getPrediccionAsignaciones = () => `
WITH operacionesAsignadas AS (
  SELECT
    ope.ope_codigo AS codigoOp,
    ISNULL(LTRIM(RTRIM(clienteOperacion.cli_nombre)), '-') AS cliente,
    ISNULL(LTRIM(RTRIM(vendedorOperacion.ven_nombre)), '-') AS vendedor,
    asignado.sa_codigo AS stockActual,
    LTRIM(RTRIM(autoAsignado.au_nombre)) AS versionAsignada,
    ISNULL(LTRIM(RTRIM(colorAsignado.col_nombre)), '-') AS colorAsignado,
    asignado.sa_marca AS marcaCodigo,
    familiaAsignada.fam_codigo AS familiaCodigo,
    asignado.sa_auto AS versionCodigo,
    pedidoAsignado.mnp_col1 AS colorCodigo,
    CONCAT(SUBSTRING(asignado.sa_nrofab, 7, 2), '/', '20', SUBSTRING(asignado.sa_nrofab, 5, 2)) AS produccionActual,
    CASE
      WHEN asignado.sa_estado IN (5, 10, 15) THEN 'STOCK CONCESIONARIO'
      WHEN UPPER(LTRIM(RTRIM(ISNULL(pedidoAsignado.mnp_status, '')))) COLLATE Latin1_General_CI_AI IN ('FURLONG', 'STOCK CONCESIONARIO', 'TRANSITO TASA-CONCESIONARIO') THEN 'FURLONG'
      WHEN UPPER(LTRIM(RTRIM(ISNULL(pedidoAsignado.mnp_status, '')))) COLLATE Latin1_General_CI_AI = 'PLAYA TASA' THEN 'PLAYA TASA'
      WHEN UPPER(LTRIM(RTRIM(ISNULL(pedidoAsignado.mnp_status, '')))) COLLATE Latin1_General_CI_AI = 'PLAYA EXTERNA' THEN 'PLAYA EXTERNA'
      WHEN UPPER(LTRIM(RTRIM(ISNULL(pedidoAsignado.mnp_status, '')))) COLLATE Latin1_General_CI_AI = 'PLAYA NACIONAL ATZ' THEN 'PLAYA NACIONAL ATZ'
      WHEN UPPER(LTRIM(RTRIM(ISNULL(pedidoAsignado.mnp_status, '')))) COLLATE Latin1_General_CI_AI = 'BUQUE' THEN 'BUQUE'
      WHEN UPPER(LTRIM(RTRIM(ISNULL(pedidoAsignado.mnp_status, '')))) COLLATE Latin1_General_CI_AI = 'PRODUCCION TASA' THEN 'PRODUCCION TASA'
      WHEN UPPER(LTRIM(RTRIM(ISNULL(pedidoAsignado.mnp_status, '')))) COLLATE Latin1_General_CI_AI = 'EN PRODUCCION' THEN 'EN PRODUCCION'
      ELSE 'SIN UBICACION'
    END AS ubicacionActual,
    CASE
      WHEN asignado.sa_estado IN (5, 10, 15) THEN 1
      WHEN UPPER(LTRIM(RTRIM(ISNULL(pedidoAsignado.mnp_status, '')))) COLLATE Latin1_General_CI_AI IN ('FURLONG', 'STOCK CONCESIONARIO', 'TRANSITO TASA-CONCESIONARIO') THEN 2
      WHEN UPPER(LTRIM(RTRIM(ISNULL(pedidoAsignado.mnp_status, '')))) COLLATE Latin1_General_CI_AI = 'PLAYA TASA' THEN 3
      WHEN UPPER(LTRIM(RTRIM(ISNULL(pedidoAsignado.mnp_status, '')))) COLLATE Latin1_General_CI_AI = 'PLAYA EXTERNA' THEN 4
      WHEN UPPER(LTRIM(RTRIM(ISNULL(pedidoAsignado.mnp_status, '')))) COLLATE Latin1_General_CI_AI = 'PLAYA NACIONAL ATZ' THEN 5
      WHEN UPPER(LTRIM(RTRIM(ISNULL(pedidoAsignado.mnp_status, '')))) COLLATE Latin1_General_CI_AI = 'BUQUE' THEN 6
      WHEN UPPER(LTRIM(RTRIM(ISNULL(pedidoAsignado.mnp_status, '')))) COLLATE Latin1_General_CI_AI = 'PRODUCCION TASA' THEN 7
      WHEN UPPER(LTRIM(RTRIM(ISNULL(pedidoAsignado.mnp_status, '')))) COLLATE Latin1_General_CI_AI = 'EN PRODUCCION' THEN 8
      ELSE 9
    END AS prioridadUbicacionActual,
    TRY_CONVERT(INT, SUBSTRING(asignado.sa_nrofab, 5, 2)) * 100
      + TRY_CONVERT(INT, SUBSTRING(asignado.sa_nrofab, 7, 2)) AS periodoAsignado
  FROM opera ope
  INNER JOIN stoauto asignado
    ON asignado.sa_codigo = ope.ope_stoauto
    AND asignado.sa_tipo = ope.ope_tipo
  INNER JOIN auto autoAsignado
    ON autoAsignado.au_codigo = asignado.sa_auto
    AND autoAsignado.au_marca = asignado.sa_marca
  INNER JOIN marca marcaAsignada
    ON marcaAsignada.mar_codigo = autoAsignado.au_marca
  INNER JOIN famiauto familiaAsignada
    ON familiaAsignada.fam_codigo = autoAsignado.au_familia
  LEFT JOIN cliente clienteOperacion
    ON clienteOperacion.cli_codigo = ope.ope_cliente
  LEFT JOIN vendedor vendedorOperacion
    ON vendedorOperacion.ven_codigo = ope.ope_vende
  INNER JOIN movnped pedidoAsignado
    ON pedidoAsignado.mnp_stoauto = asignado.sa_codigo
  INNER JOIN color colorAsignado
    ON colorAsignado.col_codigo = pedidoAsignado.mnp_col1
  WHERE ope.ope_tipo = 5
    AND ope.ope_stoauto <> 0
    AND ope.ope_fecfac IS NULL
    AND ope.ope_fecent IS NULL
    AND ope.ope_fecbaj IS NULL
    AND asignado.sa_nrofab LIKE 'NIC%'
    AND TRY_CONVERT(INT, SUBSTRING(asignado.sa_nrofab, 5, 2)) IS NOT NULL
    AND TRY_CONVERT(INT, SUBSTRING(asignado.sa_nrofab, 7, 2)) BETWEEN 1 AND 12
), stockDisponible AS (
  SELECT
    disponible.sa_codigo AS stockPosibleReasignacion,
    ISNULL(LTRIM(RTRIM(colorDisponible.col_nombre)), '-') AS colorStockPosible,
    LTRIM(RTRIM(autoDisponible.au_nombre)) AS versionStockPosible,
    disponible.sa_marca AS marcaCodigo,
    familiaDisponible.fam_codigo AS familiaCodigo,
    disponible.sa_auto AS versionCodigo,
    pedidoDisponible.mnp_col1 AS colorCodigo,
    CONCAT(SUBSTRING(disponible.sa_nrofab, 7, 2), '/', '20', SUBSTRING(disponible.sa_nrofab, 5, 2)) AS produccionPosible,
    CASE
      WHEN disponible.sa_estado IN (5, 10, 15) THEN 'STOCK CONCESIONARIO'
      WHEN UPPER(LTRIM(RTRIM(ISNULL(pedidoDisponible.mnp_status, '')))) COLLATE Latin1_General_CI_AI IN ('FURLONG', 'STOCK CONCESIONARIO', 'TRANSITO TASA-CONCESIONARIO') THEN 'FURLONG'
      WHEN UPPER(LTRIM(RTRIM(ISNULL(pedidoDisponible.mnp_status, '')))) COLLATE Latin1_General_CI_AI = 'PLAYA TASA' THEN 'PLAYA TASA'
      WHEN UPPER(LTRIM(RTRIM(ISNULL(pedidoDisponible.mnp_status, '')))) COLLATE Latin1_General_CI_AI = 'PLAYA EXTERNA' THEN 'PLAYA EXTERNA'
      WHEN UPPER(LTRIM(RTRIM(ISNULL(pedidoDisponible.mnp_status, '')))) COLLATE Latin1_General_CI_AI = 'PLAYA NACIONAL ATZ' THEN 'PLAYA NACIONAL ATZ'
      WHEN UPPER(LTRIM(RTRIM(ISNULL(pedidoDisponible.mnp_status, '')))) COLLATE Latin1_General_CI_AI = 'BUQUE' THEN 'BUQUE'
      WHEN UPPER(LTRIM(RTRIM(ISNULL(pedidoDisponible.mnp_status, '')))) COLLATE Latin1_General_CI_AI = 'PRODUCCION TASA' THEN 'PRODUCCION TASA'
      WHEN UPPER(LTRIM(RTRIM(ISNULL(pedidoDisponible.mnp_status, '')))) COLLATE Latin1_General_CI_AI = 'EN PRODUCCION' THEN 'EN PRODUCCION'
      ELSE 'SIN UBICACION'
    END AS ubicacionPosible,
    CASE
      WHEN disponible.sa_estado IN (5, 10, 15) THEN 1
      WHEN UPPER(LTRIM(RTRIM(ISNULL(pedidoDisponible.mnp_status, '')))) COLLATE Latin1_General_CI_AI IN ('FURLONG', 'STOCK CONCESIONARIO', 'TRANSITO TASA-CONCESIONARIO') THEN 2
      WHEN UPPER(LTRIM(RTRIM(ISNULL(pedidoDisponible.mnp_status, '')))) COLLATE Latin1_General_CI_AI = 'PLAYA TASA' THEN 3
      WHEN UPPER(LTRIM(RTRIM(ISNULL(pedidoDisponible.mnp_status, '')))) COLLATE Latin1_General_CI_AI = 'PLAYA EXTERNA' THEN 4
      WHEN UPPER(LTRIM(RTRIM(ISNULL(pedidoDisponible.mnp_status, '')))) COLLATE Latin1_General_CI_AI = 'PLAYA NACIONAL ATZ' THEN 5
      WHEN UPPER(LTRIM(RTRIM(ISNULL(pedidoDisponible.mnp_status, '')))) COLLATE Latin1_General_CI_AI = 'BUQUE' THEN 6
      WHEN UPPER(LTRIM(RTRIM(ISNULL(pedidoDisponible.mnp_status, '')))) COLLATE Latin1_General_CI_AI = 'PRODUCCION TASA' THEN 7
      WHEN UPPER(LTRIM(RTRIM(ISNULL(pedidoDisponible.mnp_status, '')))) COLLATE Latin1_General_CI_AI = 'EN PRODUCCION' THEN 8
      ELSE 9
    END AS prioridadUbicacionPosible,
    TRY_CONVERT(INT, SUBSTRING(disponible.sa_nrofab, 5, 2)) * 100
      + TRY_CONVERT(INT, SUBSTRING(disponible.sa_nrofab, 7, 2)) AS periodoDisponible
  FROM stoauto disponible
  INNER JOIN auto autoDisponible
    ON autoDisponible.au_codigo = disponible.sa_auto
    AND autoDisponible.au_marca = disponible.sa_marca
  INNER JOIN marca marcaDisponible
    ON marcaDisponible.mar_codigo = autoDisponible.au_marca
  INNER JOIN famiauto familiaDisponible
    ON familiaDisponible.fam_codigo = autoDisponible.au_familia
  INNER JOIN movnped pedidoDisponible
    ON pedidoDisponible.mnp_stoauto = disponible.sa_codigo
  INNER JOIN color colorDisponible
    ON colorDisponible.col_codigo = pedidoDisponible.mnp_col1
  WHERE disponible.sa_tipo = 5
    AND disponible.sa_opera = 0
    AND disponible.sa_bienuso = 0
    AND disponible.sa_estado IN (5, 10, 20, 25)
    AND disponible.sa_nrofab LIKE 'NIC%'
    AND TRY_CONVERT(INT, SUBSTRING(disponible.sa_nrofab, 5, 2)) IS NOT NULL
    AND TRY_CONVERT(INT, SUBSTRING(disponible.sa_nrofab, 7, 2)) BETWEEN 1 AND 12
), coincidencias AS (
  SELECT
    operacion.codigoOp,
    operacion.cliente,
    operacion.vendedor,
    operacion.versionAsignada,
    operacion.colorAsignado,
    operacion.stockActual,
    operacion.produccionActual,
    operacion.ubicacionActual,
    disponible.stockPosibleReasignacion,
    disponible.produccionPosible,
    disponible.ubicacionPosible,
    disponible.colorStockPosible,
    disponible.versionStockPosible,
    ROW_NUMBER() OVER (
      PARTITION BY operacion.codigoOp
      ORDER BY
        disponible.prioridadUbicacionPosible,
        disponible.periodoDisponible,
        disponible.stockPosibleReasignacion
    ) AS posicion
  FROM operacionesAsignadas operacion
  INNER JOIN stockDisponible disponible
    ON disponible.marcaCodigo = operacion.marcaCodigo
    AND disponible.familiaCodigo = operacion.familiaCodigo
    AND disponible.versionCodigo = operacion.versionCodigo
    AND disponible.colorCodigo = operacion.colorCodigo
  WHERE disponible.periodoDisponible < operacion.periodoAsignado
    OR (
      disponible.periodoDisponible = operacion.periodoAsignado
      AND disponible.prioridadUbicacionPosible < operacion.prioridadUbicacionActual
    )
)
SELECT
  codigoOp,
  cliente,
  vendedor,
  versionAsignada,
  colorAsignado,
  stockActual,
  produccionActual,
  ubicacionActual,
  stockPosibleReasignacion,
  produccionPosible,
  ubicacionPosible,
  colorStockPosible,
  versionStockPosible
FROM coincidencias
WHERE posicion = 1
ORDER BY codigoOp
`;

export const getAnalisisStockConvencional = () => `
SELECT
	stoauto.sa_codigo AS interno,
	LTRIM(RTRIM(auto.au_nombre)) AS version,
	LTRIM(RTRIM(famiauto.fam_nombre)) AS modelo,
	DATEADD(DAY, 5, movnped.mnp_fecrec) AS fechaRecepcion,
	stoauto.sa_nrofab AS sa_nrofab,
	color.col_nombre
FROM stoauto
INNER JOIN auto
	ON auto.au_codigo = stoauto.sa_auto
	AND auto.au_marca = stoauto.sa_marca
INNER JOIN movnped
	ON movnped.mnp_stoauto = stoauto.sa_codigo
INNER JOIN famiauto
	ON auto.au_familia = famiauto.fam_codigo
INNER JOIN color
	ON movnped.mnp_col1 = color.col_codigo
WHERE
	stoauto.sa_tipo = 5
	AND stoauto.sa_estado IN (5, 10, 20, 25)
	AND stoauto.sa_bienuso = 0
	AND stoauto.sa_nrofab LIKE 'NIC%'
ORDER BY
	modelo,
	version
`;

export const getAnalisisStockPromedioVenta = () => `
SELECT
	LTRIM(RTRIM(auto.au_nombre)) AS version,
	LTRIM(RTRIM(famiauto.fam_nombre)) AS modelo,
	COUNT(*) AS ventas
FROM opera ope
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
	AND ope.ope_fecasig >= DATEFROMPARTS(:anioDesde, :mesDesde, 1)
	AND ope.ope_fecasig < DATEFROMPARTS(:anioHasta, :mesHasta, 1)
	AND stoauto.sa_nrofab LIKE 'NIC%'
GROUP BY
	LTRIM(RTRIM(auto.au_nombre)),
	LTRIM(RTRIM(famiauto.fam_nombre))
`;

export const getPendFacConvencional = () => `
SELECT
	stoauto.sa_codigo AS interno,
	stoauto.sa_nrofab AS nrofab,
	LTRIM(RTRIM(auto.au_nombre)) AS version,
	LTRIM(RTRIM(famiauto.fam_nombre)) AS modelo,
	movnped.mnp_chasis AS chasis,
	movnped.mnp_certif AS certif,
	color.col_nombre AS color,
	cliente.cli_nombre AS cliente,
	vendedor.ven_nombre AS vendedor,
	CASE
		WHEN stoauto.sa_estado IN (5, 10, 15) THEN 'STOCK CONCESIONARIO'
		WHEN movnped.mnp_status IN ('STOCK CONCESIONARIO', 'TRANSITO TASA-CONCESIONARIO') THEN 'FURLONG'
		ELSE movnped.mnp_status
	END AS ubicacion,
	stoauto.sa_opera AS opera,
	DATEDIFF(DAY, opera.ope_fecasig, GETDATE()) AS diasAsignado
FROM stoauto
INNER JOIN movnped
	ON stoauto.sa_codigo = movnped.mnp_stoauto
INNER JOIN auto
	ON stoauto.sa_auto = auto.au_codigo
	AND stoauto.sa_marca = auto.au_marca
INNER JOIN famiauto
	ON auto.au_familia = famiauto.fam_codigo
INNER JOIN color
	ON movnped.mnp_col1 = color.col_codigo
INNER JOIN opera
	ON stoauto.sa_opera = opera.ope_codigo
	AND stoauto.sa_tipo = opera.ope_tipo
INNER JOIN cliente
	ON opera.ope_cliente = cliente.cli_codigo
INNER JOIN vendedor
	ON opera.ope_vende = vendedor.ven_codigo
WHERE
	stoauto.sa_nrofab LIKE 'NIC%'
	AND opera.ope_fecfac IS NULL
	AND opera.ope_fecent IS NULL
	AND opera.ope_fecbaj IS NULL
ORDER BY
	modelo,
	version,
	ubicacion,
	nrofab
`;

export const getOperacionesFacturadasByCodigoQuery = (operas: string) => `
SELECT DISTINCT
	CAST(ope.ope_codigo AS VARCHAR(50)) AS opera
FROM
	opera ope
WHERE
	ope.ope_tipo = 5
	AND ope.ope_fecbaj IS NULL
	AND ope.ope_fecfac IS NOT NULL
	AND ope.ope_codigo IN (${operas})
`;

export const getAnalisisStockVersionesDisponibles = () => `
SELECT DISTINCT
	LTRIM(RTRIM(famiauto.fam_nombre)) AS modelo,
	mar.mar_nombre AS marca,
	LTRIM(RTRIM(auto.au_nombre)) AS version
FROM auto
INNER JOIN marca mar ON
	mar.mar_codigo = auto.au_marca
INNER JOIN famiauto ON
	auto.au_familia = famiauto.fam_codigo
WHERE
	auto.au_dispo = 1
	AND ISNULL(LTRIM(RTRIM(famiauto.fam_nombre)), '') <> ''
	AND ISNULL(LTRIM(RTRIM(auto.au_nombre)), '') <> ''
`;

