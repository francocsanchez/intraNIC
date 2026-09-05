import MinutaPdfButton from "@/components/minutas/MinutaPdfButton";
import { ActionButton, DeleteActionButton, EditActionButton } from "@/components/ui/action-button";
import type { Minuta } from "@/types/index";
import { Mail, Pencil, Trash2 } from "lucide-react";

type MinutasTableProps = {
  deletingId?: string | null;
  downloadingId?: string | null;
  sendingId?: string | null;
  items: Minuta[];
  canDelete: (item: Minuta) => boolean;
  canEdit: (item: Minuta) => boolean;
  canSend: (item: Minuta) => boolean;
  onDelete: (item: Minuta) => void;
  onDownloadPdf: (item: Minuta) => void;
  onEdit: (item: Minuta) => void;
  onSend: (item: Minuta) => void;
};

export default function MinutasTable({
  canEdit,
  canDelete,
  canSend,
  deletingId,
  downloadingId,
  items,
  onDelete,
  onDownloadPdf,
  onEdit,
  onSend,
  sendingId,
}: MinutasTableProps) {
  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-sm">
      <div className="border-b border-border px-3 py-2">
        <h2 className="text-base font-semibold tracking-tight text-foreground">
          Listado de minutas
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-[980px] w-full text-sm">
          <thead className="bg-muted text-xs uppercase tracking-[0.16em] text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left">Fecha</th>
              <th className="px-3 py-2 text-left">Tema</th>
              <th className="px-3 py-2 text-left">Moderador</th>
              <th className="px-3 py-2 text-center">Participantes</th>
              <th className="px-3 py-2 text-center">Temas</th>
              <th className="px-3 py-2 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.map((item) => (
              <tr key={item._id} className="hover:bg-muted">
                <td className="px-3 py-1.5 text-muted-foreground">
                  {item.fechaLabel}
                </td>
                <td className="px-3 py-1.5">
                  <div className="font-medium text-foreground">{item.tema}</div>
                </td>
                <td className="px-3 py-1.5 text-muted-foreground">
                  {item.moderador.lastName}, {item.moderador.name}
                </td>
                <td className="px-3 py-1.5 text-center text-muted-foreground">
                  {item.participantesCount}
                </td>
                <td className="px-3 py-1.5 text-center text-muted-foreground">
                  {item.temasCount}
                </td>
                <td className="px-3 py-1.5">
                  <div className="flex justify-center gap-1">
                    <MinutaPdfButton
                      loading={downloadingId === item._id}
                      onClick={() => onDownloadPdf(item)}
                    />
                    {canEdit(item) ? (
                      <EditActionButton
                        onClick={() => onEdit(item)}
                      >
                        <Pencil size={14} />
                        Editar
                      </EditActionButton>
                    ) : null}
                    {canSend(item) ? (
                      <ActionButton
                        onClick={() => onSend(item)}
                        disabled={sendingId === item._id}
                      >
                        <Mail size={14} />
                        {sendingId === item._id ? "Enviando..." : "Enviar"}
                      </ActionButton>
                    ) : null}
                    {canDelete(item) ? (
                      <DeleteActionButton
                        onClick={() => onDelete(item)}
                        disabled={deletingId === item._id}
                      >
                        <Trash2 size={14} />
                        {deletingId === item._id ? "Eliminando..." : "Eliminar"}
                      </DeleteActionButton>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
            {!items.length ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-3 py-8 text-center text-sm text-muted-foreground"
                >
                  Todavía no hay minutas registradas.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
