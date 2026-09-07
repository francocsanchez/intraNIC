import Loading from "@/components/Loading";
import {
  createRegistroAsignacion,
  deleteRegistroAsignacion,
  getRegistroAsignacionInfoOperacion,
  getRegistrosAsignaciones,
  updateRegistroAsignacion,
} from "@/api/dms/registroAsignacionAPI";
import { paths } from "@/routes/paths";
import type {
  RegistroAsignacion,
  RegistroAsignacionInfoOperacion,
} from "@/types/index";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRightLeft,
  Filter,
  List,
  Pencil,
  Save,
  Search,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
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
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState<number>(1);
  const [fecha, setFecha] = useState<string>(getToday());
  const [operacionInput, setOperacionInput] = useState<string>("");
  const [tipo, setTipo] = useState<"Asignado" | "Desasignado" | "">("");
  const [observaciones, setObservaciones] = useState<string>("");
  const [infoOperacion, setInfoOperacion] =
    useState<RegistroAsignacionInfoOperacion | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const tipoFiltroRaw = searchParams.get("tipo");
  const tipoFiltro: "Asignado" | "Desasignado" | undefined =
    tipoFiltroRaw === "Asignado" || tipoFiltroRaw === "Desasignado"
      ? tipoFiltroRaw
      : undefined;
  const modeloFiltro = searchParams.get("modelo")?.trim() || undefined;
  const mesFiltroValue = Number(searchParams.get("mes"));
  const mesFiltro =
    Number.isInteger(mesFiltroValue) && mesFiltroValue >= 1 && mesFiltroValue <= 12
      ? mesFiltroValue
      : undefined;
  const anoFiltroValue = Number(searchParams.get("ano"));
  const anoFiltro =
    Number.isInteger(anoFiltroValue) && anoFiltroValue >= 2020
      ? anoFiltroValue
      : undefined;

  const filtrosActivos = useMemo(
    () => ({
      tipo: tipoFiltro,
      modelo: modeloFiltro,
      mes: mesFiltro,
      ano: anoFiltro,
    }),
    [anoFiltro, mesFiltro, modeloFiltro, tipoFiltro],
  );

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["registro-asignaciones", page, filtrosActivos],
    queryFn: () => getRegistrosAsignaciones(page, PAGE_SIZE, filtrosActivos),
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
        <section className="rounded-lg border border-destructive/30 bg-card p-6 shadow-sm">
          <h1 className="text-lg font-semibold tracking-tight text-foreground">
            Error al cargar registro de asignaciones
          </h1>
          <p className="mt-2 text-sm text-destructive">{error.message}</p>
        </section>
      </div>
    );
  }

  const totalPages = pagination?.totalPages ?? 1;
  const nombreMesFiltro =
    mesFiltro && anoFiltro
      ? new Date(anoFiltro, mesFiltro - 1, 1).toLocaleDateString("es-AR", {
          month: "long",
          year: "numeric",
        })
      : null;
  const hayFiltrosActivos = Boolean(tipoFiltro || modeloFiltro || nombreMesFiltro);

  return (
    <div className="w-full space-y-6 px-4 py-6">
      <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Registro asignaciones
            </h1>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
              Registra movimientos de asignacion y desasignacion con pocos campos
              y consulta el historial paginado.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
            to={paths.convencional.registroAsignacionesResumen}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-muted"
            >
              <List size={16} strokeWidth={1.75} />
              Ver resumen
            </Link>
          </div>
        </div>
      </section>

      <section>
        <article className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-base font-semibold tracking-tight text-foreground">
                {editingId ? "Editar registro" : "Nuevo registro"}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Busca la operacion para completar automaticamente los datos de la unidad.
              </p>
            </div>

            <div className="rounded-lg border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
              {editingId ? "Modo edicion" : "Carga rapida"}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-[220px_minmax(0,1fr)_220px]">
            <label className="flex flex-col gap-2 text-sm font-medium text-muted-foreground">
              Fecha
              <input
                type="date"
                value={fecha}
                onChange={(event) => setFecha(event.target.value)}
                className="rounded-lg border border-input px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-ring"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-muted-foreground">
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
                  className="w-full rounded-lg border border-input px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-ring"
                />

                <button
                  type="button"
                  onClick={handleBuscarOperacion}
                  disabled={searchMutation.isPending}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-muted"
                >
                  <Search size={16} strokeWidth={2} />
                  Buscar
                </button>
              </div>
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-muted-foreground">
              Tipo
              <select
                value={tipo}
                onChange={(event) =>
                  setTipo(event.target.value as "Asignado" | "Desasignado" | "")
                }
                className="rounded-lg border border-input bg-card px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-ring"
              >
                <option value="">Seleccionar</option>
                <option value="Asignado">Asignado</option>
                <option value="Desasignado">Desasignado</option>
              </select>
            </label>
          </div>

          <label className="mt-4 flex flex-col gap-2 text-sm font-medium text-muted-foreground">
            Observaciones
            <textarea
              rows={3}
              value={observaciones}
              onChange={(event) => setObservaciones(event.target.value)}
              placeholder="Detalle opcional"
              className="rounded-lg border border-input px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-ring"
            />
          </label>

          <div className="mt-6 overflow-hidden rounded-lg border border-border">
            <div className="overflow-x-auto">
              <table className="min-w-[820px] w-full text-sm">
                <thead className="bg-muted text-xs uppercase tracking-[0.18em] text-muted-foreground">
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
                <tbody className="divide-y divide-border bg-card">
                  {infoOperacion ? (
                    <tr className="hover:bg-muted">
                      <td className="px-4 py-3 font-semibold text-foreground">
                        {infoOperacion.operacion}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {infoOperacion.interno}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {infoOperacion.cliente}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {infoOperacion.modelo}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {infoOperacion.version}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {infoOperacion.chasis}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {infoOperacion.sucursal}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {infoOperacion.vendedor}
                      </td>
                    </tr>
                  ) : (
                    <tr>
                      <td colSpan={8} className="px-6 py-10 text-center text-sm text-muted-foreground">
                        Busca una operacion para completar automaticamente la ficha.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-muted-foreground">
              El registro guarda la fecha elegida y el usuario autenticado que realiza la carga.
            </div>

            <div className="flex flex-wrap gap-3">
              {editingId ? (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-lg border border-input bg-card px-4 py-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted"
                >
                  Cancelar edicion
                </button>
              ) : null}

              <button
                type="button"
                onClick={handleSave}
                disabled={saveMutation.isPending}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:bg-muted"
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

      <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-3 border-b border-border px-6 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-foreground">
              Historial de registros
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Cada fila se puede editar o eliminar. La paginacion se activa de a 30 registros.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {hayFiltrosActivos ? (
              <button
                type="button"
                onClick={() => {
                  setPage(1);
                  setSearchParams({});
                }}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted"
              >
                <Filter size={15} strokeWidth={1.75} />
                Limpiar filtros
              </button>
            ) : null}

            <div className="rounded-lg border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
              {pagination?.total ?? 0} registros
            </div>
          </div>
        </div>

        {hayFiltrosActivos ? (
          <div className="flex flex-wrap gap-2 border-b border-border px-6 py-4">
            {tipoFiltro ? (
              <span className="inline-flex rounded-full bg-secondary px-3 py-1 text-sm font-medium text-secondary-foreground">
                Tipo: {tipoFiltro}
              </span>
            ) : null}

            {modeloFiltro ? (
              <span className="inline-flex rounded-full bg-secondary px-3 py-1 text-sm font-medium text-primary">
                Modelo: {modeloFiltro}
              </span>
            ) : null}

            {nombreMesFiltro ? (
              <span className="inline-flex rounded-full bg-secondary px-3 py-1 text-sm font-medium capitalize text-secondary-foreground">
                Periodo: {nombreMesFiltro}
              </span>
            ) : null}
          </div>
        ) : null}

        <div className="overflow-x-auto">
          <table className="min-w-[1460px] w-full text-sm">
            <thead className="bg-muted text-xs uppercase tracking-[0.18em] text-muted-foreground">
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
            <tbody className="divide-y divide-border">
              {registros.map((registro) => (
                <tr key={registro._id} className="hover:bg-muted">
                  <td className="px-4 py-3 font-semibold text-foreground">
                    {formatDate(registro.fecha)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={[
                        "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
                        registro.tipo === "Asignado"
                          ? "bg-secondary text-secondary-foreground"
                          : "bg-secondary text-secondary-foreground",
                      ].join(" ")}
                    >
                      {registro.tipo}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{registro.operacion}</td>
                  <td className="px-4 py-3 text-muted-foreground">{registro.interno}</td>
                  <td className="min-w-[280px] px-4 py-3 text-muted-foreground">{registro.cliente}</td>
                  <td className="px-4 py-3 text-muted-foreground">{registro.modelo}</td>
                  <td className="min-w-[260px] px-4 py-3 text-muted-foreground">{registro.version}</td>
                  <td className="px-4 py-3 text-muted-foreground">{registro.chasis}</td>
                  <td className="px-4 py-3 text-muted-foreground">{registro.sucursal}</td>
                  <td className="px-4 py-3 text-muted-foreground">{registro.vendedor}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {registro.observaciones?.trim() || "-"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(registro)}
                        className="inline-flex h-6 items-center gap-1 rounded-md border border-border bg-background px-2 text-xs font-semibold text-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Pencil size={14} strokeWidth={1.8} />
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(registro)}
                        disabled={deleteMutation.isPending}
                        className="inline-flex h-6 items-center gap-1 rounded-md border border-destructive/30 bg-destructive/10 px-2 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/20 disabled:cursor-not-allowed disabled:opacity-50 disabled:cursor-not-allowed disabled:opacity-50"
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
                  <td colSpan={12} className="px-6 py-12 text-center text-sm text-muted-foreground">
                    {hayFiltrosActivos
                      ? "No hay registros para los filtros seleccionados."
                      : "Todavia no hay registros de asignaciones cargados."}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-border px-6 py-4 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-muted-foreground">
            Pagina {pagination?.page ?? 1} de {totalPages}
          </p>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(current - 1, 1))}
              disabled={page <= 1}
              className="rounded-lg border border-input bg-card px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              Anterior
            </button>

            <button
              type="button"
              onClick={() =>
                setPage((current) => Math.min(current + 1, totalPages))
              }
              disabled={page >= totalPages}
              className="rounded-lg border border-input bg-card px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
