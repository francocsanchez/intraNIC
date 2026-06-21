export const promedioVentasPlanAhorroQuery = () => `
SELECT
    ISNULL(suc.suc_nombre, 'SIN ASIGNAR') AS "sucursal",
    ven.ven_nombre AS "vendedor",
    COUNT(sol.sol_codigo) / 6.0 AS "promedio"
FROM
    solicitud sol
INNER JOIN vendedor ven ON
    sol.sol_vendedor = ven.ven_codigo
LEFT JOIN sucursal suc ON
    ven.ven_sucur = suc.suc_codigo
WHERE
    sol.sol_fecanu IS NULL
    AND sol.sol_fecha >= DATEADD(MONTH, -5, DATEFROMPARTS(:ano, :mes, 1))
    AND sol.sol_fecha < DATEADD(MONTH, 1, DATEFROMPARTS(:ano, :mes, 1))
GROUP BY
    suc.suc_nombre,
    ven.ven_nombre
ORDER BY
    suc.suc_nombre,
    ven.ven_nombre
`;
