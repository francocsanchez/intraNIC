import { hasAnyModuleAccess } from "@/helpers/access";
import { useAuth } from "@/hooks/useAuthe";
import type { ModuleKey } from "@/constants/modules";
import { paths } from "@/routes/paths";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { hasPathAccess } from "@/helpers/access";
import Loading from "@/components/Loading";

type ModuleProtectedRouteProps = {
  allowedModules: ModuleKey[];
};

export default function ModuleProtectedRoute({
  allowedModules,
}: ModuleProtectedRouteProps) {
  const { user, isAuthenticated, isLoading, isSessionRecovering, isError } = useAuth();
  const { pathname } = useLocation();

  if (isLoading || isSessionRecovering) return <Loading />;

  if (isError || !isAuthenticated || !user) {
    localStorage.removeItem("AUTH_TOKEN");
    return <Navigate to={paths.login} replace />;
  }

  if (!hasAnyModuleAccess(user, allowedModules)) {
    return <Navigate to={paths.noAutorizado} replace />;
  }

  if (!hasPathAccess(user, pathname)) {
    return <Navigate to={paths.noAutorizado} replace />;
  }

  return <Outlet />;
}
