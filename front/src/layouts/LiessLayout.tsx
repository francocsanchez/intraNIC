import { Outlet } from "react-router-dom";
import NavBarLiess from "./NavBarLiess";

export default function LiessLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Navbar */}
      <NavBarLiess negocio={`liess`} />

      {/* Main */}
      <main className="flex-1">
        <div className="px-4">
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between text-sm text-gray-500">
          <span>© {new Date().getFullYear()} IntraLiess</span>
          <span>Franco Sanchez</span>
        </div>
      </footer>
    </div>
  );
}
