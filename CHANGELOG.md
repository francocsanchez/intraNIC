# Changelog

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
