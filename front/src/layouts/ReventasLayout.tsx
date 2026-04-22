import { CarFront, LogOut } from "lucide-react";
import { Link, Outlet, useNavigate } from "react-router-dom";

export default function ReventasLayout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("AUTH_TOKEN");
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link className="flex items-center gap-3 text-gray-900 font-semibold" to="/">
            <img src="/logoNic.png" alt="IntraNIC" className="h-8 w-auto object-contain" />
            <span className="hidden sm:inline">Publico</span>
          </Link>

          <nav className="flex items-center gap-6 text-sm font-medium text-gray-600">
            <Link to="/" className="hover:text-gray-900 transition">
              Inicio
            </Link>
            <Link to="/stock-publico" className="inline-flex items-center gap-2 hover:text-gray-900 transition">
              <CarFront size={16} strokeWidth={1.5} />
              Disponible
            </Link>
          </nav>

          {localStorage.getItem("AUTH_TOKEN") ? (
            <button onClick={handleLogout} className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition">
              <LogOut size={16} strokeWidth={1.5} />
              Cerrar sesion
            </button>
          ) : (
            <Link to="/login" className="text-sm text-gray-600 hover:text-gray-900 transition">
              Iniciar sesion
            </Link>
          )}
        </div>
      </header>

      <main className="flex-1">
        <div className="px-4">
          <Outlet />
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between text-sm text-gray-500">
          <span>{new Date().getFullYear()} IntraNIC</span>
          <span>Modulo Publico</span>
        </div>
      </footer>
    </div>
  );
}
