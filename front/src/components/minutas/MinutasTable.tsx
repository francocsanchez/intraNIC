import MinutaPdfButton from "@/components/minutas/MinutaPdfButton";
import type { Minuta } from "@/types/index";
import { Eye, Mail, Trash2 } from "lucide-react";

type MinutasTableProps = {
  deletingId?: string | null;
  downloadingId?: string | null;
  sendingId?: string | null;
  items: Minuta[];
  canDelete: (item: Minuta) => boolean;
  onDelete: (item: Minuta) => void;
  onDownloadPdf: (item: Minuta) => void;
  onSend: (item: Minuta) => void;
  onView: (item: Minuta) => void;
};

export default function MinutasTable({
  canDelete,
  deletingId,
  downloadingId,
  items,
  onDelete,
  onDownloadPdf,
  onSend,
  onView,
  sendingId,
}: MinutasTableProps) {
  return (
    <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 px-6 py-4">
        <h2 className="text-base font-semibold tracking-tight text-gray-900">Listado de minutas</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[1080px] w-full text-sm">
          <thead className="bg-gray-50 text-xs uppercase tracking-[0.18em] text-gray-500">
            <tr>
              <th className="px-4 py-3 text-left">Fecha</th>
              <th className="px-4 py-3 text-left">Tema</th>
              <th className="px-4 py-3 text-left">Moderador</th>
              <th className="px-4 py-3 text-center">Participantes</th>
              <th className="px-4 py-3 text-center">Temas</th>
              <th className="px-4 py-3 text-center">Acciones</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {items.map((item) => (
              <tr key={item._id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-700">{item.fechaLabel}</td>
                <td className="px-4 py-3 text-gray-700">
                  <div className="font-medium text-gray-900">{item.tema}</div>
                </td>
                <td className="px-4 py-3 text-gray-700">
                  {item.moderador.lastName}, {item.moderador.name}
                </td>
                <td className="px-4 py-3 text-center text-gray-700">{item.participantesCount}</td>
                <td className="px-4 py-3 text-center text-gray-700">{item.temasCount}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => onView(item)}
                      className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
                    >
                      <Eye size={14} />
                      Ver
                    </button>
                    <MinutaPdfButton
                      loading={downloadingId === item._id}
                      onClick={() => onDownloadPdf(item)}
                    />
                    <button
                      type="button"
                      onClick={() => onSend(item)}
                      disabled={sendingId === item._id}
                      className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Mail size={14} />
                      {sendingId === item._id ? "Enviando..." : "Enviar"}
                    </button>
                    {canDelete(item) ? (
                      <button
                        type="button"
                        onClick={() => onDelete(item)}
                        disabled={deletingId === item._id}
                        className="inline-flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Trash2 size={14} />
                        {deletingId === item._id ? "Eliminando..." : "Eliminar"}
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}

            {!items.length ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500">
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
