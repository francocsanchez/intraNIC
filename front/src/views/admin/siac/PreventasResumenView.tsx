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
      <div className="w-full px-4 py-6">
        <section className="rounded-3xl border border-red-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold text-gray-900">Error al cargar el resumen</h1>
          <p className="mt-2 text-sm text-red-600">{error instanceof Error ? error.message : "Error desconocido"}</p>
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
    <div className="w-full space-y-6 px-4 py-6">
      <section className="rounded-3xl border border-[#cbe7e2] bg-[#e4f3fa] p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#17897d]">Analitica</p>
            <h1 className="text-3xl font-semibold tracking-tight text-gray-900">Resumen pedido vs preventas</h1>
            <p className="mt-2 max-w-3xl text-sm text-gray-600">
              Compara la cantidad actual cargada por version contra las preventas pendientes sin asignar.
            </p>
          </div>
          <Layers3 size={20} className="text-[#15aa9a]" />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Versiones</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{rows.length}</p>
        </article>
        <article className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Pedido total</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{totalPedido}</p>
        </article>
        <article className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Preventas pendientes</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{totalPreventas}</p>
        </article>
        <article className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Vendedores</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{resumenPorVendedor.length}</p>
        </article>
      </section>

      <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Disponible total</p>
        <p className={["mt-2 text-3xl font-semibold", totalDisponible < 0 ? "text-red-600" : totalDisponible === 0 ? "text-amber-600" : "text-emerald-600"].join(" ")}>
          {totalDisponible}
        </p>
      </section>

      <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-gray-900">Resumen por vendedor</h2>
            <p className="mt-1 text-sm text-gray-500">Preventas pendientes sin asignar agrupadas por vendedor.</p>
          </div>
          <UsersRound size={18} className="text-[#15aa9a]" />
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[560px] w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-[0.18em] text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">Vendedor</th>
                <th className="px-4 py-3 text-center">Preventas pendientes</th>
                <th className="px-4 py-3 text-center">Participacion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {resumenPorVendedor.map((row) => (
                <tr key={row.vendedor} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{row.vendedor}</td>
                  <td className="px-4 py-3 text-center text-gray-700">{row.preventas_pendientes}</td>
                  <td className="px-4 py-3 text-center text-gray-700">
                    {totalPreventas ? `${Math.round((row.preventas_pendientes / totalPreventas) * 100)}%` : "0%"}
                  </td>
                </tr>
              ))}
              {!resumenPorVendedor.length ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-sm text-gray-500">
                    No hay preventas pendientes para resumir por vendedor.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-base font-semibold tracking-tight text-gray-900">Comparacion por version</h2>
          <p className="mt-1 text-sm text-gray-500">Disponible = pedido mensual - preventas pendientes sin asignar.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[760px] w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-[0.18em] text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">Version</th>
                <th className="px-4 py-3 text-center">Pedido</th>
                <th className="px-4 py-3 text-center">Preventas pendientes</th>
                <th className="px-4 py-3 text-center">Disponible</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((row) => (
                <tr key={row.versionId} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-700">{row.version}</td>
                  <td className="px-4 py-3 text-center text-gray-700">{row.pedido}</td>
                  <td className="px-4 py-3 text-center text-gray-700">{row.preventas_pendientes}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex min-w-10 justify-center rounded-full bg-[#eef9f7] px-3 py-1 font-semibold">
                      <span className={[row.disponible < 0 ? "text-red-600" : row.disponible === 0 ? "text-amber-600" : "text-emerald-600"].join(" ")}>
                        {row.disponible}
                      </span>
                    </span>
                  </td>
                </tr>
              ))}
              {!rows.length ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-sm text-gray-500">
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
