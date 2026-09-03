import Loading from "@/components/Loading";
import { getPreventasResumenPendientes, getResumenPedidoMensual } from "@/api/dms/preventasAPI";
import { useQuery } from "@tanstack/react-query";
import { Layers3, UsersRound } from "lucide-react";

export default function PreventasResumenView() {
  const resumenPedidoQuery = useQuery({
    queryKey: ["preventas-resumen", "pedido-mensual"],
    queryFn: getResumenPedidoMensual,
  });

  const resumenPendientesQuery = useQuery({
    queryKey: ["preventas-resumen", "pendientes"],
    queryFn: getPreventasResumenPendientes,
  });

  const isLoading = resumenPedidoQuery.isLoading || resumenPendientesQuery.isLoading;
  const isError = resumenPedidoQuery.isError || resumenPendientesQuery.isError;
  const error = resumenPedidoQuery.error || resumenPendientesQuery.error;

  if (isLoading) return <Loading />;

  if (isError) {
    return (
      <div className="font-preset w-full bg-muted px-2 py-3">
        <section className="rounded-lg border border-destructive/30 bg-card p-3 shadow-sm">
          <h1 className="text-lg font-semibold text-foreground">Error al cargar el resumen</h1>
          <p className="mt-2 text-sm text-destructive">{error instanceof Error ? error.message : "Error desconocido"}</p>
        </section>
      </div>
    );
  }

  const rows = resumenPedidoQuery.data?.data ?? [];
  const pendientesRows = resumenPendientesQuery.data?.data ?? [];
  const resumenPorVendedor = Object.values(
    pendientesRows.reduce<Record<string, { vendedor: string; preventas_pendientes: number }>>((acc, row) => {
      const vendedor = row.vendedor || "Sin vendedor";

      if (!acc[vendedor]) {
        acc[vendedor] = {
          vendedor,
          preventas_pendientes: 0,
        };
      }

      acc[vendedor].preventas_pendientes += row.cantidad;
      return acc;
    }, {}),
  ).sort((a, b) => b.preventas_pendientes - a.preventas_pendientes || a.vendedor.localeCompare(b.vendedor));

  const totalPedido = rows.reduce((acc, row) => acc + row.pedido, 0);
  const totalPreventas = resumenPorVendedor.reduce((acc, row) => acc + row.preventas_pendientes, 0);
  const totalDisponible = rows.reduce((acc, row) => acc + row.disponible, 0);

  return (
    <div className="font-preset w-full space-y-3 bg-muted px-2 py-3">
      <section className="overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-sm">
        <div className="flex items-start justify-between gap-3 px-3 py-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Preventas</p>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">Resumen pedido vs preventas</h1>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
              Compara la cantidad actual cargada por version contra las preventas pendientes sin asignar.
            </p>
          </div>
          <Layers3 size={20} className="shrink-0 text-muted-foreground" />
        </div>

        <div className="grid border-t border-border sm:grid-cols-2 xl:grid-cols-5">
          <article className="border-b border-border px-3 py-2.5 sm:border-r xl:border-b-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Versiones</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">{rows.length}</p>
          </article>
          <article className="border-b border-border px-3 py-2.5 xl:border-r xl:border-b-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Pedido total</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">{totalPedido}</p>
          </article>
          <article className="border-b border-border px-3 py-2.5 sm:border-r sm:border-b-0 xl:border-r">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Pendientes</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">{totalPreventas}</p>
          </article>
          <article className="border-b border-border px-3 py-2.5 xl:border-r xl:border-b-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Vendedores</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">{resumenPorVendedor.length}</p>
          </article>
          <article className="px-3 py-2.5 sm:col-span-2 xl:col-span-1">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Disponible</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">{totalDisponible}</p>
          </article>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-sm">
        <div className="flex items-start justify-between gap-3 border-b border-border px-3 py-3">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-foreground">Resumen por vendedor</h2>
            <p className="mt-1 text-sm text-muted-foreground">Preventas pendientes sin asignar agrupadas por vendedor.</p>
          </div>
          <UsersRound size={18} className="shrink-0 text-muted-foreground" />
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[560px] w-full text-sm">
            <thead className="bg-muted text-xs uppercase tracking-[0.18em] text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">Vendedor</th>
                <th className="px-3 py-2 text-center">Preventas pendientes</th>
                <th className="px-3 py-2 text-center">Participacion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {resumenPorVendedor.map((row) => (
                <tr key={row.vendedor} className="hover:bg-muted">
                  <td className="px-3 py-1.5 font-medium text-foreground">{row.vendedor}</td>
                  <td className="px-3 py-1.5 text-center text-muted-foreground">{row.preventas_pendientes}</td>
                  <td className="px-3 py-1.5 text-center text-muted-foreground">
                    {totalPreventas ? `${Math.round((row.preventas_pendientes / totalPreventas) * 100)}%` : "0%"}
                  </td>
                </tr>
              ))}
              {!resumenPorVendedor.length ? (
                <tr>
                  <td colSpan={3} className="px-3 py-8 text-center text-sm text-muted-foreground">
                    No hay preventas pendientes para resumir por vendedor.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-sm">
        <div className="border-b border-border px-3 py-3">
          <h2 className="text-base font-semibold tracking-tight text-foreground">Comparacion por version</h2>
          <p className="mt-1 text-sm text-muted-foreground">Disponible = pedido mensual - preventas pendientes sin asignar.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[760px] w-full text-sm">
            <thead className="bg-muted text-xs uppercase tracking-[0.18em] text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">Version</th>
                <th className="px-3 py-2 text-center">Pedido</th>
                <th className="px-3 py-2 text-center">Preventas pendientes</th>
                <th className="px-3 py-2 text-center">Disponible</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((row) => (
                <tr key={row.versionId} className="hover:bg-muted">
                  <td className="px-3 py-1.5 text-muted-foreground">{row.version}</td>
                  <td className="px-3 py-1.5 text-center text-muted-foreground">{row.pedido}</td>
                  <td className="px-3 py-1.5 text-center text-muted-foreground">{row.preventas_pendientes}</td>
                  <td className="px-3 py-1.5 text-center">
                    <span className="inline-flex min-w-10 justify-center rounded-full bg-muted px-3 py-0.5 font-semibold text-foreground">
                      {row.disponible}
                    </span>
                  </td>
                </tr>
              ))}
              {!rows.length ? (
                <tr>
                  <td colSpan={4} className="px-3 py-8 text-center text-sm text-muted-foreground">
                    No hay versiones para resumir.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
