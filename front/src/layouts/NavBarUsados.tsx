import GlobalNavbar from "@/components/GlobalNavbar";
import useRoleGuard from "@/hooks/useRoleGuard";
import { paths } from "@/routes/paths";
import { Archive, BookMarked, Package } from "lucide-react";
import { Link } from "react-router-dom";

export default function NavBarUsados() {
  const { allowed: buttonGuardado } = useRoleGuard(["admin", "gerente", "supervisor", "stock"]);
  const { allowed: buttonReservas } = useRoleGuard(["admin", "gerente", "supervisor", "stock"]);

  return (
    <GlobalNavbar
      centerContent={
        <>
          <Link to={paths.usados.stockDisponible} className="flex items-center gap-2 relative hover:text-gray-900 transition">
            <Package size={16} strokeWidth={1.5} />
            Disponible
          </Link>

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
