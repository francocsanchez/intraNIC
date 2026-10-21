export const kintoFlotaLookupQuery = () => `
SELECT DISTINCT TOP (2)
  ISNULL(NULLIF(LTRIM(RTRIM(auto.au_nombre)), ''), '') AS modelo,
  TRY_CONVERT(INT, anexnvo.an_anio) AS anio,
  ISNULL(NULLIF(LTRIM(RTRIM(anexnvo.an_chasis)), ''), '') AS vin
FROM siac.dbo.anexnvo AS anexnvo
INNER JOIN siac.dbo.auto AS auto
  ON auto.au_marca = anexnvo.an_marca
  AND auto.au_codigo = anexnvo.an_auto
WHERE anexnvo.an_dominio = :patente
`;
