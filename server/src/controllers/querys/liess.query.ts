// querys/liess.query.ts
export type StockLiessRow = {
  interno: number;
  estado: number;
  marca: string;
  version: string;
  chasis: string | null;
  color: string | null;
  reservaVendedor: string;
  tipo: "nuevo" | "usado";
  fechaRecepcion: string;
};

export const stockLiessQuery = (tipo: number) => `
SELECT
	stoauto.sa_codigo AS "interno",
	stoauto.sa_estado AS "estado",
	marca.mar_nombre AS "marca",
	auto.au_nombre AS "version",
	movnped.mnp_chasis AS "chasis",
	movnped.mnp_fecrec AS "fechaRecepcion",
	COALESCE(anexnvo.an_color, anexusa.aus_color) AS "color",
	anexnvo.an_anio as "anioNuevo",
	anexusa.aus_anio as "anioUsado",
	stoauto.sa_reserva AS "reservaVendedor",
	CASE
		WHEN stoauto.sa_tipo = 5 THEN 'NUEVO'
		ELSE 'USADO'
	END AS "tipo"
FROM
	stoauto
INNER JOIN auto ON
	auto.au_codigo = stoauto.sa_auto
	AND auto.au_marca = stoauto.sa_marca
INNER JOIN marca ON
	auto.au_marca = marca.mar_codigo
INNER JOIN movnped ON
	stoauto.sa_codigo = movnped.mnp_stoauto
LEFT JOIN anexnvo ON
	stoauto.sa_codigo = anexnvo.an_stoauto
	AND stoauto.sa_tipo = anexnvo.an_tipo
LEFT JOIN anexusa ON
	stoauto.sa_codigo = anexusa.aus_codigo
	AND stoauto.sa_tipo = anexusa.aus_tipo
WHERE
	stoauto.sa_opera = 0
	AND stoauto.sa_tipo = ${tipo}
	AND stoauto.sa_reserva IN ('NQN', 'SIMPA')
	AND (
        stoauto.sa_estado = 10
		OR stoauto.sa_estado = 25
      )
ORDER BY
	marca.mar_nombre,
	auto.au_nombre
`;

export const getStockConsolidadoLiess = () => `
SELECT
	stoauto.sa_codigo as "interno",
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
	END as "tipoStock"
FROM
	stoauto
INNER JOIN auto ON
	stoauto.sa_auto = auto.au_codigo
	AND stoauto.sa_marca = auto.au_marca
INNER JOIN marca ON
	marca.mar_codigo = auto.au_marca
WHERE
	stoauto.sa_estado NOT IN (40, 35)
`