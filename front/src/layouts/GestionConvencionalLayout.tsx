import { hasModulePathAccess } from "@/helpers/access";
import BaseAppLayout from "@/layouts/BaseAppLayout";
import { useAuth } from "@/hooks/useAuthe";
import { paths } from "@/routes/paths";
import { BarChart3, ClipboardList, FileStack, Package, Wrench } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export default function GestionConvencionalLayout() {
  const { user } = useAuth();
  const { pathname } = useLocation();

  const navItems = [
    {
      label: "Asignaciones",
      to: paths.convencional.asignaciones,
      icon: Wrench,
      visible: hasModulePathAccess(user, "asignaciones", paths.convencional.asignaciones),
      active: pathname === paths.convencional.asignaciones,
    },
    {
      label: "Plan de negocio",
      to: paths.convencional.planNegocio,
      icon: BarChart3,
      visible: hasModulePathAccess(user, "planNegocio", paths.convencional.planNegocio),
      active: pathname === paths.convencional.planNegocio,
    },
    {
      label: "Registro asign.",
      to: paths.convencional.registroAsignaciones,
      icon: ClipboardList,
      visible: hasModulePathAccess(user, "registroAsignaciones", paths.convencional.registroAsignaciones),
      active:
        pathname === paths.convencional.registroAsignaciones ||
        pathname === paths.convencional.registroAsignacionesResumen,
    },
    {
      label: "Pedido unidades",
      to: paths.convencional.pedidoUnidades,
      icon: Package,
      visible: hasModulePathAccess(user, "pedidoUnidades", paths.convencional.pedidoUnidades),
      active: pathname === paths.convencional.pedidoUnidades,
    },
    {
      label: "Analisis stock",
      to: paths.convencional.analisisStock,
      icon: BarChart3,
      visible: hasModulePathAccess(user, "analisisStock", paths.convencional.analisisStock),
      active:
        pathname === paths.convencional.analisisStock ||
        pathname === paths.convencional.analisisStockDiccionarioVersiones,
    },
    {
      label: "Pend. fac",
      to: paths.convencional.pendFac,
      icon: FileStack,
      visible: hasModulePathAccess(user, "pendFac", paths.convencional.pendFac),
      active: pathname === paths.convencional.pendFac,
    },
  ].filter((item) => item.visible);

  return (
    <BaseAppLayout
      footerLeft="Gestion convencional"
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
