import useRoleGuard from "@/hooks/useRoleGuard";
import { Archive, BookMarked, Package } from "lucide-react";
import { Link } from "react-router-dom";

export default function NavBarUsados() {
  const { allowed: buttonGuardado } = useRoleGuard(["admin", "gerente"]);
  const { allowed: buttonReservas } = useRoleGuard(["admin", "gerente", "supervisor"]);

  return (
    <header className="bg-white border-b border-gray-200 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link className="flex items-center" to={"/"}>
          <img src="/logoNic.png" alt="IntraNIC" className="h-8 w-auto object-contain" />
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-8 text-sm font-medium text-gray-600">
          <Link to={`/stock/disponible/usados`} className="flex items-center gap-2 relative hover:text-gray-900 transition">
            <Package size={16} strokeWidth={1.5} />
            Disponible
          </Link>

          {buttonGuardado && (
            <Link to={`/stock/guardado/usados`} className="flex items-center gap-2 relative hover:text-gray-900 transition">
              <Archive size={16} strokeWidth={1.5} />
              Guardado
            </Link>
          )}

          {buttonReservas && (
            <Link to={`/stock/reservado/usados`} className="flex items-center gap-2 relative hover:text-gray-900 transition">
              <BookMarked size={16} strokeWidth={1.5} />
              Reservas
            </Link>
          )}
        </nav>

      </div>
    </header>
  );
}
