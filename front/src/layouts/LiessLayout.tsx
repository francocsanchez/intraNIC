import { Outlet } from "react-router-dom";
import NavBarLiess from "./NavBarLiess";

export default function LiessLayout() {
  return <div className="flex min-h-screen flex-col overflow-x-hidden bg-muted font-preset"><NavBarLiess /><main className="flex-1 overflow-x-hidden"><Outlet /></main><footer className="border-t border-border bg-card text-card-foreground"><div className="mx-auto flex min-h-12 max-w-7xl flex-col gap-1 px-3 py-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:py-0"><span>IntraNIC - Uso interno Nippon Car</span><span>Desarrollado por Franco Sanchez</span></div></footer></div>;
}
