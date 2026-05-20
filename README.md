# intraNIC

Aplicación interna para la gestión operativa de stock, preventas, pedidos, asignaciones, proformas y reportes de Nippon Car / LIESS.

El proyecto está dividido en dos aplicaciones principales:

- `front`: interfaz web construida con React, TypeScript, Vite y Tailwind CSS.
- `server`: API REST construida con Express y TypeScript.

Además, la solución integra:

- MongoDB para usuarios, configuraciones y entidades propias de la app.
- SQL Server para consultas operativas de NIC y LIESS.
- correo SMTP para notificaciones.
- despliegue por contenedores con imágenes publicadas en GHCR.

## Qué cubre el sistema

Según las rutas, vistas y reglas documentadas, `intraNIC` centraliza flujos para:

- autenticación y autorización por roles.
- acceso segmentado por compañía: `convencional`, `usados`, `liess` y algunos flujos de `reventa`.
- stock disponible, reservado, guardado e ingresos.
- preventas, resumen de preventas y pedido mensual.
- pedido de unidades y lista previa.
- asignaciones y registro de asignaciones.
- proformas y detalle de proformas.
- facturas de anticipo.
- configuración de vendedores y estados de módulos.
- reportes personales y operativos.

La definición funcional y de permisos vive en [REGLAS_ACCESO.md](/C:/apps/intraNIC/REGLAS_ACCESO.md).

## Estructura del repositorio

```text
intraNIC/
├─ front/                  # SPA en React + Vite
├─ server/                 # API REST en Express + TypeScript
├─ docker-compose.yml      # Orquestación de frontend + backend publicados
└─ REGLAS_ACCESO.md        # Fuente de verdad de roles y permisos
```

## Stack técnico

### Frontend

- React 19
- TypeScript
- Vite
- Tailwind CSS
- React Router
- TanStack Query
- Axios
- React Hook Form
- Zod
- Recharts

### Backend

- Node.js
- Express 5
- TypeScript
- Mongoose
- Sequelize
- Tedious
- JWT
- Nodemailer

## Arquitectura general

- El frontend consume la API usando `VITE_API_URL`.
- El backend expone endpoints bajo `/api`.
- El backend abre conexión a dos bases SQL Server:
  - `NIPPON CAR`
  - `LIESS`
- El backend también conecta a MongoDB.
- Existe un job de facturas de anticipo que se inicia junto con el servidor.

Rutas principales del backend:

- `/api/health`
- `/api/config`
- `/api/usuarios`
- `/api/dms`
- `/api/dms/convencional`
- `/api/dms/usados`
- `/api/dms/liess`
- `/api/dms/pedido-unidades`
- `/api/dms/registro-asignaciones`
- `/api/dms/colores`
- `/api/dms/versiones`
- `/api/dms/preventas`
- `/api/dms/pedido-mensual`
- `/api/dms/proformas`
- `/api/facturas-anticipo`

## Requisitos

- Node.js 20 o superior recomendado
- npm
- acceso a MongoDB
- acceso a las bases SQL Server necesarias

## Variables de entorno

### Frontend

Crear `front/.env` con al menos:

```env
VITE_API_URL=http://localhost:4002/api
```

### Backend

Crear `server/.env` con las variables esperadas por la aplicación:

```env
PORT=4002
NODE_ENV=development
DATABASE_MONGO=

DBHOST_NIC=
DBUSER_NIC=
DBPASS_NIC=
DATABASE_NIC=

DBHOST_LIESS=
DBUSER_LIESS=
DBPASS_LIESS=
DATABASE_LIESS=

FRONTEND_URL_NIC=
JWT_SECRET=

MAIL_APP_NAME=
SMTP_HOST=
SMTP_PORT=
SMTP_SECURE=
SMTP_USER=
SMTP_PASS=
SMTP_FROM_NAME=
SMTP_FROM_EMAIL=
```

Nota: `docker-compose.yml` también referencia `PORT_NIC`, `DBPORT_NIC`, `PORT_LIESS` y `DBPORT_LIESS` para despliegue por contenedores.

## Desarrollo local

### 1. Instalar dependencias

```bash
cd server
npm install

cd ../front
npm install
```

### 2. Levantar backend

```bash
cd server
npm run dev
```

El backend levanta por defecto en `http://localhost:4002`.

### 3. Levantar frontend

```bash
cd front
npm run dev
```

Vite mostrará la URL local disponible para abrir la aplicación.

## Scripts disponibles

### Frontend

```bash
npm run dev
npm run build
npm run lint
npm run preview
```

### Backend

```bash
npm run dev
npm run build
npm start
```

## Despliegue con contenedores

El archivo `docker-compose.yml` levanta dos servicios:

- `intranic-backend` en el puerto `4003`, apuntando internamente al `4002`.
- `intranic-frontend` en el puerto `8080`.

Las imágenes configuradas son:

- `ghcr.io/francocsanchez/intranic-backend:latest`
- `ghcr.io/francocsanchez/intranic-frontend:latest`

Antes de iniciar, hay que definir las variables de entorno requeridas por el compose.

## Documentación funcional

- [REGLAS_ACCESO.md](/C:/apps/intraNIC/REGLAS_ACCESO.md): reglas de acceso, roles, compañías y permisos aplicados.

## Estado de la documentación

Este `README` fue generado a partir de la estructura actual del código, scripts, rutas y configuración presentes en el repositorio. Si se agregan nuevos módulos o cambian variables de entorno, conviene actualizarlo junto con el cambio.
