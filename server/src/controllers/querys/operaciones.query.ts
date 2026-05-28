export const operacionesDashboardQuery = (filters: {
  hasMeses: boolean;
  hasSucursales: boolean;
  hasModelos: boolean;
  hasDias: boolean;
}) => `
SELECT
    ope.ope_codigo AS "codigoOperacion",
    ope.ope_fecasig AS "fechaAsignacion",
    vende.ven_nombre AS "vendedorNombre",
    ISNULL(sucursal.suc_nombre, 'SIN ASIGNAR') AS "sucursalNombre",
    famiauto.fam_nombre AS "modeloNombre",
    ope.ope_stoauto AS "interno",
    movnped.mnp_chasis AS "chasis",
    ISNULL(CAST(vende.ven_sucur AS VARCHAR(20)), 'SIN_ASIGNAR') AS "__sucursalCodigo"
FROM
    opera ope
INNER JOIN cliente cli ON
    ope.ope_cliente = cli.cli_codigo
INNER JOIN vendedor vende ON
    ope.ope_vende = vende.ven_codigo
LEFT JOIN sucursal ON
    vende.ven_sucur = sucursal.suc_codigo
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
    AND ope.ope_fecasig IS NOT NULL
    AND ope.ope_vende <> 74
    AND YEAR(ope.ope_fecasig) = :anio
    ${filters.hasMeses ? "AND MONTH(ope.ope_fecasig) IN (:meses)" : ""}
    ${filters.hasSucursales ? "AND ISNULL(CAST(vende.ven_sucur AS VARCHAR(20)), 'SIN_ASIGNAR') IN (:sucursales)" : ""}
    ${filters.hasModelos ? "AND famiauto.fam_nombre IN (:modelos)" : ""}
    ${filters.hasDias ? "AND DAY(ope.ope_fecasig) IN (:dias)" : ""}
ORDER BY
    ope.ope_fecasig DESC,
    vende.ven_nombre ASC;
`;
