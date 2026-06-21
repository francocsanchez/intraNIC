import type { Usuario } from "@/types/index";
import { normalizeModules, type ModuleKey } from "@/constants/modules";
import {
  hasPathAccess,
  hasPreventaActionAccess,
  hasRegistroTestDriveActionAccess,
  hasSuperAdminRole,
} from "@/constants/roleAccess";

type AuthUser = Usuario | null | undefined;
type BusinessMaintenanceKey = "convencional" | "usados";

export function hasModuleAccess(user: AuthUser, moduleKey: ModuleKey) {
  if (hasSuperAdminRole(user)) {
    return true;
  }

  const modules = normalizeModules(user?.modules);
  return Number(modules[moduleKey] ?? 0) === 1;
}

export function hasAnyModuleAccess(user: AuthUser, allowedModules: ModuleKey[]) {
  if (hasSuperAdminRole(user)) {
    return true;
  }

  return allowedModules.some((moduleKey) => hasModuleAccess(user, moduleKey));
}

export function hasModulePathAccess(user: AuthUser, moduleKey: ModuleKey, path: string) {
  return hasModuleAccess(user, moduleKey) && hasPathAccess(user, path);
}

export function shouldShowMaintenanceForBusiness(user: AuthUser, business: BusinessMaintenanceKey, isSystemActive: boolean) {
  if (isSystemActive) {
    return false;
  }

  if (hasSuperAdminRole(user)) {
    return false;
  }

  const normalizedRoles = (user?.role ?? []).map((role) => String(role).trim().toLowerCase());
  const isRestrictedRole = normalizedRoles.includes("vendedor") || normalizedRoles.includes("supervisor");

  if (!isRestrictedRole) {
    return false;
  }

  return business === "convencional" || business === "usados";
}

export { hasPathAccess, hasPreventaActionAccess, hasRegistroTestDriveActionAccess, hasSuperAdminRole };
