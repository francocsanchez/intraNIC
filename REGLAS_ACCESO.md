# Reglas de acceso y permisos

Este archivo sera la fuente de verdad para definir y validar los permisos del sistema.
Por ahora solo se documentan los roles y companias disponibles. Las reglas concretas de acceso se agregaran mas adelante, una por una, cuando se indique explicitamente.
No aplicar reglas nuevas en el sistema hasta recibir la indicacion: "aplicaremos las reglas".
Las reglas se iran definiendo en base al frontend. Cada regla indicada para el front debe revisarse y aplicarse tambien en el backend cuando proteja rutas, datos, endpoints o acciones sensibles, para impedir accesos directos no autorizados.

## Roles del sistema
- `admin`
- `stock`
- `gerente`
- `supervisor`
- `vendedor`
- `administracion`

## Companias del sistema
- `convencional`
- `usados`
- `liess`
## Reglas aplicadas - Etapa 1
Estas reglas ya fueron aplicadas en frontend y backend cuando existe una ruta, endpoint o accion relacionada.

### Frontend - Inicio
- `Inicio / Card Convencional` - `convencional` - `todos los roles` - Visible y habilitado para usuarios de compania `convencional`, independientemente del rol. - `frontend + ruta`
- `Inicio / Card Usados` - `usados` - `todos los roles` - Visible y habilitado para usuarios de compania `usados`, independientemente del rol. - `frontend + ruta`
- `Inicio / Card Liess` - `liess` - `todos los roles` - Visible y habilitado para usuarios de compania `liess`, independientemente del rol. - `frontend + ruta`
- `Inicio / Card Preventa` - `convencional` - `todos los roles` - Visible y habilitado para usuarios de compania `convencional`, independientemente del rol. Las acciones de modificacion quedan protegidas aparte. - `frontend + ruta + backend lectura`
- `Inicio / Card Sistema` - `cualquiera` - `admin`, `stock`, `supervisor` - Visible y habilitado para usuarios que tengan alguno de estos roles, sin importar la compania. Debe coincidir con el acceso a `/configuracion`. - `frontend + ruta`
- `Inicio / Card Administracion` - `cualquiera` - `admin`, `administracion`, `stock`, `gerente`, `supervisor`, `vendedor` - Visible y habilitado para usuarios que tengan alguno de estos roles, sin importar la compania. Debe incluir `vendedor` porque dentro de `/administracion` puede acceder a los cards permitidos del modulo, como Pendientes de reventas y Trazabilidad operativa. - `frontend + ruta`

### Frontend - Administracion Layout
- `Administracion Layout / Logo Administracion` - `cualquiera` - `admin`, `administracion`, `stock`, `gerente`, `supervisor` - Link hacia `/administracion`. - `frontend`
- `Administracion Layout / Inicio` - `cualquiera` - `todos los roles` - Link hacia `/`. - `frontend`
- `Administracion Layout / Pendientes de reventas` - `cualquiera` - `todos los roles` - Link de navegacion hacia `/reventa-pendientes`. Visible y habilitado para usuarios que tengan alguno de estos roles, sin importar la compania. - `frontend`
- `Administracion Layout / Pedido de Unidades` - `cualquiera` - `admin`, `stock` - Link de navegacion hacia `/pedido-unidades/lista-previa`. Visible y habilitado unicamente para los roles `admin` y `stock`, sin importar la compania. - `frontend + ruta + backend`
- `Administracion Layout / Trazabilidad` - `cualquiera` - `admin`, `administracion`, `stock`, `gerente` - Link de navegacion hacia `/trazabilidad-operativa`. Visible y habilitado para usuarios que tengan alguno de estos roles, sin importar la compania. - `frontend`
- `Administracion Layout / Cerrar sesion` - `usuario autenticado` - `todos los roles autenticados` - Cierra la sesion y redirige a `/login`. - `frontend`

## Reglas aplicadas - AdminModuleLayout
El acceso general al `AdminModuleLayout` ya fue definido. En esta seccion solo se definen roles para cada acceso visible dentro del layout.

No aplica compania para estas reglas.

Estado: modulo Administracion cerrado y validado. No modificar estos permisos en proximas etapas salvo pedido explicito.

- `AdminModuleLayout / Administracion` - `todos los roles` - Link del encabezado hacia `/administracion`. - `frontend + ruta`
- `AdminModuleLayout / Inicio` - `todos los roles` - Link del encabezado hacia `/`. - `frontend`
- `AdminModuleLayout / Pendientes de reventas` - `todos los roles` - Link de navegacion hacia `/reventa-pendientes`. - `frontend + ruta + backend`
- `AdminModuleLayout / Pedido de Unidades` - `admin`, `stock`, `administracion`, `gerente` - Link de navegacion hacia `/pedido-unidades/lista-previa`. - `frontend + ruta + backend`
- `AdminModuleLayout / Trazabilidad` - `todos los roles` - Link de navegacion hacia `/trazabilidad-operativa`. - `frontend + ruta + backend`
- `AdminModuleLayout / Cerrar sesion` - `todos los roles` - Boton para cerrar sesion y redirigir a `/login`. - `frontend`

## Reglas aplicadas - pedido-unidades/lista-previa
Estas acciones pertenecen a la pantalla `/pedido-unidades/lista-previa`. No aplica compania para estas reglas porque el acceso viene desde el modulo de Administracion.

Estado: pantalla cerrada y validada dentro del modulo Administracion. No modificar estos permisos en proximas etapas salvo pedido explicito.

- `Lista previa / Ver pantalla` -  `admin`, `stock`, `administracion`, `gerente` - Permite ingresar a `/pedido-unidades/lista-previa` y consultar la pantalla. - `frontend + ruta + backend`
- `Lista previa / Ir a Pedido de Unidades` - `admin`, `stock` - Link superior hacia `/pedido-unidades`. Solo estos roles deben ver el boton. - `frontend + ruta`
- `Lista previa / Campo Interno` - `admin`, `stock`, `administracion` - Campo numerico para ingresar el interno que se quiere cargar. - `frontend`
- `Lista previa / Agregar` - `admin`, `stock`, `administracion` - Boton que agrega el interno cargado en el campo Interno. Tambien se ejecuta al presionar Enter dentro del campo. - `frontend + backend`
- `Lista previa / Ver unidades cargadas` - `admin`, `stock`, `administracion`, `gerente` - Permite ver la tabla de unidades cargadas con interno, cliente, vendedor, chasis, version, modelo, prioridad, usuario y fecha. - `frontend + backend`
- `Lista previa / Ver contador de registros` - `admin`, `stock`, `administracion`, `gerente` - Muestra la cantidad total de registros cargados en la lista previa. - `frontend`
- `Lista previa / Cambiar prioridad` - `admin`, `stock`, `administracion`, `gerente` - Selector para modificar la prioridad de una unidad entre `normal`, `media` y `urgente`. - `frontend + backend`
- `Lista previa / Ver prioridad sin editar` - `no aplica` - No se usa en esta etapa porque todos los roles con acceso a la tabla pueden modificar prioridad. - `frontend`
- `Lista previa / Eliminar` - `admin`, `stock`, `administracion`, `gerente` - Boton para eliminar una unidad cargada en la lista previa. - `frontend + backend`
- `Lista previa / Ver mensaje sin registros` - `admin`, `stock`, `administracion`, `gerente` - Muestra el mensaje cuando todavia no hay unidades en la lista previa. - `frontend`
- `Lista previa / Ver error de carga` - `admin`, `stock`, `administracion`, `gerente` - Muestra el error cuando no se puede cargar la lista previa. - `frontend`

## Reglas aplicadas - /preventas
Estas acciones pertenecen a la pantalla `/preventas`. Aplica compania `convencional` porque el modulo Preventas se accede desde esa compania.

Estado: pantalla `/preventas` cerrada y validada. No modificar estos permisos en proximas etapas salvo pedido explicito.

- `Preventas / Ver pantalla` - `convencional` - `todos` - Permite ingresar a `/preventas` y consultar preventas pendientes. - `frontend + ruta + backend`
- `Preventas / Ver resumen` - `convencional` - `todos` - Link superior hacia `/preventas/resumen`. - `frontend + ruta + backend`
- `Preventas / Nueva preventa` - `convencional` - `admin`, `stock`,`supervisor` - Link superior hacia `/preventas/nueva`. - `frontend + ruta`
- `Preventas / Ver metricas` - `convencional` - `todos` - Permite ver cards de cantidad de pendientes, preventas con reserva y preventas con colores multiples. - `frontend`
- `Preventas / Ver listado operativo` - `convencional` - `todos` - Permite ver la tabla de preventas pendientes. - `frontend + backend`
- `Preventas / Ver asignadas` - `convencional` - `stock`,`admin`,`supervisor` - Link del listado hacia `/preventas/asignadas`. - `frontend + ruta + backend`
- `Preventas / Ver datos de preventa` - `convencional` - `todos` - Permite ver mes, cliente, observaciones, version, colores, vendedor, numero de OP y reserva. - `frontend + backend`
- `Preventas / Marcar asignado` - `convencional` - `admin`,`stock` - Checkbox para marcar una preventa pendiente como asignada. Al marcarla deja de mostrarse en pendientes. - `frontend + backend`
- `Preventas / Ver estado pendiente sin editar` - `convencional` - `todos` - Muestra etiqueta de estado cuando el usuario no puede marcar asignado. - `frontend`
- `Preventas / Editar` - `convencional` - `stock`,`admin`,`supervisor` - Link de accion hacia `/preventas/:id/editar`. - `frontend + ruta + backend`
- `Preventas / Eliminar` - `convencional` - `stock`,`admin`,`supervisor` - Boton para eliminar una preventa pendiente. - `frontend + backend`
- `Preventas / Ver acciones solo lectura` - `convencional` - `todos` - Muestra texto de solo lectura cuando el usuario no puede editar ni eliminar. - `frontend`
- `Preventas / Ver mensaje sin registros` - `convencional` - `todos` - Muestra el mensaje cuando no hay preventas pendientes. - `frontend`
- `Preventas / Ver ayuda sobre asignacion` - `convencional` - `no aplica` - Mensaje eliminado de la vista. - `frontend`
- `Preventas / Ver error de carga` - `convencional` - `todos` - Muestra el error cuando no se pueden cargar las preventas pendientes. - `frontend`

### Backend asociado aplicado - /preventas
- `GET /dms/preventas?asignado=false` - `convencional` - `todos` - Lista preventas pendientes. - `backend`
- `GET /dms/preventas?asignado=true` - `convencional` - `stock`, `admin`, `supervisor` - Lista preventas asignadas. - `backend`
- `GET /dms/preventas/:id` - `convencional` - `stock`, `admin`, `supervisor` - Consulta una preventa para edicion. - `backend`
- `POST /dms/preventas` - `convencional` - `stock`, `admin`, `supervisor` - Crea una nueva preventa. - `backend`
- `PUT /dms/preventas/:id` - `convencional` - `stock`, `admin`, `supervisor` - Actualiza una preventa existente. - `backend`
- `DELETE /dms/preventas/:id` - `convencional` - `stock`, `admin`, `supervisor` - Elimina una preventa. - `backend`
- `PATCH /dms/preventas/:id/asignado` - `convencional` - `admin`, `stock` - Marca o desmarca una preventa como asignada. - `backend`
- `GET /dms/preventas/resumen-pendientes` - `convencional` - `todos` - Consulta resumen de preventas pendientes. - `backend`
- `GET /dms/preventas/resumen-pedido-mensual` - `convencional` - `todos` - Consulta resumen de pedido mensual usado por `/preventas/resumen`. - `backend`

## Reglas aplicadas - /configuracion
Estas acciones pertenecen al modulo `/configuracion`. Algunas acciones dependen de compania porque cada card o pantalla modifica una configuracion especifica.

Estado: modulo `/configuracion` cerrado y validado. No modificar estos permisos en proximas etapas salvo pedido explicito. El navbar de este layout no debe mostrar link a `Reventas`.

### Configuracion - Vista principal
- `Configuracion / Ver pantalla` - `cualquiera` - `stock`, `admin`, `supervisor` - Permite ingresar a `/configuracion` y consultar la configuracion general. - `frontend + ruta + backend`
- `Configuracion / Ver card Convencional` - `convencional` - `stock`, `admin`, `supervisor` - Permite ver estado activo/inactivo y vendedores configurados de Convencional. - `frontend + backend`
- `Configuracion / Editar Convencional` - `convencional` - `stock`, `admin` - Link hacia `/configuracion/convencional/editar`. Si no tiene permiso, se muestra `Sin acceso de edicion`. - `frontend + ruta`
- `Configuracion / Ver card Usados` - `usados` - `stock`, `admin`, `supervisor` - Permite ver estado activo/inactivo y vendedores configurados de Usados. - `frontend + backend`
- `Configuracion / Editar Usados` - `usados` - `stock`, `admin` - Link hacia `/configuracion/usados/editar`. Si no tiene permiso, se muestra `Sin acceso de edicion`. - `frontend + ruta`
- `Configuracion / Ver card Reventas` - `reventa` - `stock`, `admin`, `supervisor`- Permite ver vendedores configurados para Reventas. - `frontend + backend`
- `Configuracion / Editar Reventas` - `reventa` - `stock`, `admin` - Link hacia `/configuracion/reventa/editar`. Si no tiene permiso, se muestra `Sin acceso de edicion`. - `frontend + ruta`
- `Configuracion / Ver vendedores configurados` - `segun card` - `stock`, `admin`, `supervisor` - Permite ver los nombres/codigos de vendedores habilitados por bloque. - `frontend + backend`
- `Configuracion / Ver mensaje sin vendedores configurados` - `segun card` - `stock`, `admin`, `supervisor` - Muestra `Sin vendedores configurados` cuando un bloque no tiene vendedores asignados. - `frontend`
- `Configuracion / Catalogo Colores` - `convencional` - `stock`, `admin` - Link hacia `/preventas/colores` desde el card Convencional. - `frontend + ruta`
- `Configuracion / Catalogo Versiones` - `convencional` - `stock`, `admin` - Link hacia `/preventas/versiones` desde el card Convencional. - `frontend + ruta`
- `Configuracion / Ver error de carga` - `cualquiera` - `stock`, `admin`, `supervisor` - Muestra error cuando no se puede cargar configuracion o vendedores. - `frontend`

### Configuracion - Editar Convencional - {solo usuarios que contengan rol stock, admin, gerente}
- `Editar configuracion convencional / Ver pantalla` - `convencional` - `stock`, `admin`, `gerente` - Permite ingresar a `/configuracion/convencional/editar`. - `frontend + ruta + backend`
- `Editar configuracion convencional / Volver` - `convencional` - `stock`, `admin`, `gerente` - Link hacia `/configuracion`. - `frontend`
- `Editar configuracion convencional / Ver estado actual` - `convencional` - `stock`, `admin`, `gerente` - Permite ver si el sistema Convencional esta activo o inactivo. - `frontend + backend`
- `Editar configuracion convencional / Cambiar estado del sistema` - `convencional` - `stock`, `admin`, `gerente` - Switch para activar o desactivar el sistema Convencional. - `frontend + backend`
- `Editar configuracion convencional / Seleccionar vendedores Reservas` - `convencional` - `stock`, `admin`, `gerente` - Permite marcar o desmarcar vendedores habilitados para Reservas. - `frontend + backend`
- `Editar configuracion convencional / Seleccionar vendedores Disponible` - `convencional` - `stock`, `admin`, `gerente` - Permite marcar o desmarcar vendedores habilitados para Stock Disponible. - `frontend + backend`
- `Editar configuracion convencional / Seleccionar vendedores Stock Guardado` - `convencional` - `stock`, `admin`, `gerente` - Permite marcar o desmarcar vendedores habilitados para Stock Guardado. - `frontend + backend`
- `Editar configuracion convencional / Seleccionar vendedores Reventas` - `convencional` - `stock`, `admin`, `gerente` - Permite marcar o desmarcar vendedores habilitados para Reventas. - `frontend + backend`
- `Editar configuracion convencional / Guardar configuracion` - `convencional` - `stock`, `admin`, `gerente` - Guarda cambios de estado y vendedores de Convencional. - `frontend + backend`
- `Editar configuracion convencional / Ver error de carga` - `convencional` - `stock`, `admin`, `gerente` - Muestra error cuando no se puede cargar la configuracion o vendedores activos. - `frontend`

### Configuracion - Editar Usados - {solo usuarios que contengan rol stock, admin, gerente}
- `Editar configuracion usados / Ver pantalla` - `usados` - `stock`, `admin`, `gerente` - Permite ingresar a `/configuracion/usados/editar`. - `frontend + ruta + backend`
- `Editar configuracion usados / Volver` - `usados` - `stock`, `admin`, `gerente` - Link hacia `/configuracion`. - `frontend`
- `Editar configuracion usados / Ver estado actual` - `usados` - `stock`, `admin`, `gerente` - Permite ver si el sistema Usados esta activo o inactivo. - `frontend + backend`
- `Editar configuracion usados / Cambiar estado del sistema` - `usados` - `stock`, `admin`, `gerente` - Switch para activar o desactivar el sistema Usados. - `frontend + backend`
- `Editar configuracion usados / Seleccionar vendedores Reservas` - `usados` - `stock`, `admin`, `gerente` - Permite marcar o desmarcar vendedores habilitados para Reservas. - `frontend + backend`
- `Editar configuracion usados / Seleccionar vendedores Disponible` - `usados` - `stock`, `admin`, `gerente` - Permite marcar o desmarcar vendedores habilitados para Stock Disponible. - `frontend + backend`
- `Editar configuracion usados / Seleccionar vendedores Stock Guardado` - `usados` - `stock`, `admin`, `gerente` - Permite marcar o desmarcar vendedores habilitados para Stock Guardado. - `frontend + backend`
- `Editar configuracion usados / Guardar configuracion` - `usados` - `stock`, `admin`, `gerente` - Guarda cambios de estado y vendedores de Usados. - `frontend + backend`
- `Editar configuracion usados / Ver error de carga` - `usados` - `stock`, `admin`, `gerente` - Muestra error cuando no se puede cargar la configuracion o vendedores activos. - `frontend`

### Configuracion - Editar Reventas - {solo usuarios que contengan rol stock, admin, gerente}
- `Editar configuracion reventas / Ver pantalla` - `reventa` - `stock`, `admin`, `gerente` - Permite ingresar a `/configuracion/reventa/editar`. - `frontend + ruta + backend`
- `Editar configuracion reventas / Volver` - `reventa` - `stock`, `admin`, `gerente` - Link hacia `/configuracion`. - `frontend`
- `Editar configuracion reventas / Ver vendedores seleccionados` - `reventa` - `stock`, `admin`, `gerente` - Permite ver la cantidad de vendedores seleccionados para Reventas. - `frontend + backend`
- `Editar configuracion reventas / Seleccionar vendedores Reventas` - `reventa` - `stock`, `admin`, `gerente` - Permite marcar o desmarcar vendedores habilitados para Reventas. - `frontend + backend`
- `Editar configuracion reventas / Guardar configuracion` - `reventa` - `stock`, `admin`, `gerente` - Guarda cambios de vendedores de Reventas. - `frontend + backend`
- `Editar configuracion reventas / Ver error de carga` - `reventa` - `stock`, `admin`, `gerente` - Muestra error cuando no se puede cargar la configuracion o vendedores activos. - `frontend`

### Backend asociado aplicado - /configuracion
- `GET /config/` - `cualquiera` - `uso compartido` - Consulta configuracion general del sistema. Este endpoint se mantiene compartido porque tambien lo usan pantallas operativas fuera de `/configuracion`. - `backend`
- `PATCH /config/` - `segun campos enviados` - `admin`, `stock`, `gerente` - Actualiza configuracion Convencional, Usados o Reventas segun payload. - `backend`
- `GET /dms/vendedores` - `cualquiera` - `stock`, `admin`, `supervisor` - Consulta vendedores para mostrar nombres en la vista principal de configuracion. - `backend`
- `GET /dms/vendedores/activos` - `cualquiera` - `stock`, `admin`, `gerente`, `supervisor` - Consulta vendedores activos para las pantallas de edicion. - `backend`
- `GET /dms/colores` - `convencional` - `stock`, `admin`, `supervisor` - Lista catalogo de colores de preventas. Endpoint compartido con formulario de Preventas. - `backend`
- `GET /dms/versiones` - `convencional` - `stock`, `admin`, `supervisor` - Lista catalogo de versiones de preventas. Endpoint compartido con formulario de Preventas. - `backend`

## Reglas aplicadas - Modulo Convencional
Estas acciones pertenecen al modulo Convencional. Aplica compania `convencional` salvo que una accion indique lo contrario.

Estado: modulo Convencional cerrado, aplicado y validado en frontend y backend. No modificar estos permisos en proximas etapas salvo pedido explicito.
Cuando una accion figura como `pendiente`, hereda los roles definidos en el titulo del bloque correspondiente.

Resumen de permisos aplicados:
- `Stock disponible` - `convencional` - `stock`, `admin`, `gerente`, `supervisor`, `vendedor`.
- `Stock reservado` - `convencional` - `stock`, `admin`, `gerente`, `supervisor`.
- `Stock guardado` - `convencional` - `stock`, `admin`, `gerente`.
- `Asignaciones` - `convencional` - `stock`, `admin`, `gerente`.
- `Pedido de Unidades` - `convencional` - `stock`, `admin`.
- `Registro de asignaciones` - `convencional` - `stock`, `admin`, `gerente`.
- `Resumen de registro de asignaciones` - `convencional` - `stock`, `admin`, `gerente`.
- `Pedido mensual` - `convencional` - `stock`, `admin`, `gerente`.
- `Ranking` - `convencional` - `stock`, `admin`, `gerente`, `vendedor`.
- `Promedio de ventas` - `convencional` - `stock`, `admin`, `gerente`, `vendedor`.
- `Mi perfil` - `convencional` - `todos los roles`.
- `Mis reservas`, `Mi lista de espera` y `Mis operaciones` - `convencional` - `todos los roles`.
- `Convencional Navbar / Resumen de preventas` - eliminado del navbar de Convencional. Mantiene reglas propias de `/preventas`.
- `Convencional Navbar / Menu Sistemas`, `Colores` y `Versiones` - eliminados del navbar de Convencional. Solo deben verse desde `/configuracion`.

Nota: las pantallas `/preventas`, `/preventas/resumen`, `/preventas/asignadas`, `/preventas/nueva`, `/preventas/:id/editar`, `/configuracion`, `/preventas/colores` y `/preventas/versiones` ya tienen reglas aplicadas en secciones anteriores. No redefinirlas dentro de esta etapa salvo pedido explicito.

### Convencional - Acceso general y navbar
- `Convencional / Ver modulo` - `convencional` - `stock`, `admin`, `gerente`, `supervisor`, `vendedor` - Permite ingresar al layout del modulo Convencional. - `frontend + ruta`
- `Convencional Navbar / Logo NIC` - `convencional` - `stock`, `admin`, `gerente`, `supervisor`, `vendedor` - Link hacia `/`. - `frontend`
- `Convencional Navbar / Stock Disponible` - `convencional` - `stock`, `admin`, `gerente`, `supervisor`, `vendedor` - Link hacia `/stock/disponible/convencional`. - `frontend + ruta + backend`
- `Convencional Navbar / Stock Reservado` - `convencional` - `stock`, `admin`, `gerente`, `supervisor` - Link hacia `/stock/reservado/convencional`. - `frontend + ruta + backend`
- `Convencional Navbar / Stock Guardado` - `convencional` - `stock`, `admin`, `gerente` - Link hacia `/stock/guardado/convencional`. - `frontend + ruta + backend`
- `Convencional Navbar / Menu Reportes` - `convencional` - `stock`, `admin`, `gerente`, `supervisor`, `vendedor` - Despliega accesos de reportes del modulo. - `frontend`
- `Convencional Navbar / Ranking de vendedores` - `stock`, `admin`, `gerente`, `supervisor`, `vendedor`- Link hacia `/ranking-convencional`. - `frontend + ruta + backend`
- `Convencional Navbar / Promedio de ventas` - `stock`, `admin`, `gerente`, `supervisor`, `vendedor` - Link hacia `/promedio-convencional`. - `frontend + ruta + backend`
- `Convencional Navbar / Menu Gestion` - `convencional` - `stock`, `admin`, `gerente` - Despliega accesos operativos de gestion. - `frontend`
- `Convencional Navbar / Asignaciones` - `convencional` - `stock`, `admin`, `gerente` - Link hacia `/asignaciones`. - `frontend + ruta + backend`
- `Convencional Navbar / Registro de asignaciones` - `stock`, `admin`, `gerente` - Link hacia `/registro-asignaciones`. - `frontend + ruta + backend`
- `Convencional Navbar / Pedido mensual` - `convencional` - `stock`, `admin`, `gerente` - Link hacia `/preventas/pedido-mensual`. - `frontend + ruta + backend`
- `Convencional Navbar / Resumen de preventas` - `convencional` - `ya definido en /preventas` - Link hacia `/preventas/resumen`. Mantener reglas ya aplicadas de Preventas. - `frontend + ruta + backend` - [sacar este punto del menu del navbar]
- `Convencional Navbar / Menu Sistemas` - `convencional` - `pendiente` - Despliega accesos de catalogos tecnicos del modulo. - `frontend` - [sacar este punto del menu, solo se debe ver en el modulo de /configuracion]
- `Convencional Navbar / Colores` - `convencional` - `ya definido en /configuracion` - Link hacia `/preventas/colores`. Mantener reglas ya aplicadas de Configuracion/catalogos. - `frontend + ruta + backend` - [sacar este punto del menu, solo se debe ver en el modulo de /configuracion]
- `Convencional Navbar / Versiones` - `convencional` - `ya definido en /configuracion` - Link hacia `/preventas/versiones`. Mantener reglas ya aplicadas de Configuracion/catalogos. - `frontend + ruta + backend` - [sacar este punto del menu, solo se debe ver en el modulo de /configuracion]
- `Convencional Navbar / Menu usuario` - `usuario autenticado` - `stock`, `admin`, `gerente`, `supervisor`, `vendedor` - Despliega accesos propios del usuario. - `frontend`
- `Convencional Navbar / Mi cuenta` - `usuario autenticado` - `stock`, `admin`, `gerente`, `supervisor`, `vendedor` - Link hacia `/mi-perfil/convencional`. - `frontend + ruta + backend`
- `Convencional Navbar / Mis Operaciones` - `convencional` - `todos los roles` - Link hacia `/mis-operaciones/convencional`. - `frontend + ruta + backend`
- `Convencional Navbar / Mis reservas` - `convencional` - `todos los roles` - Link hacia `/mis-reservas/convencional`. - `frontend + ruta + backend`
- `Convencional Navbar / Mi lista de espera` - `convencional` - `todos los roles` - Link hacia `/mi-lista-espera/convencional`. - `frontend + ruta + backend`
- `Convencional Navbar / Cerrar sesion` - `usuario autenticado` - `stock`, `admin`, `gerente`, `supervisor`, `vendedor` - Cierra la sesion y redirige a `/login`. - `frontend`

### Convencional - Stock disponible - {`stock`, `admin`, `gerente`, `supervisor`, `vendedor`}
- `Stock disponible / Ver pantalla` - `convencional` - `pendiente` - Permite ingresar a `/stock/disponible/convencional`. - `frontend + ruta + backend`
- `Stock disponible / Ver mantenimiento` - `convencional` - `pendiente` - Muestra aviso de sistema en mantenimiento cuando Convencional esta inactivo y el usuario no tiene permiso privilegiado. - `frontend`
- `Stock disponible / Ver metricas` - `convencional` - `pendiente` - Muestra cards de Nacionales, Importadas y Total. - `frontend`
- `Stock disponible / Filtrar por modelo` - `convencional` - `pendiente` - Botones de filtro por `TODOS`, `HILUX`, `SW4`, `HIACE`, `COROLLA`, `C.CROSS`, `YARIS`, `RAV4`, `YARIS CROSS`. - `frontend`
- `Stock disponible / Ver tabla de unidades` - `convencional` - `pendiente` - Permite ver interno, modelo, version/chasis, color, ubicacion, recepcion y observaciones. - `frontend + backend`
- `Stock disponible / Ver contador de registros` - `convencional` - `pendiente` - Muestra cantidad de unidades segun filtro seleccionado. - `frontend`
- `Stock disponible / Ver mensaje sin registros` - `convencional` - `pendiente` - Muestra mensaje cuando no hay unidades para el filtro seleccionado. - `frontend`
- `Stock disponible / Ver error de carga` - `convencional` - `pendiente` - Muestra error cuando no se puede cargar el stock disponible. - `frontend`

### Convencional - Stock reservado - {`stock`, `admin`, `gerente`, `supervisor`}
- `Stock reservado / Ver pantalla` - `convencional` - `pendiente` - Permite ingresar a `/stock/reservado/convencional`. - `frontend + ruta + backend`
- `Stock reservado / Ver mantenimiento` - `convencional` - `pendiente` - Muestra aviso de sistema en mantenimiento cuando Convencional esta inactivo y el usuario no tiene permiso privilegiado. - `frontend`
- `Stock reservado / Ver metricas por sucursal` - `convencional` - `pendiente` - Muestra total y distribucion de reservas por sucursal. - `frontend`
- `Stock reservado / Filtrar por modelo` - `convencional` - `pendiente` - Botones de filtro por modelo. - `frontend`
- `Stock reservado / Ver tabla de reservas` - `convencional` - `pendiente` - Permite ver interno, modelo, version, color, ubicacion, chasis, vendedor y dias reservada. - `frontend + backend`
- `Stock reservado / Ver alerta por antiguedad` - `convencional` - `pendiente` - Resalta unidades con mas de 2 dias reservadas. - `frontend`
- `Stock reservado / Ver mensaje sin registros` - `convencional` - `pendiente` - Muestra mensaje cuando no hay unidades reservadas. - `frontend`
- `Stock reservado / Ver error de carga` - `convencional` - `pendiente` - Muestra error cuando no se puede cargar el stock reservado. - `frontend`

### Convencional - Stock guardado - {`stock`, `admin`, `gerente`}
- `Stock guardado / Ver pantalla` - `convencional` - `pendiente` - Permite ingresar a `/stock/guardado/convencional`. - `frontend + ruta + backend`
- `Stock guardado / Ver mantenimiento` - `convencional` - `pendiente` - Muestra aviso de sistema en mantenimiento cuando Convencional esta inactivo y el usuario no tiene permiso privilegiado. - `frontend`
- `Stock guardado / Ver metricas` - `convencional` - `pendiente` - Muestra cards de Nacionales, Importadas y Total. - `frontend`
- `Stock guardado / Filtrar por modelo` - `convencional` - `pendiente` - Botones de filtro por modelo. - `frontend`
- `Stock guardado / Ver tabla de unidades` - `convencional` - `pendiente` - Permite ver interno, modelo, version/chasis, color, ubicacion y recepcion. - `frontend + backend`
- `Stock guardado / Ver contador de registros` - `convencional` - `pendiente` - Muestra cantidad de unidades segun filtro seleccionado. - `frontend`
- `Stock guardado / Ver mensaje sin registros` - `convencional` - `pendiente` - Muestra mensaje cuando no hay unidades para el filtro seleccionado. - `frontend`
- `Stock guardado / Ver error de carga` - `convencional` - `pendiente` - Muestra error cuando no se puede cargar el stock guardado. - `frontend`

### Convencional - Asignaciones - {usuarios que contengan alguno de los siguientes roles `stock`, `admin`, `gerente`}
- `Asignaciones / Ver pantalla` - `convencional` - `pendiente` - Permite ingresar a `/asignaciones`. - `frontend + ruta + backend`
- `Asignaciones / Solicitar unidades` - `convencional` - `pendiente` - Link hacia `/pedido-unidades`. - `frontend + ruta`
- `Asignaciones / Seleccionar anio` - `convencional` - `pendiente` - Selector de anio para consultar asignaciones. - `frontend`
- `Asignaciones / Seleccionar mes` - `convencional` - `pendiente` - Botones mensuales para cambiar el periodo consultado. - `frontend`
- `Asignaciones / Ver metricas` - `convencional` - `pendiente` - Muestra total de unidades, recibidas y pendientes. - `frontend`
- `Asignaciones / Ver grafico recepciones por dia` - `convencional` - `pendiente` - Muestra grafico de unidades recibidas por dia. - `frontend`
- `Asignaciones / Ver grafico estado de recepcion` - `convencional` - `pendiente` - Muestra grafico de recibidas vs pendientes. - `frontend`
- `Asignaciones / Filtrar unidades por estado` - `convencional` - `pendiente` - Botones `Todos`, `Recibidos`, `Pendientes`. - `frontend`
- `Asignaciones / Ver tabla de unidades del mes` - `convencional` - `pendiente` - Permite ver interno, numero de fabrica, version, chasis, color, fecha probable, operacion, sucursal, pedido y estado. - `frontend + backend`
- `Asignaciones / Ver estado Pedido` - `convencional` - `pendiente` - Muestra si el interno fue incluido en Pedido de Unidades. - `frontend + backend`
- `Asignaciones / Ver estado Recepcion` - `convencional` - `pendiente` - Muestra si la unidad esta recibida o pendiente. - `frontend`
- `Asignaciones / Ver mensaje sin registros` - `convencional` - `pendiente` - Muestra mensaje cuando no hay unidades para el filtro seleccionado. - `frontend`
- `Asignaciones / Ver error de carga` - `convencional` - `pendiente` - Muestra error cuando no se pueden cargar asignaciones. - `frontend`

### Convencional - Pedido de Unidades {usuarios que contengan alguno de los siguientes roles `stock`, `admin`}
- `Pedido de Unidades / Ver pantalla` - `convencional` - `pendiente` - Permite ingresar a `/pedido-unidades`. - `frontend + ruta + backend`
- `Pedido de Unidades / Ir a lista previa` - `convencional` - `pendiente` - Link hacia `/pedido-unidades/lista-previa`. - `frontend + ruta`
- `Pedido de Unidades / Volver a asignaciones` - `convencional` - `pendiente` - Link hacia `/asignaciones`. - `frontend + ruta`
- `Pedido de Unidades / Ver registros de pedidos` - `convencional` - `pendiente` - Boton superior que cambia a vista de registros. - `frontend + backend`
- `Pedido de Unidades / Cambiar modo Nueva carga` - `convencional` - `pendiente` - Boton para mostrar formulario de nuevo pedido. - `frontend`
- `Pedido de Unidades / Cambiar modo Registros` - `convencional` - `pendiente` - Boton para mostrar historial de pedidos. - `frontend`
- `Pedido de Unidades / Seleccionar fecha del pedido` - `convencional` - `pendiente` - Campo fecha requerido para consolidar el pedido. - `frontend`
- `Pedido de Unidades / Campo Interno` - `convencional` - `pendiente` - Campo numerico para buscar y agregar internos al pedido. - `frontend`
- `Pedido de Unidades / Agregar interno manual` - `convencional` - `pendiente` - Boton que consulta informacion del interno y lo agrega al pedido. Tambien se ejecuta con Enter. - `frontend + backend`
- `Pedido de Unidades / Ver lista previa disponible` - `convencional` - `pendiente` - Muestra unidades cargadas en lista previa para seleccionarlas. - `frontend + backend`
- `Pedido de Unidades / Seleccionar unidad de lista previa` - `convencional` - `pendiente` - Checkbox para marcar unidades de lista previa. - `frontend`
- `Pedido de Unidades / Agregar seleccionadas` - `convencional` - `pendiente` - Agrega al pedido las unidades seleccionadas desde lista previa. - `frontend`
- `Pedido de Unidades / Ver tabla de carga` - `convencional` - `pendiente` - Permite ver internos agregados con version, order, modelo, cliente, vendedor, chasis, prioridad, lista previa y PDI. - `frontend`
- `Pedido de Unidades / Cambiar prioridad` - `convencional` - `pendiente` - Selector para cambiar prioridad de cada interno entre `normal`, `media` y `urgente`. - `frontend + backend al guardar`
- `Pedido de Unidades / Ver prioridad sin editar` - `convencional` - `pendiente` - Muestra prioridad como etiqueta cuando el usuario no puede modificarla. - `frontend`
- `Pedido de Unidades / Marcar PDI` - `convencional` - `pendiente` - Checkbox para indicar si la unidad requiere PDI. - `frontend + backend al guardar`
- `Pedido de Unidades / Quitar interno` - `convencional` - `pendiente` - Quita un interno del pedido antes de guardar. - `frontend`
- `Pedido de Unidades / Consolidar carga` - `convencional` - `pendiente` - Guarda un nuevo pedido consolidado de hasta 8 unidades. - `frontend + backend`
- `Pedido de Unidades / Editar pedido existente` - `convencional` - `pendiente` - Boton en el detalle expandido que carga un pedido existente en modo edicion. - `frontend + backend`
- `Pedido de Unidades / Guardar cambios` - `convencional` - `pendiente` - Guarda modificaciones de un pedido existente. - `frontend + backend`
- `Pedido de Unidades / Cancelar edicion` - `convencional` - `pendiente` - Cancela modo edicion y limpia el formulario. - `frontend`
- `Pedido de Unidades / Ver historial paginado` - `convencional` - `pendiente` - Muestra registros agrupados por fecha con usuario, unidades, PDI y fecha de creacion. - `frontend + backend`
- `Pedido de Unidades / Expandir detalle` - `convencional` - `pendiente` - Muestra u oculta detalle de unidades de un grupo de pedidos. - `frontend`
- `Pedido de Unidades / Paginacion historial` - `convencional` - `pendiente` - Botones `Anterior` y `Siguiente` del listado. - `frontend + backend`
- `Pedido de Unidades / Ver mensaje sin registros` - `convencional` - `pendiente` - Muestra mensaje cuando no hay pedidos registrados. - `frontend`
- `Pedido de Unidades / Ver error de carga` - `convencional` - `pendiente` - Muestra error cuando no se pueden cargar pedidos o lista previa. - `frontend`

### Convencional - Registro de asignaciones {usuarios que contengan alguno de los siguientes roles `stock`, `admin`, `gerente`}
- `Registro asignaciones / Ver pantalla` - `convencional` - `pendiente` - Permite ingresar a `/registro-asignaciones`. - `frontend + ruta + backend`
- `Registro asignaciones / Ver resumen` - `convencional` - `pendiente` - Link hacia `/registro-asignaciones/resumen`. - `frontend + ruta + backend`
- `Registro asignaciones / Fecha` - `convencional` - `pendiente` - Campo fecha del movimiento. - `frontend`
- `Registro asignaciones / Campo Operacion` - `convencional` - `pendiente` - Campo numerico para ingresar la operacion. - `frontend`
- `Registro asignaciones / Buscar operacion` - `convencional` - `pendiente` - Boton que consulta datos de operacion para completar la ficha. Tambien se ejecuta con Enter. - `frontend + backend`
- `Registro asignaciones / Seleccionar tipo` - `convencional` - `pendiente` - Selector `Asignado` o `Desasignado`. - `frontend`
- `Registro asignaciones / Observaciones` - `convencional` - `pendiente` - Campo de texto opcional. - `frontend`
- `Registro asignaciones / Ver ficha de operacion` - `convencional` - `pendiente` - Muestra operacion, interno, cliente, modelo, version, chasis, sucursal y vendedor. - `frontend + backend`
- `Registro asignaciones / Guardar registro` - `convencional` - `pendiente` - Crea un registro de asignacion o desasignacion. - `frontend + backend`
- `Registro asignaciones / Editar registro` - `convencional` - `pendiente` - Carga un registro existente en modo edicion. - `frontend + backend`
- `Registro asignaciones / Guardar cambios` - `convencional` - `pendiente` - Actualiza un registro existente. - `frontend + backend`
- `Registro asignaciones / Cancelar edicion` - `convencional` - `pendiente` - Cancela modo edicion y limpia el formulario. - `frontend`
- `Registro asignaciones / Eliminar registro` - `convencional` - `pendiente` - Elimina un registro del historial previa confirmacion. - `frontend + backend`
- `Registro asignaciones / Ver historial paginado` - `convencional` - `pendiente` - Permite ver fecha, tipo, operacion, interno, cliente, modelo, version, chasis, sucursal, vendedor y observaciones. - `frontend + backend`
- `Registro asignaciones / Paginacion historial` - `convencional` - `pendiente` - Botones `Anterior` y `Siguiente` del listado. - `frontend + backend`
- `Registro asignaciones / Ver mensaje sin registros` - `convencional` - `pendiente` - Muestra mensaje cuando no hay registros cargados. - `frontend`
- `Registro asignaciones / Ver error de carga` - `convencional` - `pendiente` - Muestra error cuando no se puede cargar el modulo. - `frontend`

### Convencional - Resumen de registro de asignaciones {usuarios que contengan alguno de los siguientes roles `stock`, `admin`, `gerente`}
- `Resumen registro asignaciones / Ver pantalla` - `convencional` - `pendiente` - Permite ingresar a `/registro-asignaciones/resumen`. - `frontend + ruta + backend`
- `Resumen registro asignaciones / Volver a registros` - `convencional` - `pendiente` - Link hacia `/registro-asignaciones`. - `frontend + ruta`
- `Resumen registro asignaciones / Seleccionar mes` - `convencional` - `pendiente` - Selector de mes del resumen. - `frontend`
- `Resumen registro asignaciones / Seleccionar anio` - `convencional` - `pendiente` - Selector de anio del resumen. - `frontend`
- `Resumen registro asignaciones / Ver metricas mensuales` - `convencional` - `pendiente` - Muestra asignadas, desasignadas y neto del mes. - `frontend`
- `Resumen registro asignaciones / Ver resumen mensual por modelo` - `convencional` - `pendiente` - Tabla con asignadas, desasignadas y neto por modelo. - `frontend + backend`
- `Resumen registro asignaciones / Ver movimiento por sucursal y modelo` - `convencional` - `pendiente` - Matriz mensual con total neto y detalle por sucursal. - `frontend + backend`
- `Resumen registro asignaciones / Ver totales por sucursal` - `convencional` - `pendiente` - Tabla de asignadas, desasignadas y neto por sucursal. - `frontend + backend`
- `Resumen registro asignaciones / Ver graficos` - `convencional` - `pendiente` - Graficos diarios y mensuales de asignadas vs desasignadas. - `frontend + backend`
- `Resumen registro asignaciones / Ver mensajes sin datos` - `convencional` - `pendiente` - Muestra mensajes cuando no hay informacion para el periodo. - `frontend`
- `Resumen registro asignaciones / Ver error de carga` - `convencional` - `pendiente` - Muestra error cuando no se puede cargar el resumen. - `frontend`

### Convencional - Pedido mensual
- `Pedido mensual / Ver pantalla` - `convencional` - `pendiente` - Permite ingresar a `/preventas/pedido-mensual`. - `frontend + ruta + backend`
- `Pedido mensual / Ver listado` - `convencional` - `pendiente` - Muestra versiones cargadas y cantidad de pedido mensual. - `frontend + backend`
- `Pedido mensual / Seleccionar version` - `convencional` - `pendiente` - Selector de versiones activas disponibles. - `frontend + backend`
- `Pedido mensual / Campo cantidad` - `convencional` - `pendiente` - Campo numerico de cantidad por version. - `frontend`
- `Pedido mensual / Guardar` - `convencional` - `pendiente` - Crea un registro de pedido mensual para una version. - `frontend + backend`
- `Pedido mensual / Editar` - `convencional` - `pendiente` - Carga una version existente para modificar cantidad. - `frontend + backend`
- `Pedido mensual / Guardar cambios` - `convencional` - `pendiente` - Actualiza la cantidad de una version existente. - `frontend + backend`
- `Pedido mensual / Eliminar` - `convencional` - `pendiente` - Elimina una version del pedido mensual. - `frontend + backend`
- `Pedido mensual / Ver mensaje sin registros` - `convencional` - `pendiente` - Muestra mensaje cuando no hay versiones cargadas. - `frontend`
- `Pedido mensual / Ver error de carga` - `convencional` - `pendiente` - Muestra error cuando no se puede cargar pedido mensual o versiones. - `frontend`

### Convencional - Ranking {usuarios que contengan alguno de los siguientes roles `stock`, `admin`, `gerente`, `vendedor`}
- `Ranking convencional / Ver pantalla` - `convencional` - `pendiente` - Permite ingresar a `/ranking-convencional`. - `frontend + ruta + backend`
- `Ranking convencional / Seleccionar anio` - `convencional` - `pendiente` - Selector de anio del ranking. - `frontend`
- `Ranking convencional / Ver metricas generales` - `convencional` - `pendiente` - Muestra operaciones, vendedores, modelos, sucursales y total Hilux. - `frontend + backend`
- `Ranking convencional / Ver destacados` - `convencional` - `pendiente` - Muestra top vendedor, top modelo, top sucursal, top Hilux y mejor promedio. - `frontend + backend`
- `Ranking convencional / Ver ventas por mes` - `convencional` - `pendiente` - Muestra distribucion anual de operaciones por mes. - `frontend + backend`
- `Ranking convencional / Ver rankings` - `convencional` - `pendiente` - Muestra rankings por vendedor, modelo, sucursal e Hilux. - `frontend + backend`
- `Ranking convencional / Ver acumuladas por vendedor` - `convencional` - `pendiente` - Tabla completa anual con vendedor, sucursal, ventas, promedio mensual e Hilux. - `frontend + backend`
- `Ranking convencional / Ver mensaje sin datos` - `convencional` - `pendiente` - Muestra mensaje cuando no hay datos para el anio seleccionado. - `frontend`
- `Ranking convencional / Ver error de carga` - `convencional` - `pendiente` - Muestra error cuando no se puede cargar el ranking. - `frontend`

### Convencional - Promedio de ventas {usuarios que contengan alguno de los siguientes roles `stock`, `admin`, `gerente`, `vendedor`}
- `Promedio convencional / Ver pantalla` - `convencional` - `pendiente` - Permite ingresar a `/promedio-convencional`. - `frontend + ruta + backend`
- `Promedio convencional / Seleccionar mes` - `convencional` - `pendiente` - Selector de mes de cierre. - `frontend`
- `Promedio convencional / Seleccionar anio` - `convencional` - `pendiente` - Selector de anio de cierre. - `frontend`
- `Promedio convencional / Ver metricas` - `convencional` - `pendiente` - Muestra vendedores, mes actual, promedio general, mejor promedio y mejor sucursal. - `frontend + backend`
- `Promedio convencional / Ver tabla de promedios` - `convencional` - `pendiente` - Muestra sucursal, vendedor, ultimos 6 meses, ventas del mes y promedio. - `frontend + backend`
- `Promedio convencional / Ver referencias de nivel` - `convencional` - `pendiente` - Muestra etiquetas Bajo, Medio y Alto. - `frontend`
- `Promedio convencional / Ver mensaje sin datos` - `convencional` - `pendiente` - Muestra mensaje cuando no hay datos para el periodo seleccionado. - `frontend`
- `Promedio convencional / Ver error de carga` - `convencional` - `pendiente` - Muestra error cuando no se puede cargar el promedio. - `frontend`

### Convencional - Mi perfil {todos los roles}
- `Mi perfil convencional / Ver pantalla` - `usuario autenticado` - `pendiente` - Permite ingresar a `/mi-perfil/convencional`. - `frontend + ruta + backend`
- `Mi perfil convencional / Ver informacion del usuario` - `usuario autenticado` - `pendiente` - Muestra nombre, companias, email, numeros de vendedor NIC y Liess. - `frontend + backend`
- `Mi perfil convencional / Ver companias asignadas` - `usuario autenticado` - `pendiente` - Muestra etiquetas de companias del usuario. - `frontend`
- `Mi perfil convencional / Cambiar contrasena` - `usuario autenticado` - `pendiente` - Formulario para actualizar contrasena y cerrar sesion al finalizar. - `frontend + backend`
- `Mi perfil convencional / Ver error de carga` - `usuario autenticado` - `pendiente` - Muestra error cuando no se puede cargar el perfil. - `frontend`

### Convencional - Mis reservas {todos los roles}
- `Mis reservas convencional / Ver pantalla` - `convencional` - `pendiente` - Permite ingresar a `/mis-reservas/convencional`. - `frontend + ruta + backend`
- `Mis reservas convencional / Ver resumen` - `convencional` - `pendiente` - Muestra total de reservas activas y distribucion por modelo del usuario. - `frontend + backend`
- `Mis reservas convencional / Ver tabla` - `convencional` - `pendiente` - Permite ver interno, modelo, version, color, ubicacion, chasis, cliente y dias. - `frontend + backend`
- `Mis reservas convencional / Ver cliente` - `convencional` - `pendiente` - Boton que abre modal con el cliente de la reserva. - `frontend`
- `Mis reservas convencional / Cerrar modal cliente` - `convencional` - `pendiente` - Cierra el modal de cliente. - `frontend`
- `Mis reservas convencional / Ver mensaje sin registros` - `convencional` - `pendiente` - Muestra mensaje cuando el usuario no tiene reservas. - `frontend`
- `Mis reservas convencional / Ver error de carga` - `convencional` - `pendiente` - Muestra error cuando no se pueden cargar reservas. - `frontend`

### Convencional - Mi lista de espera {todos los roles}
- `Mi lista de espera convencional / Ver pantalla` - `convencional` - `pendiente` - Permite ingresar a `/mi-lista-espera/convencional`. - `frontend + ruta + backend`
- `Mi lista de espera convencional / Ver resumen` - `convencional` - `pendiente` - Muestra total y distribucion por modelo del usuario. - `frontend + backend`
- `Mi lista de espera convencional / Ver tabla` - `convencional` - `pendiente` - Permite ver operacion, fecha, modelo, version, cliente, color 1 y color 2. - `frontend + backend`
- `Mi lista de espera convencional / Ver mensaje sin registros` - `convencional` - `pendiente` - Muestra mensaje cuando el usuario no tiene operaciones en lista de espera. - `frontend`
- `Mi lista de espera convencional / Ver error de carga` - `convencional` - `pendiente` - Muestra error cuando no se puede cargar la lista de espera. - `frontend`

### Convencional - Mis operaciones {todos los roles}
- `Mis operaciones convencional / Ver pantalla` - `convencional` - `pendiente` - Permite ingresar a `/mis-operaciones/convencional`. - `frontend + ruta + backend`
- `Mis operaciones convencional / Seleccionar anio` - `convencional` - `pendiente` - Selector de anio. - `frontend`
- `Mis operaciones convencional / Seleccionar mes` - `convencional` - `pendiente` - Botones mensuales para cambiar el periodo. - `frontend`
- `Mis operaciones convencional / Ver grafico ventas por dia` - `convencional` - `pendiente` - Muestra ventas del usuario por dia. - `frontend + backend`
- `Mis operaciones convencional / Ver grafico distribucion por modelo` - `convencional` - `pendiente` - Muestra distribucion de ventas por modelo. - `frontend + backend`
- `Mis operaciones convencional / Ver tabla de operaciones` - `convencional` - `pendiente` - Permite ver operacion, cliente, interno, modelo, version, color, facturacion y entrega. - `frontend + backend`
- `Mis operaciones convencional / Ver mensaje sin registros` - `convencional` - `pendiente` - Muestra tabla vacia cuando no hay operaciones en el periodo. - `frontend`
- `Mis operaciones convencional / Ver error de carga` - `convencional` - `pendiente` - Muestra error cuando no se pueden cargar operaciones. - `frontend`

### Backend asociado aplicado - Modulo Convencional
- `GET /dms/convencional/stock-disponible` - `convencional` - `stock`, `admin`, `gerente`, `supervisor`, `vendedor` - Lista stock disponible. - `backend`
- `GET /dms/convencional/stock-reservado` - `convencional` - `stock`, `admin`, `gerente`, `supervisor` - Lista stock reservado. - `backend`
- `GET /dms/convencional/stock-guardado` - `convencional` - `stock`, `admin`, `gerente` - Lista stock guardado. - `backend`
- `GET /dms/convencional/mis-reservas` - `convencional` - `todos los roles` - Lista reservas del usuario autenticado. - `backend`
- `GET /dms/convencional/mi-lista-de-espera` - `convencional` - `todos los roles` - Lista operaciones en espera del usuario autenticado. - `backend`
- `GET /dms/convencional/mis-operaciones/:mes/:ano` - `convencional` - `todos los roles` - Lista operaciones del usuario autenticado por periodo. - `backend`
- `GET /dms/convencional/promedio-operaciones/:mes/:ano` - `convencional` - `stock`, `admin`, `gerente`, `vendedor` - Consulta promedio de operaciones por vendedor. - `backend`
- `GET /dms/convencional/ranking-operaciones/:ano` - `convencional` - `stock`, `admin`, `gerente`, `vendedor` - Consulta ranking anual de operaciones. - `backend`
- `GET /dms/asignaciones/:mes/:anio` - `convencional` - `stock`, `admin`, `gerente` - Consulta asignaciones y recepciones por periodo. - `backend`
- `GET /dms/registro-asignaciones/operacion/:operacion` - `convencional` - `stock`, `admin`, `gerente` - Consulta datos de una operacion para registrar asignacion/desasignacion. - `backend`
- `GET /dms/registro-asignaciones` - `convencional` - `stock`, `admin`, `gerente` - Lista historial de registros de asignaciones. - `backend`
- `POST /dms/registro-asignaciones` - `convencional` - `stock`, `admin`, `gerente` - Crea registro de asignacion/desasignacion. - `backend`
- `PUT /dms/registro-asignaciones/:id` - `convencional` - `stock`, `admin`, `gerente` - Actualiza registro de asignacion/desasignacion. - `backend`
- `DELETE /dms/registro-asignaciones/:id` - `convencional` - `stock`, `admin`, `gerente` - Elimina registro de asignacion/desasignacion. - `backend`
- `GET /dms/registro-asignaciones/resumen` - `convencional` - `stock`, `admin`, `gerente` - Consulta resumen de asignaciones por periodo. - `backend`
- `GET /dms/pedido-mensual` - `convencional` - `stock`, `admin`, `gerente` - Lista pedido mensual. - `backend`
- `POST /dms/pedido-mensual` - `convencional` - `stock`, `admin`, `gerente` - Crea pedido mensual por version. - `backend`
- `PUT /dms/pedido-mensual/:id` - `convencional` - `stock`, `admin`, `gerente` - Actualiza pedido mensual por version. - `backend`
- `DELETE /dms/pedido-mensual/:id` - `convencional` - `stock`, `admin`, `gerente` - Elimina pedido mensual por version. - `backend`

## Instrucciones para documentar reglas futuras
Cada regla de permiso que se agregue debe indicar, como minimo:
- Recurso o accion protegida.
- Compania a la que aplica.
- Roles permitidos.
- Descripcion clara del permiso.
- Si corresponde validar en frontend, backend o ambos.

Formato sugerido para rutas, links, cards, menus y endpoints:
- `{recurso}` - `{compania}` - `{roles permitidos}` - `{descripcion}` - `{validacion}`

Formato sugerido para botones, controles y acciones de interfaz:
- `{vista} / {accion}` - `{compania}` - `{roles permitidos}` - `{descripcion}` - `{validacion}`

Notas importantes:
- No usar tablas.
- No duplicar una misma ruta por aparecer en mas de un lugar.
- Si una accion modifica datos o permisos, debe validarse tambien en backend.
- Toda regla definida desde el frontend debe tener su equivalente en backend cuando exista una API, consulta o accion relacionada.
- Si un acceso depende de compania y rol, ambos deben quedar explicitados.
- Si un rol ve un control deshabilitado o no lo ve, debe quedar aclarado en la descripcion.
