import { CorsOptions } from "cors";
import colors from "colors";
import { logError } from "../utils/logError";

const allowedOrigins = [process.env.FRONTEND_URL_NIC].filter(Boolean) as string[];

console.log(
  colors.bgBlue.white.bold(" CORS CONFIG ") +
    colors.white(` allowedOrigins: ${JSON.stringify(allowedOrigins)}`)
);

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    console.log(
      colors.bgCyan.black.bold(" CORS CHECK ") +
        colors.white(` origin recibido: ${origin ?? "sin origin"}`)
    );

    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      console.log(
        colors.bgGreen.white.bold(" CORS OK ") +
          colors.white(` origin permitido: ${origin}`)
      );
      return callback(null, true);
    }

    logError("CORS.origin");

    console.log(
      colors.bgYellow.black.bold(" CORS BLOCKED ") +
        colors.yellow(` origin bloqueado: ${origin}`)
    );

    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
};