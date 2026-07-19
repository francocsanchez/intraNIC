import GlobalNavbar from "@/components/GlobalNavbar";
import { hasModulePathAccess } from "@/helpers/access";
import { useAuth } from "@/hooks/useAuthe";
import { paths } from "@/routes/paths";
import { Archive, BookMarked, Package } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export default function NavBarUsados() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const canViewDisponible = hasModulePathAccess(user, "usados", paths.usados.stockDisponible);
  const buttonGuardado = hasModulePathAccess(user, "usados", paths.usados.stockGuardado);
  const buttonReservas = hasModulePathAccess(user, "usados", paths.usados.stockReservado);
  const navItems = [
    {
      label: "Disponible",
      to: paths.usados.stockDisponible,
      icon: Package,
      visible: canViewDisponible,
      active: pathname === paths.usados.stockDisponible,
    },
    {
      label: "Reservas",
      to: paths.usados.stockReservado,
      icon: BookMarked,
      visible: buttonReservas,
      active: pathname === paths.usados.stockReservado,
    },
    {
      label: "Guardado",
      to: paths.usados.stockGuardado,
      icon: Archive,
      visible: buttonGuardado,
      active: pathname === paths.usados.stockGuardado,
    },
  ].filter((item) => item.visible);

  return (
    <GlobalNavbar
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
    />
  );
}
