import { CorsOptions } from "cors";

const allowedOrigins = [
  process.env.FRONTEND_URL_NIC,
].filter(Boolean);

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // Postman / server-to-server

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(null, false); // importante: NO tirar error
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};