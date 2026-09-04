import GlobalNavbar from "@/components/GlobalNavbar";
import { paths } from "@/routes/paths";
import { Package } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export default function NavBarLiess() {
  const { pathname } = useLocation();
  const navItems = ["nuevos", "usados"] as const;
  return <GlobalNavbar preset centerContent={navItems.map((tipo) => { const to = paths.liess.stockDisponible(tipo); const active = pathname === to; return <Link key={tipo} to={to} className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}><Package size={16} strokeWidth={1.75} />{tipo === "nuevos" ? "Nuevos" : "Usados"}</Link>; })} />;
}
