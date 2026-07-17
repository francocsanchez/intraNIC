import {
  getMinutaById,
  getMinutaGroups,
  getMinutaParticipants,
  updateMinuta,
  type MinutaPayload,
} from "@/api/dms/minutasAPI";
import MinutaForm from "@/components/minutas/MinutaForm";
import { useAuth } from "@/hooks/useAuthe";
import { paths } from "@/routes/paths";
import type { Minuta } from "@/types/index";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

const toInitialValues = (item: Minuta) => ({
  fecha: item.fecha.slice(0, 10),
  tema: item.tema,
  participantes: item.participantes.map((participant) => participant._id),
  temario: item.temario.map((topic) => ({
    nombre: topic.nombre,
    desarrollo: topic.desarrollo,
  })),
});

export default function MinutaEditView() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: minutaResponse, isLoading: isLoadingMinuta, isError: isMinutaError, error: minutaError } = useQuery({
    queryKey: ["minutas", id],
    queryFn: () => getMinutaById(id),
    enabled: Boolean(id),
  });

  const {
    data: participantsResponse,
    isLoading: isLoadingParticipants,
    isError: isParticipantsError,
    error: participantsError,
  } = useQuery({
    queryKey: ["minutas", "participants"],
    queryFn: getMinutaParticipants,
  });

  const {
    data: groupsResponse,
    isLoading: isLoadingGroups,
    isError: isGroupsError,
    error: groupsError,
  } = useQuery({
    queryKey: ["minutas", "groups"],
    queryFn: getMinutaGroups,
  });

  const updateMutation = useMutation({
    mutationFn: (payload: MinutaPayload) => updateMinuta(id, payload),
    onSuccess: (response) => {
      toast.success(response.message || "Minuta actualizada correctamente");
      queryClient.invalidateQueries({ queryKey: ["minutas"] });
      queryClient.invalidateQueries({ queryKey: ["minutas", id] });
      navigate(paths.convencional.minutas);
    },
    onError: (mutationError: Error) => toast.error(mutationError.message),
  });

  if (isLoadingMinuta || isLoadingParticipants || isLoadingGroups) {
    return (
      <div className="w-full px-4 py-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">Cargando formulario de edición...</div>
      </div>
    );
  }

  if (isMinutaError || isParticipantsError || isGroupsError) {
    return (
      <div className="w-full px-4 py-6">
        <div className="rounded-2xl border border-red-200 bg-white p-6 text-red-600 shadow-sm">
          {minutaError instanceof Error
            ? minutaError.message
            : participantsError instanceof Error
              ? participantsError.message
              : groupsError instanceof Error
                ? groupsError.message
              : "Error al cargar la minuta"}
        </div>
      </div>
    );
  }

  const minuta = minutaResponse?.data;

  if (!minuta) {
    return (
      <div className="w-full px-4 py-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">No se encontró la minuta solicitada.</div>
      </div>
    );
  }

  const isOwner = minuta.createdBy === user?._id;

  if (!isOwner) {
    return (
      <div className="w-full space-y-6 px-4 py-6">
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">Comercial</p>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">Editar minuta</h1>
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

        <section className="rounded-2xl border border-amber-200 bg-white p-6 text-amber-700 shadow-sm">
          Solo el usuario que creó la minuta puede editarla.
        </section>
      </div>
    );
  }

  if (minuta.sentAt) {
    return (
      <div className="w-full space-y-6 px-4 py-6">
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">Comercial</p>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">Editar minuta</h1>
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

        <section className="rounded-2xl border border-amber-200 bg-white p-6 text-amber-700 shadow-sm">
          La minuta ya fue enviada por email y ya no puede editarse.
        </section>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 px-4 py-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">Comercial</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">Editar minuta</h1>
            <p className="mt-2 max-w-3xl text-sm text-gray-500">
              Actualizá la información de la reunión antes de enviarla por email.
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
        initialValues={toInitialValues(minuta)}
        onCancel={() => navigate(paths.convencional.minutas)}
        onSubmit={(payload) => updateMutation.mutate(payload)}
        participants={participantsResponse?.data ?? []}
        pending={updateMutation.isPending}
        submitLabel="Guardar cambios"
      />
    </div>
  );
}
