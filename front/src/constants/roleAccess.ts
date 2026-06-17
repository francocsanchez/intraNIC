import { paths } from "@/routes/paths";
import type { Usuario } from "@/types/index";

type AuthUser = Usuario | null | undefined;

export type PreventaAction = "create" | "edit" | "delete" | "assign" | "viewAssigned";

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

const vendedorAllowedPaths: Array<string | RegExp> = [
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
];

const supervisorAllowedPaths: Array<string | RegExp> = [
  ...vendedorAllowedPaths,
  paths.analisis.operaciones,
  paths.convencional.stockReservado,
  paths.usados.stockReservado,
  paths.convencional.preventasNueva,
];

const administracionAllowedPaths: Array<string | RegExp> = [
  paths.home,
  paths.miPerfil,
  paths.noAutorizado,
  paths.administracion.reventaPendientes,
  paths.administracion.pedidoUnidadesListaPrevia,
  paths.administracion.facturasAnticipo,
];

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

export function hasSuperAdminRole(user: AuthUser) {
  return getNormalizedRoles(user).includes("superadmin");
}

export function hasOnlyVendedorRole(user: AuthUser) {
  const normalizedRoles = getNormalizedRoles(user);
  return normalizedRoles.length > 0 && normalizedRoles.every((role) => role === "vendedor");
}

export function hasOnlySupervisorRole(user: AuthUser) {
  const normalizedRoles = getNormalizedRoles(user);
  return normalizedRoles.length > 0 && normalizedRoles.every((role) => role === "supervisor");
}

export function hasOnlyAdministracionRole(user: AuthUser) {
  const normalizedRoles = getNormalizedRoles(user);
  return normalizedRoles.length > 0 && normalizedRoles.every((role) => role === "administracion");
}

export function hasPathAccess(user: AuthUser, path: string) {
  if (hasSuperAdminRole(user)) {
    return true;
  }

  const normalizedPath = normalizePath(path);

  if (hasOnlyVendedorRole(user)) {
    if (vendedorAllowedPaths.some((matcher) => pathMatches(normalizedPath, matcher))) {
      return true;
    }

    return !restrictedPrefixes.some(
      (prefix) => normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`),
    );
  }

  if (hasOnlySupervisorRole(user)) {
    if (supervisorAllowedPaths.some((matcher) => pathMatches(normalizedPath, matcher))) {
      return true;
    }

    return !restrictedPrefixes.some(
      (prefix) => normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`),
    );
  }

  if (hasOnlyAdministracionRole(user)) {
    if (administracionAllowedPaths.some((matcher) => pathMatches(normalizedPath, matcher))) {
      return true;
    }

    return !restrictedPrefixes.some(
      (prefix) => normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`),
    );
  }

  return true;
}

export function hasPreventaActionAccess(user: AuthUser, action: PreventaAction) {
  if (hasSuperAdminRole(user)) {
    return true;
  }

  if (hasOnlyVendedorRole(user)) {
    return false;
  }

  if (hasOnlySupervisorRole(user)) {
    return action === "create" || action === "edit" || action === "delete";
  }

  return true;
}
