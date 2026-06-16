import Loading from "@/components/Loading";
import { hasAnyRole } from "@/helpers/access";
import { useAuth } from "@/hooks/useAuthe";
import { paths } from "@/routes/paths";
import { LogOut } from "lucide-react";
import { Link, Navigate, useNavigate } from "react-router-dom";

type HomeItem = {
  label: string;
  to: string;
  enabled: boolean;
};

type HomeSection = {
  title: string;
  items: HomeItem[];
};

const buttonClass =
  "flex h-24 w-24 items-center justify-center border border-gray-300 bg-white p-3 text-center text-xs font-medium leading-tight text-gray-800 break-words transition-colors hover:bg-gray-100";

const disabledButtonClass =
  "flex h-24 w-24 items-center justify-center border border-gray-200 bg-gray-100 p-3 text-center text-xs font-medium leading-tight text-gray-400 break-words";

export default function Inicio() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, isError } = useAuth();

  if (isLoading) return <Loading />;

  if (isError || !isAuthenticated || !user) {
    localStorage.removeItem("AUTH_TOKEN");
    return <Navigate to={paths.login} replace />;
  }

  const companies = user.company ?? [];
  const hasNIC = companies.includes("convencional");
  const hasUsed = companies.includes("usados");
  const hasLiess = companies.includes("liess");
  const hasSystem = hasAnyRole(user, ["admin", "stock", "supervisor"]);
  const hasAdministracion = hasAnyRole(user, [
    "admin",
    "administracion",
    "stock",
    "gerente",
    "supervisor",
    "vendedor",
  ]);
  const hasPreventas = hasNIC;
  const hasProformas = true;
  const hasOperaciones = hasAnyRole(user, ["admin", "supervisor", "gerente"]);
  const hasPatentamientos = hasAnyRole(user, ["admin", "supervisor", "gerente"]);

  const sections: HomeSection[] = [
    {
      title: "Unidades",
      items: [
        { label: "Convencional", to: paths.convencional.stockDisponible, enabled: hasNIC },
        { label: "Usados", to: paths.usados.stockDisponible, enabled: hasUsed },
        { label: "Liess", to: paths.liess.stockDisponible("nuevos"), enabled: hasLiess },
      ],
    },
    {
      title: "Gestion de stock convencional",
      items: [
        { label: "Asignaciones", to: paths.convencional.asignaciones, enabled: hasNIC },
        {
          label: "Registro asignaciones",
          to: paths.convencional.registroAsignaciones,
          enabled: hasNIC,
        },
        { label: "Pedido mensual", to: paths.convencional.pedidoMensual, enabled: hasNIC },
        { label: "Pedido unidades", to: paths.convencional.pedidoUnidades, enabled: hasNIC },
      ],
    },
    {
      title: "Gestion de stock usados",
      items: [
        { label: "No reparado", to: paths.usados.stockNoReparado, enabled: hasUsed },
        {
          label: "Pendiente documentacion",
          to: paths.usados.stockPendienteDocumentacion,
          enabled: hasUsed,
        },
        { label: "Ingresos", to: paths.usados.stockIngresos, enabled: hasUsed },
      ],
    },
    {
      title: "Comercial",
      items: [
        { label: "Preventas", to: paths.convencional.preventas, enabled: hasPreventas },
        { label: "Proformas", to: paths.convencional.proformas, enabled: hasProformas },
        { label: "Administracion", to: paths.administracion.home, enabled: hasAdministracion },
      ],
    },
    {
      title: "Analisis",
      items: [
        { label: "Operaciones", to: paths.analisis.operaciones, enabled: hasOperaciones },
        { label: "Ranking", to: paths.convencional.ranking, enabled: hasNIC },
        { label: "Promedio", to: paths.convencional.promedio, enabled: hasNIC },
        {
          label: "Patentamientos",
          to: paths.analisis.patentamientos.dashboardMarcas,
          enabled: hasPatentamientos,
        },
      ],
    },
    {
      title: "Sistema",
      items: [
        { label: "Usuarios", to: paths.admin.usuarios, enabled: hasSystem },
        { label: "Configuracion", to: paths.admin.configuracion, enabled: hasSystem },
      ],
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem("AUTH_TOKEN");
    navigate(paths.login, { replace: true });
  };

  return (
    <div className="min-h-[70vh] bg-white px-3 py-3">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
        <div className="flex items-start justify-between gap-3 border-b border-gray-200 pb-2">
          <div className="min-w-0">
            <h1 className="text-lg font-semibold text-gray-900">Modulos</h1>
          </div>

          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100"
          >
            <LogOut size={13} strokeWidth={1.8} />
            Cerrar sesion
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {sections.map((section) => (
            <section key={section.title} className="border border-gray-200 bg-white p-2">
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-gray-700">{section.title}</h2>

              <div className="flex flex-wrap gap-2">
                {section.items.map((item) =>
                  item.enabled ? (
                    <Link key={item.label} to={item.to} className={buttonClass}>
                      <span className="max-w-full">{item.label}</span>
                    </Link>
                  ) : (
                    <span key={item.label} className={disabledButtonClass}>
                      <span className="max-w-full">{item.label}</span>
                    </span>
                  ),
                )}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
