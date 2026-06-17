import GlobalNavbar from "@/components/GlobalNavbar";
import { Navigate, Outlet, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuthe";
import { hasAnyRole } from "@/helpers/access";
import Loading from "@/components/Loading";
import { paths } from "@/routes/paths";

export default function GestionUsadosLayout() {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) return <Loading />;

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  const canViewEstados = hasAnyRole(user, ["admin", "gerente", "stock"]);
  const canViewIngresos = hasAnyRole(user, ["admin", "gerente", "stock"]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <GlobalNavbar
        centerContent={
          <>
            {canViewEstados ? (
              <Link to={paths.usados.stockNoReparado} className="hover:text-gray-900 transition">
                No reparado
              </Link>
            ) : null}

            {canViewEstados ? (
              <Link to={paths.usados.stockPendienteDocumentacion} className="hover:text-gray-900 transition">
                Pendiente documentacion
              </Link>
            ) : null}

            {canViewIngresos ? (
              <Link to={paths.usados.stockIngresos} className="hover:text-gray-900 transition">
                Ingresos
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
          <span>Gestion usados</span>
          <span>{new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  );
}
