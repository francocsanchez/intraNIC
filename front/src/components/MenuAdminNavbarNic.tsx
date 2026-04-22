import { useAuth } from "@/hooks/useAuthe";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { BookMarked, CalendarClock, ChartBarBig, CircleUserRound, FileChartPie, Handshake, MonitorCog, PowerOff, Ticket, Wrench } from "lucide-react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import Loading from "./Loading";
import useRoleGuard from "@/hooks/useRoleGuard";
import { hasAnyCompany, hasAnyRole } from "@/helpers/access";

type NavBarProps = {
  negocio: string;
};

export default function MenuAdminNavbarNic({ negocio }: NavBarProps) {
  const navigate = useNavigate();

  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) return <Loading />;

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = () => {
    localStorage.removeItem("AUTH_TOKEN");
    navigate("/login", { replace: true });
  };

  const canViewGestion = hasAnyRole(user, ["admin", "gerente", "stock", "administracion"]);
  const { allowed: canViewAsignaciones } = useRoleGuard(["admin", "gerente", "stock"]);
  const { allowed: canViewConsolidado } = useRoleGuard(["admin"]);
  const { allowed: canViewReventasByRole } = useRoleGuard(["admin", "gerente", "stock", "administracion"]);
  const canViewReventas = canViewReventasByRole && hasAnyCompany(user, ["reventa"]);
  const canViewOperativeMenu = hasAnyRole(user, ["admin", "gerente", "supervisor", "vendedor"]);
  return (
    <div className="flex items-center gap-6 text-sm text-gray-600">
      {canViewGestion && (
        <Menu as="div" className="relative">
          <MenuButton className="inline-flex items-center gap-1 hover:text-gray-900 transition">
            <MonitorCog size={16} strokeWidth={1.25} />
            Gestion
          </MenuButton>

          <MenuItems anchor="bottom end" className="mt-3 w-52 rounded-xl border border-gray-200 bg-white shadow-lg focus:outline-none">
            {canViewAsignaciones ? (
              <MenuItem>
                {({ focus }) => (
                  <Link
                    to={"/asignaciones"}
                    className={`px-4 py-2 text-sm flex items-center gap-2 relative ${focus ? "bg-gray-50 text-gray-900" : "text-gray-700"}`}
                  >
                    <FileChartPie size={16} strokeWidth={1.5} />
                    Asignaciones
                  </Link>
                )}
              </MenuItem>
            ) : null}
            {canViewConsolidado ? (
              <MenuItem>
                {({ focus }) => (
                  <Link
                    to={"/consolidado"}
                    className={`px-4 py-2 text-sm flex items-center gap-2 relative ${focus ? "bg-gray-50 text-gray-900" : "text-gray-700"}`}
                  >
                    <ChartBarBig size={16} strokeWidth={1.5} />
                    Stock consolidado
                  </Link>
                )}
              </MenuItem>
            ) : null}
            {canViewReventas ? (
              <MenuItem>
                {({ focus }) => (
                  <Link
                    to={"/reventa-pendientes"}
                    className={`px-4 py-2 text-sm flex items-center gap-2 relative ${focus ? "bg-gray-50 text-gray-900" : "text-gray-700"}`}
                  >
                    <Ticket size={16} strokeWidth={1.5} />
                    Reventas pendientes
                  </Link>
                )}
              </MenuItem>
            ) : null}
          </MenuItems>
        </Menu>
      )}

      {/* Perfil */}
      <Menu as="div" className="relative">
        <MenuButton className="inline-flex items-center gap-1 hover:text-gray-900 transition capitalize">
          <CircleUserRound size={16} strokeWidth={1.25} />
          {user.lastName}, {user.name}
        </MenuButton>

        <MenuItems anchor="bottom end" className="mt-3 w-52 rounded-xl border border-gray-200 bg-white shadow-lg focus:outline-none">
          <MenuItem>
            {({ focus }) => (
              <Link
                to={`/mi-perfil/${negocio}`}
                className={`px-4 py-2 text-sm flex items-center gap-2 relative ${focus ? "bg-gray-50 text-gray-900" : "text-gray-700"}`}
              >
                <Wrench size={16} strokeWidth={1.25} />
                Mi cuenta
              </Link>
            )}
          </MenuItem>

          {canViewOperativeMenu ? (
            <MenuItem>
              {({ focus }) => (
                <Link
                  to={`/mis-operaciones/${negocio}`}
                  className={`px-4 py-2 text-sm flex items-center gap-2 relative ${focus ? "bg-gray-50 text-gray-900" : "text-gray-700"}`}
                >
                  <Handshake size={16} strokeWidth={1.25} />
                  Mis Operaciones
                </Link>
              )}
            </MenuItem>
          ) : null}

          {canViewOperativeMenu ? (
            <MenuItem>
              {({ focus }) => (
                <Link
                  to={`/mis-reservas/${negocio}`}
                  className={`px-4 py-2 text-sm flex items-center gap-2 relative ${focus ? "bg-gray-50 text-gray-900" : "text-gray-700"}`}
                >
                  <BookMarked size={16} strokeWidth={1.25} />
                  Mis reservas
                </Link>
              )}
            </MenuItem>
          ) : null}

          {canViewOperativeMenu ? (
            <MenuItem>
              {({ focus }) => (
                <Link
                  to={`/mi-lista-espera/${negocio}`}
                  className={`px-4 py-2 text-sm flex items-center gap-2 relative ${focus ? "bg-gray-50 text-gray-900" : "text-gray-700"}`}
                >
                  <CalendarClock size={16} strokeWidth={1.25} />
                  Mis Lista de espera
                </Link>
              )}
            </MenuItem>
          ) : null}

          <MenuItem>
            {({ focus }) => (
              <a
                onClick={handleLogout}
                href="#"
                className={`px-4 py-2 text-sm flex items-center gap-2 relative ${focus ? "bg-gray-50 text-gray-900" : "text-gray-700"}`}
              >
                <PowerOff size={16} strokeWidth={1.25} />
                Cerrar sesión
              </a>
            )}
          </MenuItem>
        </MenuItems>
      </Menu>
    </div>
  );
}
