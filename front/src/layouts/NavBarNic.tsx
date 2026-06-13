import MenuAdminNavbarNic from "@/components/MenuAdminNavbarNic";
import useRoleGuard from "@/hooks/useRoleGuard";
import { paths } from "@/routes/paths";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { Archive, BookMarked, ChartBarBig, ClipboardList, MonitorCog, Package, Trophy } from "lucide-react";
import { Link } from "react-router-dom";

type NavBarProps = {
  negocio: string;
};

export default function NavBarNic({ negocio }: NavBarProps) {
  const { allowed: buttonGuardado } = useRoleGuard(["admin", "gerente", "stock"]);
  const { allowed: buttonReservas } = useRoleGuard(["admin", "gerente", "supervisor", "stock"]);
  const { allowed: buttonRanking } = useRoleGuard(["admin", "gerente", "vendedor", "stock"]);
  const { allowed: buttonPromedios } = useRoleGuard(["admin", "gerente", "vendedor", "stock"]);
  const { allowed: buttonAsignaciones } = useRoleGuard(["admin", "gerente", "stock"]);
  const { allowed: buttonRegistroAsignaciones } = useRoleGuard(["admin", "gerente", "stock"]);
  const { allowed: buttonPedidoMensual } = useRoleGuard(["admin", "gerente", "stock"]);

  const disponiblePath = negocio === "convencional" ? paths.convencional.stockDisponible : `/stock/disponible/${negocio}`;
  const reservasPath = negocio === "convencional" ? paths.convencional.stockReservado : `/stock/reservado/${negocio}`;
  const guardadoPath = negocio === "convencional" ? paths.convencional.stockGuardado : `/stock/guardado/${negocio}`;

  return (
    <header className="bg-white border-b border-gray-200 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link className="flex items-center" to={"/"}>
          <img src="/logoNic.png" alt="IntraNIC" className="h-8 w-auto object-contain" />
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-8 text-sm font-medium text-gray-600">
          <Link to={disponiblePath} className="flex items-center gap-2 relative hover:text-gray-900 transition">
            <Package size={16} strokeWidth={1.5} />
            Disponible
          </Link>

          {buttonReservas ? (
            <Link to={reservasPath} className="flex items-center gap-2 relative hover:text-gray-900 transition">
              <BookMarked size={16} strokeWidth={1.5} />
              Reservas
            </Link>
          ) : null}

          {buttonGuardado ? (
            <Link to={guardadoPath} className="flex items-center gap-2 relative hover:text-gray-900 transition">
              <Archive size={16} strokeWidth={1.5} />
              Guardado
            </Link>
          ) : null}

          {(buttonRanking || buttonPromedios) ? (
            <Menu as="div" className="relative">
              <MenuButton className="inline-flex items-center gap-2 hover:text-gray-900 transition">
                <ChartBarBig size={16} strokeWidth={1.5} />
                Reportes
              </MenuButton>

              <MenuItems anchor="bottom start" className="mt-3 w-56 rounded-xl border border-gray-200 bg-white shadow-lg focus:outline-none">
                {buttonRanking ? (
                  <MenuItem>
                    {({ focus }) => (
                      <Link
                        to={paths.convencional.ranking}
                        className={`px-4 py-2 text-sm flex items-center gap-2 relative ${focus ? "bg-gray-50 text-gray-900" : "text-gray-700"}`}
                      >
                        <Trophy size={16} strokeWidth={1.5} />
                        Ranking de vendedores
                      </Link>
                    )}
                  </MenuItem>
                ) : null}

                {buttonPromedios ? (
                  <MenuItem>
                    {({ focus }) => (
                      <Link
                        to={paths.convencional.promedio}
                        className={`px-4 py-2 text-sm flex items-center gap-2 relative ${focus ? "bg-gray-50 text-gray-900" : "text-gray-700"}`}
                      >
                        <ChartBarBig size={16} strokeWidth={1.5} />
                        Promedio de ventas
                      </Link>
                    )}
                  </MenuItem>
                ) : null}
              </MenuItems>
            </Menu>
          ) : null}

          {(buttonAsignaciones || buttonRegistroAsignaciones || buttonPedidoMensual) ? (
            <Menu as="div" className="relative">
              <MenuButton className="inline-flex items-center gap-2 hover:text-gray-900 transition">
                <MonitorCog size={16} strokeWidth={1.5} />
                Gestion
              </MenuButton>

              <MenuItems anchor="bottom start" className="mt-3 w-60 rounded-xl border border-gray-200 bg-white shadow-lg focus:outline-none">
                {buttonAsignaciones ? (
                  <MenuItem>
                    {({ focus }) => (
                      <Link
                        to={paths.convencional.asignaciones}
                        className={`px-4 py-2 text-sm flex items-center gap-2 relative ${focus ? "bg-gray-50 text-gray-900" : "text-gray-700"}`}
                      >
                        <MonitorCog size={16} strokeWidth={1.5} />
                        Asignaciones
                      </Link>
                    )}
                  </MenuItem>
                ) : null}

                {buttonRegistroAsignaciones ? (
                  <MenuItem>
                    {({ focus }) => (
                      <Link
                        to={paths.convencional.registroAsignaciones}
                        className={`px-4 py-2 text-sm flex items-center gap-2 relative ${focus ? "bg-gray-50 text-gray-900" : "text-gray-700"}`}
                      >
                        <ClipboardList size={16} strokeWidth={1.5} />
                        Registro de asignaciones
                      </Link>
                    )}
                  </MenuItem>
                ) : null}

                {buttonPedidoMensual ? (
                  <MenuItem>
                    {({ focus }) => (
                      <Link
                        to={paths.convencional.pedidoMensual}
                        className={`px-4 py-2 text-sm flex items-center gap-2 relative ${focus ? "bg-gray-50 text-gray-900" : "text-gray-700"}`}
                      >
                        <Package size={16} strokeWidth={1.5} />
                        Pedido mensual
                      </Link>
                    )}
                  </MenuItem>
                ) : null}

              </MenuItems>
            </Menu>
          ) : null}

        </nav>

        {/* Menu administracion / perfil */}
        <MenuAdminNavbarNic negocio={negocio} />
      </div>
    </header>
  );
}
