import Loading from "@/components/Loading";
import { createVersionPrecioMensual, deleteVersionPrecioMensual, getVersionesPreciosMensuales, updateVersionPrecioMensual } from "@/api/dms/cotizadorAPI";
import { getVersiones } from "@/api/dms/preventasAPI";
import { formatMoney, getCurrentMonthValue } from "@/views/admin/siac/cotizadorUtils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Power, Save, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { paths } from "@/routes/paths";

const EMPTY_PRICES: Awaited<ReturnType<typeof getVersionesPreciosMensuales>>["data"] = [];
const EMPTY_VERSIONES: Awaited<ReturnType<typeof getVersiones>>["data"] = [];

export default function CotizadorVersionesPreciosView() {
  const queryClient = useQueryClient();
  const [mes, setMes] = useState(getCurrentMonthValue());
  const [version, setVersion] = useState("");
  const [precio, setPrecio] = useState("");
  const [descuentoReferenciaPct, setDescuentoReferenciaPct] = useState("8");
  const [editingId, setEditingId] = useState<string | null>(null);

  const preciosQuery = useQuery({
    queryKey: ["cotizador-precios", mes],
    queryFn: () => getVersionesPreciosMensuales(mes),
  });

  const versionesQuery = useQuery({
    queryKey: ["versiones", "activas", "cotizador"],
    queryFn: () => getVersiones(true),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!version) {
        throw new Error("Debes seleccionar una version");
      }

      const precioValue = Number(precio);
      if (!Number.isFinite(precioValue) || precioValue < 0) {
        throw new Error("El precio debe ser mayor o igual a 0");
      }

      const descuentoValue = Number(descuentoReferenciaPct);
      if (!Number.isFinite(descuentoValue) || descuentoValue < 0) {
        throw new Error("El descuento de referencia debe ser mayor o igual a 0");
      }

      const payload = { version, mes, precio: precioValue, descuentoReferenciaPct: descuentoValue, activo: true };
      if (editingId) {
        return updateVersionPrecioMensual(editingId, payload);
      }

      return createVersionPrecioMensual(payload);
    },
    onSuccess: (response) => {
      toast.success(response.message);
      setVersion("");
      setPrecio("");
      setDescuentoReferenciaPct("8");
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ["cotizador-precios"] });
      queryClient.invalidateQueries({ queryKey: ["cotizador-catalogo"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteVersionPrecioMensual,
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries({ queryKey: ["cotizador-precios"] });
      queryClient.invalidateQueries({ queryKey: ["cotizador-catalogo"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const statusMutation = useMutation({
    mutationFn: ({
      id,
      versionId,
      precioValue,
      descuentoValue,
      activo,
    }: {
      id: string;
      versionId: string;
      precioValue: number;
      descuentoValue: number;
      activo: boolean;
    }) =>
      updateVersionPrecioMensual(id, { version: versionId, mes, precio: precioValue, descuentoReferenciaPct: descuentoValue, activo }),
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries({ queryKey: ["cotizador-precios"] });
      queryClient.invalidateQueries({ queryKey: ["cotizador-catalogo"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const loading = preciosQuery.isLoading || versionesQuery.isLoading;
  const error = preciosQuery.error || versionesQuery.error;

  const precios = preciosQuery.data?.data ?? EMPTY_PRICES;
  const versiones = versionesQuery.data?.data ?? EMPTY_VERSIONES;

  const versionesDisponibles = useMemo(() => {
    if (editingId) {
      return versiones;
    }

    const used = new Set(precios.map((item) => item.version._id));
    return versiones.filter((item) => !used.has(item._id));
  }, [editingId, precios, versiones]);

  if (loading) return <Loading />;

  if (error instanceof Error) {
    return (
      <div className="w-full px-3 py-3">
        <section className="rounded-2xl border border-red-200 bg-white p-4 shadow-sm">
          <h1 className="text-lg font-semibold text-gray-900">Error al cargar precios mensuales</h1>
          <p className="mt-2 text-sm text-red-600">{error.message}</p>
        </section>
      </div>
    );
  }

  return (
    <div className="w-full space-y-3 px-3 py-3">
      <section className="rounded-2xl border border-[#cbe7e2] bg-[#e4f3fa] p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#17897d]">Cotizador</p>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Precios mensuales por version</h1>
            <p className="mt-1 max-w-3xl text-xs text-gray-600">
              Mantiene el historial mensual de lista de precios que consume el simulador de creditos.
            </p>
          </div>

          <Link
            to={paths.admin.cotizadorPlanes}
            className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-900 transition hover:bg-gray-50"
          >
            Ir a planes financieros
          </Link>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[160px_minmax(0,1fr)_180px_180px_auto]">
          <label className="flex flex-col gap-1.5 text-xs font-medium text-gray-700">
            Mes
            <input
              type="month"
              value={mes}
              onChange={(event) => {
                setMes(event.target.value);
                setEditingId(null);
                setVersion("");
                setPrecio("");
                setDescuentoReferenciaPct("8");
              }}
              className="rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#15aa9a]"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-xs font-medium text-gray-700">
            Version
            <select
              value={version}
              onChange={(event) => setVersion(event.target.value)}
              className="rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#15aa9a]"
            >
              <option value="">Seleccionar version</option>
              {versionesDisponibles.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.nombre}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5 text-xs font-medium text-gray-700">
            Precio
            <input
              type="number"
              min={0}
              step={0.01}
              value={precio}
              onChange={(event) => setPrecio(event.target.value)}
              className="rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#15aa9a]"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-xs font-medium text-gray-700">
            Desc. ref. %
            <input
              type="number"
              min={0}
              step={0.01}
              value={descuentoReferenciaPct}
              onChange={(event) => setDescuentoReferenciaPct(event.target.value)}
              className="rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#15aa9a]"
            />
          </label>

          <button
            type="button"
            onClick={() => saveMutation.mutate()}
            className="inline-flex items-center justify-center gap-2 self-end rounded-xl bg-[#15aa9a] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#128d80]"
          >
            <Save size={14} />
            {editingId ? "Guardar cambios" : "Guardar"}
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-4 py-3">
          <h2 className="text-base font-semibold tracking-tight text-gray-900">Lista {mes}</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead className="bg-gray-50 text-[10px] uppercase tracking-[0.18em] text-gray-500">
              <tr>
                <th className="px-3 py-2 text-left">Version</th>
                <th className="px-3 py-2 text-center">Mes</th>
                <th className="px-3 py-2 text-center">Precio</th>
                <th className="px-3 py-2 text-center">Desc. ref.</th>
                <th className="px-3 py-2 text-center">Estado</th>
                <th className="px-3 py-2 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {precios.map((item) => (
                <tr key={item._id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 font-medium text-gray-900">{item.version.nombre}</td>
                  <td className="px-3 py-2 text-center text-gray-700">{item.mes}</td>
                  <td className="px-3 py-2 text-center font-semibold text-gray-900">{formatMoney(item.precio)}</td>
                  <td className="px-3 py-2 text-center font-semibold text-gray-900">{item.descuentoReferenciaPct.toFixed(2)}%</td>
                  <td className="px-3 py-2 text-center">
                    <span className={["inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold", item.activo ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"].join(" ")}>
                      {item.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(item._id);
                          setVersion(item.version._id);
                          setPrecio(String(item.precio));
                          setDescuentoReferenciaPct(String(item.descuentoReferenciaPct));
                        }}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-2.5 py-1.5 text-[10px] font-semibold text-gray-700 hover:bg-gray-50"
                      >
                        <Pencil size={12} />
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          statusMutation.mutate({
                            id: item._id,
                            versionId: item.version._id,
                            precioValue: item.precio,
                            descuentoValue: item.descuentoReferenciaPct,
                            activo: !item.activo,
                          })
                        }
                        className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-2.5 py-1.5 text-[10px] font-semibold text-gray-700 hover:bg-gray-50"
                      >
                        <Power size={12} />
                        {item.activo ? "Desactivar" : "Activar"}
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteMutation.mutate(item._id)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-red-50 px-2.5 py-1.5 text-[10px] font-semibold text-red-700 hover:bg-red-100"
                      >
                        <Trash2 size={12} />
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!precios.length ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-xs text-gray-500">
                    No hay precios cargados para {mes}.
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
