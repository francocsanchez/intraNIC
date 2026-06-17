import GlobalNavbar from "@/components/GlobalNavbar";
import Loading from "@/components/Loading";
import { hasAnyRole } from "@/helpers/access";
import { useAuth } from "@/hooks/useAuthe";
import { paths } from "@/routes/paths";
import { ClipboardList, FileWarning, ReceiptText } from "lucide-react";
import { Link, Navigate, Outlet } from "react-router-dom";

export default function AdminModuleLayout() {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) return <Loading />;

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  const canViewReventas = hasAnyRole(user, ["admin", "stock", "gerente", "supervisor", "vendedor", "administracion"]);
  const canViewPedidoUnidades = hasAnyRole(user, ["admin", "stock", "administracion", "gerente"]);
  const canViewFacturasAnticipo = hasAnyRole(user, ["administracion"]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <GlobalNavbar
        centerContent={
          <>
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
          <span>Modulo de administracion</span>
          <span>{new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  );
}
