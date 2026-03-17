import { CorsOptions } from "cors";

const normalizeOrigin = (value?: string | null) =>
  (value || "").trim().replace(/\/$/, "");

const allowedOrigins = [normalizeOrigin(process.env.FRONTEND_URL_NIC)].filter(Boolean);

console.log("CORS allowedOrigins =>", JSON.stringify(allowedOrigins));

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    const normalizedOrigin = normalizeOrigin(origin);

    console.log("CORS origin recibido =>", JSON.stringify(origin));
    console.log("CORS origin normalizado =>", JSON.stringify(normalizedOrigin));

    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(normalizedOrigin)) {
      return callback(null, true);
    }

    console.log("CORS bloqueado =>", JSON.stringify(normalizedOrigin));
    return callback(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 204,
};