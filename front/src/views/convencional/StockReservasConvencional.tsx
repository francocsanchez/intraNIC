import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getStockReservaConvencional } from "@/api/convencional/stockAPI";
import { textToColor } from "@/helpers/colores";
import type { ReservasResponse } from "@/types/index";

type ModeloFiltro = "TODOS" | "HILUX" | "SW4" | "HIACE" | "COROLLA" | "C. CROSS" | "YARIS" | "RAV4" | "YARIS CROSS";

const FILTROS_PRIORITARIOS: ModeloFiltro[] = ["TODOS", "HILUX", "SW4", "HIACE", "COROLLA", "C. CROSS", "YARIS", "RAV4", "YARIS CROSS"];
const UBICACIONES_PRIORITARIAS = ["TODAS", "EN PRODUCCION", "BUQUE", "PLAYA TASA", "FURLONG", "STOCK CONCESIONARIO"] as const;
type UbicacionFiltro = (typeof UBICACIONES_PRIORITARIAS)[number];

function normalizarUbicacion(ubicacion: string | null | undefined) {
  const value = ubicacion
    ?.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, " ");

  if (!value) return "EN PRODUCCION";
  if (["EN PRODUCCION", "PRODUCCION TASA"].includes(value)) return "EN PRODUCCION";
  if (value === "BUQUE") return "BUQUE";
  if (["PLAYA EXTERNA", "PLAYA TASA", "PLAYA NACIONAL ATZ"].includes(value)) return "PLAYA TASA";
  if (value.includes("FURLONG")) return "FURLONG";
  if (value === "STOCK CONCESIONARIO") return "STOCK CONCESIONARIO";

  return "EN PRODUCCION";
}

export default function StockReservasConvencional() {
  const [modeloActivo, setModeloActivo] = useState<ModeloFiltro>("TODOS");
  const [ubicacionActiva, setUbicacionActiva] = useState<UbicacionFiltro>("TODAS");
  const [currentTime] = useState(() => Date.now());

  const { data, isLoading, isError, error } = useQuery<ReservasResponse>({
    queryKey: ["stockReservado", "convencional"],
    queryFn: getStockReservaConvencional,
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
    const existentes = new Set(todosLosItems.map((item) => item.modelo));
    return FILTROS_PRIORITARIOS.filter((filtro) => filtro === "TODOS" || existentes.has(filtro));
  }, [todosLosItems]);

  const ubicacionesDisponibles = useMemo(() => {
    const base = modeloActivo === "TODOS" ? todosLosItems : todosLosItems.filter((item) => item.modelo === modeloActivo);
    const existentes = new Set(base.map((item) => normalizarUbicacion(item.ubicacion)));
    return UBICACIONES_PRIORITARIAS.filter((ubicacion) => ubicacion === "TODAS" || existentes.has(ubicacion));
  }, [todosLosItems, modeloActivo]);

  const sucursalesFiltradas = useMemo(() => {
    return reservasPorSucursal
      .map(([sucursal, reservas]) => {
        const filtradasPorModelo = modeloActivo === "TODOS" ? reservas : reservas.filter((item) => item.modelo === modeloActivo);
        const filtradas =
          ubicacionActiva === "TODAS"
            ? filtradasPorModelo
            : filtradasPorModelo.filter((item) => normalizarUbicacion(item.ubicacion) === ubicacionActiva);

        return [sucursal, filtradas] as const;
      })
      .filter(([, reservas]) => reservas.length > 0);
  }, [reservasPorSucursal, modeloActivo, ubicacionActiva]);

  const totalFiltrado = useMemo(() => {
    return sucursalesFiltradas.reduce((acc, [, reservas]) => acc + reservas.length, 0);
  }, [sucursalesFiltradas]);

  const diasReserva = (fecha: string) => {
    const start = new Date(fecha).getTime();
    const diff = currentTime - start;
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  if (isLoading) return <div className="font-preset w-full bg-muted px-2 py-3 text-sm text-muted-foreground">Cargando...</div>;

  if (isError) {
    return <div className="font-preset w-full bg-muted px-2 py-3 text-sm text-destructive">{error instanceof Error ? error.message : "Error"}</div>;
  }

  return (
    <div className="font-preset w-full space-y-3 bg-muted px-2 py-3">
      <section className="overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-sm">
        <div className="px-3 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Convencional</p>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Stock reservado</h1>
        </div>

        <div className="grid border-t border-border xl:grid-cols-[3fr_1fr]">
          <article className="border-b border-border px-3 py-3 xl:border-r xl:border-b-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Sucursales</p>

            <div
              className="mt-3 grid divide-x divide-border"
              style={{
                gridTemplateColumns: `repeat(${Math.max(Object.keys(data?.resumen?.sucursales ?? {}).length, 1)}, minmax(0,1fr))`,
              }}
            >
              {Object.entries(data?.resumen.sucursales ?? {}).map(([sucursal, total]) => (
                <div key={sucursal} className="px-2 first:pl-0 last:pr-0">
                  <p className="text-xs text-muted-foreground">{sucursal}</p>
                  <p className="text-xl font-semibold text-foreground">{total}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="px-3 py-3">
            <div className="flex h-full flex-col items-center justify-center">
              <p className="text-4xl font-semibold text-foreground">{modeloActivo === "TODOS" && ubicacionActiva === "TODAS" ? (data?.resumen.total ?? 0) : totalFiltrado}</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Totales</p>
            </div>
          </article>
        </div>
      </section>

      <section className="flex gap-1 overflow-x-auto">
        {filtrosDisponibles.map((filtro) => {
          const activo = modeloActivo === filtro;

          return (
            <button
              key={filtro}
              type="button"
              onClick={() => setModeloActivo(filtro)}
              className={[
                "h-9 min-w-28 flex-1 whitespace-nowrap rounded-md border text-xs font-medium transition-colors",
                activo ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground",
              ].join(" ")}
            >
              {filtro}
            </button>
          );
        })}
      </section>

      <section className="border-y border-border py-2">
        <div className="inline-flex w-full rounded-md bg-muted p-1 md:w-auto">
          {ubicacionesDisponibles.map((ubicacion) => (
            <button
              key={ubicacion}
              type="button"
              onClick={() => setUbicacionActiva(ubicacion)}
              className={[
                "flex-1 rounded-md px-3 py-2 text-xs font-semibold uppercase tracking-wide transition-colors md:flex-none",
                ubicacionActiva === ubicacion ? "bg-card text-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              ].join(" ")}
            >
              {ubicacion}
            </button>
          ))}
        </div>
      </section>

      {sucursalesFiltradas.map(([sucursal, reservas]) => (
        <section key={sucursal} className="overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-sm">
          <div className="border-b border-border px-3 py-3">
            <h2 className="text-base font-semibold text-foreground">{sucursal}</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b border-border bg-muted">
                <tr>
                  <th className="px-3 py-2 text-left text-xs uppercase tracking-[0.18em] text-muted-foreground">Interno</th>
                  <th className="px-3 py-2 text-left text-xs uppercase tracking-[0.18em] text-muted-foreground">Modelo</th>
                  <th className="px-3 py-2 text-left text-xs uppercase tracking-[0.18em] text-muted-foreground">Version</th>
                  <th className="px-3 py-2 text-left text-xs uppercase tracking-[0.18em] text-muted-foreground">Color</th>
                  <th className="px-3 py-2 text-left text-xs uppercase tracking-[0.18em] text-muted-foreground">Ubicacion</th>
                  <th className="px-3 py-2 text-left text-xs uppercase tracking-[0.18em] text-muted-foreground">Chasis</th>
                  <th className="px-3 py-2 text-left text-xs uppercase tracking-[0.18em] text-muted-foreground">Vendedor</th>
                  <th className="px-3 py-2 text-left text-xs uppercase tracking-[0.18em] text-muted-foreground">Dias</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {reservas.map((item) => (
                  <tr
                    key={`${item.chasis}-${item.interno}-${item.fechaReserva}`}
                    className={[
                      diasReserva(item.fechaReserva) > 2 ? "bg-destructive/10 hover:bg-destructive/15" : "hover:bg-muted",
                    ].join(" ")}
                  >
                    <td className="px-3 py-1.5 font-medium text-foreground">{item.interno}</td>
                    <td className="px-3 py-1.5 text-muted-foreground">{item.modelo}</td>
                    <td className="px-3 py-1.5 text-muted-foreground">
                      <div className="font-medium">{item.version}</div>
                    </td>
                    <td className="px-3 py-1.5 text-muted-foreground">
                      <span className={`inline-flex w-40 justify-center rounded-md border border-border px-2 py-0.5 text-xs font-medium ${textToColor(item.color)}`}>
                        {item.color}
                      </span>
                    </td>
                    <td className="px-3 py-1.5 text-muted-foreground">{normalizarUbicacion(item.ubicacion)}</td>
                    <td className="px-3 py-1.5 text-muted-foreground">{item.chasis}</td>
                    <td className="px-3 py-1.5 text-muted-foreground">{item.vendedorReserva}</td>
                    <td className="px-3 py-1.5 text-muted-foreground">{diasReserva(item.fechaReserva)}</td>
                  </tr>
                ))}

                {reservas.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-3 py-8 text-center text-sm text-muted-foreground">
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
        <section className="rounded-lg border border-border bg-card p-6 text-center text-sm text-muted-foreground shadow-sm">
          No hay unidades reservadas para el filtro seleccionado.
        </section>
      )}
    </div>
  );
}
