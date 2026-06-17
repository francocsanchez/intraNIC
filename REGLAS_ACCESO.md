# Reglas de Acceso

Este archivo es la fuente de verdad funcional para el esquema de acceso actual del proyecto.

## Estado actual
Hoy el sistema se encuentra gobernado por **modulos por usuario**.

La logica vigente es:

- Cada usuario puede tener un objeto `modules`.
- Un modulo esta **habilitado** solo cuando su valor es `1`.
- Un modulo esta **deshabilitado** cuando su valor es `0`, `null` o no existe.
- Si el usuario tiene el rol `superAdmin`, debe saltear cualquier restriccion funcional del sistema.
- Si el usuario tiene mas de un rol activo, los permisos deben combinarse por **union de accesos permitidos**.
- La validacion de modulos debe aplicarse en:
  - frontend
  - rutas protegidas
  - backend
  - endpoints sensibles
- `company` **sigue existiendo en el modelo**, pero **no debe usarse actualmente para decidir accesos**.
- `role` ya participa en accesos **solo** para los roles actualmente definidos:
  - `superAdmin`
  - `vendedor`
  - `supervisor`
  - `administracion`
  - `stock`

## Catalogo actual de modulos
- `convencional`
- `usados`
- `liess`
- `preventas`
- `proformas`
- `reventaPendientes`
- `listaPrevia`
- `facturasAnticipo`
- `asignaciones`
- `registroAsignaciones`
- `pedidoMensual`
- `pedidoUnidades`
- `noReparado`
- `pendienteDocumentacion`
- `ingresos`
- `operaciones`
- `ranking`
- `promedio`
- `patentamientos`
- `usuarios`
- `configuracion`

## Regla general vigente
Para cualquier pantalla, menu, accion o endpoint:

- Si el usuario tiene el rol `superAdmin`, el acceso debe permitirse siempre.
- Si el usuario tiene varios roles activos definidos, debe permitirse la **suma de permisos** de esos roles, sin convertir eso en acceso total.
- Si el modulo requerido esta en `1`, el acceso debe permitirse.
- Si el modulo requerido esta en `0`, `null` o ausente, el acceso debe bloquearse.

Esto implica:

- `superAdmin` debe ver todos los accesos y entrar a cualquier URL sin depender de `modules`
- combinar roles nunca debe abrir acceso global; solo debe sumar los accesos explicitamente definidos para cada rol
- no mostrar accesos habilitables en `Inicio` cuando el modulo no esta activo
- no mostrar links o acciones internas cuando el modulo no esta activo
- bloquear ingreso por URL directa cuando el modulo no esta activo
- responder `403` desde backend cuando el modulo no esta activo

## Regla de combinacion de roles
Cuando un usuario tenga mas de un rol definido:

- se debe aplicar la **union** de permisos de todos sus roles activos
- no se debe tomar la presencia de multiples roles como acceso total
- `superAdmin` sigue siendo la unica excepcion con acceso irrestricto

Ejemplo:

- `vendedor` + `administracion` = accesos de `vendedor` + accesos de `administracion`
- `vendedor` + `supervisor` = accesos de `vendedor` + accesos extra de `supervisor`
- cualquier combinacion con `superAdmin` = acceso total

## Relacion actual modulo -> acceso funcional
- `convencional`: stock y vistas generales de convencional
- `usados`: stock y vistas generales de usados
- `liess`: vistas de Liess
- `preventas`: modulo de preventas
- `proformas`: modulo de proformas
- `reventaPendientes`: pendientes de reventa
- `listaPrevia`: lista previa de pedido de unidades
- `facturasAnticipo`: facturas de anticipo
- `asignaciones`: asignaciones
- `registroAsignaciones`: registro y resumen de asignaciones
- `pedidoMensual`: pedido mensual
- `pedidoUnidades`: pedido de unidades
- `noReparado`: usados no reparado
- `pendienteDocumentacion`: usados pendiente documentacion
- `ingresos`: usados ingresos
- `operaciones`: analisis de operaciones
- `ranking`: ranking convencional
- `promedio`: promedio convencional
- `patentamientos`: analisis de patentamientos
- `usuarios`: ABM de usuarios
- `configuracion`: configuracion del sistema

## Roles
Estado actual de definicion funcional:

- `administracion`: definido e implementado
- `stock`: definido e implementado
- `supervisor`: definido e implementado
- `gerente`
- `vendedor`: definido e implementado
- `superAdmin`: definido e implementado

## Definiciones por rol

### Rol `vendedor`
Estado: definido

- Objetivo del rol:
  Usuario comercial operativo con acceso de consulta y autogestion sobre stock, gestion personal, proformas, resumen de preventas y analisis comercial.
- Modulos que puede ver:
  - `convencional`
  - `usados`
  - `liess`
  - `proformas`
  - `ranking`
  - `promedio`
- Modulos que puede operar:
  - `convencional` para consulta y autogestion
  - `usados` para consulta
  - `liess` para consulta
  - `proformas`, incluyendo alta de nuevas proformas
  - `ranking`
  - `promedio`
- Accesos permitidos:
  - `/convencional/stock/disponible`
  - `Dropdown "Mi Gestion"`
  - `/convencional/mis-operaciones`
  - `/convencional/mis-reservas`
  - `/convencional/mi-lista-espera`
  - `/gestion/convencional/preventas` en modo solo lectura
  - `/convencional/proformas`
  - `/convencional/proformas/nueva`
  - `/convencional/preventas/resumen`
  - `/analisis/ranking-convencional`
  - `/analisis/promedio-convencional`
  - `/usados/stock/disponible`
  - `/liess/stock/nuevos`
  - `/liess/stock/usados`
- Acciones restringidas:
  - no administra usuarios
  - no administra configuracion
  - no accede a pendientes de reventa
  - no accede a lista previa
  - no accede a facturas de anticipo
  - no accede a asignaciones
  - no accede a registro de asignaciones
  - no accede a pedido mensual
  - no accede a pedido de unidades
  - no accede a usados `no reparado`
  - no accede a usados `pendiente documentacion`
  - no accede a usados `ingresos`
  - no accede a `operaciones`
  - no accede a `patentamientos`
  - no puede crear preventas
  - no puede editar preventas
  - no puede eliminar preventas
  - no puede marcar preventas como asignadas
  - no accede a la vista de preventas asignadas en esta etapa
- Observaciones:
  - para este rol, el acceso a preventas incluye:
    - `/gestion/convencional/preventas` en solo lectura
    - `/convencional/preventas/resumen`
  - dentro de `/gestion/convencional/preventas` no deben mostrarse acciones de `Nueva preventa`, `Editar`, `Eliminar` ni `Asignado`
  - esto implica que el rol `vendedor` puede recibir el modulo `preventas`, pero las restricciones finas siguen definidas por rol
  - en `proformas`, el rol `vendedor` puede consultar el listado, ingresar al formulario `/convencional/proformas/nueva` y crear nuevas proformas
  - para crear proformas, el rol `vendedor` tambien puede leer el catalogo de `versiones` utilizado por ese formulario
  - cuando se implemente la etapa de roles, habra que distinguir permisos internos dentro del dominio `preventas`
  - el dropdown `Mi Gestion` debe estar visible cuando el usuario tenga acceso a cualquiera de estas rutas:
    - `/convencional/mis-operaciones`
    - `/convencional/mis-reservas`
    - `/convencional/mi-lista-espera`

### Rol `administracion`
Estado: definido

- Objetivo del rol:
  Usuario administrativo orientado a tareas de reventas pendientes, lista previa y facturas de anticipo.
- Modulos que puede ver:
  - `reventaPendientes`
  - `listaPrevia`
  - `facturasAnticipo`
- Modulos que puede operar:
  - `reventaPendientes`
  - `listaPrevia`
  - `facturasAnticipo`
- Accesos permitidos:
  - `/administracion/reventa-pendientes`
  - `/administracion/pedido-unidades/lista-previa`
  - `/administracion/facturas-anticipo`
- Acciones restringidas:
  - no accede a convencional
  - no accede a usados
  - no accede a liess
  - no accede a preventas
  - no accede a proformas
  - no accede a operaciones
  - no accede a ranking
  - no accede a promedio
  - no accede a patentamientos
  - no administra usuarios
  - no administra configuracion
- Observaciones:
  - este rol queda limitado exclusivamente al dominio administrativo definido en esos tres links
  - cualquier acceso fuera de esos tres modulos debe devolver bloqueo por rol aunque el usuario tenga modulos en `1`

### Rol `stock`
Estado: definido

- Objetivo del rol:
  Usuario operativo de stock con acceso transversal a stocks, asignaciones, pedido de unidades, registro de asignaciones y preventas con permisos parciales.
- Modulos que puede ver:
  - `convencional`
  - `usados`
  - `noReparado`
  - `pendienteDocumentacion`
  - `ingresos`
  - `asignaciones`
  - `pedidoUnidades`
  - `registroAsignaciones`
  - `preventas`
- Modulos que puede operar:
  - `convencional`
  - `usados`
  - `noReparado`
  - `pendienteDocumentacion`
  - `ingresos`
  - `asignaciones`
  - `pedidoUnidades`
  - `registroAsignaciones`
  - `preventas` con permisos parciales
- Accesos permitidos:
  - `/administracion/pedido-unidades/lista-previa`
  - `/liess/stock/nuevos`
  - `/liess/stock/usados`
  - `/convencional/stock/disponible`
  - `/convencional/stock/reservado`
  - `/convencional/stock/guardado`
  - `/usados/stock/disponible`
  - `/usados/stock/reservado`
  - `/usados/stock/guardado`
  - `/gestion/usados/stock/no-reparado`
  - `/gestion/usados/stock/pendiente-documentacion`
  - `/gestion/usados/stock/ingresos`
  - `/gestion/convencional/asignaciones`
  - `/gestion/convencional/pedido-mensual`
  - `/gestion/convencional/pedido-unidades`
  - `/gestion/convencional/registro-asignaciones`
  - `/gestion/convencional/registro-asignaciones/resumen`
  - `/gestion/convencional/preventas`
  - `/gestion/convencional/preventas/nueva`
  - `/gestion/convencional/preventas/resumen`
  - `/admin/configuracion`
  - `/admin/configuracion/convencional/editar`
  - `/admin/configuracion/usados/editar`
- Acciones restringidas:
  - no administra usuarios
  - no administra configuracion
  - no accede a proformas
  - no accede a ranking
  - no accede a promedio
  - no accede a operaciones
  - no accede a patentamientos
  - no accede a reventa pendientes
  - no accede a facturas de anticipo
  - no accede a `/admin/configuracion/reventa/editar`
  - no puede editar preventas
  - no puede eliminar preventas
- Observaciones:
  - en preventas puede:
    - ver el listado principal
    - crear nuevas preventas
    - marcar preventas como asignadas
  - en preventas no puede:
    - editar preventas
    - eliminar preventas
  - en configuracion puede entrar al panel general y editar solo convencional y usados
  - tambien puede acceder a `/administracion/pedido-unidades/lista-previa`
  - en la tabla principal de preventas debe ver la columna `Asignado`
  - en la tabla principal de preventas no debe ver la columna `Acciones` salvo que combine este rol con otro que la habilite

### Rol `supervisor`
Estado: definido

- Objetivo del rol:
  Usuario comercial con mas capacidad operativa que `vendedor`, incluyendo seguimiento de reservados, analisis de operaciones y gestion parcial de preventas.
- Modulos que puede ver:
  - todos los modulos habilitados para `vendedor`
  - `operaciones`
- Modulos que puede operar:
  - todos los modulos habilitados para `vendedor`
  - `operaciones`
  - preventas con permisos parciales de alta y baja
- Accesos permitidos:
  - todos los accesos permitidos para `vendedor`
  - `/analisis/operaciones`
  - `/convencional/stock/reservado`
  - `/usados/stock/reservado`
  - `/gestion/convencional/preventas`
  - `/gestion/convencional/preventas/nueva`
- Acciones restringidas:
  - no administra usuarios
  - no administra configuracion
  - no accede a pendientes de reventa
  - no accede a lista previa
  - no accede a facturas de anticipo
  - no accede a asignaciones
  - no accede a registro de asignaciones
  - no accede a pedido mensual
  - no accede a pedido de unidades
  - no accede a usados `no reparado`
  - no accede a usados `pendiente documentacion`
  - no accede a usados `ingresos`
  - no accede a `patentamientos`
  - no puede marcar preventas como asignadas
  - no debe ver la columna `Asignado` en la pantalla principal de preventas
- Observaciones:
  - `supervisor` hereda todos los accesos de `vendedor`
  - en preventas puede:
    - ver el listado principal
    - crear nuevas preventas
    - editar preventas
    - eliminar preventas
  - en preventas no puede:
    - asignarlas
  - en la tabla principal de preventas debe ver la columna `Acciones`, pero no la columna `Asignado`

### Rol `gerente`
Estado: pendiente

- Objetivo del rol:
- Modulos que puede ver:
- Modulos que puede operar:
- Acciones restringidas:
- Observaciones:

### Rol `superAdmin`
Estado: definido

- Objetivo del rol:
  Usuario dueno del sistema. Tiene acceso total, irrestricto y sin dependencias de modulos.
- Modulos que puede ver:
  - todos
- Modulos que puede operar:
  - todos
- Accesos permitidos:
  - todas las pantallas
  - todos los menus
  - todas las rutas directas
  - todos los endpoints
  - todas las acciones administrativas
- Acciones restringidas:
  - ninguna
- Observaciones:
  - `superAdmin` es la unica excepcion activa a la regla general basada en `modules`
  - si el usuario tiene `role: ["superAdmin"]` o comparte ese rol junto con otros, siempre debe prevalecer `superAdmin`
  - no debe requerirse que tenga modulos en `1` para ver o usar funcionalidades

## Regla para futuras definiciones
Cuando se agreguen permisos por rol, cada definicion debe indicar:

- que rol aplica
- sobre que modulo aplica
- si el permiso es de lectura, navegacion, creacion, edicion, eliminacion o administracion
- si debe validarse en frontend, backend o ambos
- si reemplaza o complementa una regla anterior

## Nota de implementacion
Hasta nuevo aviso:

- los modulos siguen siendo la base principal de acceso
- no se deben volver a introducir reglas por `company`
- los unicos roles activos en codigo son `superAdmin`, `vendedor`, `supervisor`, `administracion` y `stock`
- no se deben volver a introducir reglas por otros `role` hasta definir formalmente la siguiente etapa
- `superAdmin` siempre debe tener acceso total
