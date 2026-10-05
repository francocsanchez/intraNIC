// Consulta base acordada para alimentar el snapshot; devuelve exclusivamente operaciones no entregadas.
export const saldoOperacionSnapshotSourceQuery = () => `
SELECT
  csq.Codigo_operacion AS codigo_operacion,
  csq.cliente_nombre AS cliente_nombre,
  csq.Vendedor AS vendedor,
  sucursal_operacion.suc_nombre AS sucursal,
  opera.usuario_codigo AS usuario_operacion,
  usuario_operacion.usu_nombre AS nombre_usuario_operacion,
  csq.Numero_Fabrica AS numero_fabrica,
  csq.Pcio_Venta AS pcio_venta,
  csq.Bonif_Venta AS bonif_venta,
  csq.gestoria AS gestoria,
  csq.Senas AS senas,
  csq.Usado AS usado,
  csq.total_Cred_banco AS total_cred_banco,
  csq.Version AS version,
  COALESCE(famiauto_modelo.fam_nombre, csq.Modelo_General) AS modelo_general,
  CONVERT(char(10), opera.fecha_asignacion, 23) AS fecha_asignacion,
  CONVERT(char(10), opera.fecha_factura, 23) AS fecha_factura,
  DATEDIFF(DAY, opera.fecha_asignacion, GETDATE()) AS dias_asignada,
  csq.Estado AS estado
FROM dbo.csqUnidades csq
OUTER APPLY (
  SELECT TOP 1 ope.ope_fecasig AS fecha_asignacion, ope.ope_fecfac AS fecha_factura, ope.ope_auto AS auto_codigo,
    ope.ope_marca AS auto_marca, ope.ope_sucur AS sucursal_codigo, ope.ope_usua AS usuario_codigo
  FROM dbo.opera ope
  WHERE ope.ope_tipo = 5 AND ope.ope_codigo = csq.Codigo_operacion AND ope.ope_fecbaj IS NULL
  ORDER BY ope.ope_fecasig DESC
) opera
LEFT JOIN dbo.auto auto_modelo ON auto_modelo.au_codigo = opera.auto_codigo AND auto_modelo.au_marca = opera.auto_marca
LEFT JOIN dbo.famiauto famiauto_modelo ON famiauto_modelo.fam_codigo = auto_modelo.au_familia
LEFT JOIN dbo.sucursal sucursal_operacion ON sucursal_operacion.suc_codigo = opera.sucursal_codigo
LEFT JOIN dbo.usuario usuario_operacion ON usuario_operacion.usu_codigo = opera.usuario_codigo
WHERE csq.Numero_Fabrica LIKE 'NIC%'
  AND csq.Codigo_operacion IS NOT NULL
  AND UPPER(LTRIM(RTRIM(ISNULL(csq.Estado, '')))) NOT LIKE 'ENT%';
`;

export const saldoOperacionUbicacionesQuery = () => `
SELECT mnp.mnp_nrofab AS numero_fabrica,
  COALESCE(NULLIF(LTRIM(RTRIM(mnp.mnp_status)), ''), 'STOCK CONCESIONARIO') AS ubicacion
FROM dbo.movnped mnp
WHERE mnp.mnp_nrofab LIKE 'NIC%';
`;

export const saldoOperacionEstadosEntregadosQuery = () => `
SELECT csq.Codigo_operacion AS codigo_operacion, csq.Estado AS estado
FROM dbo.csqUnidades csq
WHERE csq.Codigo_operacion IN (:codigos);
`;

export const saldoOperacionUsuariosQuery = () => `
SELECT CAST(usu_codigo AS VARCHAR(30)) AS codigo, LTRIM(RTRIM(usu_nombre)) AS nombre
FROM dbo.usuario
WHERE ISNULL(usu_habilitado, 0) = 1
  AND usu_codigo IS NOT NULL
ORDER BY usu_nombre ASC, usu_codigo ASC;
`;
