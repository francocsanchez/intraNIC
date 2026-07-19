import { hasModulePathAccess } from "@/helpers/access";
import BaseAppLayout from "@/layouts/BaseAppLayout";
import { useAuth } from "@/hooks/useAuthe";
import { paths } from "@/routes/paths";
import { FileSearch, Hammer, Inbox } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export default function GestionUsadosLayout() {
  const { user } = useAuth();
  const { pathname } = useLocation();

  const navItems = [
    {
      label: "No reparado",
      to: paths.usados.stockNoReparado,
      icon: Hammer,
      visible: hasModulePathAccess(user, "noReparado", paths.usados.stockNoReparado),
      active: pathname === paths.usados.stockNoReparado,
    },
    {
      label: "Pend. documentacion",
      to: paths.usados.stockPendienteDocumentacion,
      icon: FileSearch,
      visible: hasModulePathAccess(user, "pendienteDocumentacion", paths.usados.stockPendienteDocumentacion),
      active: pathname === paths.usados.stockPendienteDocumentacion,
    },
    {
      label: "Ingresos",
      to: paths.usados.stockIngresos,
      icon: Inbox,
      visible: hasModulePathAccess(user, "ingresos", paths.usados.stockIngresos),
      active: pathname === paths.usados.stockIngresos,
    },
  ].filter((item) => item.visible);

  return (
    <BaseAppLayout
      footerLeft="Gestion usados"
      footerRight="Franco Sanchez"
      centerContent={
        <>
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={[
                "inline-flex items-center gap-2 rounded-md px-3 py-2 transition",
                item.active ? "bg-gray-900 text-white" : "text-gray-600 hover:text-gray-900",
              ].join(" ")}
            >
              <item.icon size={16} strokeWidth={1.75} />
              {item.label}
            </Link>
          ))}
        </>
      }
      mainClassName="px-4 py-6"
    />
  );
}
