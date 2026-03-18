import { CorsOptions } from "cors";

const allowedOrigins = [
  process.env.FRONTEND_URL_NIC,
  process.env.FRONTEND_URL_PUBLIC,
  process.env.FRONTEND_URL_SERVER,
  "http://192.168.100.31:8080",
  "http://nipponcarsrl.ddns.net:3000",
];

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 204,
};
