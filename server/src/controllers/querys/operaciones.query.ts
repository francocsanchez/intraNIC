export const operacionesDashboardQuery = (filters: {
  hasAnios: boolean;
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
    ${filters.hasAnios ? "AND YEAR(ope.ope_fecasig) IN (:anios)" : ""}
    ${filters.hasMeses ? "AND MONTH(ope.ope_fecasig) IN (:meses)" : ""}
    ${filters.hasSucursales ? "AND ISNULL(CAST(vende.ven_sucur AS VARCHAR(20)), 'SIN_ASIGNAR') IN (:sucursales)" : ""}
    ${filters.hasModelos ? "AND famiauto.fam_nombre IN (:modelos)" : ""}
    ${filters.hasDias ? "AND DAY(ope.ope_fecasig) IN (:dias)" : ""}
ORDER BY
    ope.ope_fecasig DESC,
    vende.ven_nombre ASC;
`;

export const analisisOperacionesPreventaQuery = () => `
SELECT
    vp.numero,
    stoauto.sa_codigo AS interno,
    vp.fecha,
    ope.ope_fecfac AS fecha_factura,
    LTRIM(RTRIM(ISNULL(sucursal.suc_nombre, 'SIN SUCURSAL'))) AS sucursal,
    LTRIM(RTRIM(vp.modelo)) AS version,
    LTRIM(RTRIM(ISNULL(famiauto.fam_nombre, ''))) AS modelo,
    vp.precio,
    vp.vehiculo,
    vp.accesorios,
    vp.patentamiento,
    vp.flete,
    vp.formulario,
    vp.prenda,
    vp.equipamiento,
    vp.preentrega,
    vp.otro,
    vp.bonificacion
FROM
    viewpreventa vp
INNER JOIN opera ope ON
    ope.ope_codigo = vp.numero
    AND ope.ope_tipo = 5
    AND ope.ope_fecasig IS NOT NULL
INNER JOIN stoauto ON
    stoauto.sa_codigo = ope.ope_stoauto
LEFT JOIN sucursal ON
    sucursal.suc_codigo = vp.sucursal_id
LEFT JOIN auto ON
    auto.au_codigo = ope.ope_auto
    AND auto.au_marca = ope.ope_marca
LEFT JOIN famiauto ON
    auto.au_familia = famiauto.fam_codigo
WHERE
    vp.fecha_anulacion IS NULL
    AND stoauto.sa_nrofab LIKE 'NIC%'
    AND YEAR(ope.ope_fecasig) = :anio
    AND MONTH(ope.ope_fecasig) = :mes
    AND UPPER(LTRIM(RTRIM(vp.tipo))) = 'CERO'
ORDER BY
    ope.ope_fecasig DESC,
    vp.numero DESC;
`;

export const analisisOperacionesPreventaFormaPagoQuery = () => `
SELECT TOP 1
    vp.numero,
    vp.usados,
    vp.contado,
    vp.cheque,
    vp.credito_bancario
FROM
    viewpreventa vp
INNER JOIN opera ope ON
    ope.ope_codigo = vp.numero
    AND ope.ope_tipo = 5
    AND ope.ope_fecasig IS NOT NULL
INNER JOIN stoauto ON
    stoauto.sa_codigo = ope.ope_stoauto
WHERE
    vp.fecha_anulacion IS NULL
    AND stoauto.sa_nrofab LIKE 'NIC%'
    AND vp.numero = :numero
    AND UPPER(LTRIM(RTRIM(vp.tipo))) = 'CERO'
ORDER BY
    ope.ope_fecasig DESC,
    vp.numero DESC;
`;

export const analisisOperacionesPreventaDescuentoMensualQuery = () => `
SELECT
    MONTH(ope.ope_fecasig) AS mes,
    LTRIM(RTRIM(ISNULL(famiauto.fam_nombre, 'SIN MODELO'))) AS modelo,
    AVG(
        CASE
            WHEN vp.precio IS NOT NULL AND vp.precio > 0 AND vp.bonificacion IS NOT NULL
                THEN (vp.bonificacion * 100.0) / vp.precio
            ELSE NULL
        END
    ) AS descuento_promedio
FROM
    viewpreventa vp
INNER JOIN opera ope ON
    ope.ope_codigo = vp.numero
    AND ope.ope_tipo = 5
    AND ope.ope_fecasig IS NOT NULL
INNER JOIN stoauto ON
    stoauto.sa_codigo = ope.ope_stoauto
LEFT JOIN auto ON
    auto.au_codigo = ope.ope_auto
    AND auto.au_marca = ope.ope_marca
LEFT JOIN famiauto ON
    auto.au_familia = famiauto.fam_codigo
WHERE
    vp.fecha_anulacion IS NULL
    AND stoauto.sa_nrofab LIKE 'NIC%'
    AND YEAR(ope.ope_fecasig) = :anio
    AND UPPER(LTRIM(RTRIM(vp.tipo))) = 'CERO'
    AND vp.precio IS NOT NULL
    AND vp.precio > 0
    AND vp.bonificacion IS NOT NULL
GROUP BY
    MONTH(ope.ope_fecasig),
    LTRIM(RTRIM(ISNULL(famiauto.fam_nombre, 'SIN MODELO')))
ORDER BY
    mes ASC,
    modelo ASC;
`;

export const analisisOperacionesPreventaDescuentoMensualSucursalQuery = () => `
SELECT
    MONTH(ope.ope_fecasig) AS mes,
    LTRIM(RTRIM(ISNULL(sucursal.suc_nombre, 'SIN SUCURSAL'))) AS sucursal,
    AVG(
        CASE
            WHEN vp.precio IS NOT NULL AND vp.precio > 0 AND vp.bonificacion IS NOT NULL
                THEN (vp.bonificacion * 100.0) / vp.precio
            ELSE NULL
        END
    ) AS descuento_promedio
FROM
    viewpreventa vp
INNER JOIN opera ope ON
    ope.ope_codigo = vp.numero
    AND ope.ope_tipo = 5
    AND ope.ope_fecasig IS NOT NULL
INNER JOIN stoauto ON
    stoauto.sa_codigo = ope.ope_stoauto
LEFT JOIN sucursal ON
    sucursal.suc_codigo = vp.sucursal_id
WHERE
    vp.fecha_anulacion IS NULL
    AND stoauto.sa_nrofab LIKE 'NIC%'
    AND YEAR(ope.ope_fecasig) = :anio
    AND UPPER(LTRIM(RTRIM(vp.tipo))) = 'CERO'
    AND vp.precio IS NOT NULL
    AND vp.precio > 0
    AND vp.bonificacion IS NOT NULL
GROUP BY
    MONTH(ope.ope_fecasig),
    LTRIM(RTRIM(ISNULL(sucursal.suc_nombre, 'SIN SUCURSAL')))
ORDER BY
    mes ASC,
    sucursal ASC;
`;

export const analisisOperacionesPreventaDescuentoMensualVendedorQuery = (hasModeloFilter: boolean) => `
SELECT
    MONTH(ope.ope_fecasig) AS mes,
    LTRIM(RTRIM(ISNULL(vende.ven_nombre, 'SIN VENDEDOR'))) AS vendedor,
    AVG(
        CASE
            WHEN vp.precio IS NOT NULL AND vp.precio > 0 AND vp.bonificacion IS NOT NULL
                THEN (vp.bonificacion * 100.0) / vp.precio
            ELSE NULL
        END
    ) AS descuento_promedio
FROM
    viewpreventa vp
INNER JOIN opera ope ON
    ope.ope_codigo = vp.numero
    AND ope.ope_tipo = 5
    AND ope.ope_fecasig IS NOT NULL
INNER JOIN stoauto ON
    stoauto.sa_codigo = ope.ope_stoauto
LEFT JOIN vendedor vende ON
    vende.ven_codigo = vp.vendedor_id
LEFT JOIN auto ON
    auto.au_codigo = ope.ope_auto
    AND auto.au_marca = ope.ope_marca
LEFT JOIN famiauto ON
    auto.au_familia = famiauto.fam_codigo
WHERE
    vp.fecha_anulacion IS NULL
    AND stoauto.sa_nrofab LIKE 'NIC%'
    AND YEAR(ope.ope_fecasig) = :anio
    AND UPPER(LTRIM(RTRIM(vp.tipo))) = 'CERO'
    ${hasModeloFilter ? "AND LTRIM(RTRIM(ISNULL(famiauto.fam_nombre, 'SIN MODELO'))) = :modelo" : ""}
    AND vp.precio IS NOT NULL
    AND vp.precio > 0
    AND vp.bonificacion IS NOT NULL
GROUP BY
    MONTH(ope.ope_fecasig),
    LTRIM(RTRIM(ISNULL(vende.ven_nombre, 'SIN VENDEDOR')))
ORDER BY
    mes ASC,
    vendedor ASC;
`;

export const analisisOperacionesPreventaResumenFinanciacionQuery = () => `
SELECT
    SUM(CASE WHEN ISNULL(vp.credito_bancario, 0) > 0 THEN 1 ELSE 0 END) AS cantidad_operaciones_credito,
    SUM(CASE WHEN ISNULL(vp.usados, 0) > 0 THEN 1 ELSE 0 END) AS cantidad_operaciones_usado,
    AVG(
        CASE
            WHEN ISNULL(vp.usados, 0) > 0 THEN vp.usados * 1.0
            ELSE NULL
        END
    ) AS promedio_valor_usado
FROM
    viewpreventa vp
INNER JOIN opera ope ON
    ope.ope_codigo = vp.numero
    AND ope.ope_tipo = 5
    AND ope.ope_fecasig IS NOT NULL
INNER JOIN stoauto ON
    stoauto.sa_codigo = ope.ope_stoauto
WHERE
    vp.fecha_anulacion IS NULL
    AND stoauto.sa_nrofab LIKE 'NIC%'
    AND YEAR(ope.ope_fecasig) = :anio
    AND MONTH(ope.ope_fecasig) = :mes
    AND UPPER(LTRIM(RTRIM(vp.tipo))) = 'CERO';
`;

export const analisisOperacionesPreventaPromedioCreditoPorModeloQuery = () => `
SELECT
    LTRIM(RTRIM(ISNULL(famiauto.fam_nombre, 'SIN MODELO'))) AS modelo,
    AVG(
        CASE
            WHEN ISNULL(vp.credito_bancario, 0) > 0 THEN vp.credito_bancario * 1.0
            ELSE NULL
        END
    ) AS promedio_credito
FROM
    viewpreventa vp
INNER JOIN opera ope ON
    ope.ope_codigo = vp.numero
    AND ope.ope_tipo = 5
    AND ope.ope_fecasig IS NOT NULL
INNER JOIN stoauto ON
    stoauto.sa_codigo = ope.ope_stoauto
LEFT JOIN auto ON
    auto.au_codigo = ope.ope_auto
    AND auto.au_marca = ope.ope_marca
LEFT JOIN famiauto ON
    auto.au_familia = famiauto.fam_codigo
WHERE
    vp.fecha_anulacion IS NULL
    AND stoauto.sa_nrofab LIKE 'NIC%'
    AND YEAR(ope.ope_fecasig) = :anio
    AND MONTH(ope.ope_fecasig) = :mes
    AND UPPER(LTRIM(RTRIM(vp.tipo))) = 'CERO'
    AND ISNULL(vp.credito_bancario, 0) > 0
GROUP BY
    LTRIM(RTRIM(ISNULL(famiauto.fam_nombre, 'SIN MODELO')))
ORDER BY
    modelo ASC;
`;

export const analisisOperacionesPreventaUsadosMensualQuery = () => `
SELECT
    MONTH(ope.ope_fecasig) AS mes,
    COUNT(*) AS total_operaciones,
    SUM(CASE WHEN ISNULL(vp.usados, 0) > 0 THEN 1 ELSE 0 END) AS cantidad_usados,
    AVG(
        CASE
            WHEN ISNULL(vp.usados, 0) > 0 THEN vp.usados * 1.0
            ELSE NULL
        END
    ) AS promedio_valor_usado
FROM
    viewpreventa vp
INNER JOIN opera ope ON
    ope.ope_codigo = vp.numero
    AND ope.ope_tipo = 5
    AND ope.ope_fecasig IS NOT NULL
INNER JOIN stoauto ON
    stoauto.sa_codigo = ope.ope_stoauto
WHERE
    vp.fecha_anulacion IS NULL
    AND stoauto.sa_nrofab LIKE 'NIC%'
    AND YEAR(ope.ope_fecasig) = :anio
    AND UPPER(LTRIM(RTRIM(vp.tipo))) = 'CERO'
GROUP BY
    MONTH(ope.ope_fecasig)
ORDER BY
    mes ASC;
`;

export const analisisOperacionesPreventaCreditoMensualQuery = () => `
SELECT
    MONTH(ope.ope_fecasig) AS mes,
    COUNT(*) AS total_operaciones,
    SUM(CASE WHEN ISNULL(vp.credito_bancario, 0) > 0 THEN 1 ELSE 0 END) AS cantidad_operaciones_credito,
    AVG(
        CASE
            WHEN ISNULL(vp.credito_bancario, 0) > 0 THEN vp.credito_bancario * 1.0
            ELSE NULL
        END
    ) AS promedio_credito
FROM
    viewpreventa vp
INNER JOIN opera ope ON
    ope.ope_codigo = vp.numero
    AND ope.ope_tipo = 5
    AND ope.ope_fecasig IS NOT NULL
INNER JOIN stoauto ON
    stoauto.sa_codigo = ope.ope_stoauto
WHERE
    vp.fecha_anulacion IS NULL
    AND stoauto.sa_nrofab LIKE 'NIC%'
    AND YEAR(ope.ope_fecasig) = :anio
    AND UPPER(LTRIM(RTRIM(vp.tipo))) = 'CERO'
GROUP BY
    MONTH(ope.ope_fecasig)
ORDER BY
    mes ASC;
`;

export const analisisVendedorMensualPorModeloQuery = (hasVendedorFilter: boolean) => `
SELECT
    MONTH(ope.ope_fecasig) AS mes,
    LTRIM(RTRIM(ISNULL(famiauto.fam_nombre, 'SIN MODELO'))) AS modelo,
    COUNT(*) AS total
FROM
    opera ope
LEFT JOIN viewpreventa vp ON
    CAST(vp.id AS VARCHAR(50)) = CONCAT(CAST(ope.ope_tipo AS VARCHAR(20)), '-', CAST(ope.ope_codigo AS VARCHAR(20)))
INNER JOIN stoauto ON
    stoauto.sa_codigo = ope.ope_stoauto
LEFT JOIN vendedor vende ON
    vende.ven_codigo = ope.ope_vende
LEFT JOIN auto ON
    auto.au_codigo = ope.ope_auto
    AND auto.au_marca = ope.ope_marca
LEFT JOIN famiauto ON
    auto.au_familia = famiauto.fam_codigo
WHERE
    ope.ope_fecbaj IS NULL
    AND ope.ope_tipo = 5
    AND ope.ope_fecasig IS NOT NULL
    AND stoauto.sa_nrofab LIKE 'NIC%'
    AND YEAR(ope.ope_fecasig) = :anio
    AND vp.fecha_anulacion IS NULL
    AND UPPER(LTRIM(RTRIM(vp.tipo))) = 'CERO'
    ${hasVendedorFilter ? "AND ope.ope_vende = :vendedor" : ""}
GROUP BY
    MONTH(ope.ope_fecasig),
    LTRIM(RTRIM(ISNULL(famiauto.fam_nombre, 'SIN MODELO')))
ORDER BY
    mes ASC,
    modelo ASC;
`;

export const analisisVendedorOperacionesQuery = (hasVendedorFilter: boolean) => `
SELECT
    vp.numero,
    stoauto.sa_codigo AS interno,
    vp.fecha,
    LTRIM(RTRIM(vp.modelo)) AS version,
    LTRIM(RTRIM(ISNULL(famiauto.fam_nombre, ''))) AS modelo,
    vp.precio,
    vp.patentamiento,
    vp.flete,
    vp.formulario,
    vp.prenda,
    vp.equipamiento,
    vp.otro,
    vp.bonificacion
FROM
    opera ope
LEFT JOIN viewpreventa vp ON
    CAST(vp.id AS VARCHAR(50)) = CONCAT(CAST(ope.ope_tipo AS VARCHAR(20)), '-', CAST(ope.ope_codigo AS VARCHAR(20)))
INNER JOIN stoauto ON
    stoauto.sa_codigo = ope.ope_stoauto
LEFT JOIN auto ON
    auto.au_codigo = ope.ope_auto
    AND auto.au_marca = ope.ope_marca
LEFT JOIN famiauto ON
    auto.au_familia = famiauto.fam_codigo
WHERE
    ope.ope_fecbaj IS NULL
    AND ope.ope_tipo = 5
    AND ope.ope_fecasig IS NOT NULL
    AND stoauto.sa_nrofab LIKE 'NIC%'
    AND YEAR(ope.ope_fecasig) = :anio
    AND vp.fecha_anulacion IS NULL
    AND UPPER(LTRIM(RTRIM(vp.tipo))) = 'CERO'
    ${hasVendedorFilter ? "AND ope.ope_vende = :vendedor" : ""}
ORDER BY
    ope.ope_fecasig DESC,
    vp.numero DESC;
`;

export const analisisVendedorUsadosMensualQuery = (hasVendedorFilter: boolean) => `
SELECT
    MONTH(ope.ope_fecasig) AS mes,
    COUNT(*) AS total_operaciones,
    SUM(CASE WHEN ISNULL(vp.usados, 0) > 0 THEN 1 ELSE 0 END) AS cantidad_usados,
    AVG(
        CASE
            WHEN ISNULL(vp.usados, 0) > 0 THEN vp.usados * 1.0
            ELSE NULL
        END
    ) AS promedio_valor_usado
FROM
    opera ope
LEFT JOIN viewpreventa vp ON
    CAST(vp.id AS VARCHAR(50)) = CONCAT(CAST(ope.ope_tipo AS VARCHAR(20)), '-', CAST(ope.ope_codigo AS VARCHAR(20)))
INNER JOIN stoauto ON
    stoauto.sa_codigo = ope.ope_stoauto
WHERE
    ope.ope_fecbaj IS NULL
    AND ope.ope_tipo = 5
    AND ope.ope_fecasig IS NOT NULL
    AND stoauto.sa_nrofab LIKE 'NIC%'
    AND YEAR(ope.ope_fecasig) = :anio
    AND vp.fecha_anulacion IS NULL
    AND UPPER(LTRIM(RTRIM(vp.tipo))) = 'CERO'
    ${hasVendedorFilter ? "AND ope.ope_vende = :vendedor" : ""}
GROUP BY
    MONTH(ope.ope_fecasig)
ORDER BY
    mes ASC;
`;

export const analisisVendedorCreditoMensualQuery = (hasVendedorFilter: boolean) => `
SELECT
    MONTH(ope.ope_fecasig) AS mes,
    COUNT(*) AS total_operaciones,
    SUM(CASE WHEN ISNULL(vp.credito_bancario, 0) > 0 THEN 1 ELSE 0 END) AS cantidad_operaciones_credito,
    AVG(
        CASE
            WHEN ISNULL(vp.credito_bancario, 0) > 0 THEN vp.credito_bancario * 1.0
            ELSE NULL
        END
    ) AS promedio_credito
FROM
    opera ope
LEFT JOIN viewpreventa vp ON
    CAST(vp.id AS VARCHAR(50)) = CONCAT(CAST(ope.ope_tipo AS VARCHAR(20)), '-', CAST(ope.ope_codigo AS VARCHAR(20)))
INNER JOIN stoauto ON
    stoauto.sa_codigo = ope.ope_stoauto
WHERE
    ope.ope_fecbaj IS NULL
    AND ope.ope_tipo = 5
    AND ope.ope_fecasig IS NOT NULL
    AND stoauto.sa_nrofab LIKE 'NIC%'
    AND YEAR(ope.ope_fecasig) = :anio
    AND vp.fecha_anulacion IS NULL
    AND UPPER(LTRIM(RTRIM(vp.tipo))) = 'CERO'
    ${hasVendedorFilter ? "AND ope.ope_vende = :vendedor" : ""}
GROUP BY
    MONTH(ope.ope_fecasig)
ORDER BY
    mes ASC;
`;

export const analisisVendedorDescuentoMensualQuery = (hasVendedorFilter: boolean) => `
SELECT
    MONTH(ope.ope_fecasig) AS mes,
    AVG(
        CASE
            WHEN vp.precio IS NOT NULL AND vp.precio > 0 AND vp.bonificacion IS NOT NULL
                THEN (vp.bonificacion * 100.0) / vp.precio
            ELSE NULL
        END
    ) AS descuento_promedio,
    AVG(
        CASE
            WHEN vp.precio IS NOT NULL
                AND vp.precio > 0
                AND vp.bonificacion IS NOT NULL
                AND UPPER(LTRIM(RTRIM(ISNULL(famiauto.fam_nombre, '')))) = 'HILUX'
                THEN (vp.bonificacion * 100.0) / vp.precio
            ELSE NULL
        END
    ) AS descuento_promedio_hilux
FROM
    opera ope
LEFT JOIN viewpreventa vp ON
    CAST(vp.id AS VARCHAR(50)) = CONCAT(CAST(ope.ope_tipo AS VARCHAR(20)), '-', CAST(ope.ope_codigo AS VARCHAR(20)))
INNER JOIN stoauto ON
    stoauto.sa_codigo = ope.ope_stoauto
LEFT JOIN auto ON
    auto.au_codigo = ope.ope_auto
    AND auto.au_marca = ope.ope_marca
LEFT JOIN famiauto ON
    auto.au_familia = famiauto.fam_codigo
WHERE
    ope.ope_fecbaj IS NULL
    AND ope.ope_tipo = 5
    AND ope.ope_fecasig IS NOT NULL
    AND stoauto.sa_nrofab LIKE 'NIC%'
    AND YEAR(ope.ope_fecasig) = :anio
    AND vp.fecha_anulacion IS NULL
    AND UPPER(LTRIM(RTRIM(vp.tipo))) = 'CERO'
    AND vp.precio IS NOT NULL
    AND vp.precio > 0
    AND vp.bonificacion IS NOT NULL
    ${hasVendedorFilter ? "AND ope.ope_vende = :vendedor" : ""}
GROUP BY
    MONTH(ope.ope_fecasig)
ORDER BY
    mes ASC;
`;

export const analisisVendedorTotalSucursalQuery = () => `
SELECT
    COUNT(*) AS total
FROM
    opera ope
LEFT JOIN viewpreventa vp ON
    CAST(vp.id AS VARCHAR(50)) = CONCAT(CAST(ope.ope_tipo AS VARCHAR(20)), '-', CAST(ope.ope_codigo AS VARCHAR(20)))
INNER JOIN stoauto ON
    stoauto.sa_codigo = ope.ope_stoauto
LEFT JOIN vendedor vende ON
    vende.ven_codigo = ope.ope_vende
WHERE
    ope.ope_fecbaj IS NULL
    AND ope.ope_tipo = 5
    AND ope.ope_fecasig IS NOT NULL
    AND stoauto.sa_nrofab LIKE 'NIC%'
    AND YEAR(ope.ope_fecasig) = :anio
    AND vp.fecha_anulacion IS NULL
    AND UPPER(LTRIM(RTRIM(vp.tipo))) = 'CERO'
    AND vende.ven_sucur = (
        SELECT TOP 1
            ven_sucur
        FROM
            vendedor
        WHERE
            ven_codigo = :vendedor
    );
`;
