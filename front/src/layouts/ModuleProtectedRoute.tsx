import { hasAnyModuleAccess } from "@/helpers/access";
import { useAuth } from "@/hooks/useAuthe";
import type { ModuleKey } from "@/constants/modules";
import { Navigate, Outlet } from "react-router-dom";

type ModuleProtectedRouteProps = {
  allowedModules: ModuleKey[];
};

export default function ModuleProtectedRoute({
  allowedModules,
}: ModuleProtectedRouteProps) {
  const { user, isAuthenticated, isLoading, isError } = useAuth();

  if (isLoading) return null;

  if (isError || !isAuthenticated || !user) {
    localStorage.removeItem("AUTH_TOKEN");
    return <Navigate to="/login" replace />;
  }

  if (!hasAnyModuleAccess(user, allowedModules)) {
    return <Navigate to="/no-autorizado" replace />;
  }

  return <Outlet />;
}
