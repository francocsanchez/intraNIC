import { Outlet } from "react-router-dom";
import NavBarNic from "./NavBarNic";

export default function NICUsadosLayout() {
  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden bg-gray-50">
      {/* Navbar */}
      <NavBarNic negocio="usados" />

      {/* Main */}
      <main className="flex-1 overflow-x-hidden">
        <div className="px-3 sm:px-4">
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto flex flex-col gap-1 px-4 py-3 text-xs text-gray-500 sm:h-14 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-0 sm:text-sm">
          <span>© {new Date().getFullYear()} IntraNIC</span>
          <span>Franco Sanchez</span>
        </div>
      </footer>
    </div>
  );
}
