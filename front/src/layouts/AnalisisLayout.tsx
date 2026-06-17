import GlobalNavbar from "@/components/GlobalNavbar";
import { Navigate, Outlet, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuthe";
import { hasModuleAccess } from "@/helpers/access";
import Loading from "@/components/Loading";
import { paths } from "@/routes/paths";

export default function AnalisisLayout() {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) return <Loading />;

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  const canViewOperaciones = hasModuleAccess(user, "operaciones");
  const canViewRanking = hasModuleAccess(user, "ranking");
  const canViewPromedio = hasModuleAccess(user, "promedio");

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <GlobalNavbar
        centerContent={
          <>
            {canViewOperaciones ? (
              <Link to={paths.analisis.operaciones} className="hover:text-gray-900 transition">
                Operaciones
              </Link>
            ) : null}

            {canViewRanking ? (
              <Link to={paths.convencional.ranking} className="hover:text-gray-900 transition">
                Ranking
              </Link>
            ) : null}

            {canViewPromedio ? (
              <Link to={paths.convencional.promedio} className="hover:text-gray-900 transition">
                Promedio
              </Link>
            ) : null}
          </>
        }
      />

      <main className="flex-1">
        <div className="px-4 py-6">
          <Outlet />
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-6 h-12 flex items-center justify-between text-sm text-gray-500">
          <span>Analisis</span>
          <span>{new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  );
}
