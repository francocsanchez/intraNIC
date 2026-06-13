import Loading from "@/components/Loading";
import { hasAnyRole } from "@/helpers/access";
import { useAuth } from "@/hooks/useAuthe";
import { paths } from "@/routes/paths";
import { BarChart3, ClipboardList, FileWarning, Home, PowerOff, ReceiptText, Shield, Upload } from "lucide-react";
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
  const canViewFacturasAnticipo = hasAnyRole(user, ["administracion"]);
  const canViewOperaciones = hasAnyRole(user, ["admin", "supervisor", "gerente"]);
  const canViewPatentamientos = hasAnyRole(user, ["admin", "supervisor", "gerente"]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {canViewAdminHome && (
              <Link className="flex items-center gap-2 text-gray-700 font-semibold" to={paths.administracion.home}>
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
              <Link to={paths.administracion.reventaPendientes} className="inline-flex items-center gap-1 hover:text-gray-900 transition">
                <ReceiptText size={15} strokeWidth={1.5} />
                Pendientes de reventas
              </Link>
            )}

            {canViewPedidoUnidades && (
              <Link
                to={paths.administracion.pedidoUnidadesListaPrevia}
                className="inline-flex items-center gap-1 hover:text-gray-900 transition"
              >
                <ClipboardList size={15} strokeWidth={1.5} />
                Pedido de Unidades
              </Link>
            )}

            {canViewFacturasAnticipo && (
              <Link
                to={paths.administracion.facturasAnticipo}
                className="inline-flex items-center gap-1 hover:text-gray-900 transition"
              >
                <FileWarning size={15} strokeWidth={1.5} />
                Facturas de anticipo
              </Link>
            )}

            {canViewOperaciones && (
              <Link to={paths.analisis.operaciones} className="inline-flex items-center gap-1 hover:text-gray-900 transition">
                <BarChart3 size={15} strokeWidth={1.5} />
                Operaciones
              </Link>
            )}

            {canViewPatentamientos && (
              <Link to={paths.analisis.patentamientos.home} className="inline-flex items-center gap-1 hover:text-gray-900 transition">
                <Upload size={15} strokeWidth={1.5} />
                Patentamientos
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
