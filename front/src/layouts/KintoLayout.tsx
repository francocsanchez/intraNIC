import BaseAppLayout from "@/layouts/BaseAppLayout";
import { hasModulePathAccess } from "@/helpers/access";
import { useAuth } from "@/hooks/useAuthe";
import { paths } from "@/routes/paths";
import { BarChart3, CarFront, Flame, LineChart, ReceiptText } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export default function KintoLayout() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const navItems = [
    { label: "Dashboard", to: paths.kinto.dashboard, icon: BarChart3, module: "kintoDashboard" as const },
    { label: "Flota", to: paths.kinto.flota, icon: CarFront, module: "kintoFlota" as const },
    { label: "Matafuegos", to: paths.kinto.matafuegos, icon: Flame, module: "kintoMatafuegos" as const },
    { label: "Multas", to: paths.kinto.multas, icon: ReceiptText, module: "kintoMultas" as const },
    { label: "NPS Share", to: paths.kinto.npsShare, icon: LineChart, module: "kintoNpsShare" as const },
  ].filter((item) => hasModulePathAccess(user, item.module, item.to));

  return (
    <BaseAppLayout
      footerLeft="IntraNIC - Uso interno Nippon Car"
      footerRight="Desarrollado por Franco Sanchez"
      centerContent={<>{navItems.map((item) => <Link key={item.to} to={item.to} className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${pathname === item.to ? "bg-primary text-primary-foreground hover:bg-primary/90" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}><item.icon size={16} strokeWidth={1.75} />{item.label}</Link>)}</>}
    />
  );
}
