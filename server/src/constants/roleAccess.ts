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

const ACTIVE_ROLE_KEYS = ["vendedor", "supervisor", "administracion"] as const;
type ActiveRoleKey = (typeof ACTIVE_ROLE_KEYS)[number];

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

const getActiveRoles = (roles: unknown): ActiveRoleKey[] => {
  const normalizedRoles = new Set(normalizeRoles(roles));
  return ACTIVE_ROLE_KEYS.filter((role) => normalizedRoles.has(role));
};

export const hasSuperAdminRole = (roles: unknown) =>
  normalizeRoles(roles).includes("superadmin");

const roleAllowedAccess: Record<ActiveRoleKey, Set<RoleAccessKey>> = {
  vendedor: new Set<RoleAccessKey>([
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
  ]),
  supervisor: new Set<RoleAccessKey>([
    "convencional.stockDisponible",
    "convencional.stockReservado",
    "convencional.misReservas",
    "convencional.misOperaciones",
    "convencional.miListaEspera",
    "convencional.ranking",
    "convencional.promedio",
    "preventas.read",
    "preventas.resumen",
    "preventas.create",
    "preventas.update",
    "preventas.delete",
    "proformas",
    "usados.stockDisponible",
    "usados.stockReservado",
    "liess.stockDisponible",
    "analisis.operaciones",
  ]),
  administracion: new Set<RoleAccessKey>([
    "administracion.reventaPendientes",
    "administracion.listaPrevia",
    "administracion.facturasAnticipo",
  ]),
};

export const canAccessByRole = (roles: unknown, accessKey: RoleAccessKey) => {
  if (hasSuperAdminRole(roles)) {
    return true;
  }

  const activeRoles = getActiveRoles(roles);
  if (!activeRoles.length) {
    return true;
  }

  return activeRoles.some((role) => roleAllowedAccess[role].has(accessKey));
};

export const canAccessLiessTipoByRole = (roles: unknown, tipo: unknown) => {
  if (hasSuperAdminRole(roles)) {
    return true;
  }

  const activeRoles = getActiveRoles(roles);
  const restrictLiessTipos = activeRoles.some(
    (role) => role === "vendedor" || role === "supervisor",
  );

  if (!restrictLiessTipos) {
    return true;
  }

  const normalizedTipo = String(tipo ?? "").trim().toLowerCase();
  return ["nuevos", "usados"].includes(normalizedTipo);
};
