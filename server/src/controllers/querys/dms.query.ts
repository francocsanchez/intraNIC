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

export const getAsignacionRecepcion = (mes: string, anio: string) => `
SELECT
	stoauto.sa_codigo AS interno,
	stoauto.sa_nrofab AS nrofab,
	auto.au_nombre AS version,
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
	AND SUBSTRING(stoauto.sa_nrofab, 5, 2) = '${anio}'
	AND SUBSTRING(stoauto.sa_nrofab, 7, 2) = '${mes}'
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
	AND cli.cli_codigo <> 5722
	AND vende.ven_codigo NOT IN (74, 265)
ORDER BY
	cli.cli_nombre
`