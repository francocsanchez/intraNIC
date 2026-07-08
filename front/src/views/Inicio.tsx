import Loading from "@/components/Loading";
import { hasModuleAccess, hasModulePathAccess } from "@/helpers/access";
import { useAuth } from "@/hooks/useAuthe";
import { paths } from "@/routes/paths";
import {
  BarChart3, CalendarRange, Car, CarFront, ClipboardClock, ClipboardList,
  Cog,
  Headset,
  CalendarDays,
  FileText,
  FileSpreadsheet,
  FolderCog,
  Factory,
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

export default function Inicio() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, isError } = useAuth();

  if (isLoading) return <Loading />;

  if (isError || !isAuthenticated || !user) {
    localStorage.removeItem("AUTH_TOKEN");
    return <Navigate to={paths.login} replace />;
  }

  const preventasHomePath = hasModulePathAccess(user, "preventas", paths.convencional.preventas)
    ? paths.convencional.preventas
    : paths.convencional.preventasResumen;

  const sections: HomeSection[] = [
    {
      title: "stock de unidades",
      icon: Warehouse,
      items: [
        { label: "Convencional", to: paths.convencional.stockDisponible, enabled: hasModulePathAccess(user, "convencional", paths.convencional.stockDisponible), icon: CarFront },
        { label: "Usados", to: paths.usados.stockDisponible, enabled: hasModulePathAccess(user, "usados", paths.usados.stockDisponible), icon: Car },
        { label: "Liess", to: paths.liess.stockDisponible("nuevos"), enabled: hasModulePathAccess(user, "liess", paths.liess.stockDisponible("nuevos")), icon: Motorbike },
      ],
    },
    {
      title: "Call Center",
      icon: Headset,
      items: [
        {
          label: "Importador de datos",
          to: paths.callCenter.importar,
          enabled: hasModulePathAccess(user, "callCenter", paths.callCenter.importar),
          icon: FileText,
        },
        {
          label: "Origenes de datos",
          to: paths.callCenter.origenesDatos,
          enabled: hasModulePathAccess(user, "callCenter", paths.callCenter.origenesDatos),
          icon: Cog,
        },
      ],
    },
    {
      title: "Entregas",
      icon: CalendarDays,
      items: [
        {
          label: "Agenda de entrega",
          to: paths.entregas.agenda,
          enabled: hasModulePathAccess(user, "agendaEntrega", paths.entregas.agenda),
          icon: CalendarDays,
        },
        {
          label: "Pendientes de turnar",
          to: paths.entregas.pendientesTurnar,
          enabled: hasModulePathAccess(user, "pendientesTurnar", paths.entregas.pendientesTurnar),
          icon: CalendarDays,
        },
      ],
    },
    {
      title: "Comercial",
      icon: ShoppingCart,
      items: [
        { label: "Proformas", to: paths.convencional.proformas, enabled: hasModulePathAccess(user, "proformas", paths.convencional.proformas), icon: FileText },
        { label: "Minutas", to: paths.convencional.minutas, enabled: hasModulePathAccess(user, "minutas", paths.convencional.minutas), icon: ClipboardList },
        { label: "Registro TestDrive", to: paths.convencional.registroTestDrive, enabled: hasModulePathAccess(user, "registroTestDriveConvencional", paths.convencional.registroTestDrive), icon: CarFront },
      ],
    },
    {
      title: "Plan de ahorro",
      icon: CarFront,
      items: [
        { label: "Registro TestDrive", to: paths.planAhorro.registroTestDrive, enabled: hasModulePathAccess(user, "registroTestDrive", paths.planAhorro.registroTestDrive), icon: CarFront },
        { label: "Promedios", to: paths.planAhorro.promedios, enabled: hasModulePathAccess(user, "promediosPlanAhorro", paths.planAhorro.promedios), icon: BarChart3 },
      ],
    },
    {
      title: "Administracion convencional",
      icon: FolderCog,
      items: [
        {
          label: "Reventa pendientes",
          to: paths.administracion.reventaPendientes,
          enabled: hasModulePathAccess(user, "reventaPendientes", paths.administracion.reventaPendientes),
          icon: ClipboardClock,
        },
        {
          label: "Lista previa",
          to: paths.administracion.pedidoUnidadesListaPrevia,
          enabled: hasModulePathAccess(user, "listaPrevia", paths.administracion.pedidoUnidadesListaPrevia),
          icon: ClipboardList,
        },
        {
          label: "Facturas anticipo",
          to: paths.administracion.facturasAnticipo,
          enabled: hasModulePathAccess(user, "facturasAnticipo", paths.administracion.facturasAnticipo),
          icon: CalendarRange,
        },
        {
          label: "Seg. unidades fabrica",
          to: paths.administracion.segUnidadesFabrica,
          enabled: hasModuleAccess(user, "segUnidadesFabrica"),
          icon: Factory,
        },
      ],
    },
    {
      title: "Gestion de stock convencional",
      icon: Settings2,
      items: [
        { label: "Asignaciones", to: paths.convencional.asignaciones, enabled: hasModulePathAccess(user, "asignaciones", paths.convencional.asignaciones), icon: Wrench },
        { label: "Plan de negocio", to: paths.convencional.planNegocio, enabled: hasModulePathAccess(user, "planNegocio", paths.convencional.planNegocio), icon: BarChart3 },
        {
          label: "Registro asignaciones",
          to: paths.convencional.registroAsignaciones,
          enabled: hasModulePathAccess(user, "registroAsignaciones", paths.convencional.registroAsignaciones),
          icon: ClipboardList,
        },
        { label: "Analisis de stock", to: paths.convencional.analisisStock, enabled: hasModulePathAccess(user, "analisisStock", paths.convencional.analisisStock), icon: BarChart3 },
        { label: "Pend Fac", to: paths.convencional.pendFac, enabled: hasModulePathAccess(user, "pendFac", paths.convencional.pendFac), icon: ClipboardList },
        { label: "Preventas", to: preventasHomePath, enabled: hasModulePathAccess(user, "preventas", preventasHomePath), icon: ClipboardList },
        { label: "Pedido mensual", to: paths.convencional.pedidoMensual, enabled: hasModulePathAccess(user, "pedidoMensual", paths.convencional.pedidoMensual), icon: Package },
        { label: "Pedido unidades", to: paths.convencional.pedidoUnidades, enabled: hasModulePathAccess(user, "pedidoUnidades", paths.convencional.pedidoUnidades), icon: Package },
      ],
    },
    {
      title: "Gestion de stock usados",
      icon: Wrench,
      items: [
        { label: "No reparado", to: paths.usados.stockNoReparado, enabled: hasModulePathAccess(user, "noReparado", paths.usados.stockNoReparado), icon: Cog },
        {
          label: "Pendiente documentacion",
          to: paths.usados.stockPendienteDocumentacion,
          enabled: hasModulePathAccess(user, "pendienteDocumentacion", paths.usados.stockPendienteDocumentacion),
          icon: ClipboardList,
        },
        { label: "Ingresos", to: paths.usados.stockIngresos, enabled: hasModulePathAccess(user, "ingresos", paths.usados.stockIngresos), icon: Handshake },
      ],
    },
    {
      title: "Analisis",
      icon: BarChart3,
      items: [
        { label: "Operaciones", to: paths.analisis.operaciones, enabled: hasModulePathAccess(user, "operaciones", paths.analisis.operaciones), icon: BarChart3 },
        { label: "Ranking", to: paths.convencional.ranking, enabled: hasModulePathAccess(user, "ranking", paths.convencional.ranking), icon: Trophy },
        { label: "Promedio", to: paths.convencional.promedio, enabled: hasModulePathAccess(user, "promedio", paths.convencional.promedio), icon: BarChart3 },
        {
          label: "Patentamientos",
          to: paths.analisis.patentamientos.dashboardGeneral,
          enabled: hasModulePathAccess(user, "patentamientos", paths.analisis.patentamientos.dashboardMarcas),
          icon: BarChart3,
        },
        {
          label: "Transferencias",
          to: paths.analisis.transferencias.dashboardGeneral,
          enabled: hasModulePathAccess(user, "transferencias", paths.analisis.transferencias.dashboardGeneral),
          icon: BarChart3,
        },
      ],
    },
    {
      title: "Sistema",
      icon: Cog,
      items: [
        { label: "Usuarios", to: paths.admin.usuarios, enabled: hasModulePathAccess(user, "usuarios", paths.admin.usuarios), icon: UserCog },
        { label: "Configuracion", to: paths.admin.configuracion, enabled: hasModulePathAccess(user, "configuracion", paths.admin.configuracion), icon: Cog },
        { label: "PN", to: paths.admin.planNegocio, enabled: hasModulePathAccess(user, "configuracion", paths.admin.planNegocio), icon: BarChart3 },
        { label: "TestDrive", to: paths.admin.testDrive, enabled: hasModulePathAccess(user, "testDrive", paths.admin.testDrive), icon: CarFront },
        {
          label: "Act. Registros",
          to: paths.analisis.registros,
          enabled: hasModulePathAccess(user, "actualizacionRegistros", paths.analisis.registros),
          icon: FileSpreadsheet,
        },
      ],
    },
  ];

  const visibleSections = sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => item.enabled),
    }))
    .filter((section) => section.items.length > 0);

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
            {visibleSections.map((section) => (
              <section key={section.title}>
                <h2 className="inicio-section-title">
                  <span className="inicio-section-title-content">
                    <section.icon size={14} strokeWidth={2} />
                    <span>{section.title}</span>
                  </span>
                </h2>

                <div className="inicio-cards">
                  {section.items.map((item) => (
                    <Link key={item.label} to={item.to} className={cardClass}>
                      <span className="inicio-card-content">
                        <item.icon size={13} strokeWidth={2} />
                        <span className="inicio-card-text">{item.label}</span>
                      </span>
                    </Link>
                  ))}
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
