import { hasModulePathAccess } from "@/helpers/access";
import BaseAppLayout from "@/layouts/BaseAppLayout";
import { useAuth } from "@/hooks/useAuthe";
import { paths } from "@/routes/paths";
import { Link } from "react-router-dom";

export default function GestionConvencionalLayout() {
  const { user } = useAuth();

  const canViewAsignaciones = hasModulePathAccess(user, "asignaciones", paths.convencional.asignaciones);
  const canViewPlanNegocio = hasModulePathAccess(user, "planNegocio", paths.convencional.planNegocio);
  const canViewRegistroAsignaciones = hasModulePathAccess(user, "registroAsignaciones", paths.convencional.registroAsignaciones);
  const canViewPedidoMensual = hasModulePathAccess(user, "pedidoMensual", paths.convencional.pedidoMensual);
  const canViewPedidoUnidades = hasModulePathAccess(user, "pedidoUnidades", paths.convencional.pedidoUnidades);
  const canViewAnalisisStock = hasModulePathAccess(user, "analisisStock", paths.convencional.analisisStock);
  const canViewAnalisisStockDictionary = hasModulePathAccess(
    user,
    "analisisStock",
    paths.convencional.analisisStockDiccionarioVersiones,
  );

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

          {canViewPlanNegocio ? (
            <Link to={paths.convencional.planNegocio} className="hover:text-gray-900 transition">
              Plan de negocio
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

          {canViewAnalisisStock ? (
            <Link to={paths.convencional.analisisStock} className="hover:text-gray-900 transition">
              Analisis de stock
            </Link>
          ) : null}

          {canViewAnalisisStockDictionary ? (
            <Link to={paths.convencional.analisisStockDiccionarioVersiones} className="hover:text-gray-900 transition">
              Diccionario versiones
            </Link>
          ) : null}
        </>
      }
    />
  );
}
