import { useAuth } from "@/hooks/useAuthe";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { CircleUserRound, Cog, MonitorCog, PowerOff, Users, Wrench } from "lucide-react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import Loading from "./Loading";
import useRoleGuard from "@/hooks/useRoleGuard";

type NavBarProps = {
  negocio: string;
};

export default function MenuAdminNavbarLiess({ negocio }: NavBarProps) {
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

  const { allowed: buttonsAdmin } = useRoleGuard(["admin"]);
  return (
    <div className="flex items-center gap-6 text-sm text-gray-600">
      {/* Administración */}
      {buttonsAdmin && (
        <Menu as="div" className="relative">
          <MenuButton className="inline-flex items-center gap-1 hover:text-gray-900 transition">
            <MonitorCog size={16} strokeWidth={1.25} />
            Administración
          </MenuButton>

          <MenuItems anchor="bottom end" className="mt-3 w-52 rounded-xl border border-gray-200 bg-white shadow-lg focus:outline-none">
            <MenuItem>
              {({ focus }) => (
                <Link
                  to={`/admin/usuarios`}
                  className={` px-4 py-2 text-sm flex items-center gap-2 relative ${focus ? "bg-gray-50 text-gray-900" : "text-gray-700"}`}
                >
                  <Users size={16} strokeWidth={1.25} />
                  Usuarios
                </Link>
              )}
            </MenuItem>
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
