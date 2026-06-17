import { paths } from "@/routes/paths";
import type { Usuario } from "@/types/index";

type AuthUser = Usuario | null | undefined;

export type PreventaAction = "create" | "edit" | "delete" | "assign" | "viewAssigned";

const ACTIVE_ROLE_KEYS = ["vendedor", "supervisor", "administracion"] as const;
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
    paths.convencional.stockDisponible,
    paths.convencional.misOperaciones,
    paths.convencional.misReservas,
    paths.convencional.miListaEspera,
    paths.convencional.proformas,
    paths.convencional.proformasNueva,
    /^\/convencional\/proformas\/[^/]+$/,
    paths.convencional.preventas,
    paths.convencional.preventasResumen,
    paths.convencional.ranking,
    paths.convencional.promedio,
    paths.usados.stockDisponible,
    /^\/liess\/stock\/(nuevos|usados)$/,
  ],
  supervisor: [
    paths.home,
    paths.miPerfil,
    paths.noAutorizado,
    paths.convencional.stockDisponible,
    paths.convencional.stockReservado,
    paths.convencional.misOperaciones,
    paths.convencional.misReservas,
    paths.convencional.miListaEspera,
    paths.convencional.proformas,
    paths.convencional.proformasNueva,
    /^\/convencional\/proformas\/[^/]+$/,
    paths.convencional.preventas,
    paths.convencional.preventasResumen,
    paths.convencional.preventasNueva,
    paths.convencional.ranking,
    paths.convencional.promedio,
    paths.usados.stockDisponible,
    paths.usados.stockReservado,
    /^\/liess\/stock\/(nuevos|usados)$/,
    paths.analisis.operaciones,
  ],
  administracion: [
    paths.home,
    paths.miPerfil,
    paths.noAutorizado,
    paths.administracion.reventaPendientes,
    paths.administracion.pedidoUnidadesListaPrevia,
    paths.administracion.facturasAnticipo,
  ],
};

const restrictedPrefixes = [
  "/admin",
  "/administracion",
  "/gestion",
  "/analisis",
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
    if (role === "supervisor") {
      return action === "create" || action === "edit" || action === "delete";
    }

    return false;
  });
}
