# AGENTS.md
Siempre actualizar este archivo y el CHANGELOG.md cada vez que se realice una implementacion.

# Instrucciones del proyecto

## Descripcion

`intraNIC` es una aplicacion interna de Nippon Car / LIESS para la gestion operativa de stock, preventas, pedidos, asignaciones, proformas, entregas, patentamientos, transferencias y reportes.

Gestion de stock convencional incluye el modulo `Prediccion de asignaciones`, una consulta de NIPPON CAR para sugerir stock 0 km de igual modelo, version y color en operaciones activas, no facturadas y no entregadas. La seleccion prioriza ubicacion y luego antiguedad; admite el mismo mes solo con una ubicacion superior. La tabla densa muestra cliente, vendedor, produccion `MM/AAAA` y ubicacion de ambos internos; separa el stock actual del posible con un divisor vertical grueso. Es informativo y no ejecuta re-asignaciones.

El repositorio contiene dos aplicaciones independientes:

- `front/`: SPA construida con React 19, TypeScript, Vite, Tailwind CSS, React Router y TanStack Query.
- `server/`: API REST construida con Express 5 y TypeScript.

## Arquitectura y datos

- El frontend consume la API mediante `VITE_API_URL`.
- El backend expone las rutas bajo el prefijo `/api` y, por defecto, escucha en el puerto `4002`.
- MongoDB persiste usuarios, configuraciones y entidades propias de la aplicacion mediante Mongoose.
- SQL Server concentra las consultas operativas de las companias `NIPPON CAR` y `LIESS`, mediante Sequelize y Tedious.
- El servidor ejecuta procesos programados al iniciar: agenda de entregas, alertas SSI, facturas de anticipo, patentamientos, transferencias, unidades de dealers, saldo de operaciones y exportacion VIN/chasis.
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
- Stock Ingresos Usados conserva sus columnas especificas, pero debe replicar exactamente la estructura visual de `StockUsadosView`: carga y errores sobre `bg-muted`, hero integrado, filtros densos, filas `py-1.5`, badges uniformes y dialogo con tokens `popover`.
- Los flujos de altas y edicion de Preventas y Proformas deben aplicar los tokens del preset tanto en la vista como en sus formularios y dialogos.
- En formularios de Proformas, las unidades repetibles se separan con divisores dentro de una unica superficie, sin cards anidadas.
- Los campos que pertenecen a la misma fila funcional deben usar el mismo ancho en escritorio, salvo que su contenido requiera expresamente otra proporcion.
- Las variantes de stock de una misma compania deben reutilizar una vista parametrizada y el mismo layout del preset para evitar divergencias visuales.
- En Stock Convencional, Disponible, Reservado y Guardado ubican el filtro de unidades por ubicacion en una franja propia, inmediatamente despues del filtro de modelo y antes del detalle.
- Stock disponible Belgrano debe respetar la misma especificacion de Stock Usados: hero integrado con resumen por marca y total, filtros compactos, tabla densa y badges uniformes.
- Las pantallas publicas migradas, incluido `/login`, deben usar `font-preset`, `bg-muted` y una unica superficie `bg-card`; no usan navbar y conservan el footer institucional indicado arriba.
- La portada autenticada (`/`) se considera una vista migrada: sus accesos se agrupan en superficies compactas del preset y no puede conservar CSS inline, colores hexadecimales ni tipografias heredadas.
- El flujo de Minutas debe mantener el preset de forma consistente en listado, alta, edición, detalle, grupos de difusión, selectores y editor enriquecido; los formularios se organizan en una única superficie con divisores, sin cards anidadas.
- La migracion integral se ejecuta por dominios completos: cada etapa incluye layout, vistas, formularios, dialogos, tablas y graficos del dominio, se valida antes de avanzar y elimina sus estilos heredados al cierre de la etapa final.
- La Valorizacion de Stock Convencional debe conservar hero y resumen en una unica superficie, tablas densas y la misma especificacion del preset para carga por fila, estados e importacion/exportacion de precios.
- Los flujos compartidos de Plan de Ahorro y Comercial, como Registro TestDrive, se mantienen en un unico componente y deben usar el preset directamente en listado, calendario, formularios y dialogos para evitar variantes visuales por negocio.
- SSI Ventas debe conservar el preset en toda la gestión del caso, incluida importación, filtros, tabla, encuesta, historial y asignación de ADM; los estados se comunican con etiquetas y estructura, no con paletas heredadas.
- Entregas debe mantener una única especificación visual para Agenda, Pendientes, Sucursales y Registros; la búsqueda de interno siempre consulta todas las fechas y sucursales y su diálogo muestra sucursal, fecha y hora de entrega o `turno sin asignar`.
- Los colores de unidades se administran centralmente en `/sistema/configuracion/colores-unidades`, separados del catálogo de Preventas. Cada nombre puede definir un hexadecimal visual; los badges deben resolverlo sin distinguir mayúsculas, tildes o espacios, conservar un fallback neutro y mantener contraste legible.
- `Sol. cambio color` vive en `/gestion/convencional/solicitud-cambio-color`, usa el permiso independiente `solicitudCambioColor`, admite hasta dos colores de destino y observaciones/N° OP., y conserva la auditoria de cada creacion, edicion y cambio de estado para unidades 0 km. Solo `stock` y `superAdmin` pueden cambiar los estados.
- Las solicitudes de cambio de color con chasis asignado no pueden crearse; las existentes se alertan en tabla. Solo `stock` y `superAdmin` pueden rechazarlas, dejando el rechazo como estado final auditado.
- La vista inicial de `Sol. cambio color` muestra solo solicitudes pendientes; los filtros permiten acceder al resto de estados.
- El Combobox de vendedores en `Sol. cambio color` requiere al menos tres caracteres antes de filtrar, para preservar la fluidez con listados extensos.
