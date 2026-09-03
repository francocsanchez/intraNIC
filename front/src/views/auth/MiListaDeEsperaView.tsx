import { miListaDeEspera } from "@/api/convencional/stockAPI";
import Loading from "@/components/Loading";
import { textToColor } from "@/helpers/colores";
import { useQuery } from "@tanstack/react-query";

export default function MiListaDeEsperaView() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["mis", "espera"],
    queryFn: miListaDeEspera,
    refetchOnWindowFocus: true,
  });

  if (isLoading) return <Loading />;

  if (isError) {
    return (
      <div className="font-preset w-full bg-muted px-2 py-3">
        <div className="rounded-lg border border-destructive/30 bg-card p-3">
          <h1 className="text-lg font-semibold text-foreground">Error al cargar tu lista de espera</h1>
          <p className="mt-2 text-sm text-destructive">{error instanceof Error ? error.message : "Ocurrió un error al obtener la información."}</p>
        </div>
      </div>
    );
  }

  const operaciones = data?.data ?? [];

  const formatDate = (value: string) =>
    new Intl.DateTimeFormat("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(value));

  return (
    <div className="font-preset w-full bg-muted px-2 py-3">
      <section className="overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-sm">
          <div className="border-b border-border px-3 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Mi lista de espera</p>
            <h1 className="mt-1 text-lg font-semibold tracking-tight text-foreground">Resumen de operaciones</h1>
          </div>

          {operaciones.length === 0 ? (
            <div className="px-3 py-8 text-sm text-muted-foreground">No tenés reservas para mostrar.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-muted">
                  <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    <th className="px-3 py-2">Operacion</th>
                    <th className="px-3 py-2">Fecha</th>
                    <th className="px-3 py-2">Modelo</th>
                    <th className="px-3 py-2">Versión</th>
                    <th className="px-3 py-2">Cliente</th>
                    <th className="px-3 py-2 text-center">Color 1</th>
                    <th className="px-3 py-2 text-center">Color 2</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-border">
                  {operaciones.map((operacion) => (
                    <tr key={operacion.opera} className="align-top text-muted-foreground hover:bg-muted">
                      <td className="px-3 py-1.5 font-medium text-foreground">{operacion.opera}</td>
                      <td className="px-3 py-1.5 font-medium text-foreground">{formatDate(operacion.fecha)}</td>
                      <td className="px-3 py-1.5">{operacion.modelo}</td>
                      <td className="min-w-[260px] px-3 py-1.5">{operacion.version}</td>
                      <td className="px-3 py-1.5">{operacion.clienteNombre}</td>
                      <td className="px-3 py-1.5 text-center">
                        <div
                          className={`inline-flex w-40 justify-center rounded-md border border-border px-2 py-0.5 text-xs font-medium ${textToColor(operacion.color1)}`}
                        >
                          {operacion.color1}
                        </div>
                      </td>
                      <td className="px-3 py-1.5 text-center">
                        <div
                          className={`inline-flex w-40 justify-center rounded-md border border-border px-2 py-0.5 text-xs font-medium ${textToColor(operacion.color2)}`}
                        >
                          {operacion.color2}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </section>
    </div>
  );
}
