import Loading from "@/components/Loading";
import { useAuth } from "@/hooks/useAuthe";
import { paths } from "@/routes/paths";
import { ChevronLeft, FileSpreadsheet } from "lucide-react";
import { Link, NavLink, Navigate, Outlet, useLocation } from "react-router-dom";

const dashboardSections = [
  { key: "general", label: "General", to: paths.analisis.patentamientos.dashboardGeneral },
  { key: "marcas", label: "Marcas", to: paths.analisis.patentamientos.dashboardMarcas },
  { key: "pickup", label: "Pickup", to: paths.analisis.patentamientos.dashboardPickup },
  { key: "suv", label: "SUV", to: paths.analisis.patentamientos.dashboardSuv },
  { key: "b-suv", label: "B-SUV", to: paths.analisis.patentamientos.dashboardBSuv },
  { key: "inscripcion-unidades", label: "Traslado de unidades", to: paths.analisis.patentamientos.dashboardInscripcionUnidades },
];

export default function PatentamientosLayout() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (isLoading) return <Loading />;

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  const isImportView = location.pathname === paths.analisis.patentamientos.importar;

  return (
    <div className="min-h-screen bg-[#f5f5f3]">
      <div className="flex min-h-screen w-full">
        <aside className="w-[280px] shrink-0 border-r border-gray-200 bg-white px-5 py-8">
          <h1 className="px-1 text-xl font-semibold tracking-tight text-gray-900">Patentamientos</h1>

          <div className="mt-5 space-y-3">
            <Link
              to="/"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-900 transition hover:border-gray-400 hover:bg-gray-100"
            >
              <ChevronLeft size={16} />
              Volver al inicio
            </Link>

            {!isImportView ? (
              <Link
                to={paths.analisis.patentamientos.importar}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                <FileSpreadsheet size={16} />
                Cargar archivos
              </Link>
            ) : null}
          </div>

          {!isImportView ? (
            <nav className="mt-6 space-y-2">
              <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">Secciones</p>
              {dashboardSections.map((section) => (
                <NavLink
                  key={section.key}
                  to={section.to}
                  className={({ isActive }) =>
                    `flex w-full items-center rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                      isActive
                        ? "border-[#9ad7d0] bg-[#e9f8f6] text-[#0f766e]"
                        : "border-transparent text-gray-700 hover:border-gray-200 hover:bg-gray-50 hover:text-gray-900"
                    }`
                  }
                >
                  <span>{section.label}</span>
                </NavLink>
              ))}
            </nav>
          ) : null}
        </aside>

        <main className="min-w-0 flex-1 px-8 py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
