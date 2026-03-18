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
	DATEDIFF(DAY, movnped.mnp_fecrec, li.li_fecha) AS diferenciaDias
FROM
	stoauto
INNER JOIN movnped
    ON stoauto.sa_codigo = movnped.mnp_stoauto
INNER JOIN auto
    ON stoauto.sa_auto = auto.au_codigo
	AND stoauto.sa_marca = auto.au_marca
INNER JOIN famiauto
    ON auto.au_familia = famiauto.fam_codigo
INNER JOIN color
    ON movnped.mnp_col1 = color.col_codigo
LEFT JOIN anexnvo an
    ON an.an_stoauto = stoauto.sa_codigo
LEFT JOIN libivac li
    ON li.li_nroope = an.an_nrooper
WHERE
	stoauto.sa_nrofab LIKE 'NIC%'
	AND movnped.mnp_fecbaj IS NULL
	AND SUBSTRING(stoauto.sa_nrofab, 5, 2) = '${anio}'
	AND SUBSTRING(stoauto.sa_nrofab, 7, 2) = '${mes}'
ORDER BY
	auto.au_nombre,
	li.li_fecha
`;