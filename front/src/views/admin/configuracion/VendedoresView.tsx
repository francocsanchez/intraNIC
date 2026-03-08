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
    <span className="inline-flex items-center gap-2 rounded-md border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
      <Check className="h-4 w-4" />
      Sí
    </span>
  ) : (
    <span className="inline-flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
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
      <div className="w-full px-4 py-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">Cargando vendedores...</p>
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
        <div className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold tracking-tight text-gray-900">
            Error al cargar vendedores
          </h2>
          <p className="mt-2 text-sm text-red-600">
            {error instanceof Error ? error.message : "Error desconocido"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-6 space-y-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
          Administración
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          Vendedores
        </h1>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
            Total
          </p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">
            {items.length}
          </p>
        </article>

        <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
            Activos
          </p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">
            {items.filter((item) => item.estado === 1).length}
          </p>
        </article>

        <article className="rounded-2xl border border-gray-200 bg-white px-6 py-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
            Tipos
          </p>

          <div
            className="mt-3 grid divide-x divide-gray-200"
            style={{
              gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            }}
          >
            <div className="px-3 first:pl-0">
              <p className="text-xs text-gray-500 uppercase">Nuevo</p>
              <p className="text-lg font-semibold text-gray-900">
                {tiposStats.nuevo}
              </p>
            </div>

            <div className="px-3">
              <p className="text-xs text-gray-500 uppercase">Usado</p>
              <p className="text-lg font-semibold text-gray-900">
                {tiposStats.usado}
              </p>
            </div>

            <div className="px-3">
              <p className="text-xs text-gray-500 uppercase">Plan</p>
              <p className="text-lg font-semibold text-gray-900">
                {tiposStats.plan}
              </p>
            </div>

            <div className="px-3 last:pr-0">
              <p className="text-xs text-gray-500 uppercase">Postventa</p>
              <p className="text-lg font-semibold text-gray-900">
                {tiposStats.posventa}
              </p>
            </div>
          </div>
        </article>
      </section>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-gray-900">
              Listado de vendedores
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Configuración general de tipos y sucursal
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
            {items.length} registros
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                  Código
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                  Vendedor
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                  Nuevo
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                  Usado
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                  Plan
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                  Posventa
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                  Email Tecnom
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                  Estado
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                  Sucursal
                </th>
              </tr>
            </thead>

            <tbody>
              {items.map((item) => (
                <tr
                  key={item.codigo}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {item.codigo}
                  </td>

                  <td className="px-4 py-3 text-gray-700">{item.vendedor}</td>

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

                  <td className="px-4 py-3 text-gray-700">
                    {item.emailTecnom || "-"}
                  </td>

                  <td className="px-4 py-3 text-center">
                    <span
                      className={[
                        "inline-flex rounded-md border px-2.5 py-1 text-xs font-medium",
                        item.estado === 1
                          ? "border-green-200 bg-green-50 text-green-700"
                          : "border-red-200 bg-red-50 text-red-700",
                      ].join(" ")}
                    >
                      {item.estado === 1 ? "Activo" : "Inactivo"}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-gray-700">{item.sucursal}</td>
                </tr>
              ))}

              {items.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="px-6 py-10 text-center text-sm text-gray-500"
                  >
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
