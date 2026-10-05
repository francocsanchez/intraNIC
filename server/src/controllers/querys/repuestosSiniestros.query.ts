export const unidadRepuestoSiniestroQuery = () => `
  SELECT TOP 1
    stoauto.sa_codigo AS interno,
    ISNULL(famiauto.fam_nombre, '-') AS modelo,
    ISNULL(auto.au_nombre, '-') AS version,
    ISNULL(NULLIF(LTRIM(RTRIM(movnped.mnp_chasis)), ''), '') AS chasis,
    ISNULL(cliente.cli_nombre, 'SIN CLIENTE') AS cliente
  FROM stoauto
  INNER JOIN auto ON stoauto.sa_auto = auto.au_codigo AND stoauto.sa_marca = auto.au_marca
  LEFT JOIN famiauto ON auto.au_familia = famiauto.fam_codigo
  LEFT JOIN opera ON stoauto.sa_opera = opera.ope_codigo
  LEFT JOIN cliente ON opera.ope_cliente = cliente.cli_codigo
  LEFT JOIN movnped ON stoauto.sa_codigo = movnped.mnp_stoauto
  WHERE stoauto.sa_tipo = 5 AND stoauto.sa_codigo = :interno
  ORDER BY movnped.mnp_fecrec DESC
`;

export const notasPedidoPorNumeroQuery = () => `
  SELECT h.msc_nroope AS operacion, h.msc_nrocom AS numero,
    CONVERT(char(10), h.msc_fecha, 103) AS fecha, h.msc_cuenta AS cuenta,
    ISNULL(c.cli_nombre, 'SIN CLIENTE') AS cliente, ISNULL(s.suc_nombre, 'SIN ASIGNAR') AS sucursal,
    COUNT(d.ms_artic) AS cantidadArticulos
  FROM movscab h
  LEFT JOIN cliente c ON c.cli_codigo = h.msc_cuenta
  LEFT JOIN sucursal s ON s.suc_codigo = h.msc_sucur
  INNER JOIN movsto d ON d.ms_nroope = h.msc_nroope
  WHERE h.msc_nrocom = :numero
  GROUP BY h.msc_nroope, h.msc_nrocom, h.msc_fecha, h.msc_cuenta, c.cli_nombre, s.suc_nombre
  ORDER BY h.msc_fecha DESC, h.msc_nroope DESC
`;

export const notaPedidoCabeceraQuery = () => `
  SELECT h.msc_nroope AS operacion, h.msc_nrocom AS numero,
    CONVERT(char(10), h.msc_fecha, 103) AS fecha, h.msc_cuenta AS cuenta,
    ISNULL(c.cli_nombre, 'SIN CLIENTE') AS cliente, ISNULL(s.suc_nombre, 'SIN ASIGNAR') AS sucursal
  FROM movscab h
  LEFT JOIN cliente c ON c.cli_codigo = h.msc_cuenta
  LEFT JOIN sucursal s ON s.suc_codigo = h.msc_sucur
  WHERE h.msc_nroope = :operacion
`;

export const notaPedidoArticulosQuery = () => `
  SELECT d.ms_renglon AS renglon, CAST(d.ms_artic AS varchar(50)) AS articulo,
    ISNULL(NULLIF(LTRIM(RTRIM(s.st_nombre)), ''), 'SIN DENOMINACION') AS denominacion,
    d.ms_cantid AS cantidad
  FROM movsto d
  LEFT JOIN stock s ON s.st_linea = d.ms_linea AND s.st_artic = d.ms_artic AND s.st_ind = d.ms_ind
  WHERE d.ms_nroope = :operacion
  ORDER BY d.ms_renglon, d.ms_linea
`;
