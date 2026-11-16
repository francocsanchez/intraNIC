import { Outlet } from "react-router-dom";
import AppFooter from "@/components/AppFooter";
import NavBarNic from "./NavBarNic";

export default function NICLayout() {
  return (
    <div className="font-preset min-h-screen flex flex-col overflow-x-hidden bg-muted">
      <NavBarNic negocio={`convencional`} />

      <main className="flex-1 overflow-x-hidden">
        <div className="px-2 py-3">
          <Outlet />
        </div>
      </main>

      <AppFooter />
    </div>
  );
}
