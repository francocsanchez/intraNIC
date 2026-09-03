import Loading from "@/components/Loading";
import { hasModulePathAccess } from "@/helpers/access";
import { useAuth } from "@/hooks/useAuthe";
import { paths } from "@/routes/paths";
import {
  BarChart3, CalendarRange, Car, CarFront, ClipboardClock, ClipboardList,
  Cog,
  ShieldAlert,
  CalendarDays,
  PhoneCall,
  FileSearch,
  FileText,
  FileSpreadsheet,
  FolderCog,
  Hammer,
  Inbox,
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
  "group flex h-12 items-center gap-2 rounded-md border border-border bg-card px-3 text-left text-sm font-medium text-foreground transition-colors hover:bg-secondary";

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
  const canViewAnalisisOperaciones = hasModulePathAccess(
    user,
    "analisisOperaciones",
    paths.analisis.analisisOperaciones,
  );

  const sections: HomeSection[] = [
    {
      title: "stock de unidades",
      icon: Warehouse,
      items: [
        { label: "Convencional", to: paths.convencional.stockDisponible, enabled: hasModulePathAccess(user, "convencional", paths.convencional.stockDisponible), icon: CarFront },
        { label: "Usados", to: paths.usados.stockDisponible, enabled: hasModulePathAccess(user, "usados", paths.usados.stockDisponible), icon: Car },
        { label: "Belgrano", to: paths.belgrano.stockDisponible, enabled: hasModulePathAccess(user, "belgrano", paths.belgrano.stockDisponible), icon: Package },
        { label: "Liess", to: paths.liess.stockDisponible("nuevos"), enabled: hasModulePathAccess(user, "liess", paths.liess.stockDisponible("nuevos")), icon: Motorbike },
      ],
    },
    {
      title: "Calidad",
      icon: PhoneCall,
      items: [
        {
          label: "SSI Ventas",
          to: paths.calidad.ssiVentas,
          enabled: hasModulePathAccess(user, "ssiVentas", paths.calidad.ssiVentas),
          icon: PhoneCall,
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
        { label: "Pedido unidades", to: paths.convencional.pedidoUnidades, enabled: hasModulePathAccess(user, "pedidoUnidades", paths.convencional.pedidoUnidades), icon: Package },
      ],
    },
    {
      title: "Gestion de stock usados",
      icon: Wrench,
      items: [
        { label: "No reparado", to: paths.usados.stockNoReparado, enabled: hasModulePathAccess(user, "noReparado", paths.usados.stockNoReparado), icon: Hammer },
        {
          label: "Pendiente documentacion",
          to: paths.usados.stockPendienteDocumentacion,
          enabled: hasModulePathAccess(user, "pendienteDocumentacion", paths.usados.stockPendienteDocumentacion),
          icon: FileSearch,
        },
        { label: "Ingresos", to: paths.usados.stockIngresos, enabled: hasModulePathAccess(user, "ingresos", paths.usados.stockIngresos), icon: Inbox },
      ],
    },
    {
      title: "Analisis",
      icon: BarChart3,
      items: [
        { label: "Operaciones", to: paths.analisis.operaciones, enabled: hasModulePathAccess(user, "operaciones", paths.analisis.operaciones), icon: BarChart3 },
        {
          label: "Central de Deudores",
          to: paths.analisis.centralDeudores,
          enabled: hasModulePathAccess(user, "centralDeudores", paths.analisis.centralDeudores),
          icon: ShieldAlert,
        },
        {
          label: "Analisis Operaciones",
          to: paths.analisis.analisisOperaciones,
          enabled: canViewAnalisisOperaciones,
          icon: FileSpreadsheet,
        },
        {
          label: "Analisis Vendedor",
          to: paths.analisis.vendedor,
          enabled: hasModulePathAccess(user, "analisisVendedor", paths.analisis.vendedor),
          icon: FileSpreadsheet,
        },
        {
          label: "Saldo de operacion",
          to: paths.analisis.saldoOperacion,
          enabled: hasModulePathAccess(user, "saldoOperacion", paths.analisis.saldoOperacion),
          icon: FileSpreadsheet,
        },
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
    <div className="font-preset flex min-h-svh flex-col bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="flex h-14 items-center justify-between px-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
              NIC
            </div>
            <h1 className="text-base font-semibold tracking-tight">IntraNIC</h1>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            <LogOut size={16} strokeWidth={2} />
            <span>Cerrar sesion</span>
          </button>
        </div>
      </header>

      <main className="flex-1 bg-muted px-3 py-4">
        <div className="grid gap-x-6 gap-y-7 xl:grid-cols-2">
          {visibleSections.map((section) => (
            <section key={section.title}>
              <h2 className="mb-3 flex items-center gap-2 border-l-2 border-primary pl-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                <section.icon size={14} strokeWidth={2} />
                <span>{section.title}</span>
              </h2>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {section.items.map((item) => (
                  <Link key={item.label} to={item.to} className={cardClass}>
                    <item.icon size={15} strokeWidth={2} className="shrink-0 text-muted-foreground" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>

      <footer className="flex flex-col gap-1 border-t border-border px-3 py-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <span>IntraNIC - Uso interno Nippon Car</span>
        <span>Desarrollado por Franco Sanchez</span>
      </footer>
    </div>
  );
}
