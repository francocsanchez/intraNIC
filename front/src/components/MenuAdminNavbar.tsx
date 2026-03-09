import { useAuth } from "@/hooks/useAuthe";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import {
  CircleUserRound,
  Cog,
  MonitorCog,
  PowerOff,
  Users,
  Wrench,
} from "lucide-react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import Loading from "./Loading";
import { useQueryClient } from "@tanstack/react-query";

export default function MenuAdminNavbar() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { user, isLoading, isAuthenticated, refetch } = useAuth();

  if (isLoading) return <Loading />;

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = () => {
    localStorage.removeItem("AUTH_TOKEN");

    navigate("/login", { replace: true });
  };
  return (
    <div className="flex items-center gap-6 text-sm text-gray-600">
      {/* Administración */}
      <Menu as="div" className="relative">
        <MenuButton className="inline-flex items-center gap-1 hover:text-gray-900 transition">
          <MonitorCog size={16} strokeWidth={1.25} />
          Administración
        </MenuButton>

        <MenuItems
          anchor="bottom end"
          className="mt-3 w-52 rounded-xl border border-gray-200 bg-white shadow-lg focus:outline-none"
        >
          <MenuItem>
            {({ focus }) => (
              <Link
                to={"/admin/usuarios"}
                className={` px-4 py-2 text-sm flex items-center gap-2 relative ${
                  focus ? "bg-gray-50 text-gray-900" : "text-gray-700"
                }`}
              >
                <Users size={16} strokeWidth={1.25} />
                Usuarios
              </Link>
            )}
          </MenuItem>

          <MenuItem>
            {({ focus }) => (
              <Link
                to={`/admin/configuracion`}
                className={`px-4 py-2 text-sm flex items-center gap-2 relative ${
                  focus ? "bg-gray-50 text-gray-900" : "text-gray-700"
                }`}
              >
                <Cog size={16} strokeWidth={1.25} />
                Configuración
              </Link>
            )}
          </MenuItem>
        </MenuItems>
      </Menu>

      {/* SIAC */}
      <Menu as="div" className="relative">
        <MenuButton className="inline-flex items-center gap-1 hover:text-gray-900 transition">
          <MonitorCog size={16} strokeWidth={1.25} />
          SIAC
        </MenuButton>

        <MenuItems
          anchor="bottom end"
          className="mt-3 w-52 rounded-xl border border-gray-200 bg-white shadow-lg focus:outline-none"
        >
          <MenuItem>
            {({ focus }) => (
              <Link
                to={"/admin/dms/vendedores"}
                className={`px-4 py-2 text-sm flex items-center gap-2 relative ${
                  focus ? "bg-gray-50 text-gray-900" : "text-gray-700"
                }`}
              >
                Vendedores
              </Link>
            )}
          </MenuItem>
        </MenuItems>
      </Menu>

      {/* Perfil */}
      <Menu as="div" className="relative">
        <MenuButton className="inline-flex items-center gap-1 hover:text-gray-900 transition capitalize">
          <CircleUserRound size={16} strokeWidth={1.25} />
          {user.lastName}, {user.name}
        </MenuButton>

        <MenuItems
          anchor="bottom end"
          className="mt-3 w-52 rounded-xl border border-gray-200 bg-white shadow-lg focus:outline-none"
        >
          <MenuItem>
            {({ focus }) => (
              <Link
                to={`/mi-perfil`}
                className={`px-4 py-2 text-sm flex items-center gap-2 relative ${
                  focus ? "bg-gray-50 text-gray-900" : "text-gray-700"
                }`}
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
                className={`px-4 py-2 text-sm flex items-center gap-2 relative ${
                  focus ? "bg-gray-50 text-gray-900" : "text-gray-700"
                }`}
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
