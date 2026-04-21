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
  if (index === 0) return "border-amber-200 bg-amber-50";
  if (index === 1) return "border-slate-200 bg-slate-50";
  if (index === 2) return "border-orange-200 bg-orange-50";
  return "border-gray-200 bg-white";
}

function getBarColor(index: number) {
  const colors = ["#15aa9a", "#43bbb0", "#6ccbc2", "#95dbd4", "#beeae6", "#d8f3ef"];
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
    <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-gray-900">{title}</h2>
          <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
        </div>
        <div className="rounded-xl bg-gray-50 px-3 py-2 text-xs font-medium text-gray-600">
          Top {items.length}
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {items.map((item, index) => {
          const vendedorItem = item as RankingVendedorItem;
          return (
            <div
              key={`${item.nombre}-${index}`}
              className={`rounded-xl border px-4 py-3 ${getPodiumStyle(index)}`}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white text-xs font-bold text-gray-700 ring-1 ring-gray-200">
                      {index + 1}
                    </span>
                    <p className="truncate font-semibold text-gray-900">{item.nombre}</p>
                  </div>
                  {variant === "vendedor" && (
                    <p className="mt-1 pl-9 text-xs text-gray-500">
                      {vendedorItem.sucursal} · Prom. {vendedorItem.promedioMensual}/mes
                    </p>
                  )}
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-2xl font-bold text-gray-900">{item.total}</p>
                  <p className="text-[11px] uppercase tracking-[0.16em] text-gray-500">ventas</p>
                </div>
              </div>
            </div>
          );
        })}

        {!items.length && (
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-10 text-center text-sm text-gray-500">
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
        <section className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold tracking-tight text-gray-900">
            Error al cargar ranking de operaciones
          </h1>
          <p className="mt-2 text-sm text-red-600">
            {error instanceof Error ? error.message : "No fue posible obtener la información."}
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 px-4 py-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
              Convencional
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-gray-900">
              Ranking de ventas
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-gray-500">
              Ranking anual con foco en vendedores, modelos, sucursales y desempeño de Hilux.
            </p>
          </div>

          <label className="space-y-1">
            <span className="text-sm font-semibold text-gray-900">Año</span>
            <select
              value={anio}
              onChange={(e) => setAnio(Number(e.target.value))}
              className="w-full min-w-36 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 outline-none transition-colors focus:border-[#15aa9a]"
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
        <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-[#eef9f7] p-3 text-[#15aa9a]">
              <Trophy size={20} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Operaciones</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">{totales?.operaciones ?? 0}</p>
            </div>
          </div>
        </article>

        <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-[#eef9f7] p-3 text-[#15aa9a]">
              <Users size={20} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Vendedores</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">{totales?.vendedores ?? 0}</p>
            </div>
          </div>
        </article>

        <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-[#eef9f7] p-3 text-[#15aa9a]">
              <CarFront size={20} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Modelos</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">{totales?.modelos ?? 0}</p>
            </div>
          </div>
        </article>

        <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-[#eef9f7] p-3 text-[#15aa9a]">
              <Building2 size={20} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Sucursales</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">{totales?.sucursales ?? 0}</p>
            </div>
          </div>
        </article>

        <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-[#eef9f7] p-3 text-[#15aa9a]">
              <Medal size={20} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Hilux</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">{totales?.hilux ?? 0}</p>
            </div>
          </div>
        </article>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <article className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">Top vendedor</p>
          <p className="mt-3 text-xl font-bold text-gray-900">{destacados?.topVendedorDelAno?.nombre ?? "-"}</p>
          <p className="mt-1 text-sm text-gray-600">{destacados?.topVendedorDelAno?.sucursal ?? "-"}</p>
          <p className="mt-4 text-3xl font-bold text-amber-700">{destacados?.topVendedorDelAno?.total ?? 0}</p>
        </article>

        <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Top modelo</p>
          <p className="mt-3 text-xl font-bold text-gray-900">{destacados?.topModeloDelAno?.nombre ?? "-"}</p>
          <p className="mt-4 text-3xl font-bold text-[#15aa9a]">{destacados?.topModeloDelAno?.total ?? 0}</p>
        </article>

        <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Top sucursal</p>
          <p className="mt-3 text-xl font-bold text-gray-900">{destacados?.topSucursalDelAno?.nombre ?? "-"}</p>
          <p className="mt-4 text-3xl font-bold text-[#15aa9a]">{destacados?.topSucursalDelAno?.total ?? 0}</p>
        </article>

        <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Top Hilux</p>
          <p className="mt-3 text-xl font-bold text-gray-900">{destacados?.topHiluxDelAno?.nombre ?? "-"}</p>
          <p className="mt-1 text-sm text-gray-600">{destacados?.topHiluxDelAno?.sucursal ?? "-"}</p>
          <p className="mt-4 text-3xl font-bold text-[#15aa9a]">{destacados?.topHiluxDelAno?.total ?? 0}</p>
        </article>

        <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Mejor promedio</p>
          <p className="mt-3 text-xl font-bold text-gray-900">{destacados?.mejorPromedioAnual?.nombre ?? "-"}</p>
          <p className="mt-1 text-sm text-gray-600">{destacados?.mejorPromedioAnual?.sucursal ?? "-"}</p>
          <p className="mt-4 text-3xl font-bold text-[#15aa9a]">{destacados?.mejorPromedioAnual?.promedioMensual ?? 0}</p>
        </article>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-[#eef9f7] p-3 text-[#15aa9a]">
            <CalendarRange size={20} />
          </div>
          <div>
            <h2 className="text-base font-semibold tracking-tight text-gray-900">Ventas por mes</h2>
            <p className="mt-1 text-sm text-gray-500">Distribución anual de operaciones para {anio}.</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-12">
          {ventasPorMes.map((item, index) => (
            <div key={item.mes} className="rounded-xl border border-gray-200 bg-gray-50 p-3">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">{item.label}</p>
                  <p className="mt-2 text-2xl font-bold text-gray-900">{item.total}</p>
                </div>
                <div className="flex h-14 w-6 items-end overflow-hidden rounded-full bg-white ring-1 ring-gray-200">
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

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-base font-semibold tracking-tight text-gray-900">
            Ventas acumuladas por vendedor
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Ranking completo anual con sucursal, total, promedio mensual y ventas Hilux.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-[0.18em] text-gray-500">
              <tr>
                <th className="px-6 py-3 text-left">#</th>
                <th className="px-6 py-3 text-left">Vendedor</th>
                <th className="px-6 py-3 text-left">Sucursal</th>
                <th className="px-6 py-3 text-center">Ventas</th>
                <th className="px-6 py-3 text-center">Prom. mensual</th>
                <th className="px-6 py-3 text-center">Hilux</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {acumuladas.map((item, index) => (
                <tr key={`${item.nombre}-${item.sucursal}-${index}`} className="hover:bg-gray-50">
                  <td className="px-6 py-3 font-medium text-gray-500">{index + 1}</td>
                  <td className="px-6 py-3 font-semibold text-gray-900">{item.nombre}</td>
                  <td className="px-6 py-3 text-gray-700">{item.sucursal}</td>
                  <td className="px-6 py-3 text-center font-semibold text-gray-900">{item.total}</td>
                  <td className="px-6 py-3 text-center text-[#15aa9a]">{item.promedioMensual}</td>
                  <td className="px-6 py-3 text-center">{item.hilux}</td>
                </tr>
              ))}

              {!acumuladas.length && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500">
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
