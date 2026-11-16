import { getConfiguracion } from "@/api/configuracionAPI";
import { getVendedoresNic } from "@/api/dms/dmsAPI";
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

  const {
    data: vendedoresResponse,
    isError: vendedoresError,
    isLoading: vendedoresLoading,
  } = useQuery({
    queryKey: ["vendedores"],
    queryFn: getVendedoresNic,
  });

  const config = configResponse?.data;
  const vendedores = vendedoresResponse?.data ?? [];

  if (configLoading || vendedoresLoading) {
    return (
      <div className="font-preset px-2 py-3 text-muted-foreground">
        Cargando...
      </div>
    );
  }

  if (configError || vendedoresError) {
    return (
      <div className="font-preset px-2 py-3 text-destructive">
        Error al cargar la configuración
      </div>
    );
  }

  const vendedoresMap = new Map(
    vendedores.map((v) => [String(v.codigo), v.vendedor]),
  );

  const mapCodigos = (codigos: string[]) =>
    codigos.map((c) => vendedoresMap.get(String(c)) ?? `Código ${c}`);

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
      slug: "convencional",
      activo: config.sistemaActivoConvencional,
      bloques: [
        {
          label: "Vendedores Reservas",
          values: mapCodigos(config.vendedoresReservasConvencional),
        },
        {
          label: "Vendedores Disponible",
          values: mapCodigos(config.vendedoresDisponibleConvencional),
        },
        {
          label: "Vendedores Stock Guardado",
          values: mapCodigos(config.vendedoresStockGuardadoConvencional),
        },
      ],
      canView: true,
      canEdit:
        canEditConfiguracion &&
        hasPathAccess(user, paths.admin.configuracionConvencionalEditar),
      editPath: paths.admin.configuracionConvencionalEditar,
    },
    {
      title: "Usados",
      slug: "usados",
      activo: config.sistemaActivoUsados,
      bloques: [
        {
          label: "Vendedores Reservas",
          values: mapCodigos(config.vendedoresReservasUsados),
        },
        {
          label: "Vendedores Disponible",
          values: mapCodigos(config.vendedoresDisponibleUsados),
        },
        {
          label: "Vendedores Stock Guardado",
          values: mapCodigos(config.vendedoresStockGuardadoUsados),
        },
        {
          label: "Vendedores Stock No Reparado",
          values: mapCodigos(config.vendedoresStockNoReparadoUsados ?? []),
        },
        {
          label: "Vendedores Stock Pend. DocumentaciÃ³n",
          values: mapCodigos(config.vendedoresStockPendDocuUsados ?? []),
        },
      ],
      canView: true,
      canEdit:
        canEditConfiguracion &&
        hasPathAccess(user, paths.admin.configuracionUsadosEditar),
      editPath: paths.admin.configuracionUsadosEditar,
    },
    {
      title: "Belgrano",
      slug: "belgrano",
      activo: config.sistemaActivoBelgrano,
      bloques: [
        {
          label: "Vendedores Disponible",
          values: mapCodigos(config.vendedoresDisponibleBelgrano ?? []),
        },
      ],
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

      <section className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        {sistemas
          .filter((sistema) => sistema.canView)
          .map((sistema) => (
            <div
              key={sistema.title}
              className="rounded-lg border border-border bg-card shadow-sm"
            >
              <div className="flex items-center justify-between border-b border-border px-3 py-3">
                <div className="flex items-center gap-2.5">
                  <h2 className="text-sm font-semibold text-foreground">
                    {sistema.title}
                  </h2>

                  <span
                    className={[
                      "rounded-full px-2.5 py-1 text-primary font-semibold",
                      sistema.activo
                        ? "border border-border bg-background text-foreground"
                        : "border border-destructive/30 bg-background text-destructive",
                    ].join(" ")}
                  >
                    {sistema.activo ? "Activo" : "Inactivo"}
                  </span>
                </div>

                {sistema.canEdit ? (
                  <Link
                    to={sistema.editPath}
                    className="rounded-md border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted"
                  >
                    Editar
                  </Link>
                ) : (
                  <span className="rounded-md border border-border bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                    Sin acceso de edicion
                  </span>
                )}
              </div>

              <div className="space-y-3 p-3">
                {sistema.bloques.map((bloque) => (
                  <div key={bloque.label}>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <div className="text-primary font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        {bloque.label}
                      </div>
                      {bloque.values.length > 0 ? (
                        <span className="text-xs text-muted-foreground">
                          {bloque.values.length}
                        </span>
                      ) : null}
                    </div>
                    <div className="rounded-md border border-border bg-muted px-3 py-2.5">
                      {bloque.values.length > 0 ? (
                        <ul className="grid grid-cols-1 gap-x-4 gap-y-1 text-sm text-foreground sm:grid-cols-2 xl:grid-cols-3">
                          {bloque.values.map((v) => (
                            <li key={v} className="truncate">
                              {v}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Sin vendedores configurados
                        </span>
                      )}
                    </div>
                  </div>
                ))}

              </div>
            </div>
          ))}
      </section>

      {canManageSystemParameters ? (
        <section className="rounded-lg border border-border bg-card px-3 py-3 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Sistema</p>
              <h2 className="mt-1 text-lg font-semibold tracking-tight text-foreground">Parámetros de sistema</h2>
              <p className="mt-1 text-sm text-muted-foreground">Administra los catálogos generales utilizados por los distintos módulos.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {canManagePreventasCatalogs ? <Link to={paths.admin.colores} className="rounded-md border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted">Colores</Link> : null}
              {canManagePreventasCatalogs ? <Link to={paths.admin.coloresUnidades} className="rounded-md border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted">Colores de unidades</Link> : null}
              {canManagePreventasCatalogs ? <Link to={paths.admin.versiones} className="rounded-md border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted">Versiones</Link> : null}
              {canManagePlanNegocio ? <Link to={paths.admin.planNegocio} className="rounded-md border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted">PN</Link> : null}
              {canManagePedidoMensual ? <Link to={paths.admin.pedidoMensual} className="rounded-md border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted">Pedido mensual</Link> : null}
              <Link to={paths.admin.conversiones} className="rounded-md border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted">Conversiones</Link>
            </div>
          </div>
        </section>
      ) : null}

      {canManageAgendaEnvio ? (
        <section className="rounded-lg border border-border bg-card px-3 py-3 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Sistema
              </p>
              <h2 className="mt-1 text-lg font-semibold tracking-tight text-foreground">
                Envío de agenda
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Configura por sucursal los destinatarios del PDF automático de
                la agenda de entrega.
              </p>
            </div>

            <Link
              to={paths.admin.configuracionEnvioAgenda}
              className="inline-flex items-center justify-center rounded-lg border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted"
            >
              Administrar envíos
            </Link>
          </div>
        </section>
      ) : null}

      {canManageDashboardSalon ? (
        <section className="rounded-lg border border-border bg-card px-3 py-3 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Análisis</p>
              <h2 className="mt-1 text-lg font-semibold tracking-tight text-foreground">Dashboard Salón</h2>
              <p className="mt-1 text-sm text-muted-foreground">Define objetivos mensuales e imágenes por modelo para el Dashboard Salón.</p>
            </div>
            <Link to={paths.admin.configuracionDashboardSalon} className="inline-flex items-center justify-center rounded-lg border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted">Configurar Dashboard</Link>
          </div>
        </section>
      ) : null}

      {canManageDashboardSalon ? (
        <section className="rounded-lg border border-border bg-card px-3 py-3 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Análisis</p>
              <h2 className="mt-1 text-lg font-semibold tracking-tight text-foreground">Fotos de vendedores</h2>
              <p className="mt-1 text-sm text-muted-foreground">Administra las fotos que se muestran debajo del ranking de vendedores del Dashboard Salón.</p>
            </div>
            <Link to={paths.admin.configuracionFotosVendedores} className="inline-flex items-center justify-center rounded-lg border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted">Administrar fotos</Link>
          </div>
        </section>
      ) : null}

      {canManageDashboardAdministracion ? (
        <section className="rounded-lg border border-border bg-card px-3 py-3 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Análisis</p>
              <h2 className="mt-1 text-lg font-semibold tracking-tight text-foreground">Cobranzas semanales</h2>
              <p className="mt-1 text-sm text-muted-foreground">Define los objetivos semanales que se comparan en Dashboard Administración.</p>
            </div>
            <Link to={paths.admin.configuracionDashboardAdministracion} className="inline-flex items-center justify-center rounded-lg border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted">Configurar objetivos</Link>
          </div>
        </section>
      ) : null}

      {canManageUnidadesNegocio ? (
        <section className="rounded-lg border border-border bg-card px-3 py-3 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Comercial
              </p>
              <h2 className="mt-1 text-lg font-semibold tracking-tight text-foreground">
                Unidades de negocio
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Define las unidades que segmentan la agenda comercial y la
                asignacion de usuarios.
              </p>
            </div>

            <Link
              to={paths.admin.unidadesNegocio}
              className="inline-flex items-center justify-center rounded-lg border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted"
            >
              Administrar unidades
            </Link>
          </div>
        </section>
      ) : null}
    </div>
  );
}
