# Changelog

## 2026-09-03

### Configuracion administrativa
- Se alinearon los dialogos de colores, versiones y plan de negocio con los tokens del preset: paneles, controles, acciones y pies compactos, sin colores hexadecimales ni utilidades visuales heredadas.

## 2026-09-03

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
