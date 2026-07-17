import {
  deleteMinuta,
  exportMinutaPdf,
  getMinutaGroups,
  getMinutaParticipants,
  getMinutas,
  sendMinutaByEmail,
} from "@/api/dms/minutasAPI";
import MinutaGroupManagerModal from "@/components/minutas/MinutaGroupManagerModal";
import MinutasTable from "@/components/minutas/MinutasTable";
import { useAuth } from "@/hooks/useAuthe";
import { paths } from "@/routes/paths";
import type { Minuta } from "@/types/index";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, Plus, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const downloadBlob = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(url);
};

export default function MinutasView() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [groupManagerOpen, setGroupManagerOpen] = useState(false);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["minutas"],
    queryFn: getMinutas,
  });

  const { data: participantsResponse } = useQuery({
    queryKey: ["minutas", "participants"],
    queryFn: getMinutaParticipants,
  });

  const { data: groupsResponse } = useQuery({
    queryKey: ["minutas", "groups"],
    queryFn: getMinutaGroups,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMinuta,
    onSuccess: (response) => {
      toast.success(response.message || "Minuta eliminada correctamente");
      queryClient.invalidateQueries({ queryKey: ["minutas"] });
    },
    onError: (mutationError: Error) => toast.error(mutationError.message),
  });

  const items = useMemo(() => data?.data ?? [], [data]);
  const isOwner = (item: Minuta) => item.createdBy === user?._id;
  const canEdit = (item: Minuta) => isOwner(item) && !item.sentAt;
  const canDelete = (item: Minuta) => isOwner(item) && !item.sentAt;
  const canSend = (item: Minuta) => isOwner(item);

  const handleDelete = (item: Minuta) => {
    const confirmed = window.confirm(`¿Eliminar la minuta "${item.tema}"?`);
    if (!confirmed) return;
    deleteMutation.mutate(item._id);
  };

  const handleDownloadPdf = async (item: Minuta) => {
    try {
      setDownloadingId(item._id);
      const blob = await exportMinutaPdf(item._id);
      downloadBlob(blob, `minuta-${item.fechaLabel.replace(/\//g, "-")}.pdf`);
      toast.success("PDF generado correctamente");
    } catch (downloadError) {
      toast.error(downloadError instanceof Error ? downloadError.message : "Error al generar el PDF");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleSend = async (item: Minuta) => {
    try {
      setSendingId(item._id);
      const response = await sendMinutaByEmail(item._id);
      toast.success(response.message || "Minuta enviada correctamente");
      queryClient.invalidateQueries({ queryKey: ["minutas"] });
    } catch (sendError) {
      toast.error(sendError instanceof Error ? sendError.message : "Error al enviar la minuta por email");
    } finally {
      setSendingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full px-4 py-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">Cargando módulo de minutas...</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="w-full px-4 py-6">
        <div className="rounded-2xl border border-red-200 bg-white p-6 text-red-600 shadow-sm">
          {error instanceof Error ? error.message : "Error al cargar el módulo de minutas"}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 px-4 py-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">Comercial</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-gray-900">Minutas</h1>
            <p className="mt-1 max-w-3xl text-sm text-gray-500">
              Generá minutas internas de reuniones comerciales, administralas desde el sistema y exportalas en PDF.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate(paths.convencional.minutasNueva)}
              className="inline-flex items-center gap-2 rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-900"
            >
              <Plus size={16} />
              Generar minuta
            </button>
            <button
              type="button"
              onClick={() => setGroupManagerOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
            >
              <Users size={16} />
              Crear grupo de difusion
            </button>
          </div>
        </div>
      </section>

      <MinutasTable
        canEdit={canEdit}
        canDelete={canDelete}
        canSend={canSend}
        deletingId={deleteMutation.variables ?? null}
        downloadingId={downloadingId}
        items={items}
        onDelete={handleDelete}
        onDownloadPdf={handleDownloadPdf}
        onEdit={(item) => navigate(paths.convencional.minutasEditar(item._id))}
        onSend={handleSend}
        sendingId={sendingId}
      />

      {!items.length ? (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <article className="rounded-3xl border border-dashed border-gray-200 bg-white p-6 text-sm text-gray-500 shadow-sm">
            <div className="flex items-start gap-3">
              <FileText size={20} className="mt-0.5 text-gray-400" />
              <div>
                <div className="font-semibold text-gray-700">Sin minutas todavía</div>
                <p className="mt-1">La primera minuta se puede crear desde el botón principal del módulo.</p>
              </div>
            </div>
          </article>
          <article className="rounded-3xl border border-dashed border-gray-200 bg-white p-6 text-sm text-gray-500 shadow-sm">
            <div className="flex items-start gap-3">
              <Users size={20} className="mt-0.5 text-gray-400" />
              <div>
                <div className="font-semibold text-gray-700">Participantes reutilizables</div>
                <p className="mt-1">El selector trabaja con usuarios activos del sistema para evitar carga manual duplicada.</p>
              </div>
            </div>
          </article>
        </section>
      ) : null}

      <MinutaGroupManagerModal
        groups={groupsResponse?.data ?? []}
        onClose={() => setGroupManagerOpen(false)}
        open={groupManagerOpen}
        participants={participantsResponse?.data ?? []}
      />
    </div>
  );
}
