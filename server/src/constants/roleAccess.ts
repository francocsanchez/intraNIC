export type RoleAccessKey =
  | "convencional.stockDisponible"
  | "convencional.stockGuardado"
  | "convencional.stockReservado"
  | "convencional.misReservas"
  | "convencional.misOperaciones"
  | "convencional.miListaEspera"
  | "convencional.listaEsperaGeneral"
  | "convencional.ranking"
  | "convencional.promedio"
  | "convencional.asignaciones"
  | "convencional.registroAsignaciones"
  | "convencional.pedidoMensual"
  | "convencional.pedidoUnidades"
  | "preventas.read"
  | "preventas.resumen"
  | "preventas.create"
  | "preventas.update"
  | "preventas.delete"
  | "preventas.assign"
  | "proformas"
  | "usados.stockDisponible"
  | "usados.stockGuardado"
  | "usados.stockReservado"
  | "usados.misReservas"
  | "usados.noReparado"
  | "usados.pendienteDocumentacion"
  | "usados.ingresos"
  | "liess.stockDisponible"
  | "analisis.operaciones"
  | "analisis.patentamientos"
  | "administracion.reventaPendientes"
  | "administracion.listaPrevia"
  | "administracion.facturasAnticipo"
  | "sistema.usuarios"
  | "sistema.configuracion";

const normalizeRole = (role: unknown) =>
  String(role)
    .normalize("NFKC")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\s+/g, "")
    .trim()
    .toLowerCase();

export const normalizeRoles = (roles: unknown): string[] => {
  if (Array.isArray(roles)) {
    return roles.map(normalizeRole).filter(Boolean);
  }

  if (typeof roles === "string") {
    return roles.split(",").map(normalizeRole).filter(Boolean);
  }

  return [];
};

export const hasSuperAdminRole = (roles: unknown) =>
  normalizeRoles(roles).includes("superadmin");

export const hasOnlyVendedorRole = (roles: unknown) => {
  const normalizedRoles = normalizeRoles(roles);
  return normalizedRoles.length > 0 && normalizedRoles.every((role) => role === "vendedor");
};

export const hasOnlySupervisorRole = (roles: unknown) => {
  const normalizedRoles = normalizeRoles(roles);
  return normalizedRoles.length > 0 && normalizedRoles.every((role) => role === "supervisor");
};

export const hasOnlyAdministracionRole = (roles: unknown) => {
  const normalizedRoles = normalizeRoles(roles);
  return normalizedRoles.length > 0 && normalizedRoles.every((role) => role === "administracion");
};

const vendedorAllowedAccess = new Set<RoleAccessKey>([
  "convencional.stockDisponible",
  "convencional.misReservas",
  "convencional.misOperaciones",
  "convencional.miListaEspera",
  "convencional.ranking",
  "convencional.promedio",
  "preventas.read",
  "preventas.resumen",
  "proformas",
  "usados.stockDisponible",
  "liess.stockDisponible",
]);

const supervisorAllowedAccess = new Set<RoleAccessKey>([
  ...vendedorAllowedAccess,
  "analisis.operaciones",
  "convencional.stockReservado",
  "usados.stockReservado",
  "preventas.create",
  "preventas.update",
  "preventas.delete",
]);

const administracionAllowedAccess = new Set<RoleAccessKey>([
  "administracion.reventaPendientes",
  "administracion.listaPrevia",
  "administracion.facturasAnticipo",
]);

export const canAccessByRole = (roles: unknown, accessKey: RoleAccessKey) => {
  if (hasSuperAdminRole(roles)) {
    return true;
  }

  if (hasOnlyVendedorRole(roles)) {
    return vendedorAllowedAccess.has(accessKey);
  }

  if (hasOnlySupervisorRole(roles)) {
    return supervisorAllowedAccess.has(accessKey);
  }

  if (hasOnlyAdministracionRole(roles)) {
    return administracionAllowedAccess.has(accessKey);
  }

  return true;
};

export const canAccessLiessTipoByRole = (roles: unknown, tipo: unknown) => {
  if (
    hasSuperAdminRole(roles) ||
    (!hasOnlyVendedorRole(roles) && !hasOnlySupervisorRole(roles) && !hasOnlyAdministracionRole(roles))
  ) {
    return true;
  }

  const normalizedTipo = String(tipo ?? "").trim().toLowerCase();
  return ["nuevos", "usados"].includes(normalizedTipo);
};
