process.removeAllListeners("warning");

import express from "express";
import { connectDatabases } from "./config/database";
import cors from "cors";

import configRoutes from "./routes/configRoutes";
import convencionalRoutes from "./routes/convencionalRoutes";
import dmsRoutes from "./routes/dmsRoutes";
import usuarioRoutes from "./routes/usuarioRoutes";
import liessRoutes from "./routes/liessRoutes";
import usadosRoutes from "./routes/usadosRoutes";
import healthRoutes from "./routes/healthRoutes";
import pedidoUnidadRoutes from "./routes/pedidoUnidadRoutes";
import registroAsignacionRoutes from "./routes/registroAsignacionRoutes";
import colorRoutes from "./routes/colorRoutes";
import versionRoutes from "./routes/versionRoutes";
import preventaRoutes from "./routes/preventaRoutes";
import pedidoMensualRoutes from "./routes/pedidoMensualRoutes";

import { corsOptions } from "./config/cors";

connectDatabases();
const app = express();

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/health", healthRoutes);
app.use("/api/config", configRoutes);
app.use("/api/usuarios", usuarioRoutes);
app.use("/api/dms/convencional", convencionalRoutes);
app.use("/api/dms/usados", usadosRoutes);
app.use("/api/dms/liess", liessRoutes);
app.use("/api/dms", dmsRoutes);
app.use("/api/dms/pedido-unidades", pedidoUnidadRoutes);
app.use("/api/dms/registro-asignaciones", registroAsignacionRoutes);
app.use("/api/dms/colores", colorRoutes);
app.use("/api/dms/versiones", versionRoutes);
app.use("/api/dms/preventas", preventaRoutes);
app.use("/api/dms/pedido-mensual", pedidoMensualRoutes);

export default app;
