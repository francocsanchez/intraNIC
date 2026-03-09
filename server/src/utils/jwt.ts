import jwt from "jsonwebtoken";

type UserPayload = {
  sub: string;
};

export const generateJWT = (payload: UserPayload): string => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET no definida en las variables de entorno");
  }

  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "180d",
  });

  return token;
};