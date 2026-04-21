import MenuAdminNavbarNic from "@/components/MenuAdminNavbarNic";
import useRoleGuard from "@/hooks/useRoleGuard";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { Archive, BookMarked, ChartBarBig, Package, Trophy } from "lucide-react";
import { Link } from "react-router-dom";

type NavBarProps = {
  negocio: string;
};

export default function NavBarNic({ negocio }: NavBarProps) {
  const { allowed: buttonGuardado } = useRoleGuard(["admin", "gerente"]);
  const { allowed: buttonReservas } = useRoleGuard(["admin", "gerente", "supervisor"]);
  const { allowed: buttonPromedios } = useRoleGuard(["admin", "gerente", "supervisor"]);

  return (
    <header className="bg-white border-b border-gray-200 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link className="flex items-center" to={"/"}>
          <img src="/logoNic.png" alt="IntraNIC" className="h-8 w-auto object-contain" />
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-8 text-sm font-medium text-gray-600">
          <Link to="/ranking-convencional" className="flex items-center gap-2 relative hover:text-gray-900 transition">
            <Trophy size={16} strokeWidth={1.5} />
            Ranking de ventas
          </Link>

          <Link to={`/stock/disponible/${negocio}`} className="flex items-center gap-2 relative hover:text-gray-900 transition">
            <Package size={16} strokeWidth={1.5} />
            Disponible
          </Link>

          {buttonGuardado && (
            <Link to={`/stock/guardado/${negocio}`} className="flex items-center gap-2 relative hover:text-gray-900 transition">
              <Archive size={16} strokeWidth={1.5} />
              Guardado
            </Link>
          )}

          {buttonReservas && (
            <Link to={`/stock/reservado/${negocio}`} className="flex items-center gap-2 relative hover:text-gray-900 transition">
              <BookMarked size={16} strokeWidth={1.5} />
              Reservas
            </Link>
          )}

          {buttonPromedios && (
            <Menu as="div" className="relative">
              <MenuButton className="inline-flex items-center gap-2 hover:text-gray-900 transition">
                <ChartBarBig size={16} strokeWidth={1.5} />
                Reportes
              </MenuButton>

              <MenuItems anchor="bottom start" className="mt-3 w-56 rounded-xl border border-gray-200 bg-white shadow-lg focus:outline-none">
                <MenuItem>
                  {({ focus }) => (
                    <Link
                      to="/promedio-convencional"
                      className={`px-4 py-2 text-sm flex items-center gap-2 relative ${focus ? "bg-gray-50 text-gray-900" : "text-gray-700"}`}
                    >
                      <ChartBarBig size={16} strokeWidth={1.5} />
                      Promedios de ventas
                    </Link>
                  )}
                </MenuItem>
              </MenuItems>
            </Menu>
          )}
        </nav>

        {/* Menu administracion / perfil */}
        <MenuAdminNavbarNic negocio={negocio} />
      </div>
    </header>
  );
}
