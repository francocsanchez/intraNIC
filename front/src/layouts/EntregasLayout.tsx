import BaseAppLayout from "./BaseAppLayout";
import { hasModulePathAccess, hasSuperAdminRole } from "@/helpers/access";
import { useAuth } from "@/hooks/useAuthe";
import { Link, useLocation } from "react-router-dom";
import { paths } from "@/routes/paths";
import { CalendarDays, Building2, History, ListTodo } from "lucide-react";

const navItems = [
  {
    label: "Agenda de entrega",
    to: paths.entregas.agenda,
    icon: CalendarDays,
  },
  {
    label: "Pendientes de turnar",
    to: paths.entregas.pendientesTurnar,
    icon: ListTodo,
  },
  {
    label: "Sucursales de entrega",
    to: paths.entregas.sucursales,
    icon: Building2,
  },
  {
    label: "Registros",
    to: paths.entregas.registros,
    icon: History,
  },
];

export default function EntregasLayout() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const moduleByPath = {
    [paths.entregas.agenda]: "agendaEntrega",
    [paths.entregas.pendientesTurnar]: "pendientesTurnar",
    [paths.entregas.sucursales]: "agendaEntrega",
    [paths.entregas.registros]: "agendaEntrega",
  } as const;

  const visibleNavItems = navItems.filter((item) =>
    item.to === paths.entregas.sucursales
      ? hasSuperAdminRole(user) && hasModulePathAccess(user, moduleByPath[item.to], item.to)
      : hasModulePathAccess(user, moduleByPath[item.to], item.to),
  );

  return (
    <BaseAppLayout
      footerLeft={`IntraNIC Entregas`}
      footerRight={`Franco Sanchez`}
      centerContent={
        <>
          {visibleNavItems.map((item) => {
            const isActive = pathname === item.to;

            return (
              <Link
                key={item.to}
                to={item.to}
                className={[
                  "inline-flex items-center gap-2 rounded-md px-3 py-2 transition",
                  isActive ? "bg-gray-900 text-white" : "text-gray-600 hover:text-gray-900",
                ].join(" ")}
              >
                <item.icon size={16} strokeWidth={1.75} />
                {item.label}
              </Link>
            );
          })}
        </>
      }
      mainClassName="px-4 py-6"
    />
  );
}
