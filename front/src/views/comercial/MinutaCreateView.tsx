import {
  createMinuta,
  getMinutaGroups,
  getMinutaParticipants,
  type MinutaPayload,
} from "@/api/dms/minutasAPI";
import MinutaForm from "@/components/minutas/MinutaForm";
import { paths } from "@/routes/paths";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function MinutaCreateView() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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
      <div className="font-preset w-full bg-muted px-2 py-3">
        <div className="rounded-lg border border-border bg-card px-3 py-3 text-sm text-muted-foreground shadow-sm">
          Cargando formulario de minuta...
        </div>
      </div>
    );
  }

  if (isParticipantsError || isGroupsError) {
    return (
      <div className="font-preset w-full bg-muted px-2 py-3">
        <div className="rounded-lg border border-destructive/30 bg-card px-3 py-3 text-sm text-destructive shadow-sm">
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
    <div className="font-preset w-full space-y-3 bg-muted px-2 py-3">
      <section className="rounded-lg border border-border bg-card px-3 py-3 text-card-foreground shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Comercial
            </p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight text-foreground">
              Generar minuta
            </h1>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
              Completá la información de la reunión, cargá los participantes y
              armá el temario en una pantalla más cómoda.
            </p>
          </div>

          <Link
            to={paths.convencional.minutas}
            className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-background px-3 text-sm font-semibold text-foreground hover:bg-secondary"
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
