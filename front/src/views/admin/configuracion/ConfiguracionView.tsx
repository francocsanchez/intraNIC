import { getConfiguracion } from "@/api/configuracionAPI";
import { getVendedoresNic } from "@/api/dms/dmsAPI";
import { hasModuleAccess, hasPathAccess } from "@/helpers/access";
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
    return <div className="px-4 py-6">Cargando...</div>;
  }

  if (configError || vendedoresError) {
    return <div className="px-4 py-6 text-red-600">Error al cargar la configuración</div>;
  }

  const vendedoresMap = new Map(vendedores.map((v) => [String(v.codigo), v.vendedor]));

  const mapCodigos = (codigos: string[]) => codigos.map((c) => vendedoresMap.get(String(c)) ?? `Código ${c}`);

  if (!config) return null;

  const canViewConfiguracion = hasModuleAccess(user, "configuracion") && hasPathAccess(user, paths.admin.configuracion);
  const canEditConfiguracion = hasModuleAccess(user, "configuracion");
  const canManagePreventasCatalogs =
    hasModuleAccess(user, "configuracion") &&
    (hasPathAccess(user, paths.convencional.preventasColores) ||
      hasPathAccess(user, paths.convencional.preventasVersiones));
  const canViewCallCenterOrigins =
    hasModuleAccess(user, "callCenter") && hasPathAccess(user, paths.callCenter.origenesDatos);

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
      canEdit: canEditConfiguracion && hasPathAccess(user, paths.admin.configuracionConvencionalEditar),
      editPath: paths.admin.configuracionConvencionalEditar,
      catalogos: canManagePreventasCatalogs
        ? [
            { label: "Colores", to: paths.convencional.preventasColores },
            { label: "Versiones", to: paths.convencional.preventasVersiones },
          ]
        : [],
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
      canEdit: canEditConfiguracion && hasPathAccess(user, paths.admin.configuracionUsadosEditar),
      editPath: paths.admin.configuracionUsadosEditar,
      catalogos: [],
    },
  ];

  return (
    <div className="w-full px-4 py-6 space-y-5">
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Administración</p>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Configuración</h1>
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {sistemas.filter((sistema) => sistema.canView).map((sistema) => (
          <div key={sistema.title} className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3.5">
              <div className="flex items-center gap-2.5">
                <h2 className="text-sm font-semibold text-gray-900">{sistema.title}</h2>

                <span
                  className={[
                    "rounded-full px-2.5 py-1 text-[11px] font-semibold",
                    sistema.activo ? "border border-green-200 bg-green-50 text-green-700" : "border border-red-200 bg-red-50 text-red-700",
                  ].join(" ")}
                >
                  {sistema.activo ? "Activo" : "Inactivo"}
                </span>
              </div>

              {sistema.canEdit ? (
                <Link
                  to={sistema.editPath}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-900 hover:bg-gray-50"
                >
                  Editar
                </Link>
              ) : (
                <span className="rounded-lg border border-gray-200 bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-400">
                  Sin acceso de edicion
                </span>
              )}
            </div>

            <div className="space-y-4 p-5">
              {sistema.bloques.map((bloque) => (
                <div key={bloque.label}>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">{bloque.label}</div>
                    {bloque.values.length > 0 ? <span className="text-xs text-gray-400">{bloque.values.length}</span> : null}
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5">
                    {bloque.values.length > 0 ? (
                      <ul className="grid grid-cols-1 gap-x-4 gap-y-1 text-sm text-gray-700 sm:grid-cols-2 xl:grid-cols-3">
                        {bloque.values.map((v) => (
                          <li key={v} className="truncate">
                            {v}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-xs text-gray-400">Sin vendedores configurados</span>
                    )}
                  </div>
                </div>
              ))}

              {sistema.catalogos.length ? (
                <div>
                  <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">Catalogos preventas</div>
                  <div className="flex flex-wrap gap-2">
                    {sistema.catalogos.map((catalogo) => (
                      <Link
                        key={catalogo.to}
                        to={catalogo.to}
                        className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-900 hover:bg-gray-50"
                      >
                        {catalogo.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </section>

      {canViewCallCenterOrigins ? (
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Call Center</p>
              <h2 className="mt-1 text-lg font-semibold tracking-tight text-gray-900">Origenes de datos</h2>
              <p className="mt-1 text-sm text-gray-500">
                Administra el campo `origenResumido` para agrupar los origenes detectados por el importador.
              </p>
            </div>

            <Link
              to={paths.callCenter.origenesDatos}
              className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-900 hover:bg-gray-50"
            >
              Administrar origenes
            </Link>
          </div>
        </section>
      ) : null}
    </div>
  );
}
