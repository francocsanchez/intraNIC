import Loading from "@/components/Loading";
import { useAuth } from "@/hooks/useAuthe";
import { paths } from "@/routes/paths";
import { ChevronLeft, PhoneCall } from "lucide-react";
import { Link, NavLink, Navigate, Outlet } from "react-router-dom";

const sections = [
  {
    label: "SSI Ventas",
    to: paths.calidad.ssiVentas,
    icon: PhoneCall,
  },
];

export default function CalidadLayout() {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) return <Loading />;

  if (!isAuthenticated || !user) {
    return <Navigate to={paths.login} replace />;
  }

  return (
    <div className="min-h-screen bg-[#f7f6f2]">
      <header className="border-b border-[#ddd8ce] bg-[#fcfbf8]">
        <div className="flex w-full flex-col gap-4 px-8 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <Link
              to={paths.home}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#d8d1c2] bg-white px-4 py-2.5 text-sm font-semibold text-[#221f18] transition hover:border-[#bbb29f] hover:bg-[#f6f2e8]"
            >
              <ChevronLeft size={16} />
              Volver
            </Link>

            <h1 className="text-xl font-semibold tracking-tight text-[#221f18]">Calidad</h1>
          </div>

          <nav className="flex flex-wrap gap-2">
            {sections.map((section) => (
              <NavLink
                key={section.to}
                to={section.to}
                className={({ isActive }) =>
                  `inline-flex items-center gap-3 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                    isActive
                      ? "border-[#bfd7c8] bg-[#e8f3eb] text-[#1f5d33]"
                      : "border-transparent text-[#5f584c] hover:border-[#e5ddd0] hover:bg-[#f7f2ea] hover:text-[#221f18]"
                  }`
                }
              >
                <section.icon size={16} />
                <span>{section.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="min-w-0 w-full px-8 py-8">
          <Outlet />
      </main>
    </div>
  );
}
