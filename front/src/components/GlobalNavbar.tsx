import { useAuth } from "@/hooks/useAuthe";
import { paths } from "@/routes/paths";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { ChevronDown, LogOut, UserRound } from "lucide-react";
import type { ReactNode } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import Loading from "./Loading";

type GlobalNavbarProps = {
  centerContent?: ReactNode;
  rightContent?: ReactNode;
};

export default function GlobalNavbar({ centerContent, rightContent }: GlobalNavbarProps) {
  const navigate = useNavigate();
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) return <Loading />;

  if (!isAuthenticated || !user) {
    return <Navigate to={paths.login} replace />;
  }

  const handleLogout = () => {
    localStorage.removeItem("AUTH_TOKEN");
    navigate(paths.login, { replace: true });
  };

  return (
    <header className="bg-white border-b border-gray-200 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-6">
        <Link to={paths.home} className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 bg-black text-white flex items-center justify-center text-[11px] font-bold">
            NIC
          </div>
          <span className="text-lg font-semibold tracking-tight uppercase text-gray-900">IntraNIC</span>
        </Link>

        <div className="flex-1 flex items-center justify-center min-w-0">
          {centerContent ? <nav className="flex items-center gap-8 text-sm font-medium text-gray-600">{centerContent}</nav> : null}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {rightContent}

          <Menu as="div" className="relative">
            <MenuButton className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:border-gray-300 hover:text-gray-900">
              <UserRound size={16} strokeWidth={1.75} />
              Mi perfil
              <ChevronDown size={15} strokeWidth={1.75} />
            </MenuButton>

            <MenuItems anchor="bottom end" className="mt-2 w-44 rounded-xl border border-gray-200 bg-white shadow-lg focus:outline-none">
              <MenuItem>
                {({ focus }) => (
                  <Link
                    to={paths.miPerfil}
                    className={`px-4 py-2 text-sm flex items-center gap-2 ${focus ? "bg-gray-50 text-gray-900" : "text-gray-700"}`}
                  >
                    <UserRound size={16} strokeWidth={1.5} />
                    Mi perfil
                  </Link>
                )}
              </MenuItem>

              <MenuItem>
                {({ focus }) => (
                  <button
                    type="button"
                    onClick={handleLogout}
                    className={`w-full px-4 py-2 text-sm flex items-center gap-2 ${focus ? "bg-gray-50 text-gray-900" : "text-gray-700"}`}
                  >
                    <LogOut size={16} strokeWidth={1.5} />
                    Cerrar sesion
                  </button>
                )}
              </MenuItem>
            </MenuItems>
          </Menu>
        </div>
      </div>
    </header>
  );
}
