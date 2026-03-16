import { CorsOptions } from "cors";
import colors from "colors";
import { logError } from "../utils/logError";

const allowedOrigins = [
  process.env.FRONTEND_URL_NIC
].filter(Boolean) as string[];

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    logError("CORS.origin");

    console.log(
      colors.bgYellow.black.bold(" CORS BLOCKED ") +
        colors.yellow(` Origin: ${origin}`)
    );

    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
};