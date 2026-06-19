import type { Usuario } from "@/types/index";
import { normalizeModules, type ModuleKey } from "@/constants/modules";
import {
  hasPathAccess,
  hasPreventaActionAccess,
  hasRegistroTestDriveActionAccess,
  hasSuperAdminRole,
} from "@/constants/roleAccess";

type AuthUser = Usuario | null | undefined;

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

export { hasPathAccess, hasPreventaActionAccess, hasRegistroTestDriveActionAccess, hasSuperAdminRole };
