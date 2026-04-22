import { Navigate, Outlet, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuthe";
import { hasAnyCompany, hasAnyRole } from "@/helpers/access";
import Loading from "@/components/Loading";
import { PowerOff, Shield } from "lucide-react";

export default function AdminLayout() {
  const navigate = useNavigate();
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) return <Loading />;

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = () => {
    localStorage.removeItem("AUTH_TOKEN");
    navigate("/login", { replace: true });
  };

  const canViewUsuarios = hasAnyRole(user, ["admin", "supervisor", "stock"]);
  const canViewConfiguracion = hasAnyRole(user, ["admin", "supervisor", "stock"]);
  const canViewReventas = hasAnyRole(user, ["admin", "gerente", "stock", "administracion"]) && hasAnyCompany(user, ["reventa"]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link className="flex items-center gap-2 text-gray-700 font-semibold" to="/">
            <Shield size={18} strokeWidth={1.5} />
            Administracion
          </Link>

          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-6 text-sm font-medium text-gray-600">
            <Link to="/" className="hover:text-gray-900 transition">
              Inicio
            </Link>

            {canViewUsuarios ? (
              <Link to="/usuarios" className="hover:text-gray-900 transition">
                Usuarios
              </Link>
            ) : null}

            {canViewConfiguracion ? (
              <Link to="/configuracion" className="hover:text-gray-900 transition">
                Configuracion
              </Link>
            ) : null}

            {canViewReventas ? (
              <Link to="/reventa-pendientes" className="hover:text-gray-900 transition">
                Reventas
              </Link>
            ) : null}
          </div>

          <div className="flex items-center gap-6 text-sm text-gray-600">
            <button onClick={handleLogout} className="flex items-center gap-1 hover:text-gray-900 transition">
              <PowerOff size={16} strokeWidth={1.25} />
              Cerrar sesion
            </button>
          </div>
        </div>
      </header>

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
