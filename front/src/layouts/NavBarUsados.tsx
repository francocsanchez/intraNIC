import GlobalNavbar from "@/components/GlobalNavbar";
import { hasModulePathAccess } from "@/helpers/access";
import { useAuth } from "@/hooks/useAuthe";
import { paths } from "@/routes/paths";
import { Archive, BookMarked, Package } from "lucide-react";
import { Link } from "react-router-dom";

export default function NavBarUsados() {
  const { user } = useAuth();
  const canViewDisponible = hasModulePathAccess(user, "usados", paths.usados.stockDisponible);
  const buttonGuardado = hasModulePathAccess(user, "usados", paths.usados.stockGuardado);
  const buttonReservas = hasModulePathAccess(user, "usados", paths.usados.stockReservado);

  return (
    <GlobalNavbar
      centerContent={
        <>
          {canViewDisponible ? (
            <Link to={paths.usados.stockDisponible} className="flex items-center gap-2 relative hover:text-gray-900 transition">
              <Package size={16} strokeWidth={1.5} />
              Disponible
            </Link>
          ) : null}

          {buttonReservas && (
            <Link to={paths.usados.stockReservado} className="flex items-center gap-2 relative hover:text-gray-900 transition">
              <BookMarked size={16} strokeWidth={1.5} />
              Reservas
            </Link>
          )}

          {buttonGuardado && (
            <Link to={paths.usados.stockGuardado} className="flex items-center gap-2 relative hover:text-gray-900 transition">
              <Archive size={16} strokeWidth={1.5} />
              Guardado
            </Link>
          )}
        </>
      }
    />
  );
}
