# Guía de integración — API InfoAuto (Autos)

> Relevada en el portal de Ayuda de InfoAuto el 11 de noviembre de 2026. Esta guía no contiene ni debe contener credenciales. Antes de implementar un endpoint poco frecuente, contrastar sus parámetros en el Swagger autenticado del portal, ya que el proveedor puede ampliar el contrato.

## Base URL y autenticación

| Recurso | URL |
| --- | --- |
| API pública autenticada | `https://demo.api.infoauto.com.ar/cars/pub` |
| Inicio de sesión | `POST https://demo.api.infoauto.com.ar/cars/auth/login` |
| Renovación | `POST https://demo.api.infoauto.com.ar/cars/auth/refresh` |
| Swagger (requiere Bearer) | `https://demo.api.infoauto.com.ar/cars/openapi/spec.yaml` |

La API usa JSON Web Tokens (JWT):

- `access_token`: se envía como `Authorization: Bearer <access_token>` en **todas** las consultas; dura 1 hora.
- `refresh_token`: permite renovar el access token; dura 24 horas.
- El login recibe autenticación HTTP Basic y la renovación recibe el refresh token como Bearer.
- No pedir un access token por cada consulta: InfoAuto lo considera mal uso y puede bloquear las credenciales. Persistirlo de forma segura y reutilizarlo hasta que venza; un job de renovación con almacenamiento compartido (por ejemplo Redis) es el patrón recomendado.

```ts
// Nunca dejar usuario/contraseña en el repositorio.
const basic = Buffer.from(`${process.env.INFOAUTO_USER}:${process.env.INFOAUTO_PASSWORD}`).toString('base64');
const login = await fetch('https://demo.api.infoauto.com.ar/cars/auth/login', {
  method: 'POST',
  headers: { Authorization: `Basic ${basic}` },
});
const tokens = await login.json();

const response = await fetch('https://demo.api.infoauto.com.ar/cars/pub/brands/', {
  headers: { Authorization: `Bearer ${tokens.access_token}` },
});
```

## Reglas operativas importantes

- Valores monetarios de `price` y `list_price` están expresados en **miles de pesos**.
- Los precios usados del año actual son precios de mercado; `list_price` es el precio de lista 0 km de la terminal. No son intercambiables.
- Las respuestas paginadas incluyen `X-Pagination`; todos los endpoints observados pueden devolver los headers `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` y, ante espera, `Retry-After`.
- Errores: el cuerpo estándar contiene `message`, `status`, `errors` y `code`; validar especialmente `422` para datos de entrada inválidos.
- Para sincronizar una cartera propia, usar `POST /batch/` en lotes de hasta 100 CODIA; **no** recorrer automáticamente toda la base. El proveedor prohíbe expresamente usar lotes para construir una copia del catálogo completo.

## Catálogo de endpoints

Todos los paths siguientes se agregan a `/cars/pub` y requieren Bearer, salvo los dos endpoints de autenticación indicados arriba.

### Actualidad

| Método | Path | Uso |
| --- | --- | --- |
| POST | `/batch/` | Recupera modelos completos por lote de CODIA. Body: `{ "batch": [123] }`; máximo 100, sin códigos repetidos o inválidos. Requiere `Accept-Encoding: gzip`. Máximo 150 consultas cada 24 h. |
| GET | `/datetime` | Fecha/hora de la última actualización. |
| GET | `/current_year` | Año en curso. |
| GET | `/brands/` | Marcas paginadas y filtrables. |
| GET | `/brands/download/` | Todas las marcas con sus grupos; requiere `Accept-Encoding: gzip`. Producción: hasta 20 consultas cada 24 h. Útil para sincronización periódica de la jerarquía. |
| GET | `/brands/{brand_id}/prices/` | Años con precio usado para una marca. |
| GET | `/brands/{brand_id}/models/` | Modelos de una marca. |
| GET | `/brands/{brand_id}/groups/` | Grupos de una marca. |
| GET | `/brands/{brand_id}/groups/{group_id}/prices/` | Años con precio usado para marca y grupo. |
| GET | `/brands/{brand_id}/groups/{group_id}/models/` | Modelos de una marca y grupo. |
| GET | `/search/` | Modelos paginados y filtrables sobre todo el catálogo. |
| GET | `/models/{codia}` | Ficha de un modelo. |
| GET | `/models/{codia}/list_price` | Precio de lista 0 km de un modelo. |
| GET | `/models/{codia}/prices/` | Precios usados de un modelo. |
| GET | `/models/{codia}/as_codia` | CODIA asimilado de un modelo. |
| GET | `/models/{codia}/photos/` | Fotos del modelo. |
| GET | `/models/{codia}/features/` | Características técnicas y valores del modelo. |
| GET | `/features/` | Definición de todas las características técnicas disponibles. |
| GET | `/features/{feature_id}/choices/` | Opciones válidas de una característica. |

### Histórico

Los históricos reproducen las consultas de catálogo para un corte determinado. `year` y `month` son obligatorios en todos los paths que los contienen.

| Método | Path | Uso |
| --- | --- | --- |
| GET | `/archives/` | Archivos históricos disponibles. |
| GET | `/archives/years/` | Años con archivos disponibles. |
| GET | `/archives/years/{year}/months/` | Meses disponibles para un año. |
| GET | `/archives/years/{year}/months/{month}/brands/` | Marcas del período. |
| GET | `/archives/years/{year}/months/{month}/brands/{brand_id}/prices/` | Años de precios usados por marca. |
| GET | `/archives/years/{year}/months/{month}/brands/{brand_id}/models/` | Modelos por marca. |
| GET | `/archives/years/{year}/months/{month}/brands/{brand_id}/groups/` | Grupos por marca. |
| GET | `/archives/years/{year}/months/{month}/brands/{brand_id}/groups/{group_id}/prices/` | Años de precios usados por marca y grupo. |
| GET | `/archives/years/{year}/months/{month}/brands/{brand_id}/groups/{group_id}/models/` | Modelos por marca y grupo. |
| GET | `/archives/years/{year}/months/{month}/search/` | Búsqueda de modelos en el corte histórico. |
| GET | `/archives/years/{year}/months/{month}/models/{codia}` | Ficha histórica de modelo. |
| GET | `/archives/years/{year}/months/{month}/models/{codia}/list_price` | Precio 0 km histórico. |
| GET | `/archives/years/{year}/months/{month}/models/{codia}/prices/` | Precios usados históricos. |

## Búsqueda y filtros

`/brands/` y `/search/` admiten el mismo núcleo de filtros; sus equivalentes históricos conservan ese comportamiento. `/brands/` busca por nombre de marca; `/search/` busca en marca, grupo y descripción de modelo.

| Parámetro | Tipo / valores | Significado |
| --- | --- | --- |
| `query_string` | string | Texto a buscar. |
| `query_mode` | `matching` (default) \| `similarity` | Coincidencia parcial exacta o similitud por trigramas. |
| `list_price`, `prices` | boolean | Tiene precio 0 km / precios usados. |
| `price_at`, `prices_from`, `prices_to` | integer | Año exacto, desde y hasta para precio usado. |
| `prices_min`, `prices_max` | number | Rango de precios usados. |
| `list_price_min`, `list_price_max` | number | Rango de precios de lista 0 km. |
| `page`, `page_size` | integer; defaults `1`, `10` | Paginación. |
| `feature_{id}` | array | Filtros de ficha técnica; obtener el catálogo y las opciones actuales desde `/features/` y `/features/{id}/choices/`. |

Los filtros más usados son: `feature_1` combustible, `feature_2` alimentación, `feature_3` tipo de vehículo, `feature_4` cabina, `feature_5` dirección, `feature_6` tracción, `feature_7` caja y `feature_11` puertas. La especificación también expone seguridad, confort, conectividad, dimensiones, consumos y asistencias como `feature_8` a `feature_85` (con algunas numeraciones no consecutivas). No hardcodear el listado: usar `/features/` como fuente de verdad y sus choices para valores enumerados.

## Modelo de datos esencial

La jerarquía es `Brand → Group → Model`.

| Entidad | Campos relevantes |
| --- | --- |
| Brand | `id`, `name`, `logo_url`, `summary`, y los campos comunes. |
| Group | `id`, `brand_id`, `name`, y los campos comunes. |
| Model | `codia`, `brand_id`, `group_id`, `description`, `photo_url`, `position`, `as_codia`, `r_codia`, y los campos comunes. |
| Price | `year`, `price` (miles de pesos). |
| ListPrice | `codia`, `list_price` (miles de pesos). |
| Feature | `id`, `category_name`, `description`, `type`, `position`, `length`, `decimals`. |
| FeatureChoice | `id`, `feature_id`, `description`, `long_description`. |
| Photo | `url`. |

Campos comunes de Brand, Group y Model: `list_price`, `prices`, `prices_from`, `prices_to` y `summary`.

Semántica especial del modelo:

- `as_codia`: CODIA de referencia con precio 0 km, o `null`.
- `r_codia`: baja del modelo; puede indicar un CODIA reasignado o el especial `9999999` si no hay reasignación.
- Las fotos y la ficha técnica se relacionan con el modelo por `codia`.

## Patrones recomendados

### Identificar un vehículo en una UI

1. Para selector guiado: sincronizar `GET /brands/download/` de forma periódica; luego consultar grupos/modelos por marca.
2. Para búsqueda libre: usar `GET /search/?query_string=...&query_mode=matching` y pasar a `similarity` solo cuando haga falta tolerancia.
3. Aplicar `list_price`, `prices`, año y `feature_*` para restringir resultados antes de mostrarlos.
4. Conservar y usar el `codia` como identificador estable de integración.

### Actualizar una cartera vigente

1. Mantener internamente solo los CODIA de interés legítimo.
2. Partirlos en lotes de hasta 100 y llamar `POST /batch/` con gzip.
3. Respetar el límite de 150 requests/24 h, leer los headers de rate limit y reintentar tras `Retry-After`.
4. Actualizar en almacenamiento propio precios, características y fotos de esos CODIA, sin intentar descargar el catálogo total.

## Ejemplos seguros

```bash
# Consulta de marcas (el token viene de almacenamiento seguro).
curl --request GET \
  --header "Authorization: Bearer $INFOAUTO_ACCESS_TOKEN" \
  'https://demo.api.infoauto.com.ar/cars/pub/brands/?query_string=toyota&page=1&page_size=10'

# Actualización de una cartera propia; incluir gzip como exige el endpoint.
curl --request POST \
  --header "Authorization: Bearer $INFOAUTO_ACCESS_TOKEN" \
  --header 'Accept-Encoding: gzip' \
  --header 'Content-Type: application/json' \
  --data '{"batch":[1234567,2345678]}' \
  'https://demo.api.infoauto.com.ar/cars/pub/batch/'
```

## Checklist antes de integrar

- [ ] Secretos solo en variables/gestor de secretos; nunca en código, documentación ni logs.
- [ ] Cachear access token y refrescarlo antes o al recibir expiración; no hacer login por request.
- [ ] Guardar los montos como miles de pesos o convertirlos explícitamente al formato monetario de la aplicación.
- [ ] Para una consulta histórica, validar primero que el año/mes exista mediante `/archives/years/` y `/archives/years/{year}/months/`.
- [ ] Implementar paginación usando `X-Pagination`.
- [ ] Respetar límites y `Retry-After`; no automatizar una extracción masiva del catálogo.
- [ ] Al agregar filtros `feature_*`, descubrir sus tipos/opciones desde la API en vez de depender de valores fijos.
