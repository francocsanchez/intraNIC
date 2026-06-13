import useRoleGuard from "@/hooks/useRoleGuard";
import { paths } from "@/routes/paths";
import { Archive, BookMarked, FileClock, Import, Package, UserCheck, Wrench } from "lucide-react";
import { Link } from "react-router-dom";

export default function NavBarUsados() {
  const { allowed: buttonGuardado } = useRoleGuard(["admin", "gerente", "supervisor", "stock"]);
  const { allowed: buttonReservas } = useRoleGuard(["admin", "gerente", "supervisor", "stock"]);
  const { allowed: buttonIngreso } = useRoleGuard(["admin", "gerente", "stock"]);
  const { allowed: buttonNuevosEstados } = useRoleGuard(["admin", "gerente", "stock"]);

  return (
    <header className="bg-white border-b border-gray-200 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link className="flex items-center" to={"/"}>
          <img src="/logoNic.png" alt="IntraNIC" className="h-8 w-auto object-contain" />
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-8 text-sm font-medium text-gray-600">
          <Link to={paths.usados.stockDisponible} className="flex items-center gap-2 relative hover:text-gray-900 transition">
            <Package size={16} strokeWidth={1.5} />
            Disponible
          </Link>

          {buttonGuardado && (
            <Link to={paths.usados.stockGuardado} className="flex items-center gap-2 relative hover:text-gray-900 transition">
              <Archive size={16} strokeWidth={1.5} />
              Guardado
            </Link>
          )}

          {buttonNuevosEstados && (
            <Link to={paths.usados.stockNoReparado} className="flex items-center gap-2 relative hover:text-gray-900 transition">
              <Wrench size={16} strokeWidth={1.5} />
              Stock No Reparado
            </Link>
          )}

          {buttonNuevosEstados && (
            <Link to={paths.usados.stockPendienteDocumentacion} className="flex items-center gap-2 relative hover:text-gray-900 transition">
              <FileClock size={16} strokeWidth={1.5} />
              Stock Pend. Docu.
            </Link>
          )}

          {buttonReservas && (
            <Link to={paths.usados.stockReservado} className="flex items-center gap-2 relative hover:text-gray-900 transition">
              <BookMarked size={16} strokeWidth={1.5} />
              Reservas
            </Link>
          )}

          <Link to={paths.usados.misReservas} className="flex items-center gap-2 relative hover:text-gray-900 transition">
            <UserCheck size={16} strokeWidth={1.5} />
            Mis Reservas
          </Link>

          {buttonIngreso && (
            <Link to={paths.usados.stockIngresos} className="flex items-center gap-2 relative hover:text-gray-900 transition">
              <Import size={16} strokeWidth={1.5} />A ingresar
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
