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
      <Dialog as="div" className="relative z-50" onClose={() => (mutation.isPending ? undefined : onClose())}>
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
              <Dialog.Panel className="w-full max-w-xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Catalogo</p>
                    <Dialog.Title className="mt-1 text-xl font-semibold tracking-tight text-gray-900">
                      {isEditing ? "Editar version" : "Nueva version"}
                    </Dialog.Title>
                  </div>

                  <button
                    type="button"
                    onClick={onClose}
                    disabled={mutation.isPending}
                    className="rounded-lg border border-gray-200 p-2 text-gray-500 transition hover:bg-gray-50 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="space-y-4 p-5">
                  <label className="block space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Nombre</span>
                    <input
                      type="text"
                      value={nombre}
                      onChange={(event) => setNombre(event.target.value)}
                      className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-[#15aa9a]"
                    />
                  </label>

                  <label className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-800">
                    <span>Version activa</span>
                    <input
                      type="checkbox"
                      checked={activo}
                      onChange={(event) => setActivo(event.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-[#15aa9a] focus:ring-[#15aa9a]"
                    />
                  </label>
                </div>

                <div className="flex flex-col gap-3 border-t border-gray-200 bg-gray-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm text-gray-500">Guarda los cambios para actualizar el catalogo.</div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={mutation.isPending}
                      className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => mutation.mutate()}
                      disabled={mutation.isPending}
                      className="inline-flex items-center justify-center rounded-lg bg-[#15aa9a] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#128d80] disabled:cursor-not-allowed disabled:opacity-60"
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
      <div className="w-full px-4 py-6">
        <section className="rounded-2xl border border-red-200 bg-white p-5 shadow-sm">
          <h1 className="text-lg font-semibold text-gray-900">Error al cargar versiones</h1>
          <p className="mt-2 text-sm text-red-600">{error.message}</p>
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
    <div className="w-full space-y-4 px-4 py-5">
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Catalogo</p>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Versiones</h1>
          </div>
          <button
            type="button"
            onClick={handleCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-[#15aa9a] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#128d80]"
          >
            <Plus size={16} />
            Nueva version
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Total versiones</p>
          <p className="mt-1.5 text-2xl font-semibold tracking-tight text-gray-900">{versiones.length}</p>
        </article>

        <article className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Activas</p>
          <p className="mt-1.5 text-2xl font-semibold tracking-tight text-gray-900">{versionesActivas.length}</p>
        </article>

        <article className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Inactivas</p>
          <p className="mt-1.5 text-2xl font-semibold tracking-tight text-gray-900">{versionesInactivas.length}</p>
        </article>
      </section>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-gray-200 px-5 py-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-gray-900">Lista de versiones</h2>
            <p className="mt-0.5 text-sm text-gray-500">
              {visibleSection === "activas"
                ? "Vista principal con las versiones activas."
                : "Listado separado de versiones inactivas."}
            </p>
          </div>

          <div className="inline-flex w-full rounded-lg bg-gray-100 p-1 md:w-auto">
            <button
              type="button"
              onClick={() => setVisibleSection("activas")}
              className={[
                "flex-1 rounded-md px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-colors md:flex-none",
                visibleSection === "activas" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900",
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
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900",
              ].join(" ")}
            >
              Inactivas ({versionesInactivas.length})
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-[0.18em] text-gray-500">
              <tr>
                <th className="px-4 py-2.5 text-left">Nombre</th>
                <th className="px-4 py-2.5 text-center">Estado</th>
                <th className="px-4 py-2.5 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {versionesVisibles.map((version) => (
                <tr key={version._id} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-medium text-gray-900">
                    <div className="flex items-center gap-3">
                      <Bookmark size={16} className="text-[#15aa9a]" />
                      {version.nombre}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <span className={["inline-flex rounded-full px-3 py-1 text-xs font-semibold", version.activo ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"].join(" ")}>
                      {version.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
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
                          "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60",
                          version.activo
                            ? "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                            : "border border-green-200 bg-green-50 text-green-700 hover:bg-green-100",
                        ].join(" ")}
                      >
                        <Power size={14} />
                        {version.activo ? "Desactivar" : "Activar"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEdit(version)}
                        className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
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
                  <td colSpan={3} className="px-6 py-10 text-center text-sm text-gray-500">
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
