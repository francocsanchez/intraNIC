import { paths } from "@/routes/paths";
import type { Usuario } from "@/types/index";

type AuthUser = Usuario | null | undefined;

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

const restrictedPrefixes = [
  "/admin",
  "/administracion",
  "/gestion",
  "/analisis",
  "/convencional",
  "/usados",
  "/liess",
];

export function hasSuperAdminRole(user: AuthUser) {
  return (user?.role ?? []).some((role) => normalizeRole(role) === "superadmin");
}

export function hasOnlyVendedorRole(user: AuthUser) {
  const normalizedRoles = (user?.role ?? []).map(normalizeRole).filter(Boolean);
  return normalizedRoles.length > 0 && normalizedRoles.every((role) => role === "vendedor");
}

export function hasPathAccess(user: AuthUser, path: string) {
  if (hasSuperAdminRole(user)) {
    return true;
  }

  if (!hasOnlyVendedorRole(user)) {
    return true;
  }

  const normalizedPath = normalizePath(path);

  if (vendedorAllowedPaths.some((matcher) => pathMatches(normalizedPath, matcher))) {
    return true;
  }

  return !restrictedPrefixes.some(
    (prefix) => normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`),
  );
}
