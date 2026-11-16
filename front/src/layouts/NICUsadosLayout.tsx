import { Outlet } from "react-router-dom";
import AppFooter from "@/components/AppFooter";
import NavBarNic from "./NavBarNic";

export default function NICUsadosLayout() {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-muted font-preset">
      <NavBarNic negocio="usados" />
      <main className="flex-1 overflow-x-hidden"><Outlet /></main>
      <AppFooter />
    </div>
  );
}
