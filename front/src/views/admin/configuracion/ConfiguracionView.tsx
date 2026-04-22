import { getConfiguracion } from "@/api/configuracionAPI";
import { getVendedoresNic } from "@/api/dms/dmsAPI";
import { useAuth } from "@/hooks/useAuthe";
import { hasAnyCompany } from "@/helpers/access";
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

  const vendedoresMap = new Map(vendedores.map((v: any) => [String(v.codigo), v.vendedor]));

  const mapCodigos = (codigos: string[]) => codigos.map((c) => vendedoresMap.get(String(c)) ?? `Código ${c}`);

  if (!config) return null;

  const sistemas = [
    {
      title: "Convencional",
      slug: "convencional",
      activo: config.sistemaActivoConvencional,
      reservas: mapCodigos(config.vendedoresReservasConvencional),
      disponibles: mapCodigos(config.vendedoresDisponibleConvencional),
      stockGuardado: mapCodigos(config.vendedoresStockGuardadoConvencional),
      canEdit: hasAnyCompany(user, ["convencional"]),
    },
    {
      title: "Usados",
      slug: "usados",
      activo: config.sistemaActivoUsados,
      reservas: mapCodigos(config.vendedoresReservasUsados),
      disponibles: mapCodigos(config.vendedoresDisponibleUsados),
      stockGuardado: mapCodigos(config.vendedoresStockGuardadoUsados),
      canEdit: hasAnyCompany(user, ["usados"]),
    },
  ];

  return (
    <div className="w-full px-4 py-6 space-y-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Administración</p>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Configuración</h1>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {sistemas.map((sistema) => (
          <div key={sistema.title} className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <div className="flex items-center gap-3">
                <h2 className="text-base font-semibold text-gray-900">{sistema.title}</h2>

                <span
                  className={[
                    "rounded-full px-3 py-1 text-xs font-semibold",
                    sistema.activo ? "border border-green-200 bg-green-50 text-green-700" : "border border-red-200 bg-red-50 text-red-700",
                  ].join(" ")}
                >
                  {sistema.activo ? "Activo" : "Inactivo"}
                </span>
              </div>

              {sistema.canEdit ? (
                <Link
                  to={`/configuracion/${sistema.slug}/editar`}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-900 hover:bg-gray-50"
                >
                  Editar
                </Link>
              ) : (
                <span className="rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-400">
                  Sin acceso de edicion
                </span>
              )}
            </div>

            <div className="space-y-5 p-6">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500 mb-2">Vendedores Reservas</div>
                <div className="flex flex-wrap gap-2">
                  {sistema.reservas.map((v) => (
                    <span key={v} className="rounded-full border border-gray-200 bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                      {v}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500 mb-2">Vendedores Disponible</div>
                <div className="flex flex-wrap gap-2">
                  {sistema.disponibles.map((v) => (
                    <span key={v} className="rounded-full border border-gray-200 bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                      {v}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500 mb-2">Vendedores Stock Guardado</div>
                <div className="flex flex-wrap gap-2">
                  {sistema.stockGuardado.map((v) => (
                    <span key={v} className="rounded-full border border-gray-200 bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                      {v}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
