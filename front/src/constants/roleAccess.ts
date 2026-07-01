import { paths } from "@/routes/paths";
import type { Usuario } from "@/types/index";

type AuthUser = Usuario | null | undefined;

export type PreventaAction = "create" | "edit" | "delete" | "assign" | "viewAssigned";
export type RegistroTestDriveAction = "deleteManaged";

const ACTIVE_ROLE_KEYS = ["vendedor", "supervisor", "gerente", "administracion", "stock", "coordinador", "entrega"] as const;
type ActiveRoleKey = (typeof ACTIVE_ROLE_KEYS)[number];

const normalizeRole = (role: unknown) =>
  String(role)
    .normalize("NFKC")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\s+/g, "")
    .trim()
    .toLowerCase();

const normalizePath = (path: string) => {
  const [pathname] = path.split(/[?#]/, 1);
  const normalized = pathname.trim().replace(/\/+$/, "");

  return normalized || "/";
};

const pathMatches = (path: string, matcher: string | RegExp) =>
  typeof matcher === "string" ? path === matcher : matcher.test(path);

const roleAllowedPaths: Record<ActiveRoleKey, Array<string | RegExp>> = {
  vendedor: [
    paths.home,
    paths.miPerfil,
    paths.noAutorizado,
    paths.callCenter.home,
    paths.callCenter.importar,
    paths.callCenter.origenesDatos,
    paths.convencional.stockDisponible,
    paths.convencional.misOperaciones,
    paths.convencional.misReservas,
    paths.convencional.miListaEspera,
    paths.convencional.proformas,
    paths.convencional.proformasNueva,
    /^\/convencional\/proformas\/[^/]+$/,
    paths.convencional.minutas,
    paths.convencional.preventas,
    paths.convencional.preventasResumen,
    paths.convencional.registroTestDrive,
    paths.convencional.registroTestDriveCalendario,
    paths.planAhorro.registroTestDrive,
    paths.planAhorro.registroTestDriveCalendario,
    paths.planAhorro.promedios,
    paths.convencional.ranking,
    paths.convencional.promedio,
    paths.analisis.registros,
    paths.usados.stockDisponible,
    paths.usados.misOperaciones,
    /^\/liess\/stock\/(nuevos|usados)$/,
    paths.entregas.registros,
  ],
  supervisor: [
    paths.home,
    paths.miPerfil,
    paths.noAutorizado,
    paths.callCenter.home,
    paths.callCenter.importar,
    paths.callCenter.origenesDatos,
    paths.convencional.stockDisponible,
    paths.convencional.stockReservado,
    paths.convencional.misOperaciones,
    paths.convencional.misReservas,
    paths.convencional.miListaEspera,
    paths.convencional.proformas,
    paths.convencional.proformasNueva,
    /^\/convencional\/proformas\/[^/]+$/,
    paths.convencional.minutas,
    paths.convencional.preventas,
    paths.convencional.preventasResumen,
    paths.convencional.preventasNueva,
    /^\/gestion\/convencional\/preventas\/[^/]+\/editar$/,
    paths.convencional.registroTestDrive,
    paths.convencional.registroTestDriveCalendario,
    paths.planAhorro.registroTestDrive,
    paths.planAhorro.registroTestDriveCalendario,
    paths.planAhorro.promedios,
    paths.convencional.ranking,
    paths.convencional.promedio,
    paths.usados.stockDisponible,
    paths.usados.stockReservado,
    paths.usados.misOperaciones,
    /^\/liess\/stock\/(nuevos|usados)$/,
    paths.analisis.operaciones,
    paths.analisis.registros,
    /^\/analisis\/patentamientos(?:\/.*)?$/,
    paths.admin.testDrive,
    paths.entregas.registros,
  ],
  gerente: [
    paths.home,
    paths.miPerfil,
    paths.noAutorizado,
    paths.callCenter.home,
    paths.callCenter.importar,
    paths.callCenter.origenesDatos,
    paths.convencional.stockDisponible,
    paths.convencional.stockReservado,
    paths.convencional.stockGuardado,
    paths.convencional.misOperaciones,
    paths.convencional.misReservas,
    paths.convencional.miListaEspera,
    paths.convencional.proformas,
    paths.convencional.proformasNueva,
    /^\/convencional\/proformas\/[^/]+$/,
    paths.convencional.minutas,
    paths.convencional.preventas,
    paths.convencional.preventasResumen,
    paths.convencional.preventasNueva,
    /^\/gestion\/convencional\/preventas\/[^/]+\/editar$/,
    paths.convencional.registroTestDrive,
    paths.convencional.registroTestDriveCalendario,
    paths.planAhorro.registroTestDrive,
    paths.planAhorro.registroTestDriveCalendario,
    paths.planAhorro.promedios,
    paths.convencional.ranking,
    paths.convencional.promedio,
    paths.convencional.asignaciones,
    paths.usados.stockDisponible,
    paths.usados.stockReservado,
    paths.usados.stockGuardado,
    paths.usados.misOperaciones,
    /^\/liess\/stock\/(nuevos|usados)$/,
    paths.analisis.operaciones,
    paths.analisis.registros,
    /^\/analisis\/patentamientos(?:\/.*)?$/,
    paths.admin.testDrive,
    paths.entregas.registros,
  ],
  administracion: [
    paths.home,
    paths.miPerfil,
    paths.noAutorizado,
    paths.callCenter.home,
    paths.callCenter.importar,
    paths.callCenter.origenesDatos,
    paths.administracion.reventaPendientes,
    paths.administracion.pedidoUnidadesListaPrevia,
    paths.administracion.pedidoUnidadesRegistros,
    paths.administracion.facturasAnticipo,
    paths.administracion.segUnidadesFabrica,
    paths.convencional.pedidoUnidades,
    paths.analisis.registros,
    paths.entregas.registros,
  ],
  stock: [
    paths.home,
    paths.miPerfil,
    paths.noAutorizado,
    paths.callCenter.home,
    paths.callCenter.importar,
    paths.callCenter.origenesDatos,
    paths.administracion.pedidoUnidadesListaPrevia,
    paths.liess.stockDisponible("nuevos"),
    paths.liess.stockDisponible("usados"),
    paths.convencional.stockDisponible,
    paths.convencional.stockReservado,
    paths.convencional.stockGuardado,
    paths.usados.stockDisponible,
    paths.usados.stockReservado,
    paths.usados.stockGuardado,
    paths.usados.stockNoReparado,
    paths.usados.stockPendienteDocumentacion,
    paths.usados.stockIngresos,
    paths.convencional.asignaciones,
    paths.convencional.pedidoMensual,
    paths.convencional.pedidoUnidades,
    paths.convencional.registroAsignaciones,
    paths.convencional.registroAsignacionesResumen,
    paths.convencional.preventas,
    paths.convencional.preventasNueva,
    paths.convencional.preventasResumen,
    paths.analisis.registros,
    paths.admin.configuracion,
    paths.admin.configuracionConvencionalEditar,
    paths.admin.configuracionUsadosEditar,
    paths.entregas.registros,
  ],
  coordinador: [
    paths.home,
    paths.miPerfil,
    paths.noAutorizado,
    paths.callCenter.home,
    paths.callCenter.importar,
    paths.callCenter.origenesDatos,
    paths.analisis.registros,
    paths.entregas.agenda,
    paths.entregas.registros,
  ],
  entrega: [
    paths.home,
    paths.miPerfil,
    paths.noAutorizado,
    paths.analisis.registros,
    paths.entregas.agenda,
    paths.entregas.registros,
  ],
};

const restrictedPrefixes = [
  "/admin",
  "/administracion",
  "/gestion",
  "/analisis",
  "/call-center",
  "/convencional",
  "/usados",
  "/liess",
];

const getNormalizedRoles = (user: AuthUser) =>
  (user?.role ?? []).map(normalizeRole).filter(Boolean);

const getActiveRoles = (user: AuthUser): ActiveRoleKey[] => {
  const normalizedRoles = new Set(getNormalizedRoles(user));
  return ACTIVE_ROLE_KEYS.filter((role) => normalizedRoles.has(role));
};

export function hasSuperAdminRole(user: AuthUser) {
  return getNormalizedRoles(user).includes("superadmin");
}

export function hasPathAccess(user: AuthUser, path: string) {
  if (hasSuperAdminRole(user)) {
    return true;
  }

  const activeRoles = getActiveRoles(user);
  if (!activeRoles.length) {
    return true;
  }

  const normalizedPath = normalizePath(path);

  const isAllowed = activeRoles.some((role) =>
    roleAllowedPaths[role].some((matcher) => pathMatches(normalizedPath, matcher)),
  );

  if (isAllowed) {
    return true;
  }

  return !restrictedPrefixes.some(
    (prefix) => normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`),
  );
}

export function hasPreventaActionAccess(user: AuthUser, action: PreventaAction) {
  if (hasSuperAdminRole(user)) {
    return true;
  }

  const activeRoles = getActiveRoles(user);
  if (!activeRoles.length) {
    return true;
  }

  return activeRoles.some((role) => {
    if (role === "supervisor" || role === "gerente") {
      return action === "create" || action === "edit" || action === "delete";
    }

    if (role === "stock") {
      return action === "create" || action === "assign";
    }

    return false;
  });
}

export function hasRegistroTestDriveActionAccess(user: AuthUser, action: RegistroTestDriveAction) {
  if (hasSuperAdminRole(user)) {
    return true;
  }

  const activeRoles = getActiveRoles(user);
  if (!activeRoles.length) {
    return false;
  }

  return activeRoles.some((role) => {
    if (action === "deleteManaged") {
      return role === "supervisor" || role === "gerente";
    }

    return false;
  });
}

export function hasEntregaAgendaManageAccess(user: AuthUser) {
  if (hasSuperAdminRole(user)) {
    return true;
  }

  return getNormalizedRoles(user).includes("coordinador");
}

export function hasEntregaAgendaToggleAccess(user: AuthUser) {
  if (hasSuperAdminRole(user)) {
    return true;
  }

  return getNormalizedRoles(user).includes("entrega");
}
