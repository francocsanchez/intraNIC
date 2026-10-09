# AGENTS.md
Siempre actualizar este archivo y el CHANGELOG.md cada vez que se realice una implementacion.
No registrar en el router una vista cuyo archivo no esté versionado en el mismo commit; el build de frontend se ejecuta con un checkout limpio en Docker.

`Saldo de operacion` lee exclusivamente `saldo_operacion_snapshots` en Mongo; su sincronizador consulta SIAC cada dos minutos, de 07:00 a 20:00 (Buenos Aires), con última ejecución a las 20:00. Los endpoints del tablero nunca realizan SQL directo.
El sincronizador marca como entregados los snapshots que pasan a estado `ENT`, sin borrarlos ni perder su fecha de cancelación. El tablero usa un selector de entrega con `No entregadas` por defecto y `Entregadas`; al elegir entregadas muestra únicamente todos los snapshots Mongo entregados, incluso los ya cancelados, para corregir su fecha cuando sea necesario. Las entregadas sin cancelación se resaltan en amarillo suave. La fecha de cancelación puede anularse desde su diálogo, restaurando fecha y días a vacío. Las fechas y días de cancelación viven en el snapshot y no pueden ser sobreescritos por el cron.
El usuario de operación conserva por separado el valor original SIAC y el override local. El cron solo actualiza el original; la grilla y Excel muestran el override cuando existe. El catálogo seleccionable contiene únicamente usuarios SIAC habilitados sincronizados en Mongo.
La grilla de `Saldo de operacion` no etiqueta visualmente como local los usuarios corregidos; muestra únicamente el usuario efectivo.
`Analisis de cancelacion` consulta exclusivamente snapshots Mongo con fecha y días de cancelación válidos, incluye operaciones luego entregadas y agrupa el usuario efectivo en el árbol Vendedor → Usuario → Sucursal → Tiempo total. Sus rangos visuales son verde para menos de 15 días, amarillo desde 15 hasta menos de 18 y rojo desde 18.
`Analisis de cancelacion` permite filtrar el árbol por mes de asignación y mantiene arriba una tabla horizontal con el promedio histórico por cada mes disponible; este resumen mensual no se reduce al filtro activo.
`Analisis de cancelacion` permite filtrar por año de asignación; su tabla anualizada conserva la fila de promedio general y agrega una fila por sucursal, con una celda por cada mes del año.
El contenedor del árbol de `Analisis de cancelacion` debe definir una altura responsive efectiva para garantizar que ECharts reciba dimensiones al iniciar; no usar expresiones Tailwind arbitrarias que puedan quedar fuera de la generación de estilos.
El árbol de `Analisis de cancelacion` es fijo: no permite zoom ni arrastre; su altura crece conforme a la cantidad de vendedores para mostrar todos los nodos sin desplazamiento interno.
El árbol de `Analisis de cancelacion` reserva margen lateral para sus etiquetas y divide los nombres extensos en líneas, para que ningún nodo se dibuje fuera del contenedor.
La grilla de Saldo de operación permite ordenar, sobre todo el conjunto paginado y no solo la página visible, desde cualquiera de sus encabezados; el orden inicial es saldo ascendente y un segundo clic invierte la dirección.
El análisis de no canceladas muestra, junto con el promedio de días de cada nivel del árbol, la suma de saldos pendientes de las operaciones incluidas; los análisis de cancelación históricos no muestran ese monto.
Al confirmar una fecha de cancelación, se debe invalidar el caché de Análisis de cancelación para que al navegar al árbol se vean los datos actualizados sin recargar la página.
El autocomplete de usuario de operación no consulta ni muestra opciones hasta que se ingresen al menos tres caracteres; la búsqueda se resuelve en Mongo y limita los resultados.
Cuando falle la consulta del autocomplete, el diálogo debe mostrar el error y permitir reintentar; no debe presentarlo como una búsqueda sin coincidencias.
La respuesta de snapshots debe tolerar transitoriamente la ausencia de los campos de override del usuario, para no bloquear el tablero durante una actualización escalonada de frontend y backend.
El job `saldo-operacion-snapshot` debe aparecer en el monitor, permitir ejecución manual y evitar ejecuciones simultáneas. La tabla se ordena por saldo ascendente; sucursal aparece a la izquierda de vendedor y Número de fábrica se conserva solo para Excel.
En el tablero de `Saldo de operacion`, filtros y saldos por modelo comparten una única superficie compacta. `Operaciones: {cantidad}` abre la fila de filtros; sucursal, usuario, vendedor, sección y ubicación se resuelven con selects y aplican también al resumen y exportación. Los accesos compactos `A. Canceladas` y `A. No canceladas` se ubican inmediatamente antes del botón de exportación Excel, que es cuadrado, verde y se alinea al extremo derecho.
La respuesta de filtros de `Saldo de operacion` debe tolerar temporalmente la ausencia de los catálogos de usuario y vendedor, para conservar sucursales y ubicaciones durante un despliegue escalonado.
La columna Saldo de la tabla de `Saldo de operacion` usa verde para importes menores o iguales a cero y rojo para importes positivos pendientes de cobro.
La columna Estado no se muestra en la tabla de `Saldo de operacion`; la ubicación sigue disponible como filtro.
La tabla de `Saldo de operacion` permite buscar una operación por su número exacto; el valor permanece como borrador y se aplica únicamente al confirmar con Buscar o Enter.
La tarjeta Crédito de `Saldo de operacion` suma únicamente el crédito de operaciones sin `ope_fecfac`; la fecha de factura se sincroniza desde SIAC al snapshot y determina facturación, independientemente del estado físico.
La tabla de `Saldo de operacion` muestra una columna `Fact.` con icono cuando el snapshot tiene fecha de factura SIAC.
El análisis de no canceladas usa exclusivamente snapshots Mongo sin fecha de cancelación, incluidas las entregadas aún no canceladas, y promedia `diasAsignada`; comparte el árbol, filtros anual/mensual y resumen por sucursal del análisis de cancelación. Los accesos del tablero se muestran en verde para cancelación y rojo para no canceladas.
Los análisis de canceladas y no canceladas preseleccionan el año y mes calendario actuales; al cambiar período, el árbol ECharts se remonta y no se intenta dibujar si faltan ramas, evitando pantallas vacías por estructuras incompletas.
Los árboles de análisis deben limpiar explícitamente la serie ECharts antes de aplicar una nueva estructura y remontarse al renovarse la respuesta; TreeChart conserva aristas internas que de otro modo pueden provocar errores al cambiar el mes.
`Tablero de cobranzas` vive en `/analisis/tablero-cobranzas`, depende del módulo propio `tableroCobranzas` y agrupa por fecha de recibo los anticipos de operaciones nuevas activas y asignadas con interno `NIC%`; una operación puede estar facturada o entregada. Sus datos proceden exclusivamente de la relación SIAC `opera → salglo → movcajh`: `salglo.sgl_opera = opera.ope_codigo`, `salglo.sgl_nroope = movcajh.mc_nroope`, con `sgl_tipmov = 105` y `sgl_haber > 0`. No se vinculan recibos por descripción, cliente, `mc_opera` ni coincidencias únicas, y no se muestran pendientes de imputación. La vista muestra siempre los días 1–31, desglosa cada medio de pago salvo divisas y contabiliza los cheques en la fecha del recibo; el gráfico semanal agrupa los totales de los días 1–7, 8–14, 15–21, 22–28 y 29–fin. El detalle agrupa únicamente las operaciones realmente vinculadas y su total coincide con la fila diaria. Cada operación permite abrir el diálogo de sus recibos SIAC vinculados, con fecha, comprobante, medios de pago y total.
`Tablero de operaciones` incluye una SPA móvil protegida en `/analisis/operaciones/movil`, sin navbar ni footer. Resume las mismas asignaciones visibles en el tablero por sucursal, modelo y vendedor para un mes calendario, e incorpora desde Análisis de Operaciones Preventa la cantidad de usados tomados. Las tablas por sucursal, modelo y vendedor agregan las columnas Cantidad y descuento promedio, en ese orden; sus métricas se muestran en tarjetas individuales apiladas verticalmente. El enlace copiado desde la vista de escritorio nunca transporta período ni credenciales: abre el mes vigente y mantiene la autenticación y permiso `operaciones`; su copiado debe conservar un fallback compatible con despliegues internos HTTP donde la Clipboard API no está disponible.


# Instrucciones del proyecto

## Descripcion

`intraNIC` es una aplicacion interna de Nippon Car / LIESS para la gestion operativa de stock, preventas, pedidos, asignaciones, proformas, entregas, patentamientos, transferencias y reportes.

Gestion de stock convencional incluye el modulo `Prediccion de asignaciones`, una consulta de NIPPON CAR para sugerir stock 0 km de igual modelo, version y color en operaciones activas, no facturadas y no entregadas. La seleccion prioriza ubicacion y luego antiguedad; admite el mismo mes solo con una ubicacion superior y ordena las operaciones por version. La tabla densa muestra cliente, vendedor, produccion `MM/AAAA` y ubicacion de ambos internos; resalta en verde el criterio prioritario y separa el stock actual del posible con un divisor vertical grueso. Es informativo y no ejecuta re-asignaciones.

`Analisis de stock` diferencia el stock físico de la proyección con pedidos: los indicadores muestran `Unidades`, `Unidades + PED`, `M. stock negocio` y `M. stock negocio + PED`; la misma distinción debe conservarse en la impresión.
`Valorizacion de stock por modelo` muestra en su resumen tanto la cantidad como la valorización de stock disponible, reservado, guardado y total; los importes se calculan con la lista de precios vigente por versión.

El repositorio contiene dos aplicaciones independientes:

- `front/`: SPA construida con React 19, TypeScript, Vite, Tailwind CSS, React Router y TanStack Query.
- `server/`: API REST construida con Express 5 y TypeScript.

## Arquitectura y datos

- El frontend consume la API mediante `VITE_API_URL`.
- El backend expone las rutas bajo el prefijo `/api` y, por defecto, escucha en el puerto `4002`.
- MongoDB persiste usuarios, configuraciones y entidades propias de la aplicacion mediante Mongoose.
- SQL Server concentra las consultas operativas de las companias `NIPPON CAR` y `LIESS`, mediante Sequelize y Tedious.
- Docker Compose publica el backend en `4003` y el frontend en `8080`.

## Estructura relevante

```text
front/src/
  api/          Clientes HTTP y esquemas de respuesta.
  components/   Componentes reutilizables y componentes por modulo.
  components/ui/ Componentes base generados por shadcn/ui.
  lib/          Utilidades compartidas, incluido `cn` para clases Tailwind.
  views/        Pantallas agrupadas por dominio funcional.
  router.tsx    Declaracion de rutas y proteccion de acceso.
  helpers/      Reglas y transformaciones reutilizables.
  constants/    Modulos, roles y reglas de acceso del frontend.

server/src/
  routes/       Declaracion de endpoints Express.
  controllers/  Manejo de solicitudes y respuestas HTTP.
  services/     Logica de negocio e integraciones.
  models/       Modelos de MongoDB.
  middleware/   Autenticacion, autorizacion y validaciones comunes.
  jobs/         Procesos programados iniciados por `index.ts`.
  utils/        Reportes, PDF, correo, JWT y utilidades transversales.
```

La definicion funcional de roles, companias y permisos se encuentra en `REGLAS_ACCESO.md`. Antes de modificar visibilidad de rutas, modulos o acciones, verificar ese documento y las constantes de acceso del frontend.

## Desarrollo local

Requisitos: Node.js 20 o superior, npm, acceso a MongoDB y a las bases SQL Server requeridas.

1. Crear `server/.env` a partir de `server/.env.example` y completar las credenciales necesarias.
2. Crear `front/.env` a partir de `front/.env.example`; para desarrollo local usar `VITE_API_URL=http://localhost:4002/api`.
3. Instalar dependencias en cada aplicacion.

```bash
cd server
npm install
npm run dev

cd ../front
npm install
npm run dev
```

## Comandos de validacion

Ejecutar las validaciones correspondientes a las capas modificadas antes de finalizar una funcionalidad.

```bash
cd server
npm run build

cd ../front
npm run build
npm run lint
```

El backend no cuenta con un script de tests automatizados definido actualmente. No incorporar credenciales ni archivos `.env` al repositorio.

## Convenciones de implementacion

- Para endpoints nuevos, agregar la ruta en `server/src/routes/`, implementar la logica en `server/src/controllers/` y delegar la logica reutilizable o de integracion en `server/src/services/`.
- Para cambios de interfaz, reutilizar el cliente en `front/src/api/`, los componentes y patrones visuales existentes del modulo, y TanStack Query para consultas y mutaciones remotas.
- Para nuevas vistas o componentes visuales, usar `shadcn/ui` desde `front/src/components/ui` y los tokens definidos en `front/src/index.css`. No migrar ni reemplazar estilos existentes salvo que la tarea lo solicite expresamente.
- El sistema shadcn esta configurado para Vite en `front/components.json`; antes de agregar componentes con el CLI, verificar que se creen bajo `front/src/components/ui`.
- Mantener la separacion por dominio funcional: por ejemplo, las entregas usan `front/src/views/entregas`, `front/src/components/entregas` y las rutas bajo `/api/entregas`.
- Las rutas del frontend deben usar prefijos que representen la seccion funcional visible para el usuario: `Sistema` bajo `/sistema`, `Comercial` bajo `/comercial`, `Plan de ahorro` bajo `/plan-ahorro`, `Stock de unidades` bajo `/stock`, `Analisis` bajo `/analisis`, `Entregas` bajo `/entregas`, `Calidad` bajo `/calidad` y las secciones de gestion bajo `/gestion/...`.
- Validar permisos tanto en el frontend como en el backend cuando una funcionalidad este restringida por rol, modulo o compania.
- Conservar el estilo TypeScript y evitar cambios ajenos a la funcionalidad solicitada.

## Documentacion y changelog

Luego de implementar una funcionalidad, actualizar `CHANGELOG.md` con fecha, modulo y resumen de los cambios visibles o tecnicos relevantes. Actualizar este archivo cuando cambien la arquitectura, los comandos, las convenciones o los modulos principales del proyecto.

## Commit

Luego de cada funcionalidad implementada correctamente, sugerir un mensaje de commit y dejar el comando listo para usar. Revisar previamente los cambios con `git status` para no incluir archivos ajenos ni secretos.

```bash
git add .
git commit -m "{commitSugerido}"
```

## Footer

Siempre el Footer de toda la app debe de la siguiente manera
Lado Izquiero - IntraNIC - Uso interno Nippon Car
Lado Derecho - Desarrollado por Franco Sanchez

## Layouts migrados al preset

- Para modulos migrados, habilitar `presetNavigation` en `BaseAppLayout`, usar `font-preset` en las vistas y los tokens semanticos de `front/src/index.css`.
- Todo navbar debe reutilizar `AppBrand`: bloque `NIC` de `h-8 w-8`, texto `IntraNIC` sin mayusculas forzadas y alineacion izquierda con `px-3`. No duplicar marcas locales ni variar su posicion entre modulos.
- Los navbars del preset usan la altura compacta `min-h-14`; no aumentar su altura por titulos o enlaces de dos lineas.
- Toda accion de interfaz debe usar los componentes de `front/src/components/ui/action-button.tsx`: `DeleteActionButton` para eliminar, `EditActionButton` para editar y `ActionButton` para acciones operativas. Mantener la altura compacta, borde y estados semanticos; no crear clases locales para estas acciones.
- Toda accion con `bg-primary text-primary-foreground` debe conservar contraste al hover mediante `hover:bg-primary/90`; nunca usar `hover:bg-secondary`, ya que vuelve claro el fondo y oculta el texto.
- Los layouts migrados deben usar el mismo fondo global `bg-muted`; no mezclar fondos heredados como `bg-gray-50` entre modulos del preset. Las superficies y controles se diferencian con `bg-card` y `bg-background`, respectivamente.
- Toda vista migrada que no herede un layout con el preset debe declarar `bg-muted` en su contenedor raiz para conservar el mismo fondo global.
- Mantener el espaciado compacto y unificar titulo, resumen e indicadores en una sola superficie cuando correspondan a la misma vista.
- Las matrices de Gestion Convencional, incluido Analisis de stock y Pend Fac, usan hero integrado `bg-card`, indicadores separados con divisores `border-border` y separadores de grupos de tabla de un solo pixel; no usan `bg-secondary`, radios grandes ni bordes gruesos heredados.
- En las matrices de Analisis de stock y Pend Fac, los conteos igual a cero se presentan como celdas vacias; no reemplazar valores editables de PED.
- Las vistas con el mismo patron funcional deben reutilizar exactamente las mismas decisiones visuales del preset. En particular, los filtros de resumen usan `grid grid-cols-2 gap-1 md:grid-cols-4 xl:grid-cols-8`, botones `h-9 rounded-md border text-xs`, estado activo `border-primary bg-primary text-primary-foreground` e inactivo `border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground`.
- En tablas de alta densidad, priorizar filas compactas: encabezados con `py-2`, celdas con `py-1.5` y badges con `py-0.5`, sin afectar columnas sticky ni datos legibles.
- En tarjetas de indicadores, priorizar `p-2` o `p-3`, titulos `text-base`, etiquetas `text-[11px]` y metricas hasta `text-lg`; no usar escalas grandes salvo que el usuario lo solicite.
- Los catalogos accesibles desde `/admin/configuracion` deben conservar su URL funcional, pero renderizar bajo `AdminLayout` para compartir navbar, fondo y footer del preset.
- Al migrar una vista al preset, no inventar colores, gradientes, sombras, radios ni variantes visuales. Usar exclusivamente los tokens semanticos y componentes del preset; solo conservar un color adicional cuando el usuario lo solicite expresamente. Eliminar las clases y valores del diseño anterior de la vista migrada, incluidos hexadecimales y utilidades `gray` heredadas.
- En auditorias de regresion visual, revisar tambien componentes compartidos, layouts no enrutados y estados de carga, error y vacio; reemplazar radios arbitrarios, sombras hardcodeadas y variantes de navegacion no-preset antes de proponer la eliminacion definitiva del codigo heredado.
- Una vez confirmado el retiro, eliminar tambien las ramas de compatibilidad que permitian renderizar navegacion sin preset; los layouts activos deben heredar siempre `font-preset`, `bg-muted`, `AppBrand` y el footer institucional.
- Los dialogos de vistas migradas deben usar directamente tokens del preset en panel, campos, acciones y pie; no depender de adaptadores de compatibilidad ni conservar colores heredados dentro del modal.
- Los graficos de vistas migradas deben usar ECharts y una paleta resuelta desde los tokens semanticos del preset; no incorporar paletas hardcodeadas ni colores heredados.
- Cuando se soliciten colores de negocio para un grafico, definirlos de forma local y documentada en la vista, con tonos suaves y aplicarlos por serie sin alterar la paleta de otros reportes.
- Los colores solicitados para estados, graficos y badges deben ser siempre claros, de alta luminosidad y baja saturacion; evitar tonos intensos que compitan con los datos.
- En las tablas comparativas de Patentamientos, la columna `%` usa una escala local y relativa por tabla: menor participacion en rojo y mayor participacion en verde de intensidad media, con texto legible; no colorear el resto de las columnas por este criterio.
- El treemap de Traslado Furlong debe ocupar todo el alto y ancho del area de grafico: el contenedor no lleva padding y la serie ECharts define sus cuatro limites en cero.
- La tabla consolidada de Traslado Furlong usa `text-xs`, encabezados y celdas `px-2 py-1.5`, con descripcion compacta para priorizar densidad vertical.
- En `/stock/convencional/mis-operaciones`, Operaciones anualizadas y Distribucion por modelo usan la misma paleta suave local por modelo; la linea TOTAL conserva `foreground`.
- En `/gestion/convencional/asignaciones`, el estado de recepcion usa verde claro para Recibido y amarillo claro para Pendiente de forma consistente en grafico, leyenda y tabla; tanto Pedido como Estado se representan solo con iconos cuando existen.
- Los formatos de valores en ECharts se configuran por serie: etiquetas numéricas solo donde se soliciten y montos con `Intl.NumberFormat("es-AR")`, moneda ARS y dos decimales, sin aplicar moneda a cantidades.
- Los informes `/analisis/operaciones-preventa` y `/analisis/vendedor` comparten para Usados anualizados barras azules suaves, linea `foreground` y etiquetas de cantidad; Credito usa barras rojas suaves y formato ARS. Descuento promedio de Vendedor usa barra violeta suave y linea `foreground`.
- El grafico anual de Vendedor usa un color suave distinto por modelo y muestra el total mensual sobre cada barra apilada mediante una serie visual sin leyenda.
- Las etiquetas de total sobre barras apiladas usan un punto transparente minimo; no usar `symbol: "none"`, porque ECharts oculta tambien su etiqueta.
- Los descuentos promedio de Vendedor se formatean por serie con porcentaje argentino a dos decimales (`xx,xx%`) en tooltip y eje.
- Los descuentos por modelo y por sucursal de Operaciones Preventa se formatean por serie con porcentaje argentino a dos decimales (`xx,xx%`) en tooltip y eje.
- Todo grafico ECharts debe resaltar la serie activa al hover: conservar explicitamente su color base y opacidad total, con `blur` suave para las restantes. El wrapper comun aplica este comportamiento seguro por defecto, evitando el estado automatico que volvía blancas o invisibles las series.
- Las vistas de Stock Usados deben compartir el mismo hero integrado, grilla de filtros, tabla compacta y badges de color mediante `StockUsadosView` cuando la fuente de datos lo permita.
- En `/stock/usados/disponible`, las observaciones se muestran directamente en una columna de la tabla; no se ocultan tras un botón o diálogo.
- Stock Ingresos Usados conserva sus columnas especificas, pero debe replicar exactamente la estructura visual de `StockUsadosView`: carga y errores sobre `bg-muted`, hero integrado, filtros densos, filas `py-1.5`, badges uniformes y dialogo con tokens `popover`.
- Los flujos de altas y edicion de Preventas y Proformas deben aplicar los tokens del preset tanto en la vista como en sus formularios y dialogos.
- En formularios de Proformas, las unidades repetibles se separan con divisores dentro de una unica superficie, sin cards anidadas.
- Los campos que pertenecen a la misma fila funcional deben usar el mismo ancho en escritorio, salvo que su contenido requiera expresamente otra proporcion.
- Las variantes de stock de una misma compania deben reutilizar una vista parametrizada y el mismo layout del preset para evitar divergencias visuales.
- En Stock Convencional, Disponible, Reservado y Guardado ubican el filtro de unidades por ubicacion en una franja propia, inmediatamente despues del filtro de modelo y antes del detalle.
- Stock disponible Belgrano debe respetar la misma especificacion de Stock Usados: hero integrado con resumen por marca y total, filtros compactos, tabla densa y badges uniformes.
- Las pantallas publicas migradas, incluido `/login`, deben usar `font-preset`, `bg-muted` y una unica superficie `bg-card`; no usan navbar y conservan el footer institucional indicado arriba.
- La portada autenticada (`/`) se considera una vista migrada: sus accesos se agrupan en superficies compactas del preset y no puede conservar CSS inline, colores hexadecimales ni tipografias heredadas.
- La portada autenticada agrupa Central de Deudores, Rend. Gastos y Minutas en la sección `Herramientas`; las rutas y permisos propios de cada módulo se conservan.
- El flujo de Minutas debe mantener el preset de forma consistente en listado, alta, edición, detalle, grupos de difusión, selectores y editor enriquecido; los formularios se organizan en una única superficie con divisores, sin cards anidadas.
- La migracion integral se ejecuta por dominios completos: cada etapa incluye layout, vistas, formularios, dialogos, tablas y graficos del dominio, se valida antes de avanzar y elimina sus estilos heredados al cierre de la etapa final.
- La Valorizacion de Stock Convencional debe conservar hero y resumen en una unica superficie, tablas densas y la misma especificacion del preset para carga por fila, estados e importacion/exportacion de precios.
- Los flujos compartidos de Plan de Ahorro y Comercial, como Registro TestDrive, se mantienen en un unico componente y deben usar el preset directamente en listado, calendario, formularios y dialogos para evitar variantes visuales por negocio.
- SSI Ventas debe conservar el preset en toda la gestión del caso, incluida importación, filtros, tabla, encuesta, historial y asignación de ADM; los estados se comunican con etiquetas y estructura, no con paletas heredadas.
- Entregas debe mantener una única especificación visual para Agenda, Pendientes, Sucursales y Registros; la búsqueda de interno siempre consulta todas las fechas y sucursales, sin restringirse por la sucursal asignada al usuario, incluidos registros históricos con interno persistido como texto o ceros a la izquierda, y su diálogo muestra sucursal, fecha y hora de entrega o `turno sin asignar`.
- En Registros de Entregas, Interno se mantiene como borrador local y solo aplica su consulta al confirmar con Buscar o Enter; no incluir el valor de cada pulsación en la `queryKey`.
- Los colores de unidades se administran centralmente en `/sistema/configuracion/colores-unidades`, separados del catálogo de Preventas. Cada nombre puede definir un hexadecimal visual; los badges deben resolverlo sin distinguir mayúsculas, tildes o espacios, conservar un fallback neutro y mantener contraste legible.
- `Sol. cambio color` vive en `/gestion/convencional/solicitud-cambio-color`, usa el permiso independiente `solicitudCambioColor`, admite hasta dos colores de destino y observaciones/N° OP., y conserva la auditoria de cada creacion, edicion y cambio de estado para unidades 0 km. Solo `stock` y `superAdmin` pueden cambiar los estados.
- `Rep. Siniestros` vive en `/gestion/convencional/rep-siniestros`, usa el permiso independiente `repuestosSiniestros` y registra casos pendientes de internos 0 km contra una Nota de Pedido SIAC seleccionada por su operación. Conserva la fotografía de unidad, cabecera y artículos; el chasis es solamente informativo. La sucursal se muestra por nombre y la lectura tolera transitoriamente respuestas históricas con código numérico. En el detalle, cada artículo se sigue individualmente y en secuencia como Pedido, Arribado y Retirado; el último retiro completa el caso automáticamente y cada cambio queda auditado. Una nota puede aparecer en varios filtros mientras su etapa tenga avance pendiente; deja de mostrarse allí al completar el 100 %. La tabla muestra en Avance solo la métrica de la etapa activa: Pedido sobre el total, Arribado sobre los pedidos y Retirado sobre los arribados. El filtro de interno conserva el borrador local y solo consulta al pulsar Buscar o Enter. Todos los usuarios habilitados pueden crear, cambiar la nota o eliminar pendientes, siempre con auditoría.
- Las solicitudes de cambio de color con chasis asignado no pueden crearse; las existentes se alertan en tabla. Solo `stock`, `gerente` y `superAdmin` pueden rechazarlas, dejando el rechazo como estado final auditado mediante una actualización atómica. Los cambios de estados de `stock` y `superAdmin` usan la misma persistencia atómica.
- La vista inicial de `Sol. cambio color` muestra solo solicitudes pendientes; los filtros permiten acceder al resto de estados.
- El Combobox de vendedores en `Sol. cambio color` requiere al menos tres caracteres antes de filtrar, para preservar la fluidez con listados extensos.
- El Registro TestDrive compartido de Comercial y Plan de ahorro ordena por retiro descendente, permite filtrar por patente y separa por defecto los turnos por ocurrir del historial cuya fecha de devolución ya pasó.
- `Rend. Gastos` vive en `/comercial/rendiciones-gastos`, está disponible para todo usuario autenticado sin depender de módulos ni roles y cada rendición solo puede ser consultada o exportada por su creador, incluido el caso `superAdmin`.
- Las rendiciones de gastos son inmutables, guardan importes en centavos, resuelven empresas por CUIT canónico de 11 dígitos y exportan un PDF A4 con firma de supervisor.
- La validación de importes de `Rend. Gastos` admite valores positivos con hasta dos decimales sin depender de la igualdad exacta de punto flotante al convertirlos a centavos.
- En `Rend. Gastos`, cada comprobante se carga desde un diálogo y puede editarse mientras la rendición no esté guardada; la pantalla principal muestra el resumen y una tabla compacta de gastos ya agregados.
- El diálogo de `Rend. Gastos` persiste la empresa canónica al confirmar el comprobante y consulta el nombre al completar los 11 dígitos del CUIT.
- El PDF de `Rend. Gastos` etiqueta al creador como empleado y ordena los gastos por fecha ascendente.
- El PDF de `Rend. Gastos` reutiliza el membrete institucional de Proformas, incluyendo logo y datos legales de Nippon Car.
- El membrete de `Rend. Gastos` usa solo un banner gris claro, sin datos legales, para una impresión de bajo consumo.
