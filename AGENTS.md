# AGENTS.md

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
