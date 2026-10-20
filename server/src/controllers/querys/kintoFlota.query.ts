export const kintoFlotaLookupQuery = () => `
SELECT DISTINCT TOP (2)
  ISNULL(NULLIF(LTRIM(RTRIM(modelo)), ''), '') AS modelo,
  TRY_CONVERT(INT, modelo_ano) AS anio,
  ISNULL(NULLIF(LTRIM(RTRIM(vin)), ''), '') AS vin
FROM siac.dbo.viewunidades
WHERE UPPER(REPLACE(LTRIM(RTRIM(patente)), ' ', '')) = :patente
`;
