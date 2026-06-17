import GlobalNavbar from "@/components/GlobalNavbar";
import { hasModulePathAccess } from "@/helpers/access";
import { useAuth } from "@/hooks/useAuthe";
import { paths } from "@/routes/paths";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { Archive, BookMarked, BriefcaseBusiness, ChevronDown, ClipboardList, Package } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

type NavBarProps = {
  negocio: string;
};

export default function NavBarNic({ negocio }: NavBarProps) {
  const { user } = useAuth();
  const { pathname } = useLocation();

  const disponiblePath = negocio === "convencional" ? paths.convencional.stockDisponible : `/stock/disponible/${negocio}`;
  const reservasPath = negocio === "convencional" ? paths.convencional.stockReservado : `/stock/reservado/${negocio}`;
  const guardadoPath = negocio === "convencional" ? paths.convencional.stockGuardado : `/stock/guardado/${negocio}`;
  const canViewConvencional = hasModulePathAccess(user, "convencional", disponiblePath);
  const canViewPreventas = hasModulePathAccess(user, "preventas", paths.convencional.preventasResumen);
  const buttonGuardado = hasModulePathAccess(user, "convencional", guardadoPath);
  const buttonReservas = hasModulePathAccess(user, "convencional", reservasPath);
  const canViewMisOperaciones = hasModulePathAccess(user, "convencional", paths.convencional.misOperaciones);
  const canViewMisReservas = hasModulePathAccess(user, "convencional", paths.convencional.misReservas);
  const canViewMiListaEspera = hasModulePathAccess(user, "convencional", paths.convencional.miListaEspera);
  const showGestionMenu =
    negocio === "convencional" &&
    (canViewMisOperaciones || canViewMisReservas || canViewMiListaEspera) &&
    (pathname.startsWith("/convencional/") || pathname.startsWith("/gestion/convencional/"));

  return (
    <GlobalNavbar
      centerContent={
        <>
          {canViewConvencional ? (
            <Link to={disponiblePath} className="flex items-center gap-2 relative hover:text-gray-900 transition">
              <Package size={16} strokeWidth={1.5} />
              Disponible
            </Link>
          ) : null}

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

          {negocio === "convencional" && canViewPreventas ? (
            <Link to={paths.convencional.preventasResumen} className="flex items-center gap-2 relative hover:text-gray-900 transition">
              <ClipboardList size={16} strokeWidth={1.5} />
              P. Resumen
            </Link>
          ) : null}
        </>
      }
      rightContent={
        showGestionMenu ? (
          <Menu as="div" className="relative">
            <MenuButton className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:border-gray-300 hover:text-gray-900">
              <BriefcaseBusiness size={16} strokeWidth={1.75} />
              Mi Gestion
              <ChevronDown size={15} strokeWidth={1.75} />
            </MenuButton>

            <MenuItems anchor="bottom end" className="mt-2 w-56 rounded-xl border border-gray-200 bg-white shadow-lg focus:outline-none">
              {canViewMisOperaciones ? (
                <MenuItem>
                  {({ focus }) => (
                    <Link
                      to={paths.convencional.misOperaciones}
                      className={`px-4 py-2 text-sm flex items-center gap-2 ${focus ? "bg-gray-50 text-gray-900" : "text-gray-700"}`}
                    >
                      <ClipboardList size={16} strokeWidth={1.5} />
                      Mis operaciones
                    </Link>
                  )}
                </MenuItem>
              ) : null}

              {canViewMisReservas ? (
                <MenuItem>
                  {({ focus }) => (
                    <Link
                      to={paths.convencional.misReservas}
                      className={`px-4 py-2 text-sm flex items-center gap-2 ${focus ? "bg-gray-50 text-gray-900" : "text-gray-700"}`}
                    >
                      <BookMarked size={16} strokeWidth={1.5} />
                      Mis reservas
                    </Link>
                  )}
                </MenuItem>
              ) : null}

              {canViewMiListaEspera ? (
                <MenuItem>
                  {({ focus }) => (
                    <Link
                      to={paths.convencional.miListaEspera}
                      className={`px-4 py-2 text-sm flex items-center gap-2 ${focus ? "bg-gray-50 text-gray-900" : "text-gray-700"}`}
                    >
                      <Archive size={16} strokeWidth={1.5} />
                      Mi lista de espera
                    </Link>
                  )}
                </MenuItem>
              ) : null}
            </MenuItems>
          </Menu>
        ) : null
      }
    />
  );
}
