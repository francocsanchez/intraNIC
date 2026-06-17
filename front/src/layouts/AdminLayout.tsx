import GlobalNavbar from "@/components/GlobalNavbar";
import { Navigate, Outlet, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuthe";
import { hasModulePathAccess } from "@/helpers/access";
import Loading from "@/components/Loading";
import { paths } from "@/routes/paths";

export default function AdminLayout() {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) return <Loading />;

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  const canViewUsuarios = hasModulePathAccess(user, "usuarios", paths.admin.usuarios);
  const canViewConfiguracion = hasModulePathAccess(user, "configuracion", paths.admin.configuracion);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <GlobalNavbar
        centerContent={
          <>
            {canViewUsuarios ? (
              <Link to={paths.admin.usuarios} className="hover:text-gray-900 transition">
                Usuarios
              </Link>
            ) : null}

            {canViewConfiguracion ? (
              <Link to={paths.admin.configuracion} className="hover:text-gray-900 transition">
                Configuracion
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
          <span>Panel de administracion</span>
          <span>{new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  );
}
