process.removeAllListeners("warning");

import express from "express";
import { connectDatabases } from "./config/database";
import cors from "cors";

// Rutas de proyectos
import configRoutes from "./routes/configRoutes";
import convencionalRoutes from "./routes/convencionalRoutes";
import dmsRoutes from "./routes/dmsRoutes";
import usuarioRoutes from "./routes/usuarioRoutes";
import liessRoutes from "./routes/liessRoutes";

import { corsOptions } from "./config/cors";

connectDatabases();
const app = express();

app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/config", configRoutes);
app.use("/api/usuarios", usuarioRoutes);
app.use("/api/dms/convencional", convencionalRoutes);
app.use("/api/dms/liess", liessRoutes);
app.use("/api/dms", dmsRoutes);

export default app;
