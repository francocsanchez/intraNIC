import BaseAppLayout from "@/layouts/BaseAppLayout";
import { hasModulePathAccess } from "@/helpers/access";
import { useAuth } from "@/hooks/useAuthe";
import { paths } from "@/routes/paths";
import { Package } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export default function NICBelgranoLayout() {
  const { user } = useAuth();
  const { pathname } = useLocation();

  const navItems = [
    {
      label: "Disponible",
      to: paths.belgrano.stockDisponible,
      icon: Package,
      visible: hasModulePathAccess(
        user,
        "belgrano",
        paths.belgrano.stockDisponible,
      ),
      active: pathname === paths.belgrano.stockDisponible,
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
                item.active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
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
