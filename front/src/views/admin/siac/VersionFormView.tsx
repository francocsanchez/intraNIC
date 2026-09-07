import Loading from "@/components/Loading";
import { createVersion, getVersiones, updateVersion } from "@/api/dms/preventasAPI";
import { paths } from "@/routes/paths";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Save } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

type VersionFormContentProps = {
  initialActivo: boolean;
  initialNombre: string;
  isEditing: boolean;
  versionId?: string;
};

function VersionFormContent({ initialActivo, initialNombre, isEditing, versionId }: VersionFormContentProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [nombre, setNombre] = useState(initialNombre);
  const [activo, setActivo] = useState(initialActivo);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!nombre.trim()) throw new Error("El nombre es obligatorio");
      if (isEditing && versionId) {
        return updateVersion(versionId, { nombre: nombre.trim(), activo });
      }
      return createVersion({ nombre: nombre.trim(), activo });
    },
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries({ queryKey: ["versiones"] });
      navigate(paths.admin.versiones);
    },
    onError: (mutationError: Error) => toast.error(mutationError.message),
  });

  return (
    <div className="w-full space-y-6 px-4 py-6">
      <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">{isEditing ? "Editar version" : "Nueva version"}</h1>
          </div>
          <Link to={paths.admin.versiones} className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary">
            <ArrowLeft size={16} />
            Volver
          </Link>
        </div>
      </section>

      <section className="max-w-2xl rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="space-y-5">
          <label className="flex flex-col gap-2 text-sm font-medium text-muted-foreground">
            Nombre
            <input
              type="text"
              value={nombre}
              onChange={(event) => setNombre(event.target.value)}
              className="rounded-lg border border-input px-4 py-3 outline-none focus:border-ring"
            />
          </label>

          <label className="inline-flex items-center gap-3 rounded-lg border border-border bg-muted px-4 py-3 text-sm font-medium text-muted-foreground">
            <input
              type="checkbox"
              checked={activo}
              onChange={(event) => setActivo(event.target.checked)}
              className="h-4 w-4 rounded border-input text-primary focus:ring-ring"
            />
            Version activa
          </label>

          <button
            type="button"
            onClick={() => mutation.mutate()}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            <Save size={16} />
            Guardar
          </button>
        </div>
      </section>
    </div>
  );
}

export default function VersionFormView() {
  const { id } = useParams();
  const isEditing = Boolean(id);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["versiones"],
    queryFn: () => getVersiones(),
  });

  if (isLoading) return <Loading />;

  if (isError) {
    return (
      <div className="w-full px-4 py-6">
        <section className="rounded-lg border border-destructive/30 bg-card p-6 shadow-sm">
          <h1 className="text-lg font-semibold text-foreground">Error al cargar version</h1>
          <p className="mt-2 text-sm text-destructive">{error.message}</p>
        </section>
      </div>
    );
  }

  const item = isEditing ? data?.data.find((version) => version._id === id) : null;

  if (isEditing && !item) {
    return (
      <div className="w-full px-4 py-6">
        <section className="rounded-lg border border-destructive/30 bg-card p-6 shadow-sm">
          <h1 className="text-lg font-semibold text-foreground">Version no encontrada</h1>
          <p className="mt-2 text-sm text-destructive">No fue posible cargar la version solicitada.</p>
        </section>
      </div>
    );
  }

  return (
    <VersionFormContent
      initialActivo={item?.activo ?? true}
      initialNombre={item?.nombre ?? ""}
      isEditing={isEditing}
      versionId={id}
    />
  );
}
