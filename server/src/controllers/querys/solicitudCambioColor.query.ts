export const unidadCambioColorQuery = () => `
  SELECT TOP 1
    stoauto.sa_codigo AS "interno",
    ISNULL(stoauto.sa_nrofab, '') AS "nrofab",
    auto.au_nombre AS "version",
    ISNULL(color.col_nombre, 'SIN COLOR') AS "color",
    ISNULL(NULLIF(LTRIM(RTRIM(movnped.mnp_chasis)), ''), '') AS "chasis"
  FROM stoauto
  INNER JOIN auto ON auto.au_codigo = stoauto.sa_auto AND auto.au_marca = stoauto.sa_marca
  LEFT JOIN movnped ON movnped.mnp_stoauto = stoauto.sa_codigo
  LEFT JOIN color ON color.col_codigo = movnped.mnp_col1
  WHERE stoauto.sa_codigo = :interno
    AND stoauto.sa_tipo = 5
  ORDER BY movnped.mnp_fecrec DESC
`;

export const unidadesCambioColorChasisQuery = () => `
  SELECT
    stoauto.sa_codigo AS "interno",
    MAX(ISNULL(stoauto.sa_nrofab, '')) AS "nrofab",
    MAX(ISNULL(NULLIF(LTRIM(RTRIM(movnped.mnp_chasis)), ''), '')) AS "chasis"
  FROM stoauto
  LEFT JOIN movnped ON movnped.mnp_stoauto = stoauto.sa_codigo
  WHERE stoauto.sa_codigo IN (:internos)
    AND stoauto.sa_tipo = 5
  GROUP BY stoauto.sa_codigo
`;
