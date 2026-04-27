import Loading from "@/components/Loading";
import { getVendedoresActivosNic } from "@/api/dms/dmsAPI";
import { createPreventa, getColores, getPreventaById, getVersiones, updatePreventa } from "@/api/dms/preventasAPI";
import { toMonthInputValue } from "@/helpers/preventas";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

type PreventaFormState = {
  vendedor: string;
  numero_op: string;
  cliente: string;
  version: string;
  colores: string[];
  monto_reserva: string;
  observaciones: string;
  mes_asigna: string;
};

const initialForm: PreventaFormState = {
  vendedor: "",
  numero_op: "",
  cliente: "",
  version: "",
  colores: [],
  monto_reserva: "",
  observaciones: "",
  mes_asigna: "",
};

export default function PreventaFormView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = Boolean(id);
  const [form, setForm] = useState<PreventaFormState>(initialForm);

  const vendedoresQuery = useQuery({
    queryKey: ["vendedores", "nic", "activos"],
    queryFn: getVendedoresActivosNic,
  });

  const versionesQuery = useQuery({
    queryKey: ["versiones", "activas"],
    queryFn: () => getVersiones(true),
  });

  const coloresQuery = useQuery({
    queryKey: ["colores", "activos"],
    queryFn: () => getColores(true),
  });

  const preventaQuery = useQuery({
    queryKey: ["preventa", id],
    queryFn: () => getPreventaById(id!),
    enabled: isEditing,
  });

  useEffect(() => {
    if (!preventaQuery.data?.data) return;

    const preventa = preventaQuery.data.data;

    setForm({
      vendedor: String(preventa.vendedor),
      numero_op: preventa.numero_op?.toString() ?? "",
      cliente: preventa.cliente,
      version: preventa.version._id,
      colores: preventa.colores.map((color) => color._id),
      monto_reserva: preventa.monto_reserva?.toString() ?? "",
      observaciones: preventa.observaciones ?? "",
      mes_asigna: toMonthInputValue(preventa.mes_asigna),
    });
  }, [preventaQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!form.vendedor) throw new Error("Debes seleccionar un vendedor");
      if (!form.cliente.trim()) throw new Error("El cliente es obligatorio");
      if (!form.version) throw new Error("Debes seleccionar una version");
      if (!form.mes_asigna) throw new Error("Debes seleccionar el mes de asignacion");

      const payload = {
        vendedor: Number(form.vendedor),
        numero_op: form.numero_op ? Number(form.numero_op) : null,
        cliente: form.cliente.trim(),
        version: form.version,
        colores: form.colores,
        monto_reserva: form.monto_reserva ? Number(form.monto_reserva) : null,
        observaciones: form.observaciones.trim(),
        mes_asigna: form.mes_asigna,
      };

      if (isEditing && id) {
        return updatePreventa(id, payload);
      }

      return createPreventa(payload);
    },
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries({ queryKey: ["preventas"] });
      queryClient.invalidateQueries({ queryKey: ["preventas-resumen"] });
      navigate("/preventas");
    },
    onError: (mutationError: Error) => toast.error(mutationError.message),
  });

  const loading = vendedoresQuery.isLoading || versionesQuery.isLoading || coloresQuery.isLoading || preventaQuery.isLoading;
  const firstError = vendedoresQuery.error || versionesQuery.error || coloresQuery.error || preventaQuery.error;

  const vendedores = vendedoresQuery.data?.data ?? [];
  const versiones = versionesQuery.data?.data ?? [];
  const colores = coloresQuery.data?.data ?? [];

  if (loading) return <Loading />;

  if (firstError instanceof Error) {
    return (
      <div className="w-full px-4 py-6">
        <section className="rounded-3xl border border-red-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold text-gray-900">No se pudo cargar el formulario de preventa</h1>
          <p className="mt-2 text-sm text-red-600">{firstError.message}</p>
        </section>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 px-4 py-6">
      <section className="rounded-3xl border border-[#cbe7e2] bg-[#e4f3fa] p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#17897d]">Preventas</p>
            <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
              {isEditing ? "Editar preventa" : "Nueva preventa"}
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              La unidad todavía no existe en el sistema; por eso se registra la necesidad comercial y el mes esperado de asignacion.
            </p>
          </div>
          <Link to="/preventas" className="inline-flex items-center gap-2 text-sm font-semibold text-[#146b61] hover:text-[#128d80]">
            <ArrowLeft size={16} />
            Volver al listado
          </Link>
        </div>
      </section>

      <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
          <label className="flex flex-col gap-2 text-sm font-medium text-gray-700 xl:col-span-4">
            Vendedor
            <select
              value={form.vendedor}
              onChange={(event) => setForm((current) => ({ ...current, vendedor: event.target.value }))}
              className="rounded-2xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#15aa9a]"
            >
              <option value="">Seleccionar vendedor</option>
              {vendedores.map((vendedor) => (
                <option key={vendedor.codigo} value={vendedor.codigo}>
                  {vendedor.vendedor}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-gray-700 xl:col-span-4">
            Numero OP
            <input
              type="number"
              value={form.numero_op}
              onChange={(event) => setForm((current) => ({ ...current, numero_op: event.target.value }))}
              className="rounded-2xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#15aa9a]"
              placeholder="Opcional"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-gray-700 xl:col-span-4">
            Monto reserva
            <input
              type="number"
              min={0}
              value={form.monto_reserva}
              onChange={(event) => setForm((current) => ({ ...current, monto_reserva: event.target.value }))}
              className="rounded-2xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#15aa9a]"
              placeholder="Opcional"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-gray-700 xl:col-span-6">
            Cliente
            <input
              type="text"
              value={form.cliente}
              onChange={(event) => setForm((current) => ({ ...current, cliente: event.target.value }))}
              className="rounded-2xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#15aa9a]"
              placeholder="Nombre del cliente"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-gray-700 xl:col-span-3">
            Version
            <select
              value={form.version}
              onChange={(event) => setForm((current) => ({ ...current, version: event.target.value }))}
              className="rounded-2xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#15aa9a]"
            >
              <option value="">Seleccionar version</option>
              {versiones.map((version) => (
                <option key={version._id} value={version._id}>
                  {version.nombre}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-gray-700 xl:col-span-3">
            Mes de asignacion
            <input
              type="month"
              value={form.mes_asigna}
              onChange={(event) => setForm((current) => ({ ...current, mes_asigna: event.target.value }))}
              className="rounded-2xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#15aa9a]"
            />
          </label>

          <div className="rounded-3xl border border-gray-200 bg-[#f8fbfd] p-4 xl:col-span-12">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Colores</h2>
                <p className="mt-1 text-xs text-gray-500">Podés seleccionar varios colores posibles para una misma unidad.</p>
              </div>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#146b61] shadow-sm">
                {form.colores.length} seleccionados
              </span>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {colores.map((color) => {
                const checked = form.colores.includes(color._id);

                return (
                  <label
                    key={color._id}
                    className={[
                      "flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition",
                      checked ? "border-[#15aa9a] bg-[#eef9f7] text-[#146b61]" : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50",
                    ].join(" ")}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        setForm((current) => ({
                          ...current,
                          colores: checked
                            ? current.colores.filter((item) => item !== color._id)
                            : [...current.colores, color._id],
                        }))
                      }
                      className="h-4 w-4 rounded border-gray-300 text-[#15aa9a] focus:ring-[#15aa9a]"
                    />
                    {color.nombre}
                  </label>
                );
              })}
            </div>
          </div>

          <label className="flex flex-col gap-2 text-sm font-medium text-gray-700 xl:col-span-12">
            Observaciones
            <textarea
              value={form.observaciones}
              onChange={(event) => setForm((current) => ({ ...current, observaciones: event.target.value }))}
              rows={5}
              className="rounded-2xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#15aa9a]"
              placeholder="Contexto comercial, prioridad, preferencia de color, etc."
            />
          </label>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#15aa9a] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#128d80] disabled:cursor-not-allowed disabled:bg-[#8fd2ca]"
          >
            <Save size={16} />
            {isEditing ? "Guardar cambios" : "Crear preventa"}
          </button>
        </div>
      </section>
    </div>
  );
}
