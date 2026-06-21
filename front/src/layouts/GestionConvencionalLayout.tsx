import { hasModulePathAccess } from "@/helpers/access";
import BaseAppLayout from "@/layouts/BaseAppLayout";
import { useAuth } from "@/hooks/useAuthe";
import { paths } from "@/routes/paths";
import { Link } from "react-router-dom";

export default function GestionConvencionalLayout() {
  const { user } = useAuth();

  const canViewAsignaciones = hasModulePathAccess(user, "asignaciones", paths.convencional.asignaciones);
  const canViewRegistroAsignaciones = hasModulePathAccess(user, "registroAsignaciones", paths.convencional.registroAsignaciones);
  const canViewPedidoMensual = hasModulePathAccess(user, "pedidoMensual", paths.convencional.pedidoMensual);
  const canViewPedidoUnidades = hasModulePathAccess(user, "pedidoUnidades", paths.convencional.pedidoUnidades);

  return (
    <BaseAppLayout
      footerLeft="Gestion convencional"
      footerRight={new Date().getFullYear()}
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
  );
}
