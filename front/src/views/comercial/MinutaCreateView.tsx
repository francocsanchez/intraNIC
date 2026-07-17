import { createMinuta, getMinutaGroups, getMinutaParticipants, type MinutaPayload } from "@/api/dms/minutasAPI";
import MinutaForm from "@/components/minutas/MinutaForm";
import { paths } from "@/routes/paths";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function MinutaCreateView() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: participantsResponse, isLoading: isLoadingParticipants, isError: isParticipantsError, error: participantsError } = useQuery({
    queryKey: ["minutas", "participants"],
    queryFn: getMinutaParticipants,
  });

  const { data: groupsResponse, isLoading: isLoadingGroups, isError: isGroupsError, error: groupsError } = useQuery({
    queryKey: ["minutas", "groups"],
    queryFn: getMinutaGroups,
  });

  const createMutation = useMutation({
    mutationFn: (payload: MinutaPayload) => createMinuta(payload),
    onSuccess: (response) => {
      toast.success(response.message || "Minuta creada correctamente");
      queryClient.invalidateQueries({ queryKey: ["minutas"] });
      navigate(paths.convencional.minutas);
    },
    onError: (mutationError: Error) => toast.error(mutationError.message),
  });

  if (isLoadingParticipants || isLoadingGroups) {
    return (
      <div className="w-full px-4 py-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">Cargando formulario de minuta...</div>
      </div>
    );
  }

  if (isParticipantsError || isGroupsError) {
    return (
      <div className="w-full px-4 py-6">
        <div className="rounded-2xl border border-red-200 bg-white p-6 text-red-600 shadow-sm">
          {participantsError instanceof Error
            ? participantsError.message
            : groupsError instanceof Error
              ? groupsError.message
              : "Error al cargar el formulario de minutas"}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 px-4 py-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">Comercial</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">Generar minuta</h1>
            <p className="mt-2 max-w-3xl text-sm text-gray-500">
              Completá la información de la reunión, cargá los participantes y armá el temario en una pantalla más cómoda.
            </p>
          </div>

          <Link
            to={paths.convencional.minutas}
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900"
          >
            <ArrowLeft size={16} />
            Volver al listado
          </Link>
        </div>
      </section>

      <MinutaForm
        groups={groupsResponse?.data ?? []}
        onCancel={() => navigate(paths.convencional.minutas)}
        onSubmit={(payload) => createMutation.mutate(payload)}
        participants={participantsResponse?.data ?? []}
        pending={createMutation.isPending}
        submitLabel="Guardar minuta"
      />
    </div>
  );
}
