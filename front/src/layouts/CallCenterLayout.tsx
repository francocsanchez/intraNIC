import Loading from "@/components/Loading";
import { useAuth } from "@/hooks/useAuthe";
import { paths } from "@/routes/paths";
import { Database, FileSpreadsheet, ChevronLeft } from "lucide-react";
import { Link, NavLink, Navigate, Outlet } from "react-router-dom";

const sections = [
  {
    label: "Importador de datos",
    to: paths.callCenter.importar,
    icon: FileSpreadsheet,
  },
  {
    label: "Origenes de datos",
    to: paths.callCenter.origenesDatos,
    icon: Database,
  },
];

export default function CallCenterLayout() {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) return <Loading />;

  if (!isAuthenticated || !user) {
    return <Navigate to={paths.login} replace />;
  }

  return (
    <div className="min-h-screen bg-[#f6f4ef]">
      <div className="flex min-h-screen w-full">
        <aside className="w-[292px] shrink-0 border-r border-[#dfd8ca] bg-[#fcfbf7] px-5 py-8">
          <h1 className="px-1 text-xl font-semibold tracking-tight text-[#2f2616]">Call Center</h1>
          <p className="mt-2 px-1 text-sm leading-6 text-[#6d6049]">
            Importa oportunidades y administra los origenes para el futuro dashboard de analisis.
          </p>

          <div className="mt-5 space-y-3">
            <Link
              to={paths.home}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#d8cfbf] bg-white px-4 py-3 text-sm font-semibold text-[#2f2616] transition hover:border-[#bcae93] hover:bg-[#f8f4eb]"
            >
              <ChevronLeft size={16} />
              Volver al inicio
            </Link>
          </div>

          <nav className="mt-6 space-y-2">
            <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7f735f]">Secciones</p>
            {sections.map((section) => (
              <NavLink
                key={section.to}
                to={section.to}
                className={({ isActive }) =>
                  `flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                    isActive
                      ? "border-[#d7c29a] bg-[#f5ead2] text-[#7c4f00]"
                      : "border-transparent text-[#5f533e] hover:border-[#e5dccd] hover:bg-[#f8f4eb] hover:text-[#2f2616]"
                  }`
                }
              >
                <section.icon size={16} />
                <span>{section.label}</span>
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 px-8 py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
