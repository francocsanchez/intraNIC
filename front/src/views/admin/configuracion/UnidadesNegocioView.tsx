import {
  createUnidadNegocio,
  deleteUnidadNegocio,
  getUnidadesNegocio,
  updateUnidadNegocio,
} from "@/api/unidadNegocioAPI";
import { paths } from "@/routes/paths";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

type DraftUnidad = {
  key: string;
  _id?: string;
  nombre: string;
  activo: boolean;
  orden: number;
};

export default function UnidadesNegocioView() {
  const queryClient = useQueryClient();
  const [drafts, setDrafts] = useState<DraftUnidad[]>([]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["unidades-negocio", "admin"],
    queryFn: () => getUnidadesNegocio(true),
  });

  const unidades = data?.data ?? [];

  useEffect(() => {
    setDrafts(
      unidades.map((unidad, index) => ({
        key: unidad._id,
        _id: unidad._id,
        nombre: unidad.nombre,
        activo: unidad.activo,
        orden: unidad.orden ?? index,
      })),
    );
  }, [unidades]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["unidades-negocio"] });
    queryClient.invalidateQueries({ queryKey: ["comercial-agenda", "unidades-negocio"] });
  };

  const createMutation = useMutation({
    mutationFn: createUnidadNegocio,
    onSuccess: (response) => {
      toast.success(response.message || "Unidad de negocio creada");
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { nombre: string; activo: boolean; orden: number } }) =>
      updateUnidadNegocio(id, payload),
    onSuccess: (response) => {
      toast.success(response.message || "Unidad de negocio actualizada");
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUnidadNegocio,
    onSuccess: (response) => {
      toast.success(response.message || "Unidad de negocio desactivada");
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const sortedDrafts = drafts
    .slice()
    .sort((a, b) => a.orden - b.orden || a.nombre.localeCompare(b.nombre));

  const updateDraft = (key: string, updater: (draft: DraftUnidad) => DraftUnidad) => {
    setDrafts((current) => current.map((item) => (item.key === key ? updater(item) : item)));
  };

  const moveDraft = (index: number, direction: -1 | 1) => {
    setDrafts((current) => {
      const ordered = current
        .slice()
        .sort((a, b) => a.orden - b.orden || a.nombre.localeCompare(b.nombre));
      const targetIndex = index + direction;

      if (targetIndex < 0 || targetIndex >= ordered.length) {
        return current;
      }

      const next = [...ordered];
      const [moved] = next.splice(index, 1);
      next.splice(targetIndex, 0, moved);

      return next.map((item, position) => ({
        ...item,
        orden: position,
      }));
    });
  };

  const handleAdd = () => {
    const nextOrden = sortedDrafts.length;
    const newDraft: DraftUnidad = {
      key: `new-${Date.now()}`,
      nombre: "",
      activo: true,
      orden: nextOrden,
    };

    setDrafts((current) => [...current, newDraft]);
  };

  const handleSave = (draft: DraftUnidad) => {
    const payload = {
      nombre: draft.nombre.trim(),
      activo: draft.activo,
      orden: draft.orden,
    };

    if (!payload.nombre) {
      toast.error("El nombre es obligatorio");
      return;
    }

    if (draft._id) {
      updateMutation.mutate({ id: draft._id, payload });
      return;
    }

    createMutation.mutate(payload, {
      onSuccess: (response) => {
        toast.success(response.message || "Unidad de negocio creada");
        invalidate();
      },
    });
  };

  const handleDelete = (draft: DraftUnidad) => {
    if (!draft._id) {
      setDrafts((current) => current.filter((item) => item.key !== draft.key));
      return;
    }

    deleteMutation.mutate(draft._id);
  };

  if (isLoading) {
    return <div className="w-full px-4 py-6">Cargando unidades de negocio...</div>;
  }

  if (isError) {
    return <div className="w-full px-4 py-6 text-red-600">Error al cargar unidades de negocio.</div>;
  }

  return (
    <div className="w-full space-y-6 px-4 py-6">
      <section className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Administracion</p>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Unidades de negocio</h1>
          <p className="mt-1 text-sm text-gray-500">
            Administra las unidades que segmentan usuarios, puestos y agenda comercial.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleAdd}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-900 transition hover:bg-gray-50"
          >
            <Plus size={14} />
            Agregar unidad
          </button>

          <Link
            to={paths.admin.configuracion}
            className="inline-flex items-center justify-center rounded-lg bg-black px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition-colors hover:bg-gray-900"
          >
            Volver
          </Link>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="space-y-4 p-6">
          {sortedDrafts.length ? (
            sortedDrafts.map((draft, index) => (
              <article
                key={draft.key}
                className="grid grid-cols-1 gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-4 lg:grid-cols-[minmax(0,1fr)_140px_140px_auto]"
              >
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
                    Nombre
                  </label>
                  <input
                    type="text"
                    value={draft.nombre}
                    onChange={(event) =>
                      updateDraft(draft.key, (current) => ({ ...current, nombre: event.target.value }))
                    }
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-gray-500"
                    placeholder="Ej: Plan NQN"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
                    Orden
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => moveDraft(index, -1)}
                      disabled={index === 0}
                      className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                    >
                      Subir
                    </button>
                    <button
                      type="button"
                      onClick={() => moveDraft(index, 1)}
                      disabled={index === sortedDrafts.length - 1}
                      className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                    >
                      Bajar
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
                    Estado
                  </label>
                  <label className="inline-flex h-[42px] items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700">
                    <input
                      type="checkbox"
                      checked={draft.activo}
                      onChange={(event) =>
                        updateDraft(draft.key, (current) => ({ ...current, activo: event.target.checked }))
                      }
                      className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black/20"
                    />
                    Activa
                  </label>
                </div>

                <div className="flex flex-wrap items-end gap-2">
                  <button
                    type="button"
                    onClick={() => handleSave(draft)}
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-900 disabled:opacity-60"
                  >
                    Guardar
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(draft)}
                    disabled={deleteMutation.isPending}
                    className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-60"
                  >
                    <Trash2 size={14} />
                    {draft._id ? "Desactivar" : "Quitar"}
                  </button>
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-sm text-gray-500">
              No hay unidades de negocio cargadas todavia.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
