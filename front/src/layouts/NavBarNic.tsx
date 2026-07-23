import GlobalNavbar from "@/components/GlobalNavbar";
import { hasModulePathAccess } from "@/helpers/access";
import { useAuth } from "@/hooks/useAuthe";
import { paths } from "@/routes/paths";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { Archive, BookMarked, BriefcaseBusiness, CalendarDays, Calculator, CarFront, ChevronDown, ClipboardList, FileText, Package } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

type NavBarProps = {
  negocio: string;
};

export default function NavBarNic({ negocio }: NavBarProps) {
  const { user } = useAuth();
  const { pathname } = useLocation();

  const isConvencional = negocio === "convencional";
  const moduleKey = isConvencional ? "convencional" : "usados";
  const disponiblePath = isConvencional ? paths.convencional.stockDisponible : paths.usados.stockDisponible;
  const reservasPath = isConvencional ? paths.convencional.stockReservado : paths.usados.stockReservado;
  const guardadoPath = isConvencional ? paths.convencional.stockGuardado : paths.usados.stockGuardado;
  const misOperacionesPath = isConvencional ? paths.convencional.misOperaciones : paths.usados.misOperaciones;
  const canViewConvencional = hasModulePathAccess(user, moduleKey, disponiblePath);
  const canViewPreventas = hasModulePathAccess(user, "preventas", paths.convencional.preventasResumen);
  const buttonGuardado = hasModulePathAccess(user, moduleKey, guardadoPath);
  const buttonReservas = hasModulePathAccess(user, moduleKey, reservasPath);
  const canViewMisOperaciones = hasModulePathAccess(user, moduleKey, misOperacionesPath);
  const canViewMisReservas = isConvencional && hasModulePathAccess(user, "convencional", paths.convencional.misReservas);
  const canViewMiListaEspera = isConvencional && hasModulePathAccess(user, "convencional", paths.convencional.miListaEspera);
  const canViewProformas = isConvencional && hasModulePathAccess(user, "proformas", paths.convencional.proformas);
  const canViewCotizador = isConvencional && hasModulePathAccess(user, "cotizador", paths.convencional.cotizador);
  const canViewMinutas = isConvencional && hasModulePathAccess(user, "minutas", paths.convencional.minutas);
  const canViewAgendaComercial = isConvencional && hasModulePathAccess(user, "agendaComercial", paths.convencional.agendaComercial);
  const canViewRegistroTestDrive = isConvencional && hasModulePathAccess(user, "registroTestDriveConvencional", paths.convencional.registroTestDrive);
  const isCommercialPath =
    isConvencional &&
    (pathname.startsWith("/convencional/proformas") ||
      pathname === paths.convencional.cotizador ||
      pathname.startsWith("/convencional/minutas") ||
      pathname === paths.convencional.agendaComercial ||
      pathname.startsWith("/gestion/convencional/test-drive"));
  const isGestionPath = isConvencional
    ? pathname.startsWith("/convencional/") || pathname.startsWith("/gestion/convencional/")
    : pathname.startsWith("/usados/");
  const showGestionMenu =
    isGestionPath &&
    !isCommercialPath &&
    (canViewMisOperaciones || canViewMisReservas || canViewMiListaEspera);
  const stockNavItems = [
    {
      label: "Disponible",
      to: disponiblePath,
      icon: Package,
      visible: canViewConvencional,
      active: pathname === disponiblePath,
    },
    {
      label: "Reservas",
      to: reservasPath,
      icon: BookMarked,
      visible: buttonReservas,
      active: pathname === reservasPath,
    },
    {
      label: "Guardado",
      to: guardadoPath,
      icon: Archive,
      visible: buttonGuardado,
      active: pathname === guardadoPath,
    },
    {
      label: "P. Resumen",
      to: paths.convencional.preventasResumen,
      icon: ClipboardList,
      visible: isConvencional && canViewPreventas,
      active:
        pathname === paths.convencional.preventasResumen ||
        pathname === paths.convencional.preventas ||
        pathname === paths.convencional.preventasAsignadas ||
        pathname === paths.convencional.preventasNueva ||
        pathname.startsWith("/gestion/convencional/preventas/"),
    },
  ].filter((item) => item.visible);

  const commercialNavItems = [
    {
      label: "Proformas",
      to: paths.convencional.proformas,
      icon: FileText,
      visible: canViewProformas,
      active: pathname === paths.convencional.proformas || pathname === paths.convencional.proformasNueva || pathname.startsWith("/convencional/proformas/"),
    },
    {
      label: "Cotizador",
      to: paths.convencional.cotizador,
      icon: Calculator,
      visible: canViewCotizador,
      active: pathname === paths.convencional.cotizador,
    },
    {
      label: "Minutas",
      to: paths.convencional.minutas,
      icon: ClipboardList,
      visible: canViewMinutas,
      active: pathname === paths.convencional.minutas || pathname === paths.convencional.minutasNueva || pathname.startsWith("/convencional/minutas/"),
    },
    {
      label: "Agenda comercial",
      to: paths.convencional.agendaComercial,
      icon: CalendarDays,
      visible: canViewAgendaComercial,
      active: pathname === paths.convencional.agendaComercial,
    },
    {
      label: "Registro TestDrive",
      to: paths.convencional.registroTestDrive,
      icon: CarFront,
      visible: canViewRegistroTestDrive,
      active: pathname === paths.convencional.registroTestDrive || pathname === paths.convencional.registroTestDriveCalendario,
    },
  ].filter((item) => item.visible);

  const navItems = isCommercialPath ? commercialNavItems : stockNavItems;

  return (
    <GlobalNavbar
      centerContent={
        <>
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={[
                "inline-flex items-center gap-2 rounded-md px-3 py-2 transition",
                item.active ? "bg-gray-900 text-white" : "text-gray-600 hover:text-gray-900",
              ].join(" ")}
            >
              <item.icon size={16} strokeWidth={1.75} />
              {item.label}
            </Link>
          ))}
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
                      to={misOperacionesPath}
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
