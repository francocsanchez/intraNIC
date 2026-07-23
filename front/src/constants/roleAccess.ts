import type { Usuario } from "@/types/index";

type AuthUser = Usuario | null | undefined;

export type PreventaAction = "create" | "edit" | "delete" | "assign" | "viewAssigned";
export type RegistroTestDriveAction = "deleteManaged" | "editPlanAhorroManaged";

const ACTIVE_ROLE_KEYS = ["vendedor", "supervisor", "gerente", "administracion", "stock", "coordinador", "entrega", "accesorios"] as const;
type ActiveRoleKey = (typeof ACTIVE_ROLE_KEYS)[number];

const normalizeRole = (role: unknown) =>
  String(role)
    .normalize("NFKC")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\s+/g, "")
    .trim()
    .toLowerCase();

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

  void path;
  return true;
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

    if (action === "editPlanAhorroManaged") {
      return role === "gerente";
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

export function hasPendienteTurnarImportAccess(user: AuthUser) {
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

export function hasEntregaAgendaEquipadoToggleAccess(user: AuthUser) {
  if (hasSuperAdminRole(user)) {
    return true;
  }

  const normalizedRoles = getNormalizedRoles(user);
  return normalizedRoles.includes("coordinador") || normalizedRoles.includes("accesorios");
}

export function hasSystemConfigToggleAccess(user: AuthUser) {
  if (hasSuperAdminRole(user)) {
    return true;
  }

  const normalizedRoles = getNormalizedRoles(user);
  return normalizedRoles.includes("stock") || normalizedRoles.includes("gerente");
}

export function hasComercialAgendaManageAccess(user: AuthUser) {
  if (hasSuperAdminRole(user)) {
    return true;
  }

  return getNormalizedRoles(user).includes("supervisor");
}

export function hasCotizadorManageAccess(user: AuthUser) {
  if (hasSuperAdminRole(user)) {
    return true;
  }

  const normalizedRoles = getNormalizedRoles(user);
  return normalizedRoles.includes("supervisor") || normalizedRoles.includes("gerente");
}
