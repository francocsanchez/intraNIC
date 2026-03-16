import { Navigate, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuthe";
import Loading from "@/components/Loading";
import { CircleUserRound, PowerOff, Shield, ArrowLeft } from "lucide-react";

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

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Navbar */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-700 font-semibold">
            <Shield size={18} strokeWidth={1.5} />
            Administración
          </div>

          <div className="flex items-center gap-6 text-sm text-gray-600">
            <button
              onClick={handleBack}
              className="flex items-center gap-1 hover:text-gray-900 transition"
            >
              <ArrowLeft size={16} strokeWidth={1.25} />
              Volver atrás
            </button>

            <div className="flex items-center gap-1 capitalize">
              <CircleUserRound size={16} strokeWidth={1.25} />
              {user.lastName}, {user.name}
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1 hover:text-gray-900 transition"
            >
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