import { Outlet } from "react-router-dom";
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

      <footer className="border-t border-border bg-card">
        <div className="mx-auto flex flex-col gap-1 px-3 py-2 text-xs text-muted-foreground sm:h-12 sm:flex-row sm:items-center sm:justify-between sm:py-0">
          <span>IntraNIC - Uso interno Nippon Car</span>
          <span>Desarrollado por Franco Sanchez</span>
        </div>
      </footer>
    </div>
  );
}
