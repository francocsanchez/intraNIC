import Loading from "@/components/Loading";
import { createProforma } from "@/api/dms/proformasAPI";
import { getVersiones } from "@/api/dms/preventasAPI";
import { buildUnitRows, formatCurrencyAr, formatPercentAr } from "@/helpers/proformas";
import { paths } from "@/routes/paths";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, Save, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

type UnidadFormState = {
  version: string;
  cantidad: string;
  ivaUnidad: string;
  totalUnidad: string;
  descuentoUnidad: string;
  totalPatentamiento: string;
  totalFlete: string;
};

const createEmptyUnit = (): UnidadFormState => ({
  version: "",
  cantidad: "1",
  ivaUnidad: "",
  totalUnidad: "",
  descuentoUnidad: "0",
  totalPatentamiento: "",
  totalFlete: "",
});

export default function ProformaFormView() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [senores, setSenores] = useState("");
  const [cliente, setCliente] = useState("");
  const [cuit, setCuit] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [unidades, setUnidades] = useState<UnidadFormState[]>([createEmptyUnit()]);

  const versionesQuery = useQuery({
    queryKey: ["versiones", "activas"],
    queryFn: () => getVersiones(true),
  });

  const saveMutation = useMutation({
    mutationFn: async () =>
      createProforma({
        senores: senores.trim(),
        cliente: cliente.trim(),
        cuit: cuit.trim(),
        observaciones: observaciones.trim(),
        unidades: unidades.map((unidad) => ({
          version: unidad.version,
          cantidad: Number(unidad.cantidad),
          ivaUnidad: Number(unidad.ivaUnidad),
          totalUnidad: Number(unidad.totalUnidad),
          descuentoUnidad: Number(unidad.descuentoUnidad),
          totalPatentamiento: Number(unidad.totalPatentamiento),
          totalFlete: Number(unidad.totalFlete),
        })),
      }),
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries({ queryKey: ["proformas"] });
      navigate(paths.convencional.proformasDetalle(response.data._id));
    },
    onError: (mutationError: Error) => toast.error(mutationError.message),
  });

  const resumen = useMemo(() => {
    const versiones = new Map((versionesQuery.data?.data ?? []).map((version) => [version._id, version.nombre]));

    const rows = unidades.flatMap((unidad) =>
      buildUnitRows({
        versionNombre: versiones.get(unidad.version) ?? "Versión",
        cantidad: Number(unidad.cantidad || 0),
        ivaUnidad: Number(unidad.ivaUnidad || 0),
        totalUnidad: Number(unidad.totalUnidad || 0),
        descuentoUnidad: Number(unidad.descuentoUnidad || 0),
        totalPatentamiento: Number(unidad.totalPatentamiento || 0),
        totalFlete: Number(unidad.totalFlete || 0),
      }),
    );

    return {
      rows,
      totalNeto: rows.reduce((acc, row) => acc + row.totales, 0),
    };
  }, [unidades, versionesQuery.data]);

  if (versionesQuery.isLoading) return <Loading />;

  if (versionesQuery.error instanceof Error) {
    return (
      <div className="w-full px-4 py-6">
        <section className="rounded-3xl border border-red-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold text-gray-900">No se pudo cargar el formulario de proformas</h1>
          <p className="mt-2 text-sm text-red-600">{versionesQuery.error.message}</p>
        </section>
      </div>
    );
  }

  const versiones = versionesQuery.data?.data ?? [];

  return (
    <div className="w-full space-y-6 px-4 py-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Proformas</p>
            <h1 className="text-3xl font-semibold tracking-tight text-gray-900">Nueva proforma</h1>
            <p className="mt-2 text-sm text-gray-600">
              Cargá los datos comerciales, agregá una o varias unidades y revisá los cálculos antes de guardar.
            </p>
          </div>
          <Link to={paths.convencional.proformas} className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900">
            <ArrowLeft size={16} />
            Volver al listado
          </Link>
        </div>
      </section>

      <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
          <label className="flex flex-col gap-2 text-sm font-medium text-gray-700 xl:col-span-6">
            Señores
            <input
              type="text"
              value={senores}
              onChange={(event) => setSenores(event.target.value)}
              className="rounded-2xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-gray-500"
              placeholder="Dato obligatorio"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-gray-700 xl:col-span-3">
            Cliente
            <input
              type="text"
              value={cliente}
              onChange={(event) => setCliente(event.target.value)}
              className="rounded-2xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-gray-500"
              placeholder="Opcional"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-gray-700 xl:col-span-3">
            CUIT
            <input
              type="text"
              value={cuit}
              onChange={(event) => setCuit(event.target.value)}
              className="rounded-2xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-gray-500"
              placeholder="Opcional"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-gray-700 xl:col-span-12">
            Observaciones
            <textarea
              value={observaciones}
              onChange={(event) => setObservaciones(event.target.value)}
              rows={4}
              className="rounded-2xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-gray-500"
              placeholder="Opcional"
            />
          </label>
        </div>
      </section>

      <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Unidades</h2>
            <p className="mt-1 text-sm text-gray-500">Cada unidad generará automáticamente tres renglones en el PDF.</p>
          </div>
          <button
            type="button"
            onClick={() => setUnidades((current) => [...current, createEmptyUnit()])}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            <Plus size={16} />
            Agregar unidad
          </button>
        </div>

        <div className="mt-6 space-y-4">
          {unidades.map((unidad, index) => (
            <article key={`unidad-${index}`} className="rounded-2xl border border-gray-200 bg-white p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">Unidad {index + 1}</h3>
                <button
                  type="button"
                  onClick={() => setUnidades((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                  disabled={unidades.length === 1}
                  className="inline-flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Trash2 size={14} />
                  Quitar
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
                <label className="flex flex-col gap-2 text-sm font-medium text-gray-700 xl:col-span-6">
                  Versión
                  <select
                    value={unidad.version}
                    onChange={(event) =>
                      setUnidades((current) =>
                        current.map((item, itemIndex) => (itemIndex === index ? { ...item, version: event.target.value } : item)),
                      )
                    }
                    className="rounded-2xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-gray-500"
                  >
                    <option value="">Seleccionar versión</option>
                    {versiones.map((version) => (
                      <option key={version._id} value={version._id}>
                        {version.nombre}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex flex-col gap-2 text-sm font-medium text-gray-700 xl:col-span-2">
                  Cantidad
                  <input
                    type="number"
                    min={1}
                    value={unidad.cantidad}
                    onChange={(event) =>
                      setUnidades((current) =>
                        current.map((item, itemIndex) => (itemIndex === index ? { ...item, cantidad: event.target.value } : item)),
                      )
                    }
                    className="rounded-2xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-gray-500"
                  />
                </label>

                <label className="flex flex-col gap-2 text-sm font-medium text-gray-700 xl:col-span-2">
                  IVA unidad
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={unidad.ivaUnidad}
                    onChange={(event) =>
                      setUnidades((current) =>
                        current.map((item, itemIndex) => (itemIndex === index ? { ...item, ivaUnidad: event.target.value } : item)),
                      )
                    }
                    className="rounded-2xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-gray-500"
                    placeholder="Ej. 10.5"
                  />
                </label>

                <label className="flex flex-col gap-2 text-sm font-medium text-gray-700 xl:col-span-2">
                  Total unidad
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={unidad.totalUnidad}
                    onChange={(event) =>
                      setUnidades((current) =>
                        current.map((item, itemIndex) => (itemIndex === index ? { ...item, totalUnidad: event.target.value } : item)),
                      )
                    }
                    className="rounded-2xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-gray-500"
                  />
                </label>

                <label className="flex flex-col gap-2 text-sm font-medium text-gray-700 xl:col-span-2">
                  Descuento unidad
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={unidad.descuentoUnidad}
                    onChange={(event) =>
                      setUnidades((current) =>
                        current.map((item, itemIndex) => (itemIndex === index ? { ...item, descuentoUnidad: event.target.value } : item)),
                      )
                    }
                    className="rounded-2xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-gray-500"
                  />
                </label>

                <label className="flex flex-col gap-2 text-sm font-medium text-gray-700 xl:col-span-5">
                  Total patentamiento
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={unidad.totalPatentamiento}
                    onChange={(event) =>
                      setUnidades((current) =>
                        current.map((item, itemIndex) => (itemIndex === index ? { ...item, totalPatentamiento: event.target.value } : item)),
                      )
                    }
                    className="rounded-2xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-gray-500"
                  />
                </label>

                <label className="flex flex-col gap-2 text-sm font-medium text-gray-700 xl:col-span-5">
                  Total flete
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={unidad.totalFlete}
                    onChange={(event) =>
                      setUnidades((current) =>
                        current.map((item, itemIndex) => (itemIndex === index ? { ...item, totalFlete: event.target.value } : item)),
                      )
                    }
                    className="rounded-2xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-gray-500"
                  />
                </label>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-900 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            <Save size={16} />
            Guardar proforma
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-base font-semibold tracking-tight text-gray-900">Vista previa de cálculos</h2>
          <p className="mt-1 text-sm text-gray-500">Patentamiento se muestra exento de IVA. Los ítems en 0 no se incluyen como renglón adicional.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[980px] w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-[0.18em] text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">Detalle</th>
                <th className="px-4 py-3 text-center">Cantidad</th>
                <th className="px-4 py-3 text-center">IVA</th>
                <th className="px-4 py-3 text-right">Neto</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-right">Totales</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {resumen.rows.map((row, index) => (
                <tr key={`${row.detalle}-${index}`} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-700">{row.detalle}</td>
                  <td className="px-4 py-3 text-center text-gray-700">{row.cantidad}</td>
                  <td className="px-4 py-3 text-center text-gray-700">{formatPercentAr(row.iva)}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{formatCurrencyAr(row.neto)}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{formatCurrencyAr(row.total)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">{formatCurrencyAr(row.totales)}</td>
                </tr>
              ))}
              <tr className="bg-gray-50">
                <td colSpan={5} className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                  TOTAL NETO
                </td>
                <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">{formatCurrencyAr(resumen.totalNeto)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
