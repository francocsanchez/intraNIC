# Reglas de Acceso

## Objetivo

Este documento funciona como guia operativa de permisos y como referencia de comportamiento esperado del sistema.

## Etapa actual

En esta primera etapa se definio que algunas pantallas dependen solo de los modulos habilitados en el usuario, sin bloquearse por rol.

Aplica a estas areas:

- `Call Center`
- `Plan de ahorro`
- `Gestion de stock usados`
- `Analisis`

## Reglas por modulo

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
- Si el modulo correspondiente esta habilitado, el rol no debe bloquear el acceso a la pantalla.

## Alcance y limites

- Esta etapa solo cambia acceso a pantallas y navegacion para las areas listadas arriba.
- El resto de permisos por rol del sistema se mantiene sin cambios.
- No se modifica la estructura de `User.modules`.
- No se agregan modulos nuevos.

## Carga de permisos en usuarios

- La habilitacion se administra desde el formulario de alta y edicion de usuario.
- Los checks siguen siendo por modulo individual.
- Una seccion se muestra cuando el usuario tiene al menos uno de sus modulos hijos habilitado.

## Nota sobre acciones finas

- Esta etapa no redefine todos los permisos funcionales internos del sistema.
- Cualquier ajuste adicional sobre acciones por rol se trabajara en iteraciones posteriores.
