import BaseAppLayout from "@/layouts/BaseAppLayout";
import { hasModulePathAccess } from "@/helpers/access";
import { useAuth } from "@/hooks/useAuthe";
import { paths } from "@/routes/paths";
import { ClipboardList } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export default function LicitacionesLayout() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const visible = hasModulePathAccess(user, "licitacionesAdministracion", paths.licitaciones.administracion);

  return <BaseAppLayout centerContent={visible ? <Link to={paths.licitaciones.administracion} className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${pathname === paths.licitaciones.administracion ? "bg-primary text-primary-foreground hover:bg-primary/90" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}><ClipboardList size={16} strokeWidth={1.75} />Administración</Link> : null} />;
}
