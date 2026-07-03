import {
  createAnalisisStockVersionDictionary,
  deleteAnalisisStockVersionDictionary,
  getAnalisisStockVersionDictionary,
  getAnalisisStockVersionesDisponibles,
  updateAnalisisStockVersionDictionary,
} from "@/api/dms/analisisStockAPI";
import Loading from "@/components/Loading";
import { paths } from "@/routes/paths";
import type { AnalisisStockDictionaryItem, AnalisisStockVersionesDisponiblesItem } from "@/types/index";
import { Dialog, Transition } from "@headlessui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, GitMerge, Pencil, Plus, Trash2, X } from "lucide-react";
import { Fragment, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const normalizeVersionKey = (value: string) => value.trim().toUpperCase();

function DictionaryModal({
  open,
  onClose,
  item,
  options,
}: {
  open: boolean;
  onClose: () => void;
  item: AnalisisStockDictionaryItem | null;
  options: AnalisisStockVersionesDisponiblesItem[];
}) {
  const queryClient = useQueryClient();
  const isEditing = Boolean(item);
  const [modelo, setModelo] = useState("");
  const [versionRaw, setVersionRaw] = useState("");
  const [versionCanonica, setVersionCanonica] = useState("");
  const selectedModelOption = options.find((option) => option.modelo === modelo) ?? null;
  const availableVersions = selectedModelOption?.versions ?? [];

  useEffect(() => {
    if (!open) return;

    setModelo(item?.modelo ?? "");
    setVersionRaw(item?.versionRaw ?? "");
    setVersionCanonica(item?.versionCanonica ?? "");
  }, [item, open]);

  useEffect(() => {
    if (!selectedModelOption) {
      setVersionRaw("");
      return;
    }

    if (versionRaw && availableVersions.includes(versionRaw)) {
      return;
    }

    if (!item?._id) {
      setVersionRaw(availableVersions[0] ?? "");
    }
  }, [availableVersions, item?._id, selectedModelOption, versionRaw]);

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        modelo: modelo.trim(),
        versionRaw: versionRaw.trim(),
        versionCanonica: versionCanonica.trim(),
      };

      if (!payload.modelo) throw new Error("El modelo es obligatorio");
      if (!payload.versionRaw) throw new Error("La version cruda es obligatoria");
      if (!payload.versionCanonica) throw new Error("La version unificada es obligatoria");

      if (item?._id) {
        return updateAnalisisStockVersionDictionary(item._id, payload);
      }

      return createAnalisisStockVersionDictionary(payload);
    },
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries({ queryKey: ["analisis-stock", "dictionary"] });
      queryClient.invalidateQueries({ queryKey: ["analisis-stock"] });
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
              <Dialog.Panel className="w-full max-w-2xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Analisis de stock</p>
                    <Dialog.Title className="mt-1 text-xl font-semibold tracking-tight text-gray-900">
                      {isEditing ? "Editar version unificada" : "Nueva version unificada"}
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

                <div className="grid gap-4 p-5">
                  <label className="block space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Modelo</span>
                    <select
                      value={modelo}
                      onChange={(event) => setModelo(event.target.value)}
                      className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-[#15aa9a]"
                    >
                      <option value="">Seleccionar modelo</option>
                      {options.map((option) => (
                        <option key={option.modelo} value={option.modelo}>
                          {option.modelo}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Version cruda</span>
                    <select
                      value={versionRaw}
                      onChange={(event) => setVersionRaw(event.target.value)}
                      disabled={!selectedModelOption}
                      className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-[#15aa9a]"
                    >
                      <option value="">{selectedModelOption ? "Seleccionar version" : "Seleccionar modelo primero"}</option>
                      {availableVersions.map((optionVersion) => (
                        <option key={optionVersion} value={optionVersion}>
                          {optionVersion}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Version unificada</span>
                    <input
                      type="text"
                      list={selectedModelOption ? `canonicas-${selectedModelOption.modelo}` : undefined}
                      value={versionCanonica}
                      onChange={(event) => setVersionCanonica(event.target.value)}
                      className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-[#15aa9a]"
                    />
                    {selectedModelOption ? (
                      <datalist id={`canonicas-${selectedModelOption.modelo}`}>
                        {availableVersions.map((optionVersion) => (
                          <option key={optionVersion} value={optionVersion} />
                        ))}
                      </datalist>
                    ) : null}
                  </label>
                </div>

                <div className="flex flex-col gap-3 border-t border-gray-200 bg-gray-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm text-gray-500">La unificacion impacta en stock, PED y promedio de venta.</div>

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

export default function AnalisisStockVersionesView() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AnalisisStockDictionaryItem | null>(null);
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["analisis-stock", "dictionary"],
    queryFn: getAnalisisStockVersionDictionary,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAnalisisStockVersionDictionary,
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries({ queryKey: ["analisis-stock", "dictionary"] });
      queryClient.invalidateQueries({ queryKey: ["analisis-stock"] });
    },
    onError: (mutationError: Error) => toast.error(mutationError.message),
  });

  const versionesDisponiblesQuery = useQuery({
    queryKey: ["analisis-stock", "versions-available"],
    queryFn: getAnalisisStockVersionesDisponibles,
  });

  const items = data?.data ?? [];
  const totalModelos = useMemo(() => new Set(items.map((item) => item.modeloKey)).size, [items]);
  const versionOptions = useMemo(() => {
    const dictionaryByModel = items.reduce<Map<string, Set<string>>>((acc, item) => {
      const current = acc.get(item.modelo) ?? new Set<string>();
      current.add(item.versionRawKey);
      acc.set(item.modelo, current);
      return acc;
    }, new Map());

    return (versionesDisponiblesQuery.data?.data ?? [])
      .map((option) => {
        const usedVersionKeys = dictionaryByModel.get(option.modelo) ?? new Set<string>();
        const versions = option.versions.filter((version) => {
          const versionKey = normalizeVersionKey(version);

          if (editingItem?.modelo === option.modelo && editingItem.versionRawKey === versionKey) {
            return true;
          }

          return !usedVersionKeys.has(versionKey);
        });

        return {
          ...option,
          versions,
        };
      })
      .filter((option) => {
        if (editingItem?.modelo === option.modelo) {
          return true;
        }

        return option.versions.length > 0;
      });
  }, [editingItem, items, versionesDisponiblesQuery.data?.data]);

  if (isLoading || versionesDisponiblesQuery.isLoading) return <Loading />;

  if (isError || versionesDisponiblesQuery.isError) {
    return (
      <div className="w-full px-4 py-6">
        <section className="rounded-2xl border border-red-200 bg-white p-5 shadow-sm">
          <h1 className="text-lg font-semibold text-gray-900">Error al cargar el diccionario</h1>
          <p className="mt-2 text-sm text-red-600">
            {(error as Error | undefined)?.message ?? versionesDisponiblesQuery.error?.message}
          </p>
        </section>
      </div>
    );
  }

  const handleCreate = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item: AnalisisStockDictionaryItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setEditingItem(null);
    setIsModalOpen(false);
  };

  return (
    <div className="w-full space-y-4 px-4 py-5">
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <Link
              to={paths.convencional.analisisStock}
              className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-gray-900"
            >
              <ArrowLeft size={16} />
              Volver a Analisis de stock
            </Link>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Analisis de stock</p>
              <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Diccionario de versiones</h1>
              <p className="mt-1 text-sm text-gray-500">
                Unifica variantes crudas de SIAC por modelo para consolidar stock, PED y promedio de venta.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-[#15aa9a] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#128d80]"
          >
            <Plus size={16} />
            Nueva unificacion
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Registros</p>
          <p className="mt-1.5 text-2xl font-semibold tracking-tight text-gray-900">{items.length}</p>
        </article>

        <article className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Modelos</p>
          <p className="mt-1.5 text-2xl font-semibold tracking-tight text-gray-900">{totalModelos}</p>
        </article>

        <article className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Versiones unificadas</p>
          <p className="mt-1.5 text-2xl font-semibold tracking-tight text-gray-900">
            {new Set(items.map((item) => `${item.modeloKey}::${item.versionCanonicaKey}`)).size}
          </p>
        </article>
      </section>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-5 py-3">
          <h2 className="text-base font-semibold tracking-tight text-gray-900">Equivalencias cargadas</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-[0.18em] text-gray-500">
              <tr>
                <th className="px-4 py-2.5 text-left">Modelo</th>
                <th className="px-4 py-2.5 text-left">Version cruda</th>
                <th className="px-4 py-2.5 text-left">Version unificada</th>
                <th className="px-4 py-2.5 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item) => (
                <tr key={item._id} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-medium text-gray-900">{item.modelo}</td>
                  <td className="px-4 py-2.5 text-gray-700">{item.versionRaw}</td>
                  <td className="px-4 py-2.5">
                    <div className="inline-flex items-center gap-2 rounded-full bg-[#e4f3fa] px-3 py-1 text-xs font-semibold text-[#0f766e]">
                      <GitMerge size={14} />
                      {item.versionCanonica}
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(item)}
                        className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                      >
                        <Pencil size={14} />
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteMutation.mutate(item._id)}
                        disabled={deleteMutation.isPending}
                        className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Trash2 size={14} />
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {!items.length ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-sm text-gray-500">
                    No hay equivalencias cargadas todavia.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <DictionaryModal open={isModalOpen} onClose={handleClose} item={editingItem} options={versionOptions} />
    </div>
  );
}
