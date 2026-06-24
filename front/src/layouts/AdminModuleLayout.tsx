import BaseAppLayout from "@/layouts/BaseAppLayout";
import { hasAnyModuleAccess, hasModuleAccess, hasModulePathAccess, hasPathAccess } from "@/helpers/access";
import { useAuth } from "@/hooks/useAuthe";
import { paths } from "@/routes/paths";
import { ClipboardList, FileWarning, List, ReceiptText, Factory } from "lucide-react";
import { Link } from "react-router-dom";

export default function AdminModuleLayout() {
  const { user } = useAuth();

  const canViewReventas = hasModulePathAccess(user, "reventaPendientes", paths.administracion.reventaPendientes);
  const canViewPedidoUnidades = hasModulePathAccess(user, "listaPrevia", paths.administracion.pedidoUnidadesListaPrevia);
  const canViewFacturasAnticipo = hasModulePathAccess(user, "facturasAnticipo", paths.administracion.facturasAnticipo);
  const canViewSegUnidadesFabrica = hasModuleAccess(user, "segUnidadesFabrica");
  const canViewPedidoUnidadesRegistros = hasAnyModuleAccess(user, ["listaPrevia", "pedidoUnidades"])
    && hasPathAccess(user, paths.administracion.pedidoUnidadesRegistros);

  return (
    <BaseAppLayout
      footerLeft="Modulo de administracion"
      footerRight={new Date().getFullYear()}
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

          {canViewPedidoUnidadesRegistros && (
            <Link
              to={paths.administracion.pedidoUnidadesRegistros}
              className="inline-flex items-center gap-1 hover:text-gray-900 transition"
            >
              <List size={15} strokeWidth={1.5} />
              Registros de pedidos
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

          {canViewSegUnidadesFabrica && (
            <Link
              to={paths.administracion.segUnidadesFabrica}
              className="inline-flex items-center gap-1 hover:text-gray-900 transition"
            >
              <Factory size={15} strokeWidth={1.5} />
              Seg. unidades fabrica
            </Link>
          )}
        </>
      }
    />
  );
}
