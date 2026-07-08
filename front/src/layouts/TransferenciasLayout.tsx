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
    <div className="min-h-screen bg-[#f5f5f3]">
      <div className="flex min-h-screen w-full">
        <aside
          data-print-hidden="true"
          className={`relative shrink-0 border-r border-gray-200 bg-white py-8 transition-all duration-200 ${
            sidebarCollapsed ? "w-[88px] px-3" : "w-[280px] px-5"
          }`}
        >
          <div className={`flex items-start ${sidebarCollapsed ? "justify-center" : "justify-between gap-3"}`}>
            {sidebarCollapsed ? null : <h1 className="px-1 text-xl font-semibold tracking-tight text-gray-900">Transferencias</h1>}

            <button
              type="button"
              onClick={() => setSidebarCollapsed((current) => !current)}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-300 bg-white text-gray-700 transition hover:border-gray-400 hover:bg-gray-100 hover:text-gray-900"
              aria-label={sidebarCollapsed ? "Expandir menu lateral" : "Colapsar menu lateral"}
              title={sidebarCollapsed ? "Expandir menu lateral" : "Colapsar menu lateral"}
            >
              {sidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            </button>
          </div>

          <div className="mt-5 space-y-3">
            <Link
              to={paths.home}
              className={`inline-flex w-full items-center rounded-xl border border-gray-300 bg-white text-sm font-semibold text-gray-900 transition hover:border-gray-400 hover:bg-gray-100 ${
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
              <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">Secciones</p>
            )}

            {dashboardSections.map((section) => (
              <NavLink
                key={section.key}
                to={section.to}
                className={({ isActive }) =>
                  `flex w-full items-center rounded-xl border text-sm font-semibold transition ${
                    sidebarCollapsed ? "justify-center px-2 py-3" : "px-4 py-3"
                  } ${
                    isActive
                      ? "border-[#9ad7d0] bg-[#e9f8f6] text-[#0f766e]"
                      : "border-transparent text-gray-700 hover:border-gray-200 hover:bg-gray-50 hover:text-gray-900"
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
