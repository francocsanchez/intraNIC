import Loading from "@/components/Loading";
import { hasAnyRole } from "@/helpers/access";
import { useAuth } from "@/hooks/useAuthe";
import { paths } from "@/routes/paths";
import {
  BarChart3, CalendarRange, Car, CarFront, ClipboardClock, ClipboardList,
  Cog,
  FileText,
  FolderCog,
  Handshake,
  LogOut,
  Motorbike,
  Package,
  Settings2, ShoppingCart,
  Trophy,
  UserCog,
  Warehouse,
  Wrench
} from "lucide-react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import type { LucideIcon } from "lucide-react";

type HomeItem = {
  label: string;
  to: string;
  enabled: boolean;
  icon: LucideIcon;
};

type HomeSection = {
  title: string;
  items: HomeItem[];
  icon: LucideIcon;
};

const cardClass =
  "home-module-card group block rounded-sm border border-[#E5E7EB] bg-white text-left shadow-sm transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:border-[#111827]";

const disabledCardClass = "home-module-card block rounded-sm border border-[#E5E7EB] bg-[#F3F4F6] text-left shadow-sm opacity-50 cursor-not-allowed";

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
  const hasAdministracion = hasAnyRole(user, ["admin", "administracion", "stock", "gerente", "supervisor", "vendedor"]);

  const hasPreventas = hasNIC;
  const hasProformas = true;
  const hasOperaciones = hasAnyRole(user, ["admin", "supervisor", "gerente"]);
  const hasPatentamientos = hasAnyRole(user, ["admin", "supervisor", "gerente"]);

  const sections: HomeSection[] = [
    {
      title: "stock de unidades",
      icon: Warehouse,
      items: [
        { label: "Convencional", to: paths.convencional.stockDisponible, enabled: hasNIC, icon: CarFront },
        { label: "Usados", to: paths.usados.stockDisponible, enabled: hasUsed, icon: Car },
        { label: "Liess", to: paths.liess.stockDisponible("nuevos"), enabled: hasLiess, icon: Motorbike },
      ],
    },
    {
      title: "Comercial",
      icon: ShoppingCart,
      items: [
        { label: "Preventas", to: paths.convencional.preventas, enabled: hasPreventas, icon: ClipboardList },
        { label: "Proformas", to: paths.convencional.proformas, enabled: hasProformas, icon: FileText },
      ],
    },
    {
      title: "Administracion convencional",
      icon: FolderCog,
      items: [
        {
          label: "Reventa pendientes",
          to: paths.administracion.reventaPendientes,
          enabled: hasAdministracion,
          icon: ClipboardClock,
        },
        {
          label: "Lista previa",
          to: paths.administracion.pedidoUnidadesListaPrevia,
          enabled: hasAdministracion,
          icon: ClipboardList,
        },
        {
          label: "Facturas anticipo",
          to: paths.administracion.facturasAnticipo,
          enabled: hasAdministracion,
          icon: CalendarRange,
        },
      ],
    },
    {
      title: "Gestion de stock convencional",
      icon: Settings2,
      items: [
        { label: "Asignaciones", to: paths.convencional.asignaciones, enabled: hasNIC, icon: Wrench },
        {
          label: "Registro asignaciones",
          to: paths.convencional.registroAsignaciones,
          enabled: hasNIC,
          icon: ClipboardList,
        },
        { label: "Pedido mensual", to: paths.convencional.pedidoMensual, enabled: hasNIC, icon: Package },
        { label: "Pedido unidades", to: paths.convencional.pedidoUnidades, enabled: hasNIC, icon: Package },
      ],
    },
    {
      title: "Gestion de stock usados",
      icon: Wrench,
      items: [
        { label: "No reparado", to: paths.usados.stockNoReparado, enabled: hasUsed, icon: Cog },
        {
          label: "Pendiente documentacion",
          to: paths.usados.stockPendienteDocumentacion,
          enabled: hasUsed,
          icon: ClipboardList,
        },
        { label: "Ingresos", to: paths.usados.stockIngresos, enabled: hasUsed, icon: Handshake },
      ],
    },
    {
      title: "Analisis",
      icon: BarChart3,
      items: [
        { label: "Operaciones", to: paths.analisis.operaciones, enabled: hasOperaciones, icon: BarChart3 },
        { label: "Ranking", to: paths.convencional.ranking, enabled: hasNIC, icon: Trophy },
        { label: "Promedio", to: paths.convencional.promedio, enabled: hasNIC, icon: BarChart3 },
        {
          label: "Patentamientos",
          to: paths.analisis.patentamientos.dashboardMarcas,
          enabled: hasPatentamientos,
          icon: BarChart3,
        },
      ],
    },
    {
      title: "Sistema",
      icon: Cog,
      items: [
        { label: "Usuarios", to: paths.admin.usuarios, enabled: hasSystem, icon: UserCog },
        { label: "Configuracion", to: paths.admin.configuracion, enabled: hasSystem, icon: Cog },
      ],
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem("AUTH_TOKEN");
    navigate(paths.login, { replace: true });
  };

  return (
    <>
      <style>
        {`
          .inicio-page {
            min-height: 100vh;
            background: #F9FAFB;
            color: #111827;
            font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            display: flex;
            flex-direction: column;
          }

          .inicio-header {
            width: 100%;
            background: #FFFFFF;
            border-bottom: 1px solid #E5E7EB;
          }

          .inicio-header-inner {
            max-width: 1280px;
            height: 64px;
            margin: 0 auto;
            padding: 0 24px;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }

          .inicio-brand {
            display: flex;
            align-items: center;
            gap: 12px;
          }

          .inicio-logo {
            width: 32px;
            height: 32px;
            background: #000000;
            color: #FFFFFF;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: 700;
          }

          .inicio-title {
            margin: 0;
            color: #111827;
            font-size: 18px;
            line-height: 28px;
            font-weight: 600;
            letter-spacing: -0.025em;
            text-transform: uppercase;
          }

          .inicio-logout {
            display: flex;
            align-items: center;
            gap: 8px;
            border: 1px solid #E5E7EB;
            border-radius: 6px;
            background: #FFFFFF;
            color: #6B7280;
            padding: 8px 16px;
            font-size: 14px;
            line-height: 20px;
            font-weight: 500;
            transition: all 0.2s ease-in-out;
          }

          .inicio-logout:hover {
            color: #DC2626;
            border-color: #FECACA;
          }

          .inicio-logout svg {
            transition: transform 0.2s ease-in-out;
          }

          .inicio-logout:hover svg {
            transform: translateX(4px);
          }

          .inicio-main {
            width: 100%;
            max-width: 1280px;
            margin: 0 auto;
            padding: 48px 24px;
            flex: 1;
          }

          .inicio-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            column-gap: 48px;
            row-gap: 64px;
          }

          .inicio-section-title {
            margin: 0 0 24px 0;
            padding-left: 12px;
            border-left: 2px solid #000000;
            color: #6B7280;
            font-size: 12px;
            line-height: 16px;
            font-weight: 600;
            letter-spacing: 0.15em;
            text-transform: uppercase;
          }

          .inicio-cards {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 16px;
          }

          .home-module-card {
  height: 54px;
  display: flex;
  align-items: center;
  padding: 0 18px !important;
}

.inicio-card-text {
  color: #374151;
  font-size: 13px;
  line-height: 18px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

          .inicio-section-title-content {
            display: inline-flex;
            align-items: center;
            gap: 8px;
          }

          .inicio-card-content {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            min-width: 0;
          }

          .home-module-card:hover .inicio-card-text {
            color: #000000;
          }

          .inicio-footer {
            border-top: 1px solid #E5E7EB;
            padding: 40px 24px;
            text-align: center;
          }

          .inicio-footer p {
            margin: 0;
            color: #6B7280;
            font-size: 12px;
            line-height: 16px;
            letter-spacing: 0.15em;
            text-transform: uppercase;
          }

          @media (max-width: 768px) {
            .inicio-grid {
              grid-template-columns: 1fr;
              row-gap: 48px;
            }

            .inicio-cards {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }
          }
        `}
      </style>

      <div className="inicio-page">
        <header className="inicio-header">
          <div className="inicio-header-inner">
            <div className="inicio-brand">
              <div className="inicio-logo">NIC</div>
              <h1 className="inicio-title">IntraNIC</h1>
            </div>

            <button type="button" onClick={handleLogout} className="inicio-logout">
              <LogOut size={16} strokeWidth={2} />
              <span>Cerrar sesion</span>
            </button>
          </div>
        </header>

        <main className="inicio-main">
          <div className="inicio-grid">
            {sections.map((section) => (
              <section key={section.title}>
                <h2 className="inicio-section-title">
                  <span className="inicio-section-title-content">
                    <section.icon size={14} strokeWidth={2} />
                    <span>{section.title}</span>
                  </span>
                </h2>

                <div className="inicio-cards">
                  {section.items.map((item) =>
                    item.enabled ? (
                      <Link key={item.label} to={item.to} className={cardClass}>
                        <span className="inicio-card-content">
                          <item.icon size={13} strokeWidth={2} />
                          <span className="inicio-card-text">{item.label}</span>
                        </span>
                      </Link>
                    ) : (
                      <span key={item.label} className={disabledCardClass}>
                        <span className="inicio-card-content">
                          <item.icon size={13} strokeWidth={2} />
                          <span className="inicio-card-text">{item.label}</span>
                        </span>
                      </span>
                    ),
                  )}
                </div>
              </section>
            ))}
          </div>
        </main>

        <footer className="inicio-footer">
          <p>Uso interno de Nippon Car SRL 2026 - Franco Sanchez</p>
        </footer>
      </div>
    </>
  );
}
