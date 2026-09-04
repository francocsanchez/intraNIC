import Loading from "@/components/Loading";
import { useAuth } from "@/hooks/useAuthe";
import { paths } from "@/routes/paths";
import { ChevronLeft, ChevronRight, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useState } from "react";
import { Link, NavLink, Navigate, Outlet } from "react-router-dom";

const dashboardSections = [
  { key: "general", label: "General", to: paths.analisis.transferencias.dashboardGeneral },
];

export default function TransferenciasLayout() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  if (isLoading) return <Loading />;

  if (!isAuthenticated || !user) {
    return <Navigate to={paths.login} replace />;
  }

  return (
    <div className="min-h-screen bg-secondary">
      <div className="flex min-h-screen w-full">
        <aside
          data-print-hidden="true"
          className={`relative shrink-0 border-r border-border bg-card py-8 transition-all duration-200 ${
            sidebarCollapsed ? "w-[88px] px-3" : "w-[280px] px-5"
          }`}
        >
          <div className={`flex items-start ${sidebarCollapsed ? "justify-center" : "justify-between gap-3"}`}>
            {sidebarCollapsed ? null : <h1 className="px-1 text-xl font-semibold tracking-tight text-foreground">Transferencias</h1>}

            <button
              type="button"
              onClick={() => setSidebarCollapsed((current) => !current)}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-input bg-card text-muted-foreground transition hover:border-border hover:bg-muted hover:text-foreground"
              aria-label={sidebarCollapsed ? "Expandir menu lateral" : "Colapsar menu lateral"}
              title={sidebarCollapsed ? "Expandir menu lateral" : "Colapsar menu lateral"}
            >
              {sidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            </button>
          </div>

          <div className="mt-5 space-y-3">
            <Link
              to={paths.home}
              className={`inline-flex w-full items-center rounded-lg border border-input bg-card text-sm font-semibold text-foreground transition hover:border-border hover:bg-muted ${
                sidebarCollapsed ? "justify-center px-2 py-3" : "justify-center gap-2 px-4 py-3"
              }`}
              aria-label="Volver al inicio"
              title="Volver al inicio"
            >
              <ChevronLeft size={16} />
              {sidebarCollapsed ? null : "Volver al inicio"}
            </Link>
          </div>

          <nav className="mt-6 space-y-2">
            {sidebarCollapsed ? null : (
              <p className="px-1 text-primary font-semibold uppercase tracking-[0.16em] text-muted-foreground">Secciones</p>
            )}

            {dashboardSections.map((section) => (
              <NavLink
                key={section.key}
                to={section.to}
                className={({ isActive }) =>
                  `flex w-full items-center rounded-lg border text-sm font-semibold transition ${
                    sidebarCollapsed ? "justify-center px-2 py-3" : "px-4 py-3"
                  } ${
                    isActive
                      ? "border-border bg-secondary text-primary"
                      : "border-transparent text-muted-foreground hover:border-border hover:bg-muted hover:text-foreground"
                  }`
                }
                aria-label={section.label}
                title={section.label}
              >
                {sidebarCollapsed ? <ChevronRight size={16} /> : <span>{section.label}</span>}
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 px-8 py-8 print-main-area">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
