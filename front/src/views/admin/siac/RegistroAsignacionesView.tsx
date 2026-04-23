import Loading from "@/components/Loading";
import {
  createRegistroAsignacion,
  deleteRegistroAsignacion,
  getRegistroAsignacionInfoOperacion,
  getRegistrosAsignaciones,
  updateRegistroAsignacion,
} from "@/api/dms/registroAsignacionAPI";
import type {
  RegistroAsignacion,
  RegistroAsignacionInfoOperacion,
} from "@/types/index";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRightLeft,
  List,
  Pencil,
  Save,
  Search,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const PAGE_SIZE = 30;

function getToday() {
  const today = new Date();
  const offset = today.getTimezoneOffset() * 60_000;
  return new Date(today.getTime() - offset).toISOString().slice(0, 10);
}

function formatDate(dateString: string) {
  const date = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateString;

  return date.toLocaleDateString("es-AR");
}

export default function RegistroAsignacionesView() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState<number>(1);
  const [fecha, setFecha] = useState<string>(getToday());
  const [operacionInput, setOperacionInput] = useState<string>("");
  const [tipo, setTipo] = useState<"Asignado" | "Desasignado" | "">("");
  const [observaciones, setObservaciones] = useState<string>("");
  const [infoOperacion, setInfoOperacion] =
    useState<RegistroAsignacionInfoOperacion | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["registro-asignaciones", page],
    queryFn: () => getRegistrosAsignaciones(page, PAGE_SIZE),
    refetchOnWindowFocus: true,
  });

  const registros = data?.data ?? [];
  const pagination = data?.pagination;

  const currentOperacion = Number(operacionInput.trim());
  const infoMatchesInput = infoOperacion?.operacion === currentOperacion;

  const searchMutation = useMutation({
    mutationFn: getRegistroAsignacionInfoOperacion,
    onSuccess: (response) => {
      setInfoOperacion(response);
      setOperacionInput(String(response.operacion));
      toast.success("Operacion encontrada");
    },
    onError: (mutationError: Error) => {
      setInfoOperacion(null);
      toast.error(
        mutationError.message ||
          "No se pudo obtener la informacion de la operacion",
      );
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        fecha,
        operacion: currentOperacion,
        observaciones: observaciones.trim(),
        tipo: tipo as "Asignado" | "Desasignado",
      };

      if (editingId) {
        return updateRegistroAsignacion(editingId, payload);
      }

      return createRegistroAsignacion(payload);
    },
    onSuccess: (response) => {
      toast.success(response.message);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["registro-asignaciones"] });
      queryClient.invalidateQueries({ queryKey: ["registro-asignaciones-resumen"] });
    },
    onError: (mutationError: Error) => {
      toast.error(
        mutationError.message ||
          "No se pudo guardar el registro de asignacion",
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteRegistroAsignacion,
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries({ queryKey: ["registro-asignaciones"] });
      queryClient.invalidateQueries({ queryKey: ["registro-asignaciones-resumen"] });
    },
    onError: (mutationError: Error) => {
      toast.error(
        mutationError.message ||
          "No se pudo eliminar el registro de asignacion",
      );
    },
  });

  function resetForm() {
    setFecha(getToday());
    setOperacionInput("");
    setTipo("");
    setObservaciones("");
    setInfoOperacion(null);
    setEditingId(null);
  }

  const handleBuscarOperacion = () => {
    if (!Number.isInteger(currentOperacion) || currentOperacion <= 0) {
      toast.error("Ingresa un numero de operacion valido");
      return;
    }

    searchMutation.mutate(currentOperacion);
  };

  const handleSave = () => {
    if (!fecha) {
      toast.error("Debes seleccionar una fecha");
      return;
    }

    if (!Number.isInteger(currentOperacion) || currentOperacion <= 0) {
      toast.error("Debes ingresar una operacion valida");
      return;
    }

    if (!tipo) {
      toast.error("Debes seleccionar el tipo de movimiento");
      return;
    }

    if (!infoOperacion || !infoMatchesInput) {
      toast.error("Debes buscar la operacion antes de guardar");
      return;
    }

    saveMutation.mutate();
  };

  const handleEdit = (registro: RegistroAsignacion) => {
    setEditingId(registro._id);
    setFecha(registro.fecha);
    setOperacionInput(String(registro.operacion));
    setTipo(registro.tipo);
    setObservaciones(registro.observaciones ?? "");
    setInfoOperacion({
      operacion: registro.operacion,
      interno: registro.interno,
      cliente: registro.cliente,
      modelo: registro.modelo,
      version: registro.version,
      chasis: registro.chasis,
      sucursal: registro.sucursal,
      vendedor: registro.vendedor,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = (registro: RegistroAsignacion) => {
    const confirmed = window.confirm(
      `Vas a eliminar el registro de la operacion ${registro.operacion}.`,
    );

    if (!confirmed) return;
    deleteMutation.mutate(registro._id);
  };

  if (isLoading) return <Loading />;

  if (isError) {
    return (
      <div className="w-full px-4 py-6">
        <section className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold tracking-tight text-gray-900">
            Error al cargar registro de asignaciones
          </h1>
          <p className="mt-2 text-sm text-red-600">{error.message}</p>
        </section>
      </div>
    );
  }

  const totalPages = pagination?.totalPages ?? 1;

  return (
    <div className="w-full space-y-6 px-4 py-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
              Registro asignaciones
            </h1>
            <p className="mt-1 max-w-3xl text-sm text-gray-500">
              Registra movimientos de asignacion y desasignacion con pocos campos
              y consulta el historial paginado.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/registro-asignaciones/resumen"
              className="inline-flex items-center gap-2 rounded-xl bg-gray-950 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-800"
            >
              <List size={16} strokeWidth={1.75} />
              Ver resumen
            </Link>
          </div>
        </div>
      </section>

      <section>
        <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-base font-semibold tracking-tight text-gray-900">
                {editingId ? "Editar registro" : "Nuevo registro"}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Busca la operacion para completar automaticamente los datos de la unidad.
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
              {editingId ? "Modo edicion" : "Carga rapida"}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-[220px_minmax(0,1fr)_220px]">
            <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
              Fecha
              <input
                type="date"
                value={fecha}
                onChange={(event) => setFecha(event.target.value)}
                className="rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition-colors focus:border-[#15aa9a]"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
              Operacion
              <div className="flex gap-3">
                <input
                  type="number"
                  min={1}
                  value={operacionInput}
                  onChange={(event) => {
                    setOperacionInput(event.target.value);
                    if (
                      infoOperacion &&
                      infoOperacion.operacion !== Number(event.target.value)
                    ) {
                      setInfoOperacion(null);
                    }
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      handleBuscarOperacion();
                    }
                  }}
                  placeholder="Ej: 145236"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition-colors focus:border-[#15aa9a]"
                />

                <button
                  type="button"
                  onClick={handleBuscarOperacion}
                  disabled={searchMutation.isPending}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#15aa9a] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#129181] disabled:cursor-not-allowed disabled:bg-[#8fd2ca]"
                >
                  <Search size={16} strokeWidth={2} />
                  Buscar
                </button>
              </div>
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
              Tipo
              <select
                value={tipo}
                onChange={(event) =>
                  setTipo(event.target.value as "Asignado" | "Desasignado" | "")
                }
                className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-colors focus:border-[#15aa9a]"
              >
                <option value="">Seleccionar</option>
                <option value="Asignado">Asignado</option>
                <option value="Desasignado">Desasignado</option>
              </select>
            </label>
          </div>

          <label className="mt-4 flex flex-col gap-2 text-sm font-medium text-gray-700">
            Observaciones
            <textarea
              rows={3}
              value={observaciones}
              onChange={(event) => setObservaciones(event.target.value)}
              placeholder="Detalle opcional"
              className="rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition-colors focus:border-[#15aa9a]"
            />
          </label>

          <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200">
            <div className="overflow-x-auto">
              <table className="min-w-[820px] w-full text-sm">
                <thead className="bg-gray-50 text-xs uppercase tracking-[0.18em] text-gray-500">
                  <tr>
                    <th className="px-4 py-3 text-left">Operacion</th>
                    <th className="px-4 py-3 text-left">Interno</th>
                    <th className="px-4 py-3 text-left">Cliente</th>
                    <th className="px-4 py-3 text-left">Modelo</th>
                    <th className="px-4 py-3 text-left">Version</th>
                    <th className="px-4 py-3 text-left">Chasis</th>
                    <th className="px-4 py-3 text-left">Sucursal</th>
                    <th className="px-4 py-3 text-left">Vendedor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {infoOperacion ? (
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-semibold text-gray-900">
                        {infoOperacion.operacion}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {infoOperacion.interno}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {infoOperacion.cliente}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {infoOperacion.modelo}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {infoOperacion.version}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {infoOperacion.chasis}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {infoOperacion.sucursal}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {infoOperacion.vendedor}
                      </td>
                    </tr>
                  ) : (
                    <tr>
                      <td colSpan={8} className="px-6 py-10 text-center text-sm text-gray-500">
                        Busca una operacion para completar automaticamente la ficha.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 border-t border-gray-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-gray-500">
              El registro guarda la fecha elegida y el usuario autenticado que realiza la carga.
            </div>

            <div className="flex flex-wrap gap-3">
              {editingId ? (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Cancelar edicion
                </button>
              ) : null}

              <button
                type="button"
                onClick={handleSave}
                disabled={saveMutation.isPending}
                className="inline-flex items-center gap-2 rounded-xl bg-gray-950 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
              >
                {editingId ? (
                  <Save size={16} strokeWidth={2} />
                ) : (
                  <ArrowRightLeft size={16} strokeWidth={2} />
                )}
                {editingId ? "Guardar cambios" : "Guardar registro"}
              </button>
            </div>
          </div>
        </article>
      </section>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-gray-200 px-6 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-gray-900">
              Historial de registros
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Cada fila se puede editar o eliminar. La paginacion se activa de a 30 registros.
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
            {pagination?.total ?? 0} registros
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[1460px] w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-[0.18em] text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">Fecha</th>
                <th className="px-4 py-3 text-left">Tipo</th>
                <th className="px-4 py-3 text-left">Operacion</th>
                <th className="px-4 py-3 text-left">Interno</th>
                <th className="min-w-[280px] px-4 py-3 text-left">Cliente</th>
                <th className="px-4 py-3 text-left">Modelo</th>
                <th className="min-w-[260px] px-4 py-3 text-left">Version</th>
                <th className="px-4 py-3 text-left">Chasis</th>
                <th className="px-4 py-3 text-left">Sucursal</th>
                <th className="px-4 py-3 text-left">Vendedor</th>
                <th className="px-4 py-3 text-left">Observaciones</th>
                <th className="px-4 py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {registros.map((registro) => (
                <tr key={registro._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-semibold text-gray-900">
                    {formatDate(registro.fecha)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={[
                        "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
                        registro.tipo === "Asignado"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-rose-100 text-rose-700",
                      ].join(" ")}
                    >
                      {registro.tipo}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{registro.operacion}</td>
                  <td className="px-4 py-3 text-gray-700">{registro.interno}</td>
                  <td className="min-w-[280px] px-4 py-3 text-gray-700">{registro.cliente}</td>
                  <td className="px-4 py-3 text-gray-700">{registro.modelo}</td>
                  <td className="min-w-[260px] px-4 py-3 text-gray-700">{registro.version}</td>
                  <td className="px-4 py-3 text-gray-700">{registro.chasis}</td>
                  <td className="px-4 py-3 text-gray-700">{registro.sucursal}</td>
                  <td className="px-4 py-3 text-gray-700">{registro.vendedor}</td>
                  <td className="px-4 py-3 text-gray-700">
                    {registro.observaciones?.trim() || "-"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(registro)}
                        className="inline-flex items-center gap-2 rounded-lg bg-gray-950 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-gray-800"
                      >
                        <Pencil size={14} strokeWidth={1.8} />
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(registro)}
                        disabled={deleteMutation.isPending}
                        className="inline-flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Trash2 size={14} strokeWidth={1.8} />
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {!registros.length ? (
                <tr>
                  <td colSpan={12} className="px-6 py-12 text-center text-sm text-gray-500">
                    Todavia no hay registros de asignaciones cargados.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-gray-200 px-6 py-4 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-gray-500">
            Pagina {pagination?.page ?? 1} de {totalPages}
          </p>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(current - 1, 1))}
              disabled={page <= 1}
              className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Anterior
            </button>

            <button
              type="button"
              onClick={() =>
                setPage((current) => Math.min(current + 1, totalPages))
              }
              disabled={page >= totalPages}
              className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
