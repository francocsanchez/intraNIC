import GlobalNavbar from "@/components/GlobalNavbar";
import { Navigate, Outlet, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuthe";
import { hasModuleAccess } from "@/helpers/access";
import Loading from "@/components/Loading";
import { paths } from "@/routes/paths";

export default function GestionConvencionalLayout() {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) return <Loading />;

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  const canViewAsignaciones = hasModuleAccess(user, "asignaciones");
  const canViewRegistroAsignaciones = hasModuleAccess(user, "registroAsignaciones");
  const canViewPedidoMensual = hasModuleAccess(user, "pedidoMensual");
  const canViewPedidoUnidades = hasModuleAccess(user, "pedidoUnidades");

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <GlobalNavbar
        centerContent={
          <>
            {canViewAsignaciones ? (
              <Link to={paths.convencional.asignaciones} className="hover:text-gray-900 transition">
                Asignaciones
              </Link>
            ) : null}

            {canViewRegistroAsignaciones ? (
              <Link to={paths.convencional.registroAsignaciones} className="hover:text-gray-900 transition">
                Registro asignaciones
              </Link>
            ) : null}

            {canViewPedidoMensual ? (
              <Link to={paths.convencional.pedidoMensual} className="hover:text-gray-900 transition">
                Pedido mensual
              </Link>
            ) : null}

            {canViewPedidoUnidades ? (
              <Link to={paths.convencional.pedidoUnidades} className="hover:text-gray-900 transition">
                Pedido unidades
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
          <span>Gestion convencional</span>
          <span>{new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  );
}
