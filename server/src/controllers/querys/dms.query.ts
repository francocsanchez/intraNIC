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
