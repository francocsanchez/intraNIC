import Loading from "@/components/Loading";
import { getRankingOperacionesConvencional } from "@/api/dms/dmsAPI";
import type { RankingOperacionesConvencionalResponse } from "@/types/index";
import { useQuery } from "@tanstack/react-query";
import { Trophy, Medal, Building2, CarFront, Users, CalendarRange } from "lucide-react";
import { useMemo, useState } from "react";

type RankingBaseItem = {
  nombre: string;
  total: number;
};

type RankingVendedorItem = RankingBaseItem & {
  sucursal: string;
  promedioMensual: number;
  hilux: number;
};

const CURRENT_YEAR = new Date().getFullYear();

function getPodiumStyle(index: number) {
  if (index === 0) return "border-border bg-secondary";
  if (index === 1) return "border-border bg-muted";
  if (index === 2) return "border-border bg-secondary";
  return "border-border bg-card";
}

function getBarColor(index: number) {
  const colors = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "var(--chart-1)"];
  return colors[index % colors.length];
}

function RankingList({
  title,
  subtitle,
  items,
  variant = "base",
}: {
  title: string;
  subtitle: string;
  items: RankingBaseItem[] | RankingVendedorItem[];
  variant?: "base" | "vendedor";
}) {
  return (
    <article className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-foreground">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <div className="rounded-lg bg-muted px-3 py-2 text-xs font-medium text-muted-foreground">
          Top {items.length}
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {items.map((item, index) => {
          const vendedorItem = item as RankingVendedorItem;
          return (
            <div
              key={`${item.nombre}-${index}`}
              className={`rounded-lg border px-4 py-3 ${getPodiumStyle(index)}`}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-card text-xs font-bold text-muted-foreground ring-1 ring-border">
                      {index + 1}
                    </span>
                    <p className="truncate font-semibold text-foreground">{item.nombre}</p>
                  </div>
                  {variant === "vendedor" && (
                    <p className="mt-1 pl-9 text-xs text-muted-foreground">
                      {vendedorItem.sucursal} · Prom. {vendedorItem.promedioMensual}/mes
                    </p>
                  )}
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-2xl font-bold text-foreground">{item.total}</p>
                  <p className="text-primary uppercase tracking-[0.16em] text-muted-foreground">ventas</p>
                </div>
              </div>
            </div>
          );
        })}

        {!items.length && (
          <div className="rounded-lg border border-dashed border-border bg-muted px-4 py-10 text-center text-sm text-muted-foreground">
            Sin datos disponibles.
          </div>
        )}
      </div>
    </article>
  );
}

export default function RankingConvencionalView() {
  const [anio, setAnio] = useState<number>(CURRENT_YEAR);
  const anios = useMemo(() => Array.from({ length: 6 }, (_, index) => CURRENT_YEAR - index), []);

  const { data, isLoading, isError, error } = useQuery<RankingOperacionesConvencionalResponse>({
    queryKey: ["ranking-operaciones-convencional", anio],
    queryFn: () => getRankingOperacionesConvencional(anio),
    refetchOnWindowFocus: true,
  });

  const resumen = data?.resumen;
  const ventasPorMes = resumen?.ventasPorMes ?? [];
  const rankingVendedores = resumen?.rankingVendedores ?? [];
  const rankingModelos = resumen?.rankingModelos ?? [];
  const rankingSucursales = resumen?.rankingSucursales ?? [];
  const rankingHilux = resumen?.rankingHilux ?? [];
  const acumuladas = resumen?.ventasAcumuladasPorVendedor ?? [];
  const destacados = resumen?.destacados;
  const totales = resumen?.totales;

  const maxMes = Math.max(...ventasPorMes.map((item) => item.total), 1);

  if (isLoading) return <Loading />;

  if (isError) {
    return (
      <div className="w-full px-4 py-6">
        <section className="rounded-lg border border-destructive/30 bg-card p-6 shadow-sm">
          <h1 className="text-lg font-semibold tracking-tight text-foreground">
            Error al cargar ranking de operaciones
          </h1>
          <p className="mt-2 text-sm text-destructive">
            {error instanceof Error ? error.message : "No fue posible obtener la información."}
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 px-4 py-6">
      <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Convencional
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
              Ranking de ventas
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              Ranking anual con foco en vendedores, modelos, sucursales y desempeño de Hilux.
            </p>
          </div>

          <label className="space-y-1">
            <span className="text-sm font-semibold text-foreground">Año</span>
            <select
              value={anio}
              onChange={(e) => setAnio(Number(e.target.value))}
              className="w-full min-w-36 rounded-lg border border-input bg-card px-4 py-2 text-sm text-foreground outline-none transition-colors focus:border-ring"
            >
              {anios.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4 xl:grid-cols-5">
        <article className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-secondary p-3 text-primary">
              <Trophy size={20} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Operaciones</p>
              <p className="mt-1 text-3xl font-bold text-foreground">{totales?.operaciones ?? 0}</p>
            </div>
          </div>
        </article>

        <article className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-secondary p-3 text-primary">
              <Users size={20} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Vendedores</p>
              <p className="mt-1 text-3xl font-bold text-foreground">{totales?.vendedores ?? 0}</p>
            </div>
          </div>
        </article>

        <article className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-secondary p-3 text-primary">
              <CarFront size={20} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Modelos</p>
              <p className="mt-1 text-3xl font-bold text-foreground">{totales?.modelos ?? 0}</p>
            </div>
          </div>
        </article>

        <article className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-secondary p-3 text-primary">
              <Building2 size={20} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Sucursales</p>
              <p className="mt-1 text-3xl font-bold text-foreground">{totales?.sucursales ?? 0}</p>
            </div>
          </div>
        </article>

        <article className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-secondary p-3 text-primary">
              <Medal size={20} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Hilux</p>
              <p className="mt-1 text-3xl font-bold text-foreground">{totales?.hilux ?? 0}</p>
            </div>
          </div>
        </article>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <article className="rounded-lg border border-border bg-card p-3 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-secondary-foreground">Top vendedor</p>
          <p className="mt-3 text-xl font-bold text-foreground">{destacados?.topVendedorDelAno?.nombre ?? "-"}</p>
          <p className="mt-1 text-sm text-muted-foreground">{destacados?.topVendedorDelAno?.sucursal ?? "-"}</p>
          <p className="mt-4 text-3xl font-bold text-secondary-foreground">{destacados?.topVendedorDelAno?.total ?? 0}</p>
        </article>

        <article className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Top modelo</p>
          <p className="mt-3 text-xl font-bold text-foreground">{destacados?.topModeloDelAno?.nombre ?? "-"}</p>
          <p className="mt-4 text-3xl font-bold text-primary">{destacados?.topModeloDelAno?.total ?? 0}</p>
        </article>

        <article className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Top sucursal</p>
          <p className="mt-3 text-xl font-bold text-foreground">{destacados?.topSucursalDelAno?.nombre ?? "-"}</p>
          <p className="mt-4 text-3xl font-bold text-primary">{destacados?.topSucursalDelAno?.total ?? 0}</p>
        </article>

        <article className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Top Hilux</p>
          <p className="mt-3 text-xl font-bold text-foreground">{destacados?.topHiluxDelAno?.nombre ?? "-"}</p>
          <p className="mt-1 text-sm text-muted-foreground">{destacados?.topHiluxDelAno?.sucursal ?? "-"}</p>
          <p className="mt-4 text-3xl font-bold text-primary">{destacados?.topHiluxDelAno?.total ?? 0}</p>
        </article>

        <article className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Mejor promedio</p>
          <p className="mt-3 text-xl font-bold text-foreground">{destacados?.mejorPromedioAnual?.nombre ?? "-"}</p>
          <p className="mt-1 text-sm text-muted-foreground">{destacados?.mejorPromedioAnual?.sucursal ?? "-"}</p>
          <p className="mt-4 text-3xl font-bold text-primary">{destacados?.mejorPromedioAnual?.promedioMensual ?? 0}</p>
        </article>
      </section>

      <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-secondary p-3 text-primary">
            <CalendarRange size={20} />
          </div>
          <div>
            <h2 className="text-base font-semibold tracking-tight text-foreground">Ventas por mes</h2>
            <p className="mt-1 text-sm text-muted-foreground">Distribución anual de operaciones para {anio}.</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-12">
          {ventasPorMes.map((item, index) => (
            <div key={item.mes} className="rounded-lg border border-border bg-muted p-3">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-primary font-semibold uppercase tracking-[0.18em] text-muted-foreground">{item.label}</p>
                  <p className="mt-2 text-2xl font-bold text-foreground">{item.total}</p>
                </div>
                <div className="flex h-14 w-6 items-end overflow-hidden rounded-full bg-card ring-1 ring-border">
                  <div
                    className="w-full rounded-full"
                    style={{
                      height: `${Math.max((item.total / maxMes) * 100, item.total > 0 ? 10 : 0)}%`,
                      backgroundColor: getBarColor(index),
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <RankingList
          title="Ranking por vendedor"
          subtitle="Top vendedores por operaciones del año."
          items={rankingVendedores}
          variant="vendedor"
        />

        <RankingList
          title="Ranking por modelo"
          subtitle="Modelos con mayor volumen de ventas."
          items={rankingModelos}
        />

        <RankingList
          title="Ranking por sucursal"
          subtitle="Sucursales con más operaciones acumuladas."
          items={rankingSucursales}
        />

        <RankingList
          title="Ranking Hilux"
          subtitle="Desempeño específico del producto líder."
          items={rankingHilux}
          variant="vendedor"
        />
      </section>

      <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-base font-semibold tracking-tight text-foreground">
            Ventas acumuladas por vendedor
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Ranking completo anual con sucursal, total, promedio mensual y ventas Hilux.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted text-xs uppercase tracking-[0.18em] text-muted-foreground">
              <tr>
                <th className="px-6 py-3 text-left">#</th>
                <th className="px-6 py-3 text-left">Vendedor</th>
                <th className="px-6 py-3 text-left">Sucursal</th>
                <th className="px-6 py-3 text-center">Ventas</th>
                <th className="px-6 py-3 text-center">Prom. mensual</th>
                <th className="px-6 py-3 text-center">Hilux</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {acumuladas.map((item, index) => (
                <tr key={`${item.nombre}-${item.sucursal}-${index}`} className="hover:bg-muted">
                  <td className="px-6 py-3 font-medium text-muted-foreground">{index + 1}</td>
                  <td className="px-6 py-3 font-semibold text-foreground">{item.nombre}</td>
                  <td className="px-6 py-3 text-muted-foreground">{item.sucursal}</td>
                  <td className="px-6 py-3 text-center font-semibold text-foreground">{item.total}</td>
                  <td className="px-6 py-3 text-center text-primary">{item.promedioMensual}</td>
                  <td className="px-6 py-3 text-center">{item.hilux}</td>
                </tr>
              ))}

              {!acumuladas.length && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-muted-foreground">
                    No hay datos para el año seleccionado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
