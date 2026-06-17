import GlobalNavbar from "@/components/GlobalNavbar";
import { paths } from "@/routes/paths";
import { Package } from "lucide-react";
import { Link } from "react-router-dom";

export default function NavBarLiess() {
  return (
    <GlobalNavbar
      centerContent={
        <>
          <Link to={paths.liess.stockDisponible("nuevos")} className="flex items-center gap-2 relative hover:text-gray-900 transition">
            <Package size={16} strokeWidth={1.5} />
            Nuevos
          </Link>
          <Link to={paths.liess.stockDisponible("usados")} className="flex items-center gap-2 relative hover:text-gray-900 transition">
            <Package size={16} strokeWidth={1.5} />
            Usados
          </Link>
        </>
      }
    />
  );
}
