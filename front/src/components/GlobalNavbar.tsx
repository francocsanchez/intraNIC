import { useAuth } from "@/hooks/useAuthe";
import { paths } from "@/routes/paths";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { ChevronDown, LogOut, Menu as MenuIcon, UserRound, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import Loading from "./Loading";

type GlobalNavbarProps = {
  centerContent?: ReactNode;
  rightContent?: ReactNode;
};

export default function GlobalNavbar({ centerContent, rightContent }: GlobalNavbarProps) {
  const navigate = useNavigate();
  const { user, isLoading, isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (isLoading) return <Loading />;

  if (!isAuthenticated || !user) {
    return <Navigate to={paths.login} replace />;
  }

  const handleLogout = () => {
    localStorage.removeItem("AUTH_TOKEN");
    setMobileMenuOpen(false);
    navigate(paths.login, { replace: true });
  };

  return (
    <header className="border-b border-gray-200 bg-white backdrop-blur-sm">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link
          to={paths.home}
          onClick={() => setMobileMenuOpen(false)}
          className="flex min-w-0 items-center gap-3 shrink-0"
        >
          <div className="flex h-8 w-8 items-center justify-center bg-black text-[11px] font-bold text-white">
            NIC
          </div>
          <span className="truncate text-base font-semibold uppercase tracking-tight text-gray-900 sm:text-lg">
            IntraNIC
          </span>
        </Link>

        <div className="hidden min-w-0 flex-1 items-center justify-center md:flex">
          {centerContent ? <nav className="flex items-center gap-8 text-sm font-medium text-gray-600">{centerContent}</nav> : null}
        </div>

        <div className="hidden items-center gap-3 shrink-0 md:flex">
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

        <button
          type="button"
          onClick={() => setMobileMenuOpen((current) => !current)}
          className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white p-2 text-gray-700 transition hover:border-gray-300 hover:text-gray-900 md:hidden"
          aria-expanded={mobileMenuOpen}
          aria-label={mobileMenuOpen ? "Cerrar menu" : "Abrir menu"}
        >
          {mobileMenuOpen ? <X size={20} strokeWidth={1.75} /> : <MenuIcon size={20} strokeWidth={1.75} />}
        </button>
      </div>

      {mobileMenuOpen ? (
        <div className="border-t border-gray-200 bg-white md:hidden">
          <div className="mx-auto max-w-7xl space-y-4 px-4 py-4 sm:px-6">
            {centerContent ? (
              <nav
                onClickCapture={(event) => {
                  const target = event.target;
                  if (target instanceof HTMLElement && target.closest("a")) {
                    setMobileMenuOpen(false);
                  }
                }}
                className="flex flex-col gap-1 text-sm font-medium text-gray-700 [&>a]:rounded-lg [&>a]:px-3 [&>a]:py-2 [&>a]:transition [&>a:hover]:bg-gray-50 [&>a:hover]:text-gray-900"
              >
                {centerContent}
              </nav>
            ) : null}

            {rightContent ? (
              <div className="flex flex-col gap-2 [&_.mobile-menu-hidden]:hidden">
                {rightContent}
              </div>
            ) : null}

            <div className="flex flex-col gap-2 border-t border-gray-100 pt-3">
              <Link
                to={paths.miPerfil}
                className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 hover:text-gray-900"
              >
                <UserRound size={16} strokeWidth={1.5} />
                Mi perfil
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-gray-700 transition hover:bg-gray-50 hover:text-gray-900"
              >
                <LogOut size={16} strokeWidth={1.5} />
                Cerrar sesion
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
