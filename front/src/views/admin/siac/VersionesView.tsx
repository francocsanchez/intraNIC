import Loading from "@/components/Loading";
import { deleteVersion, getVersiones } from "@/api/dms/preventasAPI";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bookmark, Pencil, Plus, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

export default function VersionesView() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["versiones"],
    queryFn: () => getVersiones(),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteVersion,
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries({ queryKey: ["versiones"] });
    },
    onError: (mutationError: Error) => toast.error(mutationError.message),
  });

  if (isLoading) return <Loading />;

  if (isError) {
    return (
      <div className="w-full px-4 py-6">
        <section className="rounded-3xl border border-red-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold text-gray-900">Error al cargar versiones</h1>
          <p className="mt-2 text-sm text-red-600">{error.message}</p>
        </section>
      </div>
    );
  }

  const versiones = data?.data ?? [];

  return (
    <div className="w-full space-y-6 px-4 py-6">
      <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Catalogo</p>
            <h1 className="text-3xl font-semibold tracking-tight text-gray-900">Versiones</h1>
          </div>
          <Link to="/preventas/versiones/nuevo" className="inline-flex items-center gap-2 rounded-2xl bg-[#15aa9a] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#128d80]">
            <Plus size={16} />
            Nueva version
          </Link>
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-[0.18em] text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">Nombre</th>
                <th className="px-4 py-3 text-center">Estado</th>
                <th className="px-4 py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {versiones.map((version) => (
                <tr key={version._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    <div className="flex items-center gap-3">
                      <Bookmark size={16} className="text-[#15aa9a]" />
                      {version.nombre}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={["inline-flex rounded-full px-3 py-1 text-xs font-semibold", version.activo ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"].join(" ")}>
                      {version.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center gap-2">
                      <Link to={`/preventas/versiones/${version._id}/editar`} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50">
                        <Pencil size={14} />
                        Editar
                      </Link>
                      <button
                        type="button"
                        onClick={() => deleteMutation.mutate(version._id)}
                        className="inline-flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
                      >
                        <Trash2 size={14} />
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!versiones.length ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-sm text-gray-500">
                    No hay versiones cargadas.
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
