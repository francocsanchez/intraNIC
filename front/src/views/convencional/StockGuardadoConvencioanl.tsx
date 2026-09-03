import { getStockGuardadoConvencional } from "@/api/convencional/stockAPI";
import { textToColor } from "@/helpers/colores";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

type ModeloFiltro = "TODOS" | "HILUX" | "SW4" | "HIACE" | "COROLLA" | "C. CROSS" | "YARIS" | "RAV4" | "YARIS CROSS";

const FILTROS_PRIORITARIOS: ModeloFiltro[] = ["TODOS", "HILUX", "SW4", "HIACE", "COROLLA", "C. CROSS", "YARIS", "RAV4", "YARIS CROSS"];
const UBICACIONES_PRIORITARIAS = ["TODAS", "EN PRODUCCION", "BUQUE", "PLAYA TASA", "FURLONG", "STOCK CONCESIONARIO"] as const;
type UbicacionFiltro = (typeof UBICACIONES_PRIORITARIAS)[number];

const EMPTY_STOCK_GUARDADO_CONVENCIONAL: Awaited<
  ReturnType<typeof getStockGuardadoConvencional>
>["data"] = [];

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

export default function StockGuardadoConvencioanl() {
  const [modeloActivo, setModeloActivo] = useState<ModeloFiltro>("TODOS");
  const [ubicacionActiva, setUbicacionActiva] = useState<UbicacionFiltro>("TODAS");

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["stockGuardado", "convencional"],
    queryFn: getStockGuardadoConvencional,
    refetchOnWindowFocus: true,
    refetchInterval: 1000,
  });

  const items = data?.data ?? EMPTY_STOCK_GUARDADO_CONVENCIONAL;
  const resumen = data?.resumen;

  const resumenDinamico = useMemo(() => {
    const porModelo = items.reduce<Record<string, number>>((acc, item) => {
      acc[item.modelo] = (acc[item.modelo] || 0) + 1;
      return acc;
    }, {});

    const nacionales = ["HILUX", "SW4", "HIACE"];
    const importadas = ["COROLLA", "C. CROSS", "YARIS", "RAV4", "YARIS CROSS"];

    return {
      nacionales: nacionales.map((modelo) => ({
        modelo,
        total: porModelo[modelo] || 0,
      })),
      importadas: importadas.map((modelo) => ({
        modelo,
        total: porModelo[modelo] || 0,
      })),
      total: items.length,
    };
  }, [items]);

  const filtrosDisponibles = useMemo(() => {
    const existentes = new Set(items.map((item) => item.modelo));
    return FILTROS_PRIORITARIOS.filter((filtro) => filtro === "TODOS" || existentes.has(filtro));
  }, [items]);

  const itemsFiltrados = useMemo(() => {
    if (modeloActivo === "TODOS") return items;
    return items.filter((item) => item.modelo === modeloActivo);
  }, [items, modeloActivo]);

  const ubicacionesDisponibles = useMemo(() => {
    const existentes = new Set(itemsFiltrados.map((item) => normalizarUbicacion(item.ubicacion)));
    return UBICACIONES_PRIORITARIAS.filter((ubicacion) => ubicacion === "TODAS" || existentes.has(ubicacion));
  }, [itemsFiltrados]);

  const itemsVisibles = useMemo(() => {
    if (ubicacionActiva === "TODAS") return itemsFiltrados;
    return itemsFiltrados.filter((item) => normalizarUbicacion(item.ubicacion) === ubicacionActiva);
  }, [itemsFiltrados, ubicacionActiva]);

  const formatDate = (value: string) =>
    new Intl.DateTimeFormat("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(value));

  if (isLoading) {
    return (
      <div className="font-preset w-full space-y-3 bg-muted px-2 py-3">
        <div className="rounded-lg border border-border bg-card p-3 shadow-sm">
          <div className="h-6 w-64 animate-pulse rounded bg-muted" />
          <div className="mt-2 h-4 w-52 animate-pulse rounded bg-muted" />
        </div>

        <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-border bg-card p-3 shadow-sm">
              <div className="h-4 w-24 animate-pulse rounded bg-muted" />
              <div className="mt-4 h-10 w-full animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-1 md:grid-cols-4 xl:grid-cols-8">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-9 animate-pulse rounded-md bg-muted" />
          ))}
        </div>

        <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
          <div className="border-b border-border px-3 py-3">
            <div className="h-5 w-40 animate-pulse rounded bg-muted" />
          </div>
          <div className="space-y-3 p-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-8 animate-pulse rounded bg-muted" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="font-preset w-full bg-muted px-2 py-3">
        <div className="rounded-lg border border-destructive/30 bg-card p-3 shadow-sm">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">Error al cargar el stock</h2>
          <p className="mt-2 text-sm text-destructive">{error instanceof Error ? error.message : "Error desconocido"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="font-preset w-full space-y-3 bg-muted px-2 py-3">
      <section className="overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-sm">
        <div className="px-3 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Convencional</p>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Stock guardado</h1>
        </div>

        <div className="grid border-t border-border xl:grid-cols-[1.2fr_2.5fr_0.9fr]">
          <article className="border-b border-border px-3 py-3 xl:border-r xl:border-b-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Nacionales</p>

            <div className="mt-3 grid grid-cols-3 divide-x divide-border">
              {resumenDinamico.nacionales.map((item) => (
                <div key={item.modelo} className="px-2 first:pl-0 last:pr-0">
                  <p className="text-xs text-muted-foreground">{item.modelo}</p>
                  <p className="mt-1 text-xl font-semibold tracking-tight text-foreground">{item.total}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="border-b border-border px-3 py-3 xl:border-r xl:border-b-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Importadas</p>

            <div className="mt-3 grid grid-cols-5 divide-x divide-border">
              {resumenDinamico.importadas.map((item) => (
                <div key={item.modelo} className="px-2 first:pl-0 last:pr-0">
                  <p className="text-xs text-muted-foreground">{item.modelo}</p>
                  <p className="mt-1 text-xl font-semibold tracking-tight text-foreground">{item.total}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="px-3 py-3">
            <div className="flex h-full flex-col items-center justify-center">
              <p className="text-4xl font-semibold tracking-tight text-foreground">{resumen?.total ?? resumenDinamico.total}</p>
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

      <section className="overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-sm">
        <div className="flex flex-col gap-3 border-b border-border px-3 py-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-foreground">Detalle de unidades</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {modeloActivo === "TODOS" ? "Listado completo de unidades disponibles" : `Listado filtrado por modelo: ${modeloActivo}`}
            </p>
          </div>

          <div className="flex flex-col items-stretch gap-3 md:items-end">
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

            <div className="rounded-md border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">{itemsVisibles.length} registros</div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b border-border bg-muted">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Interno</th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Modelo</th>
                <th className="px-3 py-2 text-center text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Version</th>
                <th className="px-3 py-2 text-center text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Color</th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Ubicacion</th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Recepcion</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {itemsVisibles.map((item) => (
                <tr
                  key={`${item.interno}-${item.chasis}-${item.fechaRecepcion}`}
                  className={[
                    item.vendedorReserva === "3MES QUE VIENE" ? "bg-destructive/10 hover:bg-destructive/15" : "hover:bg-muted",
                  ].join(" ")}
                >
                  <td className="px-3 py-1.5 font-medium text-foreground">{item.interno}</td>
                  <td className="px-3 py-1.5 text-muted-foreground">
                    <span className="inline-flex rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-foreground">{item.modelo}</span>
                  </td>

                  <td className="min-w-[240px] px-3 py-1.5 text-center">
                    <div className="font-medium text-foreground">{item.version}</div>
                    <div className="text-xs text-muted-foreground">{item.chasis}</div>
                  </td>
                  <td className="px-3 py-1.5 text-center text-muted-foreground">
                    <span className={`inline-block rounded-md border border-border px-2 py-0.5 text-xs font-medium ${textToColor(item.color)}`}>
                      {item.color}
                    </span>
                  </td>
                  <td className="px-3 py-1.5 text-muted-foreground">{normalizarUbicacion(item.ubicacion)}</td>

                  <td className="px-3 py-1.5 text-muted-foreground">{formatDate(item.fechaRecepcion)}</td>
                </tr>
              ))}

              {itemsVisibles.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center text-sm text-muted-foreground">
                    No hay unidades para el filtro seleccionado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
          Mostrando {itemsVisibles.length} unidades
          {modeloActivo !== "TODOS" ? ` de ${modeloActivo}` : ""}
          {ubicacionActiva !== "TODAS" ? ` en ${ubicacionActiva}` : ""}.
        </div>
      </section>
    </div>
  );
}
