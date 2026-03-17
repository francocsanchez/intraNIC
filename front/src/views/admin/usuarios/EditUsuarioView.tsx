import { useQuery } from "@tanstack/react-query";
import { Navigate, useParams } from "react-router-dom";
import { getUsuarioById } from "@/api/usuarioAPI";
import EditUsuarioForm from "./EditUsuarioForm";

function LoadingState() {
  return (
    <div className="w-full px-4 py-6 space-y-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="h-7 w-48 animate-pulse rounded bg-gray-200" />
        <div className="mt-2 h-4 w-80 animate-pulse rounded bg-gray-100" />
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <article key={i} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
            <div className="mt-3 h-6 w-32 animate-pulse rounded bg-gray-100" />
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="h-5 w-40 animate-pulse rounded bg-gray-200" />
        </div>
        <div className="space-y-4 p-6">
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
  if (isError) return <Navigate to="/404" />;
  if (!data) return <Navigate to="/404" />;

  return <EditUsuarioForm data={data} usuarioId={usuarioId} />;
}
