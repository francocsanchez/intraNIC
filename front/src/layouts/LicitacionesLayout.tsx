import BaseAppLayout from "@/layouts/BaseAppLayout";
import { hasModulePathAccess } from "@/helpers/access";
import { useAuth } from "@/hooks/useAuthe";
import { paths } from "@/routes/paths";
import { ClipboardList, ListChecks } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export default function LicitacionesLayout() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const items = [
    {
      label: "Administración",
      to: paths.licitaciones.administracion,
      enabled: hasModulePathAccess(user, "licitacionesAdministracion", paths.licitaciones.administracion),
      icon: ClipboardList,
    },
    {
      label: "Resumen",
      to: paths.licitaciones.resumen,
      enabled: hasModulePathAccess(user, "licitacionesResumen", paths.licitaciones.resumen),
      icon: ListChecks,
    },
  ].filter((item) => item.enabled);

  return <BaseAppLayout centerContent={items.length ? <div className="flex items-center gap-1">{items.map(({ label, to, icon: Icon }) => <Link key={to} to={to} className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${pathname === to ? "bg-primary text-primary-foreground hover:bg-primary/90" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}><Icon size={16} strokeWidth={1.75} />{label}</Link>)}</div> : null} />;
}
