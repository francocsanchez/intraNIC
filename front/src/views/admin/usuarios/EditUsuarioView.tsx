import { useQuery } from "@tanstack/react-query";
import { Navigate, useParams } from "react-router-dom";
import { getUsuarioById } from "@/api/usuarioAPI";
import { paths } from "@/routes/paths";
import EditUsuarioForm from "./EditUsuarioForm";

function LoadingState() {
  return (
    <div className="font-preset w-full space-y-3 px-2 py-3">
      <section className="rounded-lg border border-border bg-card p-3 shadow-sm">
        <div className="h-7 w-48 animate-pulse rounded bg-gray-200" />
        <div className="mt-2 h-4 w-80 animate-pulse rounded bg-gray-100" />
      </section>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <article key={i} className="rounded-lg border border-border bg-card p-3 shadow-sm">
            <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
            <div className="mt-3 h-6 w-32 animate-pulse rounded bg-gray-100" />
          </article>
        ))}
      </section>

      <section className="rounded-lg border border-border bg-card shadow-sm">
        <div className="border-b border-border px-3 py-3">
          <div className="h-5 w-40 animate-pulse rounded bg-gray-200" />
        </div>
        <div className="space-y-4 p-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      </section>
    </div>
  );
}

export default function EditUsuario() {
  const params = useParams();
  const usuarioId = params.idUsuario!;

  const { data, isLoading, isError } = useQuery({
    queryKey: ["usuario", usuarioId],
    queryFn: () => getUsuarioById(usuarioId),
    retry: false,
    enabled: !!usuarioId,
  });

  if (isLoading) return <LoadingState />;
  if (isError) return <Navigate to={paths.notFound} replace />;
  if (!data) return <Navigate to={paths.notFound} replace />;

  return <EditUsuarioForm data={data} usuarioId={usuarioId} />;
}
