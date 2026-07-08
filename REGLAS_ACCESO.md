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
  - `gerente`
  - `administracion`
  - `stock`

## Catalogo actual de modulos
- `convencional`
- `usados`
- `liess`
- `callCenter`
- `preventas`
- `proformas`
- `reventaPendientes`
- `listaPrevia`
- `facturasAnticipo`
- `segUnidadesFabrica`
- `asignaciones`
- `planNegocio`
- `registroAsignaciones`
- `pedidoMensual`
- `pedidoUnidades`
- `analisisStock`
- `pendFac`
- `noReparado`
- `pendienteDocumentacion`
- `ingresos`
- `operaciones`
- `ranking`
- `promedio`
- `patentamientos`
- `transferencias`
- `actualizacionRegistros`
- `agendaEntrega`
- `pendientesTurnar`
- `usuarios`
- `configuracion`
- `testDrive`
- `registroTestDriveConvencional`
- `registroTestDrive`
- `promediosPlanAhorro`
- `minutas`

## Regla general vigente
Para cualquier pantalla, menu, accion o endpoint:

- Si el usuario tiene el rol `superAdmin`, el acceso debe permitirse siempre.
- Si el usuario tiene varios roles activos definidos, debe permitirse la **suma de permisos** de esos roles, sin convertir eso en acceso total.
- Si el modulo requerido esta en `1`, el acceso debe permitirse.
- Si el modulo requerido esta en `0`, `null` o ausente, el acceso debe bloquearse.

Esto implica:

- `superAdmin` debe ver todos los accesos y entrar a cualquier URL sin depender de `modules`.
- Combinar roles nunca debe abrir acceso global; solo debe sumar los accesos explicitamente definidos para cada rol.
- No mostrar accesos habilitables en `Inicio` cuando el modulo no esta activo.
- No mostrar links o acciones internas cuando el modulo no esta activo.
- Bloquear ingreso por URL directa cuando el modulo no esta activo.
- Responder `403` desde backend cuando el modulo no esta activo.

## Regla de combinacion de roles
Cuando un usuario tenga mas de un rol definido:

- se debe aplicar la **union** de permisos de todos sus roles activos
- no se debe tomar la presencia de multiples roles como acceso total
- `superAdmin` sigue siendo la unica excepcion con acceso irrestricto

Ejemplo:

- `vendedor` + `administracion` = accesos de `vendedor` + accesos de `administracion`
- `vendedor` + `supervisor` = accesos de `vendedor` + accesos extra de `supervisor`
- cualquier combinacion con `superAdmin` = acceso total

## Etapa actual: pantallas controladas solo por modulo
En esta etapa se definio que algunas pantallas dependen solo de los modulos habilitados en el usuario, sin bloquearse por rol.

Aplica a estas areas:

- `Call Center`
- `Plan de ahorro`
- `Gestion de stock usados`
- `Analisis`

### Call Center

- La seccion completa depende de `modules.callCenter = 1`.
- Si el modulo no esta habilitado, la seccion no debe mostrarse ni permitir acceso por URL.
- Si el modulo esta habilitado, el rol no debe bloquear:
  - `Importador de datos`
  - `Origenes de datos`

### Plan de ahorro

- `Registro TestDrive` depende de `modules.registroTestDrive = 1`.
- `Promedios` depende de `modules.promediosPlanAhorro = 1`.
- Si el modulo correspondiente esta habilitado, el rol no debe bloquear el acceso a la pantalla.
- No se agregan modulos padres ni checks de seccion: la fuente de verdad sigue siendo el formulario de usuario por modulo.
- Regla especifica para `/gestion/plan-ahorro/test-drive`:
  - cualquier usuario con `modules.registroTestDrive = 1` puede crear registros;
  - solo el usuario creador puede editar o eliminar su propio registro;
  - una vez llegada la fecha y hora de retiro, el registro ya no puede editarse ni eliminarse;
  - `superAdmin` mantiene acceso total sobre las acciones del modulo.

### Gestion de stock usados

- `No reparado` depende de `modules.noReparado = 1`.
- `Pendiente documentacion` depende de `modules.pendienteDocumentacion = 1`.
- `Ingresos` depende de `modules.ingresos = 1`.
- Si el modulo correspondiente esta habilitado, el rol no debe bloquear el acceso a la pantalla.

### Analisis

- `Operaciones` depende de `modules.operaciones = 1`.
- `Ranking` depende de `modules.ranking = 1`.
- `Promedio` depende de `modules.promedio = 1`.
- `Patentamientos` depende de `modules.patentamientos = 1`.
- `Transferencias` depende de `modules.transferencias = 1`.
- Si el modulo correspondiente esta habilitado, el rol no debe bloquear el acceso a la pantalla.

## Relacion actual modulo -> acceso funcional
- `convencional`: stock y vistas generales de convencional
- `usados`: stock y vistas generales de usados
- `liess`: vistas de Liess
- `callCenter`: seccion de importacion y administracion de origenes
- `preventas`: modulo de preventas
- `proformas`: modulo de proformas
- `registroTestDriveConvencional`: registro de solicitudes de test drive para `Comercial / Convencional`
- `registroTestDrive`: registro de solicitudes de test drive en la seccion `Plan de ahorro`
- `promediosPlanAhorro`: promedios de plan de ahorro
- `reventaPendientes`: pendientes de reventa
- `listaPrevia`: lista previa de pedido de unidades
- `facturasAnticipo`: facturas de anticipo
- `segUnidadesFabrica`: seguimiento de unidades de fabrica
- `asignaciones`: asignaciones
- `planNegocio`: plan de negocio
- `registroAsignaciones`: registro y resumen de asignaciones
- `pedidoMensual`: pedido mensual
- `pedidoUnidades`: pedido de unidades
- `analisisStock`: analisis de stock
- `pendFac`: pendientes de factura
- `noReparado`: usados no reparado
- `pendienteDocumentacion`: usados pendiente documentacion
- `ingresos`: usados ingresos
- `operaciones`: analisis de operaciones
- `ranking`: ranking convencional
- `promedio`: promedio convencional
- `patentamientos`: analisis de patentamientos
- `transferencias`: analisis de transferencias
- `actualizacionRegistros`: actualizacion/importacion de registros
- `agendaEntrega`: agenda de entrega
- `pendientesTurnar`: pendientes de turnar
- `usuarios`: ABM de usuarios
- `configuracion`: configuracion del sistema
- `testDrive`: ABM de unidades para test drive
- `minutas`: modulo de minutas

## Roles
Estado actual de definicion funcional:

- `administracion`: definido e implementado
- `stock`: definido e implementado
- `supervisor`: definido e implementado
- `gerente`: definido e implementado
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
  - `registroTestDrive`
  - `ranking`
  - `promedio`
- Modulos que puede operar:
  - `convencional` para consulta y autogestion
  - `usados` para consulta
  - `liess` para consulta
  - `proformas`, incluyendo alta de nuevas proformas
  - `registroTestDrive`, incluyendo alta, edicion propia y eliminacion propia
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
  - `/gestion/convencional/test-drive`
  - `/convencional/preventas/resumen`
  - `/analisis/ranking-convencional`
  - `/analisis/promedio-convencional`
  - `/usados/stock/disponible`
  - `/liess/stock/nuevos`
  - `/liess/stock/usados`
- Acciones restringidas:
  - no administra usuarios
  - no administra configuracion
  - no administra TestDrive
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

### Rol `supervisor`
Estado: definido

- Objetivo del rol:
  Usuario comercial con mas capacidad operativa que `vendedor`, incluyendo seguimiento de reservados, analisis de operaciones y gestion parcial de preventas.

### Rol `gerente`
Estado: definido

- Objetivo del rol:
  Usuario comercial con acceso ampliado equivalente a `vendedor` + `supervisor`, sumando acceso a asignaciones para consulta.

### Rol `superAdmin`
Estado: definido

- Objetivo del rol:
  Usuario dueno del sistema. Tiene acceso total, irrestricto y sin dependencias de modulos.
- Modulos que puede ver:
  - todos
- Modulos que puede operar:
  - todos

## Acceso especifico del modulo `testDrive`
- Modulo asociado: `testDrive`
- Acceso funcional asociado: `sistema.testDrive`
- Ruta principal: `/admin/test-drive`
- Accion habilitada: ABM de unidades destinadas a test drive
- Roles permitidos:
  - `supervisor`
  - `gerente`
  - `superAdmin`

## Acceso especifico del modulo `registroTestDrive`
- Modulo asociado: `registroTestDrive`
- Seccion visible en UI: `Plan de ahorro`
- Ruta principal: `/gestion/plan-ahorro/test-drive`
- Reglas vigentes:
  - cualquier usuario con `modules.registroTestDrive = 1` puede crear registros
  - solo el usuario creador puede editar o eliminar su propio registro
  - una vez iniciada la fecha y hora de retiro, el registro no puede editarse ni eliminarse
  - `superAdmin` puede acceder siempre aunque no tenga el modulo activo y mantiene acceso total
  - una unidad no puede tener dos registros superpuestos en el tiempo

## Acceso especifico del modulo `registroTestDriveConvencional`
- Modulo asociado: `registroTestDriveConvencional`
- Seccion visible en UI: `Comercial`
- Ruta principal: `/gestion/convencional/test-drive`
- Reglas:
  - `vendedor`, `supervisor` y `gerente` deben tener `modules.registroTestDriveConvencional = 1` para acceder
  - `vendedor` puede crear, editar solo sus propios registros y eliminar solo sus propios registros
  - `supervisor` y `gerente` pueden crear, editar solo sus propios registros y eliminar registros propios o ajenos
  - `stock` y `administracion` no deben acceder aunque tengan `modules.registroTestDriveConvencional = 1`
  - `superAdmin` puede acceder siempre aunque no tenga el modulo activo
  - una unidad no puede tener dos registros superpuestos en el tiempo

## Alcance y limites

- Esta etapa solo cambia acceso a pantallas y navegacion para las areas listadas arriba.
- El resto de permisos por rol del sistema se mantiene sin cambios.
- No se modifica la estructura de `User.modules`.
- No se agregan modulos nuevos.

## Carga de permisos en usuarios

- La habilitacion se administra desde el formulario de alta y edicion de usuario.
- Los checks siguen siendo por modulo individual.
- Una seccion se muestra cuando el usuario tiene al menos uno de sus modulos hijos habilitado.

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
- los unicos roles activos en codigo son `superAdmin`, `vendedor`, `supervisor`, `gerente`, `administracion` y `stock`
- no se deben volver a introducir reglas por otros `role` hasta definir formalmente la siguiente etapa
- `superAdmin` siempre debe tener acceso total
