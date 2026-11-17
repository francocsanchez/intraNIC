import { getConfiguracion } from "@/api/configuracionAPI";
import {
  hasModuleAccess,
  hasPathAccess,
  hasSuperAdminRole,
} from "@/helpers/access";
import { useAuth } from "@/hooks/useAuthe";
import { paths } from "@/routes/paths";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
export default function ConfiguracionView() {
  const { user } = useAuth();
  const {
    data: configResponse,
    isError: configError,
    isLoading: configLoading,
  } = useQuery({
    queryKey: ["configuracion"],
    queryFn: getConfiguracion,
  });

  const config = configResponse?.data;

  if (configLoading) {
    return (
      <div className="font-preset px-2 py-3 text-muted-foreground">
        Cargando...
      </div>
    );
  }

  if (configError) {
    return (
      <div className="font-preset px-2 py-3 text-destructive">
        Error al cargar la configuración
      </div>
    );
  }

  if (!config) return null;

  const canViewConfiguracion =
    hasModuleAccess(user, "configuracion") &&
    hasPathAccess(user, paths.admin.configuracion);
  const canEditConfiguracion = hasModuleAccess(user, "configuracion");
  const canManagePreventasCatalogs =
    hasModuleAccess(user, "configuracion") &&
    (hasPathAccess(user, paths.admin.colores) ||
      hasPathAccess(user, paths.admin.versiones));
  const canManagePlanNegocio =
    hasModuleAccess(user, "configuracion") &&
    hasPathAccess(user, paths.admin.planNegocio);
  const canManagePedidoMensual =
    hasModuleAccess(user, "pedidoMensual") &&
    hasPathAccess(user, paths.admin.pedidoMensual);
  const canManageSystemParameters =
    hasSuperAdminRole(user) &&
    hasModuleAccess(user, "configuracion");
  const canManageAgendaEnvio =
    hasModuleAccess(user, "configuracion") &&
    hasPathAccess(user, paths.admin.configuracionEnvioAgenda);
  const canManageUnidadesNegocio =
    hasModuleAccess(user, "configuracion") &&
    hasPathAccess(user, paths.admin.unidadesNegocio);
  const canManageDashboardSalon =
    hasModuleAccess(user, "configuracion") &&
    hasPathAccess(user, paths.admin.configuracionDashboardSalon);
  const canManageDashboardAdministracion =
    hasModuleAccess(user, "configuracion") &&
    hasPathAccess(user, paths.admin.configuracionDashboardAdministracion);

  if (!canViewConfiguracion) return null;

  const sistemas = [
    {
      title: "Convencional",
      activo: config.sistemaActivoConvencional,
      canView: true,
      canEdit:
        canEditConfiguracion &&
        hasPathAccess(user, paths.admin.configuracionConvencionalEditar),
      editPath: paths.admin.configuracionConvencionalEditar,
    },
    {
      title: "Usados",
      activo: config.sistemaActivoUsados,
      canView: true,
      canEdit:
        canEditConfiguracion &&
        hasPathAccess(user, paths.admin.configuracionUsadosEditar),
      editPath: paths.admin.configuracionUsadosEditar,
    },
    {
      title: "Belgrano",
      activo: config.sistemaActivoBelgrano,
      canView: true,
      canEdit:
        canEditConfiguracion &&
        hasPathAccess(user, paths.admin.configuracionBelgranoEditar),
      editPath: paths.admin.configuracionBelgranoEditar,
    },
  ];

  return (
    <div className="font-preset w-full space-y-3 px-2 py-3">
      <section className="rounded-lg border border-border bg-card px-3 py-3 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Administración
        </p>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Configuración
        </h1>
      </section>

      <section className="grid grid-cols-1 gap-2 xl:grid-cols-3">
        {sistemas
          .filter((sistema) => sistema.canView)
          .map((sistema) => (
            <div
              key={sistema.title}
              className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-3 shadow-sm ${sistema.activo ? "border-emerald-300 bg-emerald-50" : "border-red-300 bg-red-50"}`}
            >
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-foreground">
                  {sistema.title}
                </h2>
                <span className={`text-xs font-semibold ${sistema.activo ? "text-emerald-800" : "text-red-800"}`}>
                  {sistema.activo ? "Activo" : "Inactivo"}
                </span>
              </div>

              {sistema.canEdit ? (
                <Link
                  to={sistema.editPath}
                  className="text-xs font-semibold text-primary hover:underline hover:underline-offset-4"
                >
                  Editar
                </Link>
              ) : (
                <span className="text-xs text-muted-foreground">
                  Sin acceso de edición
                </span>
              )}
            </div>
          ))}
      </section>

      {canManageSystemParameters || canManageAgendaEnvio || canManageDashboardSalon || canManageDashboardAdministracion || canManageUnidadesNegocio ? (
        <section className="rounded-lg border border-border bg-card px-4 py-3 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Sistema</p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight text-foreground">Parámetros de sistema</h2>
          <div className="mt-4 grid gap-x-8 gap-y-2 sm:grid-cols-2">
            {canManageSystemParameters && canManagePreventasCatalogs ? <Link to={paths.admin.colores} className="text-sm font-semibold text-primary hover:underline hover:underline-offset-4">Colores</Link> : null}
            {canManageSystemParameters && canManagePreventasCatalogs ? <Link to={paths.admin.coloresUnidades} className="text-sm font-semibold text-primary hover:underline hover:underline-offset-4">Colores de unidades</Link> : null}
            {canManageSystemParameters && canManagePreventasCatalogs ? <Link to={paths.admin.versiones} className="text-sm font-semibold text-primary hover:underline hover:underline-offset-4">Versiones</Link> : null}
            {canManageSystemParameters && canManagePlanNegocio ? <Link to={paths.admin.planNegocio} className="text-sm font-semibold text-primary hover:underline hover:underline-offset-4">PN</Link> : null}
            {canManageSystemParameters && canManagePedidoMensual ? <Link to={paths.admin.pedidoMensual} className="text-sm font-semibold text-primary hover:underline hover:underline-offset-4">Pedido mensual</Link> : null}
            {canManageSystemParameters ? <Link to={paths.admin.conversiones} className="text-sm font-semibold text-primary hover:underline hover:underline-offset-4">Conversiones</Link> : null}
            {canManageAgendaEnvio ? <Link to={paths.admin.configuracionEnvioAgenda} className="text-sm font-semibold text-primary hover:underline hover:underline-offset-4">Envío de agenda</Link> : null}
            {canManageDashboardSalon ? <Link to={paths.admin.configuracionDashboardSalon} className="text-sm font-semibold text-primary hover:underline hover:underline-offset-4">Dashboard Salón</Link> : null}
            {canManageDashboardSalon ? <Link to={paths.admin.configuracionFotosVendedores} className="text-sm font-semibold text-primary hover:underline hover:underline-offset-4">Fotos de vendedores</Link> : null}
            {canManageDashboardAdministracion ? <Link to={paths.admin.configuracionDashboardAdministracion} className="text-sm font-semibold text-primary hover:underline hover:underline-offset-4">Cobranzas semanales</Link> : null}
            {canManageUnidadesNegocio ? <Link to={paths.admin.unidadesNegocio} className="text-sm font-semibold text-primary hover:underline hover:underline-offset-4">Unidades de negocio</Link> : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}
