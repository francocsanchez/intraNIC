import Loading from "@/components/Loading";
import { hasModulePathAccess } from "@/helpers/access";
import { useAuth } from "@/hooks/useAuthe";
import { paths } from "@/routes/paths";
import {
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useState } from "react";
import { Link, NavLink, Navigate, Outlet } from "react-router-dom";

const patentamientosSections = [
  {
    key: "general",
    label: "General",
    to: paths.analisis.patentamientos.dashboardGeneral,
  },
  {
    key: "marcas",
    label: "Marcas",
    to: paths.analisis.patentamientos.dashboardMarcas,
  },
  {
    key: "pickup",
    label: "Hilux",
    to: paths.analisis.patentamientos.dashboardPickup,
  },
  { key: "sw4", label: "SW4", to: paths.analisis.patentamientos.dashboardSw4 },
  {
    key: "c-cross",
    label: "C. Cross",
    to: paths.analisis.patentamientos.dashboardCCross,
  },
  {
    key: "y-cross",
    label: "Y. Cross",
    to: paths.analisis.patentamientos.dashboardYCross,
  },
  {
    key: "yaris",
    label: "Yaris",
    to: paths.analisis.patentamientos.dashboardYaris,
  },
  {
    key: "localidad",
    label: "Localidad",
    to: paths.analisis.patentamientos.dashboardLocalidad,
  },
  {
    key: "inscripcion-unidades",
    label: "Traslado Furlong",
    to: paths.analisis.patentamientos.dashboardInscripcionUnidades,
  },
];

const transferenciasSections = [
  {
    key: "general",
    label: "General",
    to: paths.analisis.transferencias.dashboardGeneral,
  },
];

export default function AnalisisMercadoLayout() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  if (isLoading) return <Loading />;

  if (!isAuthenticated || !user) {
    return <Navigate to={paths.login} replace />;
  }

  const canViewPatentamientos = hasModulePathAccess(
    user,
    "patentamientos",
    paths.analisis.patentamientos.dashboardGeneral,
  );
  const canViewTransferencias = hasModulePathAccess(
    user,
    "transferencias",
    paths.analisis.transferencias.dashboardGeneral,
  );

  const navGroups = [
    canViewPatentamientos
      ? {
          title: "Patentamiento",
          items: patentamientosSections,
        }
      : null,
    canViewTransferencias
      ? {
          title: "Transferencias",
          items: transferenciasSections,
        }
      : null,
  ].filter(Boolean) as Array<{
    title: string;
    items: typeof patentamientosSections;
  }>;

  return (
    <div className="font-preset min-h-screen bg-muted">
      <div className="flex min-h-screen w-full">
        <aside
          data-print-hidden="true"
          className={`relative shrink-0 border-r border-border bg-card py-3 transition-all duration-200 ${
            sidebarCollapsed ? "w-[78px] px-2.5" : "w-[248px] px-3.5"
          }`}
        >
          <div
            className={`flex items-start ${sidebarCollapsed ? "justify-center" : "justify-between gap-2"}`}
          >
            {sidebarCollapsed ? null : (
              <div className="px-1">
                <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Modulo unificado
                </p>
                <h1 className="mt-1 text-lg font-semibold tracking-tight text-foreground">
                  Analisis de mercado
                </h1>
              </div>
            )}

            <button
              type="button"
              onClick={() => setSidebarCollapsed((current) => !current)}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition hover:bg-secondary hover:text-foreground"
              aria-label={
                sidebarCollapsed
                  ? "Expandir menu lateral"
                  : "Colapsar menu lateral"
              }
              title={
                sidebarCollapsed
                  ? "Expandir menu lateral"
                  : "Colapsar menu lateral"
              }
            >
              {sidebarCollapsed ? (
                <PanelLeftOpen size={18} />
              ) : (
                <PanelLeftClose size={18} />
              )}
            </button>
          </div>

          <div className="mt-4 space-y-2">
            <Link
              to={paths.home}
              className={`inline-flex w-full items-center rounded-md border border-border bg-background text-[13px] font-medium text-foreground transition hover:bg-secondary ${
                sidebarCollapsed
                  ? "justify-center px-2 py-2.5"
                  : "justify-center gap-2 px-3 py-2.5"
              }`}
              aria-label="Volver al inicio"
              title="Volver al inicio"
            >
              <ChevronLeft size={16} />
              {sidebarCollapsed ? null : "Volver al inicio"}
            </Link>
          </div>

          <nav className="mt-5 space-y-4">
            {navGroups.map((group) => (
              <div key={group.title} className="space-y-1.5">
                {sidebarCollapsed ? null : (
                  <div className="px-1 pt-1">
                    <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                      {group.title}
                    </p>
                  </div>
                )}

                {group.items.map((section) => (
                  <NavLink
                    key={`${group.title}-${section.key}`}
                    to={section.to}
                    className={({ isActive }) =>
                      `group flex w-full items-center rounded-md border text-[13px] font-medium transition ${
                        sidebarCollapsed
                          ? "justify-center px-2 py-2.5"
                          : "px-3 py-2.5"
                      } ${
                        isActive
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-transparent text-muted-foreground hover:border-border hover:bg-secondary hover:text-foreground"
                      }`
                    }
                    aria-label={section.label}
                    title={`${group.title} - ${section.label}`}
                  >
                    {sidebarCollapsed ? (
                      <ChevronRight size={15} />
                    ) : (
                      <span className="truncate">{section.label}</span>
                    )}
                  </NavLink>
                ))}
              </div>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 px-2 py-3 print-main-area">
          <Outlet />
        </main>
      </div>
      <footer className="border-t border-border bg-card">
        <div className="flex min-h-12 flex-col gap-1 px-3 py-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:py-0">
          <span>IntraNIC - Uso interno Nippon Car</span>
          <span>Desarrollado por Franco Sanchez</span>
        </div>
      </footer>
    </div>
  );
}
