import Loading from "@/components/Loading";
import { createVersion, getVersiones, updateVersion } from "@/api/dms/preventasAPI";
import type { Catalogo } from "@/types/index";
import { Dialog, Transition } from "@headlessui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bookmark, Pencil, Plus, Power, X } from "lucide-react";
import { Fragment, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

function VersionModal({
  open,
  onClose,
  version,
}: {
  open: boolean;
  onClose: () => void;
  version: Catalogo | null;
}) {
  const queryClient = useQueryClient();
  const isEditing = Boolean(version);
  const [nombre, setNombre] = useState("");
  const [activo, setActivo] = useState(true);

  useEffect(() => {
    if (!open) {
      return;
    }

    setNombre(version?.nombre ?? "");
    setActivo(version?.activo ?? true);
  }, [open, version]);

  const mutation = useMutation({
    mutationFn: async () => {
      const normalizedName = nombre.trim();

      if (!normalizedName) {
        throw new Error("El nombre es obligatorio");
      }

      if (version?._id) {
        return updateVersion(version._id, { nombre: normalizedName, activo });
      }

      return createVersion({ nombre: normalizedName, activo });
    },
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries({ queryKey: ["versiones"] });
      onClose();
    },
    onError: (mutationError: Error) => toast.error(mutationError.message),
  });

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="font-preset relative z-50" onClose={() => (mutation.isPending ? undefined : onClose())}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-xl overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-xl">
                <div className="flex items-center justify-between border-b border-border px-3 py-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Catalogo</p>
                    <Dialog.Title className="mt-1 text-xl font-semibold tracking-tight text-foreground">
                      {isEditing ? "Editar version" : "Nueva version"}
                    </Dialog.Title>
                  </div>

                  <button
                    type="button"
                    onClick={onClose}
                    disabled={mutation.isPending}
                    className="rounded-md border border-border p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="space-y-3 p-3">
                  <label className="block space-y-1.5">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Nombre</span>
                    <input
                      type="text"
                      value={nombre}
                      onChange={(event) => setNombre(event.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:ring-2 focus:ring-ring"
                    />
                  </label>

                  <label className="flex items-center justify-between gap-3 rounded-md border border-border bg-muted px-3 py-2 text-sm font-medium text-foreground">
                    <span>Version activa</span>
                    <input
                      type="checkbox"
                      checked={activo}
                      onChange={(event) => setActivo(event.target.checked)}
                      className="h-4 w-4 rounded border-input text-primary focus:ring-ring"
                    />
                  </label>
                </div>

                <div className="flex flex-col gap-3 border-t border-border bg-muted px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm text-muted-foreground">Guarda los cambios para actualizar el catalogo.</div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={mutation.isPending}
                      className="inline-flex items-center justify-center rounded-md border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => mutation.mutate()}
                      disabled={mutation.isPending}
                      className="inline-flex items-center justify-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {mutation.isPending ? "Guardando..." : isEditing ? "Guardar cambios" : "Crear version"}
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

export default function VersionesView() {
  const queryClient = useQueryClient();
  const [visibleSection, setVisibleSection] = useState<"activas" | "inactivas">("activas");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVersion, setEditingVersion] = useState<Catalogo | null>(null);
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["versiones"],
    queryFn: () => getVersiones(),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, nombre, activo }: { id: string; nombre: string; activo: boolean }) =>
      updateVersion(id, { nombre, activo }),
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries({ queryKey: ["versiones"] });
    },
    onError: (mutationError: Error) => toast.error(mutationError.message),
  });

  const versiones = data?.data ?? [];
  const versionesActivas = useMemo(() => versiones.filter((version) => version.activo), [versiones]);
  const versionesInactivas = useMemo(() => versiones.filter((version) => !version.activo), [versiones]);
  const versionesVisibles = visibleSection === "activas" ? versionesActivas : versionesInactivas;

  if (isLoading) return <Loading />;

  if (isError) {
    return (
      <div className="font-preset w-full px-2 py-3">
        <section className="rounded-lg border border-destructive/30 bg-card p-3">
          <h1 className="text-lg font-semibold text-foreground">Error al cargar versiones</h1>
          <p className="mt-2 text-sm text-destructive">{error.message}</p>
        </section>
      </div>
    );
  }

  const handleCreate = () => {
    setEditingVersion(null);
    setIsModalOpen(true);
  };

  const handleEdit = (version: Catalogo) => {
    setEditingVersion(version);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingVersion(null);
    setIsModalOpen(false);
  };

  return (
    <div className="font-preset w-full space-y-3 px-2 py-3">
      <section className="rounded-lg border border-border bg-card px-3 py-3 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Catalogo</p>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Versiones</h1>
          </div>
          <button
            type="button"
            onClick={handleCreate}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          >
            <Plus size={16} />
            Nueva version
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 border-y border-border bg-card md:grid-cols-3">
        <article className="border-b border-border px-3 py-3 md:border-r md:border-b-0">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Total versiones</p>
          <p className="mt-1.5 text-2xl font-semibold tracking-tight text-foreground">{versiones.length}</p>
        </article>

        <article className="border-b border-border px-3 py-3 md:border-r md:border-b-0">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Activas</p>
          <p className="mt-1.5 text-2xl font-semibold tracking-tight text-foreground">{versionesActivas.length}</p>
        </article>

        <article className="px-3 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Inactivas</p>
          <p className="mt-1.5 text-2xl font-semibold tracking-tight text-foreground">{versionesInactivas.length}</p>
        </article>
      </section>

      <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-3 border-b border-border px-3 py-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-foreground">Lista de versiones</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {visibleSection === "activas"
                ? "Vista principal con las versiones activas."
                : "Listado separado de versiones inactivas."}
            </p>
          </div>

          <div className="inline-flex w-full rounded-md bg-muted p-1 md:w-auto">
            <button
              type="button"
              onClick={() => setVisibleSection("activas")}
              className={[
                "flex-1 rounded-md px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-colors md:flex-none",
                visibleSection === "activas" ? "bg-card text-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              ].join(" ")}
            >
              Activas ({versionesActivas.length})
            </button>

            <button
              type="button"
              onClick={() => setVisibleSection("inactivas")}
              className={[
                "flex-1 rounded-md px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-colors md:flex-none",
                visibleSection === "inactivas"
                  ? "bg-card text-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              ].join(" ")}
            >
              Inactivas ({versionesInactivas.length})
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-muted text-xs uppercase tracking-[0.18em] text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">Nombre</th>
                <th className="px-3 py-2 text-center">Estado</th>
                <th className="px-3 py-2 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {versionesVisibles.map((version) => (
                <tr key={version._id} className="hover:bg-muted">
                  <td className="px-3 py-1.5 font-medium text-foreground">
                    <div className="flex items-center gap-3">
                      <Bookmark size={16} className="text-muted-foreground" />
                      {version.nombre}
                    </div>
                  </td>
                  <td className="px-3 py-1.5 text-center">
                    <span className={["inline-flex rounded-full px-3 py-1 text-xs font-semibold", version.activo ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"].join(" ")}>
                      {version.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-3 py-1.5">
                    <div className="flex justify-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          statusMutation.mutate({
                            id: version._id,
                            nombre: version.nombre,
                            activo: !version.activo,
                          })
                        }
                        disabled={statusMutation.isPending}
                        className={[
                          "inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60",
                        ].join(" ")}
                      >
                        <Power size={14} />
                        {version.activo ? "Desactivar" : "Activar"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEdit(version)}
                        className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:bg-secondary"
                      >
                        <Pencil size={14} />
                        Editar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!versionesVisibles.length ? (
                <tr>
                  <td colSpan={3} className="px-3 py-8 text-center text-sm text-muted-foreground">
                    {visibleSection === "activas"
                      ? "No hay versiones activas cargadas."
                      : "No hay versiones inactivas cargadas."}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <VersionModal open={isModalOpen} onClose={handleCloseModal} version={editingVersion} />
    </div>
  );
}
