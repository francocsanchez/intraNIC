import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getConfiguracion } from "@/api/configuracionAPI";
import Mantenimiento from "@/components/Mantenimiento";
import { getStockReservaUsados } from "@/api/usados/stockAPI";
import { useAuth } from "@/hooks/useAuthe";
import { hasAnyRole } from "@/helpers/access";
import { textToColor } from "@/helpers/colores";

type ReservaUsado = {
  interno: number;
  vendedorReserva: string;
  version: string;
  marca: string;
  observaciones: string;
  color: string;
  anio: number;
  precioVenta: number;
  fechaRecepcion: string;
  kilometros: number;
  sucursal: string;
};

type ReservasUsadosResponse = {
  data: Record<string, ReservaUsado[]>;
  resumen: {
    total: number;
    sucursales: Record<string, number>;
  };
};

type MarcaFiltro = "TODOS" | string;

export default function StockReservasUsados() {
  const [marcaActiva, setMarcaActiva] = useState<MarcaFiltro>("TODOS");
  const { user } = useAuth();

  const {
    data: configResponse,
    isError: configError,
    isLoading: configLoading,
  } = useQuery({
    queryKey: ["configuracion"],
    queryFn: getConfiguracion,
    refetchOnWindowFocus: true,
  });

  const { data, isLoading, isError, error } = useQuery<ReservasUsadosResponse>({
    queryKey: ["stockReservado", "usados"],
    queryFn: getStockReservaUsados,
    refetchOnWindowFocus: true,
    refetchInterval: 1000,
  });

  const reservasPorSucursal = useMemo(() => {
    return Object.entries(data?.data ?? {});
  }, [data]);

  const todosLosItems = useMemo(() => {
    return Object.values(data?.data ?? {}).flat();
  }, [data]);

  const filtrosDisponibles = useMemo(() => {
    const marcas = Array.from(new Set(todosLosItems.map((item) => (item.marca || "").trim().toUpperCase()).filter(Boolean))).sort((a, b) =>
      a.localeCompare(b),
    );

    return ["TODOS", ...marcas];
  }, [todosLosItems]);

  const sucursalesFiltradas = useMemo(() => {
    return reservasPorSucursal
      .map(([sucursal, reservas]) => {
        const filtradas = marcaActiva === "TODOS" ? reservas : reservas.filter((item) => (item.marca || "").trim().toUpperCase() === marcaActiva);

        return [sucursal, filtradas] as const;
      })
      .filter(([, reservas]) => reservas.length > 0);
  }, [reservasPorSucursal, marcaActiva]);

  const totalFiltrado = useMemo(() => {
    return sucursalesFiltradas.reduce((acc, [, reservas]) => acc + reservas.length, 0);
  }, [sucursalesFiltradas]);

  const diasReserva = (fecha: string) => {
    const start = new Date(fecha).getTime();
    const now = Date.now();
    const diff = now - start;
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  const isPrivileged = hasAnyRole(user, ["admin", "gerente", "stock"]);

  if (isLoading || configLoading) return <div className="px-4 py-6">Cargando...</div>;

  if (isError || configError) {
    return <div className="px-4 py-6">{error instanceof Error ? error.message : "Error"}</div>;
  }

  if (configResponse?.data?.sistemaActivoUsados === false && !isPrivileged) {
    return <Mantenimiento />;
  }

  return (
    <div className="w-full px-4 py-6 space-y-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Usados</p>
        <h1 className=" text-2xl font-semibold tracking-tight text-gray-900">Stock Reservado Usados</h1>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[3fr_1fr]">
        <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Sucursales</p>

          <div
            className="mt-5 grid divide-x divide-gray-200"
            style={{
              gridTemplateColumns: `repeat(${Math.max(Object.keys(data?.resumen.sucursales ?? {}).length, 1)}, minmax(0,1fr))`,
            }}
          >
            {Object.entries(data?.resumen.sucursales ?? {}).map(([sucursal, total]) => (
              <div key={sucursal} className="px-4 first:pl-0 last:pr-0">
                <p className="text-sm text-gray-500">{sucursal}</p>
                <p className="text-2xl font-semibold text-gray-900">{total}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex h-full flex-col items-center justify-center">
            <p className="text-6xl font-semibold text-gray-900">{marcaActiva === "TODOS" ? (data?.resumen.total ?? 0) : totalFiltrado}</p>
            <p className="text-sm text-gray-500">Totales</p>
          </div>
        </article>
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
        {filtrosDisponibles.map((filtro) => {
          const activo = marcaActiva === filtro;

          return (
            <button
              key={filtro}
              type="button"
              onClick={() => setMarcaActiva(filtro)}
              className={[
                "h-12 rounded-xl border text-sm font-medium transition-colors",
                activo ? "border-gray-950 bg-gray-950 text-white shadow-sm" : "border-gray-200 bg-gray-100 text-gray-700 hover:bg-gray-200",
              ].join(" ")}
            >
              {filtro}
            </button>
          );
        })}
      </section>

      {sucursalesFiltradas.map(([sucursal, reservas]) => (
        <section key={sucursal} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-base font-semibold text-gray-900">{sucursal}</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs uppercase text-gray-500">Interno</th>
                  <th className="px-4 py-3 text-left text-xs uppercase text-gray-500">Marca</th>
                  <th className="px-4 py-3 text-left text-xs uppercase text-gray-500">Versión</th>
                  <th className="px-4 py-3 text-left text-xs uppercase text-gray-500">Color</th>
                  <th className="px-4 py-3 text-left text-xs uppercase text-gray-500">Año</th>
                  <th className="px-4 py-3 text-left text-xs uppercase text-gray-500">Km</th>
                  <th className="px-4 py-3 text-left text-xs uppercase text-gray-500">Vendedor</th>
                  <th className="px-4 py-3 text-left text-xs uppercase text-gray-500">Días</th>
                </tr>
              </thead>

              <tbody>
                {reservas.map((item, i) => (
                  <tr
                    key={`${item.interno}-${i}-${item.fechaRecepcion}`}
                    className={[
                      "border-b border-gray-100",
                      diasReserva(item.fechaRecepcion) > 2 ? "bg-red-50 hover:bg-red-100" : "hover:bg-gray-50",
                    ].join(" ")}
                  >
                    <td className="px-4 py-2 font-medium text-gray-900">{item.interno}</td>

                    <td className="px-4 py-2 text-gray-700">{item.marca}</td>

                    <td className="px-4 py-2 text-gray-700">
                      <div className="font-medium">{item.version}</div>
                    </td>

                    <td className="px-4 py-2 text-gray-700">
                      <span className={`inline-block px-2 py-1 text-xs font-medium rounded-md border border-slate-200 ${textToColor(item.color)}`}>
                        {item.color}
                      </span>
                    </td>

                    <td className="px-4 py-2 text-gray-700">{item.anio}</td>

                    <td className="px-4 py-2 text-gray-700">{new Intl.NumberFormat("es-AR").format(item.kilometros ?? 0)}</td>

                    <td className="px-4 py-2 text-gray-700">{item.vendedorReserva}</td>

                    <td className="px-4 py-2 text-gray-700">{diasReserva(item.fechaRecepcion)}</td>
                  </tr>
                ))}

                {reservas.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-6 py-10 text-center text-sm text-gray-500">
                      No hay unidades para el filtro seleccionado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      {sucursalesFiltradas.length === 0 && (
        <section className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500 shadow-sm">
          No hay unidades reservadas para la marca seleccionada.
        </section>
      )}
    </div>
  );
}
