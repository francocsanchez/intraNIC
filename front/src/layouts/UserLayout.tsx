import { Link, Outlet } from "react-router-dom";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { CircleUserRound, MonitorCog } from "lucide-react";

export default function UserLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Navbar */}

      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 h-16 grid grid-cols-3 items-center">
          {/* Logo */}
          <div className="font-semibold text-gray-900 tracking-tight">
            Sistema
          </div>

          {/* Center navigation */}
          <nav className="flex justify-center items-center gap-8 text-sm text-gray-600">
            <Link
              to={`/stock/disponible/convencional`}
              className="hover:text-gray-900 cursor-pointer"
            >
              Disponible
            </Link>
            <Link
              to={`/stock/guardado/convencional`}
              className="hover:text-gray-900 cursor-pointer"
            >
              Guardado
            </Link>
             <Link
              to={`/stock/reservado/convencional`}
              className="hover:text-gray-900 cursor-pointer"
            >
              Reservas
            </Link>
        
          </nav>

          {/* Right menus */}
          <div className="flex justify-end items-center gap-6 text-sm text-gray-600">
            {/* Administracion */}
            <Menu as="div" className="relative">
              <MenuButton className="inline-flex items-center gap-1 hover:text-gray-900">
                <MonitorCog size={16} strokeWidth={1.25} />
                Administracion
              </MenuButton>

              <MenuItems
                anchor="bottom end"
                className="mt-2 w-48 rounded-xl border border-gray-200 bg-white shadow-sm focus:outline-none"
              >
                <MenuItem>
                  {({ focus }) => (
                    <Link
                      to={"/admin/usuarios"}
                      className={`block px-4 py-2 text-sm ${
                        focus ? "bg-gray-100 text-gray-900" : "text-gray-700"
                      }`}
                    >
                      Usuarios
                    </Link>
                  )}
                </MenuItem>

                <MenuItem>
                  {({ focus }) => (
                    <Link
                      to={`/admin/configuracion`}
                      className={`block px-4 py-2 text-sm ${
                        focus ? "bg-gray-100 text-gray-900" : "text-gray-700"
                      }`}
                    >
                      Configuración
                    </Link>
                  )}
                </MenuItem>
              </MenuItems>
            </Menu>

             {/* DMS */}
            <Menu as="div" className="relative">
              <MenuButton className="inline-flex items-center gap-1 hover:text-gray-900">
                <MonitorCog size={16} strokeWidth={1.25} />
                SIAC
              </MenuButton>

              <MenuItems
                anchor="bottom end"
                className="mt-2 w-48 rounded-xl border border-gray-200 bg-white shadow-sm focus:outline-none"
              >
                <MenuItem>
                  {({ focus }) => (
                    <Link
                      to={"/admin/dms/vendedores"}
                      className={`block px-4 py-2 text-sm ${
                        focus ? "bg-gray-100 text-gray-900" : "text-gray-700"
                      }`}
                    >
                      Vendedores
                    </Link>
                  )}
                </MenuItem>

                
              </MenuItems>
            </Menu>

            {/* Mi Perfil */}
            <Menu as="div" className="relative">
              <MenuButton className="inline-flex items-center gap-1 hover:text-gray-900">
                <CircleUserRound size={16} strokeWidth={1.25} />
                Mi Perfil
              </MenuButton>

              <MenuItems
                anchor="bottom end"
                className="mt-2 w-48 rounded-xl border border-gray-200 bg-white shadow-sm focus:outline-none"
              >
                <MenuItem>
                  {({ focus }) => (
                    <a
                      href="#"
                      className={`block px-4 py-2 text-sm ${
                        focus ? "bg-gray-100 text-gray-900" : "text-gray-700"
                      }`}
                    >
                      Mi cuenta
                    </a>
                  )}
                </MenuItem>

                <MenuItem>
                  {({ focus }) => (
                    <a
                      href="#"
                      className={`block px-4 py-2 text-sm ${
                        focus ? "bg-gray-100 text-gray-900" : "text-gray-700"
                      }`}
                    >
                      Cerrar sesión
                    </a>
                  )}
                </MenuItem>
              </MenuItems>
            </Menu>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1">
        <div className="px-4">
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between text-sm text-gray-500">
          <span>© {new Date().getFullYear()} IntraNIC</span>
          <span>Franco Sanchez</span>
        </div>
      </footer>
    </div>
  );
}
