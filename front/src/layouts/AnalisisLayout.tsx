import { hasModulePathAccess } from "@/helpers/access";
import BaseAppLayout from "@/layouts/BaseAppLayout";
import { useAuth } from "@/hooks/useAuthe";
import { paths } from "@/routes/paths";
import { BarChart3, ChartColumn, Rows3, Trophy } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export default function AnalisisLayout() {
  const { user } = useAuth();
  const { pathname } = useLocation();

  const navItems = [
    {
      label: "Operaciones",
      to: paths.analisis.operaciones,
      icon: ChartColumn,
      visible: hasModulePathAccess(user, "operaciones", paths.analisis.operaciones),
      active: pathname === paths.analisis.operaciones,
    },
    {
      label: "Analisis Operaciones",
      to: paths.analisis.analisisOperaciones,
      icon: Rows3,
      visible: hasModulePathAccess(user, "analisisOperaciones", paths.analisis.analisisOperaciones),
      active: pathname === paths.analisis.analisisOperaciones,
    },
    {
      label: "Ranking",
      to: paths.convencional.ranking,
      icon: Trophy,
      visible: hasModulePathAccess(user, "ranking", paths.convencional.ranking),
      active: pathname === paths.convencional.ranking,
    },
    {
      label: "Promedio",
      to: paths.convencional.promedio,
      icon: BarChart3,
      visible: hasModulePathAccess(user, "promedio", paths.convencional.promedio),
      active: pathname === paths.convencional.promedio,
    },
  ].filter((item) => item.visible);

  return (
    <BaseAppLayout
      footerLeft="Analisis"
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
