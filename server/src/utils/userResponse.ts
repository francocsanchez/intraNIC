import { sanitizeUserModules } from "../constants/modules";

const normalizeStringArray = (values: unknown): string[] => {
  const normalizeEntry = (value: unknown) =>
    String(value)
      .normalize("NFKC")
      .replace(/[\u200B-\u200D\uFEFF]/g, "")
      .replace(/\s+/g, "")
      .trim()
      .toLowerCase();

  if (Array.isArray(values)) {
    return values
      .map((value) => normalizeEntry(value))
      .filter(Boolean);
  }

  if (typeof values === "string") {
    return values
      .split(",")
      .map((value) => normalizeEntry(value))
      .filter(Boolean);
  }

  return [];
};

const buildSucursalPredeterminada = (value: unknown) => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const sucursal = value as {
    _id?: unknown;
    nombre?: string;
    activa?: boolean;
    direccion?: string;
  };

  if (!sucursal._id) {
    return null;
  }

  return {
    _id: String(sucursal._id),
    nombre: sucursal.nombre ?? "",
    activa: Boolean(sucursal.activa),
    direccion: sucursal.direccion ?? "",
  };
};

const buildUnidadNegocio = (value: unknown) => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const unidad = value as {
    _id?: unknown;
    nombre?: string;
    activo?: boolean;
    orden?: number;
  };

  if (!unidad._id) {
    return null;
  }

  return {
    _id: String(unidad._id),
    nombre: unidad.nombre ?? "",
    activo: Boolean(unidad.activo),
    orden: Number(unidad.orden ?? 0),
  };
};

export const serializeUserResponse = (user: any) => {
  const sucursalPredeterminada = buildSucursalPredeterminada(user?.sucursalEntrega);
  const unidadNegocio = buildUnidadNegocio(user?.unidadNegocio);

  return {
    _id: String(user?._id ?? ""),
    name: user?.name ?? "",
    lastName: user?.lastName ?? "",
    email: user?.email ?? "",
    celular: user?.celular ?? "",
    enable: Boolean(user?.enable),
    role: normalizeStringArray(user?.role),
    company: normalizeStringArray(user?.company),
    numberSaleNic: Number(user?.numberSaleNic ?? 0),
    numberSaleLiess: Number(user?.numberSaleLiess ?? 0),
    modules: sanitizeUserModules(user?.modules),
    unidadNegocio,
    sucursalPredeterminada,
    // Alias temporal para compatibilidad interna mientras se completa la migracion.
    sucursalEntrega: sucursalPredeterminada,
    createdAt: user?.createdAt,
    updatedAt: user?.updatedAt,
  };
};
