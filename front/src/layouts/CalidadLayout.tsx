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
    <div className="font-preset flex min-h-screen flex-col bg-muted">
      <header className="border-b border-border bg-card">
        <div className="flex w-full flex-col gap-3 px-3 py-2 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <Link
              to={paths.home}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-border bg-background px-3 text-sm font-semibold text-foreground transition hover:bg-secondary"
            >
              <ChevronLeft size={16} />
              Volver
            </Link>

            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              Calidad
            </h1>
          </div>

          <nav className="flex flex-wrap gap-2">
            {sections.map((section) => (
              <NavLink
                key={section.to}
                to={section.to}
                className={({ isActive }) =>
                  `inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm font-semibold transition ${
                    isActive
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-muted-foreground hover:bg-secondary hover:text-foreground"
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

      <main className="min-w-0 w-full flex-1 px-2 py-3">
        <Outlet />
      </main>
      <footer className="border-t border-border bg-card">
        <div className="flex min-h-12 flex-col gap-1 px-3 py-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:py-0">
          <span>IntraNIC - Uso interno Nippon Car</span>
          <span>Desarrollado por Franco Sanchez</span>
        </div>
      </footer>
    </div>
  );
}
