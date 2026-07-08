export const agendaEntregaLookupConvencionalQuery = () => `
SELECT
    s.sa_codigo AS "interno",
    s.sa_estado AS "estado",
    o.ope_codigo AS "operacion",
    v.ven_nombre AS "vendedor",
    cli.cli_nombre AS "cliente",
    cli.cli_telefo AS "telefono",
    ISNULL(auto.au_nombre, '-') AS "version",
    ISNULL(famiauto.fam_nombre, '-') AS "modelo",
    ISNULL(m.mnp_chasis, '-') AS "chasis",
    ISNULL(m.mnp_nrofab, '-') AS "nroFabricacion",
    ISNULL(an.an_dominio, '-') AS "dominio",
    ISNULL(CONVERT(VARCHAR(10), an.an_fecpaten, 103), '-') AS "fechaPatente",
    c.col_nombre AS "color",
    CASE
        WHEN m.mnp_nrofab LIKE 'TPA%' THEN 'PLAN DE AHORRO'
        WHEN m.mnp_nrofab LIKE 'F0%' THEN 'V. ESPECIALES'
        ELSE 'NIC'
    END AS "tipoOperacion"
FROM stoauto s
INNER JOIN opera o
    ON o.ope_codigo = s.sa_opera
INNER JOIN vendedor v
    ON v.ven_codigo = o.ope_vende
INNER JOIN cliente cli
    ON cli.cli_codigo = o.ope_cliente
LEFT JOIN movnped m
    ON m.mnp_stoauto = s.sa_codigo
LEFT JOIN auto
    ON auto.au_codigo = s.sa_auto
    AND auto.au_marca = s.sa_marca
LEFT JOIN famiauto
    ON auto.au_familia = famiauto.fam_codigo
LEFT JOIN color c
    ON c.col_codigo = m.mnp_col1
LEFT JOIN anexnvo an
    ON an.an_stoauto = s.sa_codigo
    AND an.an_tipo = s.sa_tipo
WHERE s.sa_codigo = :interno
`;

export const agendaEntregaLookupPlanAhorroQuery = () => `
SELECT
    sa.sa_codigo AS "interno",
    sa.sa_estado AS "estado",
    cli.cli_nombre AS "cliente",
    cli.cli_telefo AS "telefono",
    ven.ven_nombre AS "vendedor",
    ISNULL(auto.au_nombre, '-') AS "version",
    ISNULL(famiauto.fam_nombre, '-') AS "modelo",
    sa.sa_grupo AS "grupo",
    sa.sa_orden AS "orden",
    sol.sol_serie AS "serie",
    ISNULL(sa.sa_nrofab, '-') AS "nroFabricacion",
    ISNULL(an.an_dominio, '-') AS "dominio",
    ISNULL(CONVERT(VARCHAR(10), an.an_fecpaten, 103), '-') AS "fechaPatente",
    col.col_nombre AS "color",
    'PLAN DE AHORRO' AS "tipoOperacion"
FROM stoauto sa
INNER JOIN solicitud sol
    ON sol.sol_grupo = sa.sa_grupo
    AND sol.sol_orden = sa.sa_orden
INNER JOIN cliente cli
    ON cli.cli_codigo = sol.sol_cliente
INNER JOIN vendedor ven
    ON ven.ven_codigo = sol.sol_vendedor
LEFT JOIN auto
    ON auto.au_codigo = sa.sa_auto
    AND auto.au_marca = sa.sa_marca
LEFT JOIN famiauto
    ON auto.au_familia = famiauto.fam_codigo
LEFT JOIN color col
    ON col.col_codigo = sol.sol_accolor
LEFT JOIN anexnvo an
    ON an.an_stoauto = sa.sa_codigo
    AND an.an_tipo = sa.sa_tipo
WHERE sa.sa_codigo = :interno
`;

export const agendaEntregaBatchConvencionalQuery = () => `
SELECT
    s.sa_codigo AS "interno",
    s.sa_estado AS "estado",
    o.ope_codigo AS "operacion",
    v.ven_nombre AS "vendedor",
    cli.cli_nombre AS "cliente",
    cli.cli_telefo AS "telefono",
    ISNULL(auto.au_nombre, '-') AS "version",
    ISNULL(famiauto.fam_nombre, '-') AS "modelo",
    ISNULL(m.mnp_chasis, '-') AS "chasis",
    ISNULL(m.mnp_nrofab, '-') AS "nroFabricacion",
    ISNULL(an.an_dominio, '-') AS "dominio",
    ISNULL(CONVERT(VARCHAR(10), an.an_fecpaten, 103), '-') AS "fechaPatente",
    c.col_nombre AS "color",
    CASE
        WHEN m.mnp_nrofab LIKE 'TPA%' THEN 'PLAN DE AHORRO'
        WHEN m.mnp_nrofab LIKE 'F0%' THEN 'V. ESPECIALES'
        ELSE 'NIC'
    END AS "tipoOperacion"
FROM stoauto s
INNER JOIN opera o
    ON o.ope_codigo = s.sa_opera
INNER JOIN vendedor v
    ON v.ven_codigo = o.ope_vende
INNER JOIN cliente cli
    ON cli.cli_codigo = o.ope_cliente
LEFT JOIN movnped m
    ON m.mnp_stoauto = s.sa_codigo
LEFT JOIN auto
    ON auto.au_codigo = s.sa_auto
    AND auto.au_marca = s.sa_marca
LEFT JOIN famiauto
    ON auto.au_familia = famiauto.fam_codigo
LEFT JOIN color c
    ON c.col_codigo = m.mnp_col1
LEFT JOIN anexnvo an
    ON an.an_stoauto = s.sa_codigo
    AND an.an_tipo = s.sa_tipo
WHERE s.sa_codigo IN (:internos)
`;

export const agendaEntregaBatchPlanAhorroQuery = () => `
SELECT
    sa.sa_codigo AS "interno",
    sa.sa_estado AS "estado",
    cli.cli_nombre AS "cliente",
    cli.cli_telefo AS "telefono",
    ven.ven_nombre AS "vendedor",
    ISNULL(auto.au_nombre, '-') AS "version",
    ISNULL(famiauto.fam_nombre, '-') AS "modelo",
    sa.sa_grupo AS "grupo",
    sa.sa_orden AS "orden",
    sol.sol_serie AS "serie",
    ISNULL(sa.sa_nrofab, '-') AS "nroFabricacion",
    ISNULL(an.an_dominio, '-') AS "dominio",
    ISNULL(CONVERT(VARCHAR(10), an.an_fecpaten, 103), '-') AS "fechaPatente",
    col.col_nombre AS "color",
    'PLAN DE AHORRO' AS "tipoOperacion"
FROM stoauto sa
INNER JOIN solicitud sol
    ON sol.sol_grupo = sa.sa_grupo
    AND sol.sol_orden = sa.sa_orden
INNER JOIN cliente cli
    ON cli.cli_codigo = sol.sol_cliente
INNER JOIN vendedor ven
    ON ven.ven_codigo = sol.sol_vendedor
LEFT JOIN auto
    ON auto.au_codigo = sa.sa_auto
    AND auto.au_marca = sa.sa_marca
LEFT JOIN famiauto
    ON auto.au_familia = famiauto.fam_codigo
LEFT JOIN color col
    ON col.col_codigo = sol.sol_accolor
LEFT JOIN anexnvo an
    ON an.an_stoauto = sa.sa_codigo
    AND an.an_tipo = sa.sa_tipo
WHERE sa.sa_codigo IN (:internos)
`;
