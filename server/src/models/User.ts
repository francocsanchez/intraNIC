import mongoose, { Schema, Document } from "mongoose";
import { moduleKeys, type UserModules } from "../constants/modules";

export const userRole = {
  GERENTE: "gerente",
  SUPERVISOR: "supervisor",
  VENDEDOR: "vendedor",
  SUPER_ADMIN: "superAdmin",
  STOCK: "stock",
  ADMINISTRACION: "administracion",
} as const;

export type userRole = (typeof userRole)[keyof typeof userRole];

export const userCompany = {
  DEFAULT: "default",
  CONVENCIONAL: "convencional",
  LIESS: "liess",
  USADOS: "usados",
  TPA: "planAhorro",
  REVENTA: "reventa",
} as const;

export type userCompany = (typeof userCompany)[keyof typeof userCompany];

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  lastName: string;
  celular?: string;
  enable: boolean;
  role: userRole[];
  company: userCompany[];
  numberSaleNic: number;
  numberSaleLiess: number;
  modules?: UserModules;
}

const modulesSchemaDefinition = Object.fromEntries(
  moduleKeys.map((moduleKey) => [
    moduleKey,
    {
      type: Number,
      default: undefined,
    },
  ]),
);

const userSchema: Schema = new Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    celular: {
      type: String,
      default: "",
      trim: true,
    },
    enable: {
      type: Boolean,
      default: true,
    },
    numberSaleNic: {
      type: Number,
      default: 0,
    },
    numberSaleLiess: {
      type: Number,
      default: 0,
    },
    role: {
      type: [String],
      default: ["vendedor"],
    },
    company: {
      type: [String],
      default: ["default"],
    },
    modules: {
      type: new Schema(modulesSchemaDefinition, { _id: false }),
      default: undefined,
    },
  },
  { timestamps: true },
);

const User = mongoose.model<IUser>("users", userSchema);
export default User;
