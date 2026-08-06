# Changelog

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
