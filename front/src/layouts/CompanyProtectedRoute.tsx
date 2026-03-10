import { useAuth } from "@/hooks/useAuthe";
import { Navigate, Outlet } from "react-router-dom";

type CompanyProtectedRouteProps = {
  allowedCompany: string[];
};

export default function CompanyProtectedRoute({ allowedCompany }: CompanyProtectedRouteProps) {
  const { user, isAuthenticated, isLoading, isError } = useAuth();

  if (isLoading) return null;

  if (isError || !isAuthenticated || !user) {
    localStorage.removeItem("AUTH_TOKEN");
    return <Navigate to="/login" replace />;
  }

  const userCompany = user.company ?? [];
  const hasAccess = userCompany.some((company) => allowedCompany.includes(company));

  if (!hasAccess) {
    return <Navigate to="/no-autorizado" replace />;
  }

  return <Outlet />;
}
