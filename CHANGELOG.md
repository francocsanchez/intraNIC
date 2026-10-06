# Changelog

## 2026-10-06

- **Saldo de operación:** las operaciones entregadas guardadas en Mongo permanecen visibles en tablero, filtros, resumen y Excel hasta cargar su fecha de cancelación; al completar ambos estados se ocultan sin consultar historial SQL.
- **Saldo de operación:** se agregó el filtro de entrega y el resaltado amarillo suave para entregadas aún no canceladas.
- **Saldo de operación:** la fecha de cancelación puede anularse desde el diálogo para corregir registros cargados por error.
- **Saldo de operación:** se reemplazó el acceso separado por un selector con `No entregadas` predeterminado y `Entregadas`, que muestra exclusivamente los snapshots Mongo entregados —incluidos los cancelados— para revisarlos y corregirlos.
- **Saldo de operación:** el acceso de exportación Excel ahora es cuadrado, verde y se alinea a la derecha de los filtros.
- **Saldo de operación:** el conteo pasó al inicio como `Operaciones`, y los accesos a análisis se compactaron y renombraron para acompañar la exportación.
- **Análisis de no canceladas:** incorpora operaciones entregadas sin fecha de cancelación en sus árboles, promedios y saldos pendientes.

## 2026-10-05

- Análisis de no canceladas: cada nodo del árbol y el indicador principal muestran ahora los días promedio junto con el monto pendiente acumulado para cancelar; se corrigió el cálculo Mongo para restar correctamente señas, usados y crédito.

## 2026-10-05

- Saldo de operación: los encabezados de la grilla ahora ordenan ascendente o descendente todas las operaciones filtradas, incluidos importes, fechas y días.

## 2026-10-05

- Análisis de saldos: se estabilizó el cambio de mes de ambos árboles; ECharts descarta las aristas previas antes de recibir una nueva estructura para evitar el error de renderizado `_edge`.

## 2026-10-05

- **Saldo de operación:** se incorporó el análisis de no canceladas, con promedios de días desde asignación, árbol por vendedor/usuario/sucursal y los mismos filtros anual, mensual y resumen por sucursal. Los accesos distinguen cancelación en verde y no canceladas en rojo.
- **Análisis de cancelación:** se conserva la respuesta previa durante los cambios de filtro para evitar pantallas vacías al seleccionar un mes.
- **Análisis de cancelación:** año y mes actuales quedan preseleccionados; se estabilizó el árbol al cambiar de período para evitar fallas de ECharts.

## 2026-10-05

- **Saldo de operación:** se agregó la búsqueda exacta por número de operación en la cabecera de la tabla, aplicable con Buscar o Enter.
- **Saldo de operación:** el indicador Crédito no facturado ahora suma exclusivamente operaciones SIAC no facturadas.
- **Saldo de operación:** la facturación del indicador Crédito se determina por `ope_fecfac` sincronizado desde SIAC, no por el estado físico de la operación.

## 2026-10-04

- **Saldo de operación:** se hizo compatible la lectura de filtros con respuestas de backend previas, evitando que la ausencia temporal de usuario/vendedor oculte sucursales y ubicaciones.

## 2026-10-04

- **Saldo de operación:** la columna Saldo ahora identifica en verde los valores en cero o negativos y en rojo los saldos positivos pendientes de cobro.
- **Saldo de operación:** se retiró la columna Estado de la tabla para priorizar densidad.

## 2026-10-04

- **Saldo de operación:** se unificaron filtros y saldos por modelo en una sola superficie compacta; se añadieron filtros por usuario efectivo y vendedor, y sección/ubicación pasaron a selects. Los nuevos filtros también aplican al resumen y Excel.

## 2026-10-04

- **Análisis de cancelación:** se agregó el filtro por año de asignación y la tabla anualizada ahora muestra el promedio general y el desglose mensual por sucursal.

## 2026-10-03

- **Análisis de cancelación:** se corrigió el alto efectivo del contenedor ECharts del árbol, que impedía su renderizado, y se compactó su superficie responsive.
- **Análisis de cancelación:** el árbol quedó fijo, sin zoom ni arrastre, y adapta su alto a la cantidad de vendedores visualizados.
- **Análisis de cancelación:** se reservaron márgenes para etiquetas y los nombres extensos ahora se dividen en líneas para evitar que los nodos sobresalgan del contenedor.
- **Análisis de cancelación:** se corrigió el renderizado de nombres multilínea de los nodos del árbol.
- **Análisis de cancelación:** se corrigió la composición de los nombres para que cada nodo conserve su etiqueta completa.

## 2026-10-02

### Saldo de operación

- Se corrigió el build de frontend retirando una ruta de Repuestos Siniestros cuyo componente no formaba parte del commit publicado.
- Se incorporó Análisis de cancelación: un árbol histórico Mongo de promedios por vendedor, usuario efectivo y sucursal, con promedio total y rangos visuales por tiempo.
- El análisis ahora permite filtrar el árbol por mes de asignación e incorpora una tabla comparativa de promedios históricos mensuales, además de un árbol más amplio e interactivo.
- Al guardar una cancelación se invalida el caché del análisis, evitando tener que recargar la página para ver el árbol actualizado.
- Se agregó la corrección local del usuario de operación mediante el catálogo SIAC habilitado sincronizado en Mongo; las correcciones no modifican SIAC ni son sobrescritas por el cron.
- Se retiró la etiqueta visual `local` de usuarios corregidos; la grilla muestra solo el usuario efectivo.
- El selector de usuario ahora busca en Mongo a partir de tres caracteres, evitando cargar el catálogo completo en el navegador.
- El autocomplete diferencia errores de API de una búsqueda sin coincidencias e incorpora reintento.
- La respuesta del tablero tolera temporalmente servidores que aún no informen los campos nuevos de usuario, evitando fallos de carga durante despliegues escalonados.
- El sincronizador quedó limitado al horario operativo: cada dos minutos entre las 07:00 y las 20:00 de Buenos Aires, sin ejecución nocturna ni sincronización inicial fuera de esa franja.
- Se reconstruyó el tablero sobre snapshots Mongo sincronizados desde SIAC.
- Se agregaron filtros por sucursal y ubicación, resumen, exportación Excel, fecha de cancelación con días calendario y permiso independiente.
- Las operaciones entregadas se conservan como historial en Mongo y se ocultan de ambas secciones.

## 2026-10-02

### Analisis

- Se retiró temporalmente el tablero Saldo de operación, sus rutas, permisos, endpoints, consultas, acciones, job heredado y el historial Mongo asociado para reemplazarlo por una nueva arquitectura de snapshot.

## 2026-10-01

### Analisis · Saldo de operacion

- Las cancelaciones ahora guardan de forma permanente la fecha de asignación de SIAC, la fecha de cancelación y los días calendario transcurridos. La fecha se confirma antes de guardar, puede corregirse desde Canceladas y no se admite si la operación no tiene asignación válida o si es anterior a ella.
- Canceladas incorpora las columnas F. Asignación, F. Cancelación y Días hasta cancelación; los registros históricos sin fecha permanecen visibles como pendientes de completar. Se retiró el retorno a Con saldo y la limpieza programada que eliminaba historiales al facturar.
- La exportación Excel incluye las fechas y los días de cancelación junto a la información existente.
- Se eliminó una consulta SQL duplicada por carga al obtener el total de registros dentro de la misma consulta paginada.
- Los filtros visibles, las cancelaciones y el resumen por modelo usan cachés breves e invalidadas al modificar una cancelación; además se dejó de consultar el catálogo de estados que la interfaz no usa, reduciendo consultas repetidas a SIAC y MongoDB.
- Marcar una operación como cancelada o con saldo actualiza la tabla y los totales en pantalla sin esperar una recarga completa; las demás páginas se refrescan al volver a utilizarlas.
- La tabla deja de esperar el cálculo global de saldos por modelo y los filtros: ambos se cargan en segundo plano, para mostrar la primera página apenas responde SIAC.
- Se agregó filtro por sucursal y su columna se muestra inmediatamente a la izquierda de Vendedor, tanto en la grilla como en la exportación Excel.
- Se ocultó Número de fábrica de la tabla para ganar densidad visual —sin quitarlo del Excel— y se compactaron los filtros e indicadores por modelo.
- Los filtros superiores se ordenaron como Sucursal, cantidad de registros, sección Con saldo/Canceladas y estados operativos; el contador se presenta en una sola línea.
- El listado ya no excluye operaciones facturadas; solo se excluyen las operaciones entregadas.
- La carga inicial evita el cruce costoso con movimientos de pedido cuando no se filtró por estado operativo; ese cruce se realiza únicamente al seleccionar una ubicación.
- El conteo total se desacopló de la primera página: la tabla se muestra sin esperar el recorrido completo y el contador se actualiza luego en segundo plano.
- Los filtros y saldos por modelo se difieren hasta mostrar la tabla; el resumen presenta un spinner mientras se calcula para no competir con la primera carga.
- Los cambios de estado operativo ahora cancelan las solicitudes de saldo, total y resumen que quedaron obsoletas; la búsqueda de ubicación usa la igualdad directa del interno para aprovechar índices de SQL Server.
- La primera página sin filtros pagina `csqUnidades` antes de resolver operación, modelo y sucursal, limitando esos cruces a las filas visibles.
- La misma paginación temprana se extendió a los filtros de ubicación y sucursal: los candidatos se acotan desde `movnped` u operaciones SIAC antes de armar el detalle de la tabla.
- El contador general sin filtros dejó de cruzar operación y sucursal, porque esos datos no intervienen en el total; se conserva la carga diferida de indicadores y tarjetas.
- Al iniciar el servidor se precalienta la primera página y los datos secundarios del tablero. La respuesta inicial, total y saldos por modelo usan cachés de 30 segundos e invalidación al modificar cancelaciones, eliminando la espera de la primera consulta fría de SQL.
- La tabla se ordena por saldo ascendente y el resumen incorpora tarjetas de Crédito y Usado, calculadas sobre todas las operaciones no canceladas y filtradas del tablero.
- Las tarjetas de Crédito y Usado también permanecen disponibles al consultar Canceladas, sin alterar su criterio de operaciones con saldo.

## 2026-09-26

### Gestion de stock convencional · Analisis de stock

- Se incorporaron los indicadores `Unidades + PED` y `M. stock negocio + PED` para diferenciar el stock físico de la proyección que incluye unidades pedidas.
- El indicador `M. stock negocio` ahora refleja exclusivamente las unidades físicas, manteniendo ambos cálculos visibles también en la impresión.

## 2026-09-24

### Stock Usados

- Stock disponible ahora muestra las observaciones de cada unidad directamente en una columna de la tabla.

## 2026-09-23

### Entregas

- La búsqueda de turnos por interno ahora consulta la agenda completa sin depender del día, sucursal ni del formato histórico del interno, y conserva el modal con el detalle de entrega encontrado.
- El resultado global se entrega aunque la sucursal encontrada no esté asignada al usuario, incluyendo internos históricos con ceros a la izquierda.
- El filtro Interno de Registros ahora consulta solo al confirmar con Buscar o Enter, eliminando las recargas por cada dígito ingresado.

## 2026-09-28

### Gestion de stock convencional · Rep. Siniestros
- Se incorporó el módulo independiente `Rep. Siniestros`, con permiso, acceso desde Inicio y Gestión Convencional, ruta protegida y endpoints propios.
- Permite validar internos 0 km, buscar y seleccionar una Nota de Pedido SIAC por número, visualizar sus coincidencias y artículos, y crear el caso en estado Pendiente.
- Los casos guardan una fotografía de la unidad, cabecera, artículos y auditoría; la creación y los cambios vuelven a validar SIAC, bloquean duplicados activos por interno y operación, y conservan la eliminación como un evento auditado.
- Se prepararon los campos de pedido, arribo y retiro por artículo para las próximas etapas, sin habilitar todavía esos cambios en la interfaz.
- La selección de Notas de Pedido muestra ahora el nombre de sucursal y cada caso pendiente incluye una vista de detalle con la unidad, cabecera y artículos persistidos.
- La respuesta de búsqueda conserva compatibilidad con servidores que todavía devuelven el código numérico de sucursal, evitando que se descarte toda la lista durante una actualización.
- El detalle permite ahora marcar o desmarcar individualmente cada repuesto como pedido, persistiendo el cambio y su auditoría.
- Se agregaron los checks individuales de Arribado y Retirado. El flujo exige Pedido → Arribado → Retirado y completa automáticamente el caso al retirar el último artículo.
- El listado incorpora los filtros Pendientes, Pedidos, Arribados y Retirados, y expone los conteos de cada etapa por nota.
- Las notas ahora pueden aparecer en varios filtros: cada vista lista únicamente los repuestos que están en esa etapa y muestra los porcentajes de progreso sobre el total.
- Se eliminó la columna de repuestos por etapa del listado para dedicar ese espacio al avance de Pedido, Arribado y Retirado.
- Los porcentajes de avance se calculan sobre los repuestos habilitados en la etapa anterior: los retiros se miden sobre los arribos y los arribos sobre los pedidos.
- La tabla muestra únicamente el avance de la etapa seleccionada, evitando mezclar las cuatro métricas en una misma fila.
- El filtro por interno dejó de recargar por cada dígito; aplica la búsqueda únicamente con el botón Buscar o al presionar Enter.
- Las notas dejan de mostrarse en una etapa cuando completan su avance en ella; por ejemplo, un Pedido `10/10` ya no aparece en el filtro Pedidos.

## 2026-09-17

### Comercial — Rend. Gastos

- Se incorporó el módulo universal y privado `Rend. Gastos` para registrar rendiciones de viaje, con detalle de comprobantes, saldo automático y consulta exclusiva del usuario creador.
- Se agregó el catálogo canónico de empresas por CUIT, que completa y protege el nombre ya registrado para normalizar futuras cargas.
- Se habilitó la exportación bajo demanda a PDF A4 con tabla de gastos, resumen de importes y espacio de firma para supervisor.
- La carga de cada gasto ahora se realiza mediante un diálogo, mientras el formulario principal conserva una tabla compacta de comprobantes agregados.
- Las empresas se registran al confirmar cada gasto en el diálogo y se recuperan automáticamente al completar su CUIT.
- Se unificó la dimensión de las acciones de detalle y el PDF ahora identifica al empleado y ordena los gastos de la fecha más antigua a la más reciente.
- El PDF de rendiciones incorpora el membrete institucional de Nippon Car, alineado al utilizado en las proformas.
- El membrete de rendiciones se simplificó a un banner gris claro, sin datos legales, para reducir consumo de tinta.

## 2026-09-17

### Gestion de stock convencional · Sol. cambio color
- El rechazo de solicitudes ahora se restringe exclusivamente a los roles Stock, Gerente y SuperAdmin.
- El rechazo se persiste mediante una actualización atómica, compatible con solicitudes existentes y con protección ante cambios simultáneos de estado.
- Los estados Pedida y Completada ahora también se actualizan de forma atómica, evitando fallas de auditoría para usuarios Stock y preservando su secuencia obligatoria.

## 2026-09-09

### Registro TestDrive · Comercial y Plan de ahorro
- Se ordenaron los registros por fecha de retiro descendente y se agregó el filtro por patente de la unidad.
- El listado incorpora las pestañas `Por ocurrir` y `Ocurridos`; abre en las reservas cuya fecha de devolución aún no pasó y separa el historial ya finalizado.

### Gestion de stock convencional · Prediccion de asignaciones
- Se incorporo el modulo independiente de Prediccion de asignaciones, con acceso por permiso, ruta y navegacion dentro de Gestion convencional.
- La consulta identifica operaciones 0 km activas, no facturadas y no entregadas, y propone la unidad disponible mas antigua de igual modelo, version y color cuando su ORDER es anterior al interno asignado.
- La vista presenta las coincidencias con operacion, unidades, versiones y colores para evaluar la re-asignacion sin modificar datos operativos.
- Junto a cada interno se informa su mes y ano de produccion, extraidos del ORDER en formato `MM/AAAA`.
- Un divisor vertical grueso separa visualmente los datos del stock actual de la posible re-asignacion.
- Se agregaron Cliente y Vendedor de la operacion al lado actual de la tabla.
- La tabla se compacto a tipografia de datos e incorpora la ubicacion operativa de ambos internos: Produccion, Furlong, Stock concesionario u otro estado disponible.
- La prediccion ahora normaliza las nueve prioridades de ubicacion y elige primero la unidad de mejor disponibilidad; una alternativa del mismo mes solo aparece cuando mejora la ubicacion del interno asignado.
- Las operaciones se ordenan por version asignada y luego por codigo de OP para mantener agrupadas las coincidencias comparables.
- La celda que define la prioridad de cada sugerencia se resalta en verde: ubicacion cuando mejora la disponibilidad, o mes de produccion cuando rota una unidad mas antigua.

## 2026-09-08

### Gestion de stock convencional · Sol. cambio color
- Se incorporo el modulo `Sol. cambio color` con permiso independiente, acceso desde Gestion Convencional y proteccion de API y ruta.
- Permite consultar internos 0 km, conservar su version y color de origen, seleccionar el destino desde los catalogos activos y editar el destino posteriormente.
- El listado permite filtrar solicitudes, marcar el pedido y la completitud en secuencia, y consultar un historial inmutable con usuario, fecha y valores anteriores/nuevos de cada accion.
- El acceso al modulo ahora tambien aparece en la portada, dentro de Gestion de stock convencional, cuando el permiso esta habilitado.
- Los checks de solicitud pedida y completada ahora solo pueden modificarse por usuarios con rol Stock o SuperAdmin.
- Se retiró el filtro redundante “Todas”; el listado inicial sigue mostrando todas las solicitudes y los filtros de estado se pueden activar o desactivar.
- Las solicitudes ahora admiten un segundo color de destino opcional y el campo persistente `Observaciones / N° OP.`, ambos visibles en la tabla y registrados en el historial.
- Se incorporó el rechazo final de solicitudes para roles Stock y SuperAdmin, con auditoría y bloqueo posterior de edición/estados.
- Las solicitudes ahora se bloquean para internos con chasis; la tabla alerta cuando un interno ya cargado adquiere chasis.
- La vista inicial de Sol. cambio color ahora abre directamente sobre solicitudes pendientes.
- El buscador de vendedores de Sol. cambio color requiere tres caracteres antes de filtrar, evitando renderizar el listado completo.
- El historial de solicitudes ahora usa un diálogo amplio y presenta los valores anteriores y nuevos como campos individuales y legibles.

## 2026-09-07

### Colores de unidades
- Se incorporó el catálogo independiente `Colores de unidades`, separado del catálogo de Preventas, para definir el color hexadecimal con selector y vista previa de cada unidad.
- Los badges de color de Convencional, Usados, Belgrano, LIESS, análisis, operaciones y Entregas ahora resuelven esa configuración centralizada y preservan un estilo neutro cuando no hay asignación.

### Auditoria de preset
- Se corrigio la navegacion de Stock Usados para usar explicitamente el preset comun.
- Se normalizaron superficies, radios, espaciado y sombreado heredados en los paneles de Patentamientos y Analisis de operaciones, vendedor, saldo y resumen.
- La escala de intensidad de la tabla comparativa de Patentamientos ahora usa tonos suaves y tokens semanticos, sin la paleta intensa heredada.
- Se corrigieron todos los hovers primarios locales detectados para conservar `bg-primary/90` y el contraste del texto.
- Se eliminaron los layouts no enrutados de Patentamientos, Transferencias y Stock Usados, junto con la variante de compatibilidad sin preset de `GlobalNavbar` y `BaseAppLayout`.

### Patentamientos
- La columna `%` de todas las tablas comparativas de Marcas, Hilux, SW4, C. Cross, Y. Cross, Yaris y Localidad ahora usa una escala relativa suave: menor participacion en rojo y mayor participacion en verde.
- Se aumento moderadamente la intensidad de esa escala para hacer mas evidente el peso relativo de cada fila.
- El treemap de `/analisis/patentamientos/dashboard/inscripcion-unidades` ahora ocupa toda el area disponible, sin padding interno.
- Se compacto la tabla consolidada por dealer: tipografia, encabezado y celdas reducen su altura sin cambiar datos ni columnas.

### Stock Convencional
- Se unifico la ubicacion del filtro de unidades en Disponible y Guardado con Reservado: ahora se muestra debajo del filtro de modelo y antes del detalle.
- Se incorporaron colores suaves consistentes por modelo en Operaciones anualizadas y Distribucion por modelo de `/stock/convencional/mis-operaciones`.

### Asignaciones
- Estado de recepcion ahora diferencia Recibido en verde suave y Pendiente en amarillo suave en su grafico, leyenda y tabla mensual; Pedido muestra un check solo para unidades solicitadas.
- Se aclararon los colores de estado y la tabla mensual ahora muestra solamente el check o reloj, sin etiquetas de texto visibles.

### Acciones primarias
- Se corrigio el hover de botones y badges primarios locales para conservar fondo oscuro y texto legible, en lugar de cambiar a un fondo claro.

### Gestion Convencional
- Se migraron Analisis de stock y Pend Fac al hero integrado y compacto del preset, eliminando fondos secundarios, radios grandes, tarjetas de resumen separadas y divisores gruesos heredados.
- Las celdas de conteo en cero de ambas matrices ahora se muestran vacias para priorizar los datos con unidades.

### Stock Usados
- Se alineo Stock Ingresos con No reparado: hero, filtros, tabla densa, badges, estados de carga/error y dialogo de observaciones ahora comparten el preset.

## 2026-09-05

### Stock Belgrano y navegacion
- Se compacto `GlobalNavbar` a la altura comun `min-h-14`, incluyendo la navegacion de Analisis de operaciones.
- Se aplico una paleta suave solicitada a `/analisis/operaciones-preventa`: barras azules y linea negra para usados anualizados, barras rojas para credito y lineas diferenciadas para descuentos por modelo y sucursal.
- Los cuatro graficos de operaciones preventa ahora resaltan la serie sobre la que se hace hover, atenuando las restantes sin afectar los demas graficos de la aplicacion.
- El resaltado seguro al hover se extendio al wrapper comun de ECharts, por lo que todos los graficos del proyecto enfatizan la serie activa sin perder color ni desaparecer.
- El wrapper ahora preserva el color base de cada serie durante `emphasis` y `blur`, corrigiendo la desaparicion de la barra o linea activa al hacer hover.
- Se compactaron los resumenes de `/analisis/operaciones-preventa`: tarjetas, etiquetas y metricas reducen padding y escala tipografica para aumentar la densidad visual.
- Usados anualizados muestra el valor sobre cada barra; los importes de usados y credito ahora se presentan en pesos argentinos con separadores locales y dos decimales en ejes y tooltips.
- Se alinearon los graficos de `/analisis/vendedor`: usados anualizados replica etiquetas, barras azules y linea negra; credito usa barras rojas, importes ARS y dos decimales; descuento promedio usa barra violeta y linea negra.
- El tooltip y eje de Descuento promedio en Vendedor ahora muestran porcentajes con dos decimales y formato local.
- Se compacto el resumen de Vendedor y el grafico anual ahora diferencia cada modelo con un color suave y muestra el total mensual sobre sus barras apiladas.
- Se corrigio la serie transparente de total mensual para que la etiqueta acumulada sea visible sobre cada barra apilada.
- Los graficos de descuento por modelo y sucursal de Operaciones Preventa ahora muestran porcentajes con dos decimales y formato local en tooltip y eje.
- Se alineo `/stock/belgrano/disponible` al patron de stock disponible: hero y resumen integrados, filtros compactos, tabla densa y badges uniformes de marca y color.
- Se unifico la marca de Inicio y todos los navbars mediante `AppBrand`: mismo bloque NIC, texto `IntraNIC`, dimensiones y posicion de inicio en cada modulo.
- Se incorporaron botones de accion reutilizables para eliminar, editar y ejecutar acciones operativas; las acciones de tablas se normalizaron al mismo formato compacto y semantico en todos los modulos.

## 2026-09-04

### Rutas por seccion
- Se reorganizaron las rutas del frontend para que cada seccion use su propio prefijo visible: `Sistema` bajo `/sistema`, `Comercial` bajo `/comercial`, `Plan de ahorro` bajo `/plan-ahorro` y `Stock de unidades` bajo `/stock`.
- Se movio `Act. Registros` al espacio de `Sistema` con la ruta `/sistema/registros` y se actualizaron los layouts y detecciones de navegacion que dependian de prefijos anteriores.

### Migracion de preset
- Se estabilizo el wrapper comun de ECharts: conserva una unica instancia por grafico, resuelve los tokens de paleta para SVG y desactiva los estados visuales de hover que volvían transparente la serie enfocada.
- Se retiraron las referencias activas a `recharts`, se eliminó la dependencia y se migraron los gráficos restantes de operaciones, asignaciones, patentamientos y transferencias al wrapper común de ECharts con la paleta `--chart-*`.
- Se normalizaron los residuos visuales detectados en `front/src`: no quedan clases cromáticas heredadas, valores hexadecimales, radios grandes heredados ni adaptadores de color del diseño anterior.
- Se unificaron los layouts base de Analisis, Entregas, Gestion Convencional, Belgrano, Calidad y Analisis de mercado con fondo `muted`, navegacion semantica, espaciado compacto y footer institucional.
- Se amplio el componente compartido de ECharts para soportar treemap y se agrego una utilidad que resuelve la paleta monocromatica desde los tokens `chart` del preset.
- Se ajusto TestDrive administrativo con dialogo, formulario, acciones y tabla compacta bajo los tokens semanticos del preset.
- Se compacto el flujo de Usuarios: listado de alta densidad, resumen de edición y formulario compartido para altas y cambios de datos.
- Se migraron los parámetros de Hot Alert y Envío de agenda a superficies compactas, campos semánticos y acciones del preset.
- Se extendió temporalmente la capa de compatibilidad del contexto `font-preset` para que los formularios de configuración que comparten markup heredado respeten los radios y acciones del preset durante la migración final de sus componentes.

### Valorizacion de stock convencional
- Se migraron `/convencional/stock/valorizacion` y `/convencional/stock/valorizacion/lista-precios` al preset compacto, con hero y resumen integrados, fondo `muted`, superficies semanticas y tablas de alta densidad.
- Se alinearon la edición por fila, los estados de precio y las acciones de importar, exportar y guardar a los tokens del preset, sin modificar la lógica de consulta, actualización ni archivos Excel.

### Plan de ahorro
- Se migraron el Registro TestDrive y su calendario mensual/semanal al preset compacto, incluyendo alta, edición, eliminación, modal y controles de agenda.
- Se ajustó `/gestion/plan-ahorro/promedios` con selector anual, resumen integrado y tabla sticky de alta densidad, retirando colores, gradientes y bordes heredados.

### Calidad
- Se migró `/calidad/ssi-ventas` al preset compacto, incluyendo listado, importación CSV, filtros por estado, paginación y estados de carga y error.
- Se unificaron los diálogos de gestión de encuesta y asignación de ADM: campos, historial, acciones y estados usan superficies y tokens semánticos, sin cards anidadas ni colores heredados.

### Entregas
- Se actualizaron Agenda de entrega y Pendientes de turnar con heroes compactos, filtros semánticos, acciones consistentes y tablas de alta densidad.
- La búsqueda por interno conserva la consulta global y presenta en un diálogo el turno encontrado con sucursal, fecha y hora, o el estado `turno sin asignar`.

### Minutas
- Se migraron el listado, alta, edición, detalle y gestor de grupos de difusión al preset, con fondo unificado, superficies compactas, tablas densas y diálogos semánticos.
- Se consolidó el formulario en una única superficie con divisores y se alinearon selectores de participantes, grupos y editor enriquecido a los tokens del preset.

## 2026-09-03

### Preventas
- Se migro `/gestion/convencional/preventas/resumen` al preset con resumen unificado, fondo `muted` y tablas de alta densidad sin estilos heredados.

### Gestion personal
- Se migraron `/convencional/mis-reservas` y `/convencional/mi-lista-espera` al preset con superficies unificadas, tablas compactas, badges de color de ancho consistente y dialogo de cliente alineado a los tokens semanticos.

### Stock usados
- Se migraron `/usados/stock/disponible`, `/usados/stock/reservado` y `/usados/stock/guardado` al preset con heroes integrados, filtros y tablas compactas, badges de color unificados y dialogos semanticos.
- Se actualizo el layout de Usados con el fondo, navbar y footer institucional del preset.
- `/usados/mis-operaciones` utiliza el mismo componente de operaciones con ECharts, superficies compactas y tokens semanticos del preset.

### Stock LIESS
- Se migraron `/liess/stock/nuevos` y `/liess/stock/usados` al preset con resumen integrado, filtros compactos, tablas densas, navbar y footer institucionales.

### Preventas y administracion
- Se ajustaron Preventas, Lista previa, Facturas de anticipo y Proformas al preset compacto, con encabezados integrados, controles semanticos y tablas de alta densidad.
- Se actualizaron los formularios y dialogos de Preventas y Nueva proforma para usar los bordes, fondos y acciones del nuevo sistema visual.
- Se compacto Nueva proforma eliminando cards por unidad y se migro el detalle de proforma al preset con resumen integrado y tabla de alta densidad.
- Se unifico el ancho de Señores, Cliente y CUIT en el formulario de Nueva proforma.

### Stock convencional
- Se migro `/convencional/stock/disponible` al preset con navbar, footer y fondo unificados, hero y resumen en una unica superficie, filtros compactos y tabla de alta densidad.
- Se conservaron exclusivamente los colores que representan datos operativos de la unidad y alertas de reserva.
- Se migraron `/convencional/stock/reservado` y `/convencional/stock/guardado` con el mismo esquema visual, incluyendo tablas compactas y resumen integrado.
- Se unifico la fila de filtros de modelo en las tres vistas de stock convencional, con desplazamiento horizontal en pantallas angostas.
- Se unifico el ancho y la alineacion de los badges de color en las tres tablas de stock convencional.

### Inicio
- Se migro `/` al preset con una portada compacta, accesos por modulo bajo tokens semanticos, header simplificado y footer institucional.
- Se separaron los accesos de cada modulo para recuperar la lectura de botones independientes, sin fondos de relleno ni huecos visuales.
- Se establecio `bg-muted` como fondo global de las vistas migradas para distinguir las superficies `bg-card` sin incorporar tonos fijos.
- Se cubrieron las vistas migradas que no heredan `BaseAppLayout` y Plan de negocio, evitando excepciones de fondo dentro de los modulos existentes.

### Acceso
- Se migro `/login` al preset: superficie unica compacta, tipografia Nunito Sans, controles semanticos, fondo unificado y footer institucional.

### Configuracion administrativa
- Se alinearon los dialogos de colores, versiones y plan de negocio con los tokens del preset: paneles, controles, acciones y pies compactos, sin colores hexadecimales ni utilidades visuales heredadas.

## 2026-09-03

### Mis operaciones
- Se reemplazaron los graficos de `/convencional/mis-operaciones` por ECharts con renderizado SVG y paleta resuelta desde los tokens del preset.
- Se migro la vista completa al preset compacto: fondo, superficies, filtros, indicadores, tabla y estados sin clases ni colores del diseno anterior.

### Sistema de diseno
- Se inicializo shadcn/ui para Vite con el preset `b1D0dvg8`, aliases para componentes y la utilidad compartida `cn`.
- Se agregaron los tokens de color, radio y modo oscuro para que los nuevos componentes shadcn adopten el nuevo sistema visual sin modificar las vistas existentes.
- Se actualizo Tailwind CSS a la version 4 para usar los componentes generados por el preset de shadcn/ui.
- Se incorporo Nunito Sans para las vistas migradas al preset.

### Plan de negocio
- Se rediseño `/gestion/convencional/plan-negocio` con shadcn/ui, indicadores anuales y una grilla mensual con el mes actual destacado.
- Se redujo el espaciado de la vista para concentrar mas informacion en pantalla.
- Se unificaron el encabezado y los indicadores del resumen anual en una sola card.
- Se elimino el contenedor de la tabla para que la grilla ocupe todo el ancho disponible.
- Se resaltan en verde los avances iguales o superiores al 100%.

### Vistas operativas
- Se normalizaron las rutas de Colores, Versiones y Pedido mensual bajo `/admin/configuracion`, y se redujo el padding de sus tablas y tabs al preset.
- Se movieron los catalogos de Colores y Versiones a AdminLayout y se compactaron sus resumenes, tablas y dialogos junto con Plan de negocio administrativo y Pedido mensual.
- Se compactaron las filas, encabezados y badges de la tabla de Promedio convencional para mostrar mas registros en pantalla.
- Se unifico el fondo global de Reventas y Stock Usados al activar el layout del preset en el modulo de administracion.
- Se unificaron los filtros de Reventas y Stock Usados con una unica especificacion de espaciado, dimensiones y estados del preset.
- Se migraron No reparado, Pendiente de documentacion e Ingresos de Stock Usados al preset, con navbar, footer, heroes integrados y filtros compactos.
- Se rediseño Mi Perfil con el preset compacto: navbar y footer semánticos, hero con resumen integrado y datos sin cards anidadas.
- Se simplificaron los datos principales y el cambio de contraseña de Mi Perfil para eliminar divisores verticales y contenedores redundantes.
- Se adapto el navbar y footer exclusivos de Administracion al preset, con la leyenda de uso interno y autoria solicitadas.
- Se adaptaron los flujos de creación y edición de usuarios, incluido el formulario compartido y sus estados de carga, al preset compacto.
- Se simplifico el bloque de módulos del formulario de usuarios para eliminar cards anidadas y reducir el espaciado.
- Se migraron Usuarios, Configuración, TestDrive y Registros al preset visual compacto, con superficies, bordes y tipografía semánticos.
- Se integro el detalle de cheques rechazados en el panel de Titular de Central de Deudores para eliminar su fila independiente.
- Se alineo toda la vista Central de Deudores con los tokens del preset, incluidos sus estados de riesgo, paneles y detalles.
- Se adaptaron Reventas pendientes, Central de Deudores y Promedio convencional al sistema visual shadcn, con encabezados compactos que unifican filtros y resúmenes.
- Se mejoraron los indicadores de antigüedad de Reventas pendientes con cantidades centradas y de mayor tamaño.
- Se organizo el resumen por modelo en una sola fila desplazable para eliminar espacios vacios.
- Se unificaron los bordes, radios y colores de Reventas pendientes con los tokens del preset shadcn.

## 2026-09-03

### Agenda de entregas
- Se incorporo la busqueda global de turnos por interno, sin depender del dia ni de la sucursal seleccionados en la agenda.
- El resultado ahora informa en forma destacada la sucursal, fecha y hora de entrega, y permite abrir directamente esa agenda diaria.

## 2026-08-07

### Analisis de descuentos
- Se ajusto `/analisis/vendedor` para calcular descuentos promedio solo con operaciones que tienen bonificacion efectiva.
- Se ajusto `/analisis/operaciones-preventa` para calcular `PROM DESC.`, `Descuento Por Mes` y `Descuento Anual Sucursal` solo con operaciones bonificadas.
- Se alineo `/convencional/mis-operaciones` para que el resumen de descuentos use exclusivamente operaciones con bonificacion.
- Se agrego la columna `Cliente` en las tablas de operaciones encontradas de `/analisis/vendedor` y `/analisis/operaciones-preventa`.
- Se agrego el vendedor de la operacion en el dialogo de forma de pago de `/analisis/operaciones-preventa`.

## 2026-08-06

### Modulo Valorizacion
- Se agrego el modulo `Valorizacion` dentro de `Convencional > Stock de unidades`.
- Se incorporo control de acceso por `modules.valorizacion` y su documentacion funcional.
- Se creo la vista principal con resumen por modelo, columna `$ Valorizacion` y fila totalizadora.
- Se agrego la vista `Lista de precios` para administrar precios vigentes por version.
- Se implemento persistencia propia de precios de valorizacion sin historial.
- Se agregaron endpoints para listar, guardar, exportar e importar precios por version.
- Se habilito exportacion e importacion Excel para carga masiva de precios.
- La valorizacion ahora consolida stock por modelo a partir de precios vigentes por version.
