import MenuAdminNavbar from "@/components/MenuAdminNavbar";
import { Package } from "lucide-react";
import { Link } from "react-router-dom";

type NavBarProps = {
  negocio: string;
};

export default function NavBarLiess({ negocio }: NavBarProps) {
  return (
    <header className="bg-white border-b border-gray-200 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link className="flex items-center" to={"/"}>
          <img src="/logoLIESS.png" alt="IntraNIC" className="h-8 w-auto object-contain" />
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-8 text-sm font-medium text-gray-600">
          <Link to={`/stock/disponible/${negocio}`} className="flex items-center gap-2 relative hover:text-gray-900 transition">
            <Package size={16} strokeWidth={1.5} />
            Disponible
          </Link>
        </nav>

        {/* Menu administracion / perfil */}
        <MenuAdminNavbar negocio={`liess`} />
      </div>
    </header>
  );
}
