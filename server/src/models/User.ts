import mongoose, { Schema, Document } from "mongoose";

export const userRole = {
  ADMIN: "admin",
  GERENTE: "gerente",
  SUPERVISOR: "supervisor",
  VENDEDOR: "vendedor",
  STOCK: "stock",
  REVENTA: "reventa",
  ADMINISTRACION: "administracion",
} as const;

export type userRole = (typeof userRole)[keyof typeof userRole];

export const userCompany = {
  DEFAULT: "default",
  CONVENCIONAL: "convencional",
  LIESS: "liess",
  USADOS: "usados",
  TPA: "planAhorro",
} as const;

export type userCompany = (typeof userCompany)[keyof typeof userCompany];

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  lastName: string;
  enable: boolean;
  role: userRole[];
  company: userCompany[];
  numberSaleNic: number;
  numberSaleLiess: number;
}

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
  },
  { timestamps: true },
);

const User = mongoose.model<IUser>("users", userSchema);
export default User;
