import BaseAppLayout from "./BaseAppLayout";
import { Link, useLocation } from "react-router-dom";
import { paths } from "@/routes/paths";
import { CalendarDays, Building2, History } from "lucide-react";

const navItems = [
  {
    label: "Agenda de entrega",
    to: paths.entregas.agenda,
    icon: CalendarDays,
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
  const { pathname } = useLocation();

  return (
    <BaseAppLayout
      footerLeft={`IntraNIC Entregas`}
      footerRight={`Franco Sanchez`}
      centerContent={
        <>
          {navItems.map((item) => {
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
