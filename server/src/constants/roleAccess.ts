export type RoleAccessKey =
  | "callCenter"
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
  | "convencional.planNegocio"
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
  | "usados.misOperaciones"
  | "usados.noReparado"
  | "usados.pendienteDocumentacion"
  | "usados.ingresos"
  | "liess.stockDisponible"
  | "analisis.operaciones"
  | "analisis.patentamientos"
  | "administracion.reventaPendientes"
  | "administracion.listaPrevia"
  | "administracion.pedidoUnidadesRegistros"
  | "administracion.facturasAnticipo"
  | "administracion.segUnidadesFabrica"
  | "comercial.testDriveRegistroConvencional.read"
  | "comercial.testDriveRegistroConvencional.create"
  | "comercial.testDriveRegistroConvencional.updateOwn"
  | "comercial.testDriveRegistroConvencional.deleteOwn"
  | "comercial.testDriveRegistroConvencional.deleteManaged"
  | "comercial.testDriveRegistro.read"
  | "comercial.testDriveRegistro.create"
  | "comercial.testDriveRegistro.updateOwn"
  | "comercial.testDriveRegistro.deleteOwn"
  | "comercial.testDriveRegistro.deleteManaged"
  | "comercial.minutas.read"
  | "comercial.minutas.create"
  | "comercial.minutas.update"
  | "comercial.minutas.delete"
  | "comercial.minutas.pdf"
  | "planAhorro.testDriveRegistro.read"
  | "planAhorro.testDriveRegistro.create"
  | "planAhorro.testDriveRegistro.updateOwn"
  | "planAhorro.testDriveRegistro.deleteOwn"
  | "planAhorro.testDriveRegistro.deleteManaged"
  | "planAhorro.promedios"
  | "sistema.usuarios"
  | "sistema.configuracion"
  | "sistema.testDrive";

const ACTIVE_ROLE_KEYS = ["vendedor", "supervisor", "gerente", "administracion", "stock", "entrega"] as const;
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
    "callCenter",
    "convencional.stockDisponible",
    "convencional.misReservas",
    "convencional.misOperaciones",
    "convencional.miListaEspera",
    "convencional.ranking",
    "convencional.promedio",
    "preventas.read",
    "preventas.resumen",
    "proformas",
    "comercial.testDriveRegistroConvencional.read",
    "comercial.testDriveRegistroConvencional.create",
    "comercial.testDriveRegistroConvencional.updateOwn",
    "comercial.testDriveRegistroConvencional.deleteOwn",
    "planAhorro.testDriveRegistro.read",
    "planAhorro.testDriveRegistro.create",
    "planAhorro.testDriveRegistro.updateOwn",
    "planAhorro.testDriveRegistro.deleteOwn",
    "planAhorro.promedios",
    "comercial.testDriveRegistro.read",
    "comercial.testDriveRegistro.create",
    "comercial.testDriveRegistro.updateOwn",
    "comercial.testDriveRegistro.deleteOwn",
    "comercial.minutas.read",
    "comercial.minutas.create",
    "comercial.minutas.update",
    "comercial.minutas.delete",
    "comercial.minutas.pdf",
    "usados.stockDisponible",
    "usados.misOperaciones",
    "liess.stockDisponible",
  ]),
  supervisor: new Set<RoleAccessKey>([
    "callCenter",
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
    "comercial.testDriveRegistroConvencional.read",
    "comercial.testDriveRegistroConvencional.create",
    "comercial.testDriveRegistroConvencional.updateOwn",
    "comercial.testDriveRegistroConvencional.deleteOwn",
    "comercial.testDriveRegistroConvencional.deleteManaged",
    "planAhorro.testDriveRegistro.read",
    "planAhorro.testDriveRegistro.create",
    "planAhorro.testDriveRegistro.updateOwn",
    "planAhorro.testDriveRegistro.deleteOwn",
    "planAhorro.testDriveRegistro.deleteManaged",
    "planAhorro.promedios",
    "comercial.testDriveRegistro.read",
    "comercial.testDriveRegistro.create",
    "comercial.testDriveRegistro.updateOwn",
    "comercial.testDriveRegistro.deleteOwn",
    "comercial.testDriveRegistro.deleteManaged",
    "comercial.minutas.read",
    "comercial.minutas.create",
    "comercial.minutas.update",
    "comercial.minutas.delete",
    "comercial.minutas.pdf",
    "usados.stockDisponible",
    "usados.stockReservado",
    "usados.misOperaciones",
    "liess.stockDisponible",
    "analisis.operaciones",
    "analisis.patentamientos",
    "sistema.testDrive",
  ]),
  gerente: new Set<RoleAccessKey>([
    "callCenter",
    "convencional.stockDisponible",
    "convencional.stockReservado",
    "convencional.misReservas",
    "convencional.misOperaciones",
    "convencional.miListaEspera",
    "convencional.ranking",
    "convencional.promedio",
    "convencional.planNegocio",
    "convencional.asignaciones",
    "preventas.read",
    "preventas.resumen",
    "preventas.create",
    "preventas.update",
    "preventas.delete",
    "proformas",
    "comercial.testDriveRegistroConvencional.read",
    "comercial.testDriveRegistroConvencional.create",
    "comercial.testDriveRegistroConvencional.updateOwn",
    "comercial.testDriveRegistroConvencional.deleteOwn",
    "comercial.testDriveRegistroConvencional.deleteManaged",
    "planAhorro.testDriveRegistro.read",
    "planAhorro.testDriveRegistro.create",
    "planAhorro.testDriveRegistro.updateOwn",
    "planAhorro.testDriveRegistro.deleteOwn",
    "planAhorro.testDriveRegistro.deleteManaged",
    "planAhorro.promedios",
    "comercial.testDriveRegistro.read",
    "comercial.testDriveRegistro.create",
    "comercial.testDriveRegistro.updateOwn",
    "comercial.testDriveRegistro.deleteOwn",
    "comercial.testDriveRegistro.deleteManaged",
    "comercial.minutas.read",
    "comercial.minutas.create",
    "comercial.minutas.update",
    "comercial.minutas.delete",
    "comercial.minutas.pdf",
    "usados.stockDisponible",
    "usados.stockReservado",
    "usados.misOperaciones",
    "liess.stockDisponible",
    "analisis.operaciones",
    "analisis.patentamientos",
    "sistema.configuracion",
    "sistema.testDrive",
  ]),
  administracion: new Set<RoleAccessKey>([
    "callCenter",
    "administracion.reventaPendientes",
    "administracion.listaPrevia",
    "administracion.pedidoUnidadesRegistros",
    "administracion.facturasAnticipo",
    "administracion.segUnidadesFabrica",
  ]),
  stock: new Set<RoleAccessKey>([
    "callCenter",
    "administracion.listaPrevia",
    "liess.stockDisponible",
    "convencional.stockDisponible",
    "convencional.stockGuardado",
    "convencional.stockReservado",
    "usados.stockDisponible",
    "usados.stockGuardado",
    "usados.stockReservado",
    "usados.noReparado",
    "usados.pendienteDocumentacion",
    "usados.ingresos",
    "convencional.asignaciones",
    "convencional.planNegocio",
    "convencional.pedidoMensual",
    "convencional.pedidoUnidades",
    "convencional.registroAsignaciones",
    "sistema.configuracion",
    "preventas.read",
    "preventas.resumen",
    "preventas.create",
    "preventas.assign",
  ]),
  entrega: new Set<RoleAccessKey>([]),
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
    (role) => role === "vendedor" || role === "supervisor" || role === "gerente" || role === "stock",
  );

  if (!restrictLiessTipos) {
    return true;
  }

  const normalizedTipo = String(tipo ?? "").trim().toLowerCase();
  return ["nuevos", "usados"].includes(normalizedTipo);
};
