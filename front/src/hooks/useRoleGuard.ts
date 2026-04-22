import { useAuth } from "./useAuthe";
import { hasAnyRole } from "@/helpers/access";

type Role = string;

export default function useRoleGuard(allowedRoles: Role[]) {
  const { user } = useAuth();
  const hasAccess = hasAnyRole(user, allowedRoles);

  if (!hasAccess) {
    return {
      allowed: false,
      message: "No posee permisos para acceder a esta sección.",
    };
  }

  return {
    allowed: true,
    message: null,
  };
}
