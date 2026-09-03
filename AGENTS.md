# AGENTS.md
Siempre actualizar este archivo y el CHANGELOG.md cada vez que se realice una implementacion.

# Instrucciones del proyecto

## Descripcion

`intraNIC` es una aplicacion interna de Nippon Car / LIESS para la gestion operativa de stock, preventas, pedidos, asignaciones, proformas, entregas, patentamientos, transferencias y reportes.

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
- Los layouts migrados deben usar el mismo fondo global `bg-muted`; no mezclar fondos heredados como `bg-gray-50` entre modulos del preset. Las superficies y controles se diferencian con `bg-card` y `bg-background`, respectivamente.
- Toda vista migrada que no herede un layout con el preset debe declarar `bg-muted` en su contenedor raiz para conservar el mismo fondo global.
- Mantener el espaciado compacto y unificar titulo, resumen e indicadores en una sola superficie cuando correspondan a la misma vista.
- Las vistas con el mismo patron funcional deben reutilizar exactamente las mismas decisiones visuales del preset. En particular, los filtros de resumen usan `grid grid-cols-2 gap-1 md:grid-cols-4 xl:grid-cols-8`, botones `h-9 rounded-md border text-xs`, estado activo `border-primary bg-primary text-primary-foreground` e inactivo `border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground`.
- En tablas de alta densidad, priorizar filas compactas: encabezados con `py-2`, celdas con `py-1.5` y badges con `py-0.5`, sin afectar columnas sticky ni datos legibles.
- Los catalogos accesibles desde `/admin/configuracion` deben conservar su URL funcional, pero renderizar bajo `AdminLayout` para compartir navbar, fondo y footer del preset.
- Al migrar una vista al preset, no inventar colores, gradientes, sombras, radios ni variantes visuales. Usar exclusivamente los tokens semanticos y componentes del preset; solo conservar un color adicional cuando el usuario lo solicite expresamente. Eliminar las clases y valores del diseño anterior de la vista migrada, incluidos hexadecimales y utilidades `gray` heredadas.
- Los dialogos de vistas migradas deben usar directamente tokens del preset en panel, campos, acciones y pie; no depender de adaptadores de compatibilidad ni conservar colores heredados dentro del modal.
- Los graficos de vistas migradas deben usar ECharts y una paleta resuelta desde los tokens semanticos del preset; no incorporar paletas hardcodeadas ni colores heredados.
- Las vistas de Stock Usados deben compartir el mismo hero integrado, grilla de filtros, tabla compacta y badges de color mediante `StockUsadosView` cuando la fuente de datos lo permita.
- Las pantallas publicas migradas, incluido `/login`, deben usar `font-preset`, `bg-muted` y una unica superficie `bg-card`; no usan navbar y conservan el footer institucional indicado arriba.
- La portada autenticada (`/`) se considera una vista migrada: sus accesos se agrupan en superficies compactas del preset y no puede conservar CSS inline, colores hexadecimales ni tipografias heredadas.
