import type { UserModules } from "@/constants/modules";

export type UsuarioFormData = {
  name: string;
  lastName: string;
  email: string;
  password?: string;
  celular: string;
  sucursalEntrega: string;
  numberSaleNic: number;
  numberSaleLiess: number;
  role: string[];
  modules: UserModules;
};
