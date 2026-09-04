import { getVendedoresNic } from "@/api/dms/dmsAPI";
import { useQuery } from "@tanstack/react-query";
import { Check, X } from "lucide-react";

type Vendedor = {
  vendedor: string;
  codigo: number;
  tpoNuevo: boolean;
  tipoUsado: boolean;
  tipoPlan: boolean;
  tipoPosventa: boolean;
  emailTecnom: string;
  estado: number;
  sucursal: string;
};

type VendedoresResponse = {
  data: Vendedor[];
};

function BooleanBadge({ value }: { value: boolean }) {
  return value ? (
    <span className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-0.5 text-xs font-medium text-foreground">
      <Check className="h-4 w-4" />
      Sí
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-md border border-destructive/30 bg-background px-2 py-0.5 text-xs font-medium text-destructive">
      <X className="h-4 w-4" />
      No
    </span>
  );
}

export default function VendedoresView() {
  const { data, isLoading, isError, error } = useQuery<VendedoresResponse>({
    queryKey: ["vendedores", "nic"],
    queryFn: getVendedoresNic,
  });

  const items = data?.data ?? [];

  if (isLoading) {
    return (
      <div className="font-preset w-full bg-muted px-2 py-3">
        <div className="rounded-lg border border-border bg-card px-3 py-3 shadow-sm">
          <p className="text-sm text-muted-foreground">Cargando vendedores...</p>
        </div>
      </div>
    );
  }

  const tiposStats = items.reduce(
    (acc, item) => {
      if (item.tpoNuevo) acc.nuevo += 1;
      if (item.tipoUsado) acc.usado += 1;
      if (item.tipoPlan) acc.plan += 1;
      if (item.tipoPosventa) acc.posventa += 1;
      return acc;
    },
    { nuevo: 0, usado: 0, plan: 0, posventa: 0 },
  );

  if (isError) {
    return (
      <div className="w-full px-4 py-6">
        <div className="rounded-lg border border-destructive/30 bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">Error al cargar vendedores</h2>
          <p className="mt-2 text-sm text-destructive">{error instanceof Error ? error.message : "Error desconocido"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="font-preset w-full space-y-3 bg-muted px-2 py-3">
      <section className="rounded-lg border border-border bg-card px-3 py-3 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Administración</p>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Vendedores</h1>
      </section>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <article className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Total</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{items.length}</p>
        </article>

        <article className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Activos</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{items.filter((item) => item.estado === 1).length}</p>
        </article>

        <article className="rounded-lg border border-border bg-card px-6 py-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Tipos</p>

          <div
            className="mt-3 grid divide-x divide-border"
            style={{
              gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            }}
          >
            <div className="px-3 first:pl-0">
              <p className="text-xs text-muted-foreground uppercase">Nuevo</p>
              <p className="text-lg font-semibold text-foreground">{tiposStats.nuevo}</p>
            </div>

            <div className="px-3">
              <p className="text-xs text-muted-foreground uppercase">Usado</p>
              <p className="text-lg font-semibold text-foreground">{tiposStats.usado}</p>
            </div>

            <div className="px-3">
              <p className="text-xs text-muted-foreground uppercase">Plan</p>
              <p className="text-lg font-semibold text-foreground">{tiposStats.plan}</p>
            </div>

            <div className="px-3 last:pr-0">
              <p className="text-xs text-muted-foreground uppercase">Postventa</p>
              <p className="text-lg font-semibold text-foreground">{tiposStats.posventa}</p>
            </div>
          </div>
        </article>
      </section>

      <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-foreground">Listado de vendedores</h2>
            <p className="mt-1 text-sm text-muted-foreground">Configuración general de tipos y sucursal</p>
          </div>

          <div className="rounded-lg border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">{items.length} registros</div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b border-border bg-muted">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Código</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Vendedor</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Nuevo</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Usado</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Plan</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Posventa</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Email Tecnom</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Sucursal</th>
              </tr>
            </thead>

            <tbody>
              {items.map((item) => (
                <tr key={item.codigo} className="border-b border-border hover:bg-muted">
                  <td className="px-4 py-3 font-medium text-foreground">{item.codigo}</td>

                  <td className="px-4 py-3 text-muted-foreground">{item.vendedor}</td>

                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center">
                      <BooleanBadge value={item.tpoNuevo} />
                    </div>
                  </td>

                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center">
                      <BooleanBadge value={item.tipoUsado} />
                    </div>
                  </td>

                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center">
                      <BooleanBadge value={item.tipoPlan} />
                    </div>
                  </td>

                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center">
                      <BooleanBadge value={item.tipoPosventa} />
                    </div>
                  </td>

                  <td className="px-4 py-3 text-muted-foreground">{item.emailTecnom || "-"}</td>

                  <td className="px-4 py-3 text-center">
                    <span
                      className={[
                        "inline-flex rounded-md border px-2.5 py-1 text-xs font-medium",
                        item.estado === 1 ? "border-border bg-secondary text-primary" : "border-destructive/30 bg-destructive/10 text-destructive",
                      ].join(" ")}
                    >
                      {item.estado === 1 ? "Activo" : "Inactivo"}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-muted-foreground">{item.sucursal}</td>
                </tr>
              ))}

              {items.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-6 py-10 text-center text-sm text-muted-foreground">
                    No hay vendedores para mostrar.
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
