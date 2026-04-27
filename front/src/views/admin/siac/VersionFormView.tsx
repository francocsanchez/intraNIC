import Loading from "@/components/Loading";
import { createVersion, getVersiones, updateVersion } from "@/api/dms/preventasAPI";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

export default function VersionFormView() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [nombre, setNombre] = useState("");
  const [activo, setActivo] = useState(true);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["versiones"],
    queryFn: () => getVersiones(),
  });

  useEffect(() => {
    if (!isEditing) return;
    const item = data?.data.find((version) => version._id === id);
    if (!item) return;
    setNombre(item.nombre);
    setActivo(item.activo);
  }, [data, id, isEditing]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!nombre.trim()) throw new Error("El nombre es obligatorio");
      if (isEditing && id) {
        return updateVersion(id, { nombre: nombre.trim(), activo });
      }
      return createVersion({ nombre: nombre.trim(), activo });
    },
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries({ queryKey: ["versiones"] });
      navigate("/preventas/versiones");
    },
    onError: (mutationError: Error) => toast.error(mutationError.message),
  });

  if (isLoading) return <Loading />;

  if (isError) {
    return (
      <div className="w-full px-4 py-6">
        <section className="rounded-3xl border border-red-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold text-gray-900">Error al cargar version</h1>
          <p className="mt-2 text-sm text-red-600">{error.message}</p>
        </section>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 px-4 py-6">
      <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-gray-900">{isEditing ? "Editar version" : "Nueva version"}</h1>
          </div>
          <Link to="/preventas/versiones" className="inline-flex items-center gap-2 text-sm font-semibold text-[#15aa9a] hover:text-[#128d80]">
            <ArrowLeft size={16} />
            Volver
          </Link>
        </div>
      </section>

      <section className="max-w-2xl rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="space-y-5">
          <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
            Nombre
            <input
              type="text"
              value={nombre}
              onChange={(event) => setNombre(event.target.value)}
              className="rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:border-[#15aa9a]"
            />
          </label>

          <label className="inline-flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700">
            <input
              type="checkbox"
              checked={activo}
              onChange={(event) => setActivo(event.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-[#15aa9a] focus:ring-[#15aa9a]"
            />
            Version activa
          </label>

          <button
            type="button"
            onClick={() => mutation.mutate()}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#15aa9a] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#128d80]"
          >
            <Save size={16} />
            Guardar
          </button>
        </div>
      </section>
    </div>
  );
}
