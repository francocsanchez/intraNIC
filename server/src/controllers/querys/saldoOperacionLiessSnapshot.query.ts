export const saldoOperacionLiessSnapshotSourceQuery = () => `
SELECT o.ope_codigo AS codigo_operacion, o.ope_tipo AS tipo_operacion, LTRIM(RTRIM(ISNULL(c.cli_nombre, ''))) AS cliente_nombre,
  LTRIM(RTRIM(ISNULL(v.ven_nombre, ''))) AS vendedor, LTRIM(RTRIM(ISNULL(su.suc_nombre, 'SIN SUCURSAL'))) AS sucursal,
  LTRIM(RTRIM(ISNULL(ma.mar_nombre, 'SIN MARCA'))) AS marca,
  LTRIM(RTRIM(ISNULL(a.au_nombre, 'SIN VERSION'))) AS version, COALESCE(NULLIF(LTRIM(RTRIM(m.mnp_chasis)), ''), NULLIF(LTRIM(RTRIM(au.aus_chasis)), '')) AS chasis,
  COALESCE(vp.precio, o.ope_precio, 0) + COALESCE(o.ope_gestor, 0) - COALESCE(vp.bonificacion, 0) AS total,
  o.ope_gestor AS gestoria, vp.bonificacion AS bonificacion, vp.usados AS usado, vp.credito_bancario AS credito_banco,
  ISNULL(cobros.senas, 0) AS senas,
  ISNULL(creditos.monto_liquidado, 0) AS credito_liquidado_monto,
  CONVERT(char(10), creditos.fecha_liquidacion, 23) AS credito_liquidado_en,
  CONVERT(char(10), COALESCE(auditoria.fecha_asignacion, o.ope_fecasig), 23) AS fecha_asignacion,
  CONVERT(char(10), o.ope_fecfac, 23) AS fecha_factura,
  DATEDIFF(DAY, COALESCE(auditoria.fecha_asignacion, o.ope_fecasig), GETDATE()) AS dias_asignada,
  CASE WHEN st.sa_estado IN (35, 40) THEN 1 ELSE 0 END AS entregada
FROM dbo.opera o
OUTER APPLY (SELECT TOP 1 p.* FROM dbo.viewpreventa p WHERE p.numero = o.ope_codigo ORDER BY p.fecha DESC, p.id DESC) vp
LEFT JOIN dbo.stoauto st ON st.sa_codigo = o.ope_stoauto AND st.sa_tipo = o.ope_tipo
LEFT JOIN dbo.movnped m ON m.mnp_stoauto = st.sa_codigo
LEFT JOIN dbo.anexusa au ON au.aus_codigo = st.sa_codigo AND au.aus_tipo = st.sa_tipo
LEFT JOIN dbo.cliente c ON c.cli_codigo = o.ope_cliente
LEFT JOIN dbo.vendedor v ON v.ven_codigo = o.ope_vende
LEFT JOIN dbo.sucursal su ON su.suc_codigo = o.ope_sucur
LEFT JOIN dbo.auto a ON a.au_codigo = o.ope_auto AND a.au_marca = o.ope_marca
LEFT JOIN dbo.marca ma ON ma.mar_codigo = o.ope_marca
OUTER APPLY (SELECT TOP 1 aud.aud_fecha AS fecha_asignacion FROM dbo.audittabla aud WHERE aud.aud_codigo = o.ope_codigo AND aud.aud_codigo1 = o.ope_tipo AND aud.aud_tabla = N'opera' AND aud.aud_campo = N'Asignación Unidad' ORDER BY aud.aud_fecha DESC, aud.aud_hora DESC, aud.aud_renglon DESC) auditoria
OUTER APPLY (SELECT SUM(g.sgl_haber) AS senas FROM dbo.salglo g WHERE g.sgl_opera = o.ope_codigo AND g.sgl_tipmov = 105 AND g.sgl_haber > 0 AND EXISTS (SELECT 1 FROM dbo.movcajh mc WHERE mc.mc_nroope = g.sgl_nroope)) cobros
OUTER APPLY (SELECT SUM(g.sgl_haber) AS monto_liquidado, MAX(g.sgl_fecmov) AS fecha_liquidacion FROM dbo.salglo g WHERE g.sgl_opera = o.ope_codigo AND g.sgl_tipo = o.ope_tipo AND g.sgl_tipmov = 150 AND g.sgl_haber > 0) creditos
WHERE o.ope_tipo IN (5, 10) AND o.ope_fecbaj IS NULL AND o.ope_fecha >= CONVERT(date, '20260501', 112);`;
