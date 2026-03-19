import { Navigate, Outlet, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuthe";
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
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Navbar */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link className="flex items-center gap-2 text-gray-700 font-semibold" to="/">
            <Shield size={18} strokeWidth={1.5} />
            Administración
          </Link>

          {/* Navegación centrada */}
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-6 text-sm font-medium text-gray-600">
            <Link to="/" className="hover:text-gray-900 transition">
              Inicio
            </Link>

            <Link to="/usuarios" className="hover:text-gray-900 transition">
              Usuarios
            </Link>

            <Link to="/configuracion" className="hover:text-gray-900 transition">
              Configuración
            </Link>
          </div>

          <div className="flex items-center gap-6 text-sm text-gray-600">

            <button onClick={handleLogout} className="flex items-center gap-1 hover:text-gray-900 transition">
              <PowerOff size={16} strokeWidth={1.25} />
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      {/* Contenido */}
      <main className="flex-1">
        <div className="px-4 py-6">
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-6 h-12 flex items-center justify-between text-sm text-gray-500">
          <span>Panel de administración</span>
          <span>© {new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  );
}
