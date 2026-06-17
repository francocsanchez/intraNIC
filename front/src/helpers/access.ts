import type { Usuario } from "@/types/index";
import { normalizeModules, type ModuleKey } from "@/constants/modules";

type AuthUser = Usuario | null | undefined;

export function hasModuleAccess(user: AuthUser, moduleKey: ModuleKey) {
  const modules = normalizeModules(user?.modules);
  return Number(modules[moduleKey] ?? 0) === 1;
}

export function hasAnyModuleAccess(user: AuthUser, allowedModules: ModuleKey[]) {
  return allowedModules.some((moduleKey) => hasModuleAccess(user, moduleKey));
}
