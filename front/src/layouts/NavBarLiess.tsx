import GlobalNavbar from "@/components/GlobalNavbar";
import { paths } from "@/routes/paths";
import { Package } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export default function NavBarLiess() {
  const { pathname } = useLocation();
  const navItems = [
    {
      label: "Nuevos",
      to: paths.liess.stockDisponible("nuevos"),
      active: pathname === paths.liess.stockDisponible("nuevos"),
    },
    {
      label: "Usados",
      to: paths.liess.stockDisponible("usados"),
      active: pathname === paths.liess.stockDisponible("usados"),
    },
  ];

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
              <Package size={16} strokeWidth={1.75} />
              {item.label}
            </Link>
          ))}
        </>
      }
    />
  );
}
