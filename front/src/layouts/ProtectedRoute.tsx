import { Navigate, Outlet } from "react-router-dom";

import Loading from "@/components/Loading";
import { useAuth } from "@/hooks/useAuthe";
import { paths } from "@/routes/paths";

export default function ProtectedRoute() {
  const { isAuthenticated, isLoading, isError } = useAuth();

  if (isLoading) return <Loading />;

  if (isError || !isAuthenticated) {
    localStorage.removeItem("AUTH_TOKEN");
    return <Navigate to={paths.login} replace />;
  }

  return <Outlet />;
}
