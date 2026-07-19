import { hasSuperAdminRole } from "@/helpers/access";
import { useAuth } from "@/hooks/useAuthe";
import { paths } from "@/routes/paths";
import { Navigate, Outlet } from "react-router-dom";

export default function SuperAdminProtectedRoute() {
  const { user, isAuthenticated, isLoading, isError } = useAuth();

  if (isLoading) return null;

  if (isError || !isAuthenticated || !user) {
    localStorage.removeItem("AUTH_TOKEN");
    return <Navigate to={paths.login} replace />;
  }

  if (!hasSuperAdminRole(user)) {
    return <Navigate to={paths.noAutorizado} replace />;
  }

  return <Outlet />;
}
