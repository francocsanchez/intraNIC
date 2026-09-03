import BaseAppLayout from "@/layouts/BaseAppLayout";
import { hasAnyModuleAccess, hasModulePathAccess, hasPathAccess } from "@/helpers/access";
import { useAuth } from "@/hooks/useAuthe";
import { paths } from "@/routes/paths";
import { ClipboardList, FileWarning, List, ReceiptText } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export default function AdminModuleLayout() {
  const { user } = useAuth();
  const { pathname } = useLocation();

  const navItems = [
    {
      label: "Pend. reventas",
      to: paths.administracion.reventaPendientes,
      icon: ReceiptText,
      visible: hasModulePathAccess(user, "reventaPendientes", paths.administracion.reventaPendientes),
      active: pathname === paths.administracion.reventaPendientes,
    },
    {
      label: "Pedido unidades",
      to: paths.administracion.pedidoUnidadesListaPrevia,
      icon: ClipboardList,
      visible: hasModulePathAccess(user, "listaPrevia", paths.administracion.pedidoUnidadesListaPrevia),
      active:
        pathname === paths.administracion.pedidoUnidadesListaPrevia ||
        pathname === paths.administracion.pedidoUnidadesRegistros,
    },
    {
      label: "Registros pedidos",
      to: paths.administracion.pedidoUnidadesRegistros,
      icon: List,
      visible:
        hasAnyModuleAccess(user, ["listaPrevia", "pedidoUnidades"]) &&
        hasPathAccess(user, paths.administracion.pedidoUnidadesRegistros),
      active: pathname === paths.administracion.pedidoUnidadesRegistros,
    },
    {
      label: "Fact. anticipo",
      to: paths.administracion.facturasAnticipo,
      icon: FileWarning,
      visible: hasModulePathAccess(user, "facturasAnticipo", paths.administracion.facturasAnticipo),
      active: pathname === paths.administracion.facturasAnticipo,
    },
  ].filter((item) => item.visible);

  return (
    <BaseAppLayout
      footerLeft="IntraNIC - Uso interno Nippon Car"
      footerRight="Desarrollado por Franco Sanchez"
      centerContent={
        <>
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={[
                "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                item.active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
              ].join(" ")}
            >
              <item.icon size={16} strokeWidth={1.75} />
              {item.label}
            </Link>
          ))}
        </>
      }
      mainClassName="px-2 py-3"
      presetNavigation
    />
  );
}
