import Loading from "@/components/Loading";
import { hasAnyRole } from "@/helpers/access";
import { useAuth } from "@/hooks/useAuthe";
import { ClipboardList, FileWarning, Gauge, Home, PowerOff, ReceiptText, Shield } from "lucide-react";
import { Link, Navigate, Outlet, useNavigate } from "react-router-dom";

export default function AdminModuleLayout() {
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

  const canViewAdminHome = hasAnyRole(user, ["admin", "stock", "gerente", "supervisor", "vendedor", "administracion"]);
  const canViewReventas = hasAnyRole(user, ["admin", "stock", "gerente", "supervisor", "vendedor", "administracion"]);
  const canViewPedidoUnidades = hasAnyRole(user, ["admin", "stock", "administracion", "gerente"]);
  const canViewTrazabilidad = hasAnyRole(user, ["admin", "stock", "gerente", "supervisor", "vendedor", "administracion"]);
  const canViewFacturasAnticipo = hasAnyRole(user, ["administracion"]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {canViewAdminHome && (
              <Link className="flex items-center gap-2 text-gray-700 font-semibold" to="/administracion">
                <Shield size={18} strokeWidth={1.5} />
                Administracion
              </Link>
            )}

            <Link to="/" className="inline-flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900 transition">
              <Home size={15} strokeWidth={1.5} />
              Inicio
            </Link>
          </div>

          <nav className="absolute left-1/2 -translate-x-1/2 flex items-center gap-6 text-sm font-medium text-gray-600">
            {canViewReventas && (
              <Link to="/reventa-pendientes" className="inline-flex items-center gap-1 hover:text-gray-900 transition">
                <ReceiptText size={15} strokeWidth={1.5} />
                Pendientes de reventas
              </Link>
            )}

            {canViewPedidoUnidades && (
              <Link
                to="/pedido-unidades/lista-previa"
                className="inline-flex items-center gap-1 hover:text-gray-900 transition"
              >
                <ClipboardList size={15} strokeWidth={1.5} />
                Pedido de Unidades
              </Link>
            )}

            {canViewFacturasAnticipo && (
              <Link
                to="/administracion/facturas-anticipo"
                className="inline-flex items-center gap-1 hover:text-gray-900 transition"
              >
                <FileWarning size={15} strokeWidth={1.5} />
                Facturas de anticipo
              </Link>
            )}

            {canViewTrazabilidad && (
              <Link to="/trazabilidad-operativa" className="inline-flex items-center gap-1 hover:text-gray-900 transition">
                <Gauge size={15} strokeWidth={1.5} />
                Trazabilidad
              </Link>
            )}
          </nav>

          <button onClick={handleLogout} className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition">
            <PowerOff size={16} strokeWidth={1.25} />
            Cerrar sesion
          </button>
        </div>
      </header>

      <main className="flex-1">
        <div className="px-4 py-6">
          <Outlet />
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-6 h-12 flex items-center justify-between text-sm text-gray-500">
          <span>Modulo de administracion</span>
          <span>{new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  );
}
