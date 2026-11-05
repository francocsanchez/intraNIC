import { createLink, deleteLink, getLinks, updateLink, type LinkPayload } from "@/api/linksAPI";
import { ActionButton, DeleteActionButton, EditActionButton } from "@/components/ui/action-button";
import type { LinkItem } from "@/types/index";
import { Dialog, Transition } from "@headlessui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Clipboard, ExternalLink, Link2, Pencil, Plus, Trash2, X } from "lucide-react";
import { Fragment, useState, type ReactNode } from "react";
import { toast } from "sonner";

function Modal({ children, onClose, pending = false }: { children: ReactNode; onClose: () => void; pending?: boolean }) {
  return <Transition appear show as={Fragment}><Dialog as="div" className="relative z-50" onClose={() => !pending && onClose()}><Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0"><div className="fixed inset-0 bg-foreground/40" /></Transition.Child><div className="fixed inset-0 overflow-y-auto"><div className="flex min-h-full items-center justify-center p-3"><Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"><Dialog.Panel className="w-full max-w-lg overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-xl">{children}</Dialog.Panel></Transition.Child></div></div></Dialog></Transition>;
}

const validUrl = (value: string) => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

function LinkDialog({ item, close }: { item?: LinkItem; close: () => void }) {
  const client = useQueryClient();
  const [payload, setPayload] = useState<LinkPayload>({ url: item?.url ?? "", descripcion: item?.descripcion ?? "" });
  const urlOk = validUrl(payload.url.trim());
  const descriptionOk = Boolean(payload.descripcion.trim());
  const mutation = useMutation({
    mutationFn: () => item ? updateLink(item._id, { url: payload.url.trim(), descripcion: payload.descripcion.trim() }) : createLink({ url: payload.url.trim(), descripcion: payload.descripcion.trim() }),
    onSuccess: (response) => { toast.success(response.message); client.invalidateQueries({ queryKey: ["links"] }); close(); },
    onError: (error: Error) => toast.error(error.message),
  });
  const invalid = !urlOk || !descriptionOk;

  return <Modal onClose={close} pending={mutation.isPending}><div className="flex items-center justify-between border-b border-border px-3 py-3"><div><p className="text-xs font-semibold uppercase tracking-[.16em] text-muted-foreground">Sistema</p><Dialog.Title className="mt-1 text-xl font-semibold tracking-tight">{item ? "Editar link" : "Nuevo link"}</Dialog.Title></div><button type="button" onClick={close} disabled={mutation.isPending} aria-label="Cerrar diálogo" className="rounded-md border border-border p-2 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"><X size={18} /></button></div><form onSubmit={(event) => { event.preventDefault(); if (!invalid) mutation.mutate(); }}><div className="space-y-3 p-3"><label className="block space-y-1.5 text-sm font-medium">URL<input required autoFocus type="url" maxLength={2048} value={payload.url} onChange={(event) => setPayload((current) => ({ ...current, url: event.target.value }))} placeholder="https://ejemplo.com" className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" /></label>{payload.url && !urlOk ? <p className="-mt-1 text-sm text-destructive">Ingresá una URL válida que comience con http:// o https://.</p> : null}<label className="block space-y-1.5 text-sm font-medium">Descripción<textarea required maxLength={500} rows={3} value={payload.descripcion} onChange={(event) => setPayload((current) => ({ ...current, descripcion: event.target.value }))} placeholder="Describe el destino del enlace" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" /></label></div><div className="flex justify-end gap-2 border-t border-border px-3 py-3"><ActionButton variant="outline" onClick={close} disabled={mutation.isPending}>Cancelar</ActionButton><ActionButton type="submit" disabled={invalid || mutation.isPending}>{mutation.isPending ? "Guardando..." : "Guardar"}</ActionButton></div></form></Modal>;
}

function DeleteDialog({ item, close }: { item: LinkItem; close: () => void }) {
  const client = useQueryClient();
  const mutation = useMutation({ mutationFn: () => deleteLink(item._id), onSuccess: (response) => { toast.success(response.message); client.invalidateQueries({ queryKey: ["links"] }); close(); }, onError: (error: Error) => toast.error(error.message) });
  return <Modal onClose={close} pending={mutation.isPending}><div className="border-b border-border px-3 py-3"><p className="text-xs font-semibold uppercase tracking-[.16em] text-muted-foreground">Sistema</p><Dialog.Title className="mt-1 text-xl font-semibold tracking-tight">Eliminar link</Dialog.Title></div><div className="space-y-2 p-3"><p className="text-sm">¿Querés eliminar este link?</p><p className="break-all text-sm text-muted-foreground">{item.descripcion}</p></div><div className="flex justify-end gap-2 border-t border-border px-3 py-3"><ActionButton variant="outline" onClick={close} disabled={mutation.isPending}>Cancelar</ActionButton><DeleteActionButton onClick={() => mutation.mutate()} disabled={mutation.isPending}>{mutation.isPending ? "Eliminando..." : "Eliminar"}</DeleteActionButton></div></Modal>;
}

async function copyUrl(url: string) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(url);
    return;
  }
  const input = document.createElement("textarea");
  input.value = url;
  input.style.position = "fixed";
  input.style.opacity = "0";
  document.body.appendChild(input);
  input.select();
  const copied = document.execCommand("copy");
  document.body.removeChild(input);
  if (!copied) throw new Error("No se pudo copiar el link");
}

export default function LinksView() {
  const [dialogItem, setDialogItem] = useState<LinkItem | undefined>();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState<LinkItem | undefined>();
  const query = useQuery({ queryKey: ["links"], queryFn: getLinks });
  const links = query.data?.data ?? [];
  const openCreate = () => { setDialogItem(undefined); setDialogOpen(true); };
  const openEdit = (item: LinkItem) => { setDialogItem(item); setDialogOpen(true); };

  return <div className="font-preset space-y-3 p-3"><section className="flex flex-col gap-3 rounded-lg border border-border bg-card p-3 md:flex-row md:items-center md:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[.16em] text-muted-foreground">Sistema</p><h1 className="mt-1 text-xl font-semibold tracking-tight">Links</h1><p className="mt-1 text-sm text-muted-foreground">Enlaces compartidos para los usuarios habilitados.</p></div><ActionButton onClick={openCreate}><Plus />Nuevo link</ActionButton></section>{query.isLoading ? <section className="rounded-lg border border-border bg-card p-3 text-sm text-muted-foreground">Cargando links...</section> : query.isError ? <section className="rounded-lg border border-destructive/30 bg-card p-3 text-sm text-destructive">{query.error instanceof Error ? query.error.message : "No se pudieron cargar los links."}</section> : <section className="overflow-hidden rounded-lg border border-border bg-card"><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-sm"><thead className="bg-muted text-left text-[11px] uppercase tracking-[.12em] text-muted-foreground"><tr><th className="px-3 py-2">URL</th><th className="px-3 py-2">Descripción</th><th className="px-3 py-2 text-right">Acciones</th></tr></thead><tbody>{links.length ? links.map((item) => <tr key={item._id} className="border-t border-border"><td className="max-w-[360px] px-3 py-2"><span className="block truncate" title={item.url}>{item.url}</span></td><td className="max-w-[360px] px-3 py-2"><span className="block truncate" title={item.descripcion}>{item.descripcion}</span></td><td className="px-3 py-2"><div className="flex justify-end gap-1.5"><ActionButton variant="outline" size="sm" title="Copiar link" onClick={() => void copyUrl(item.url).then(() => toast.success("Link copiado")).catch((error: Error) => toast.error(error.message))}><Clipboard />Copiar link</ActionButton><ActionButton variant="outline" size="sm" title="Ir a URL" onClick={() => window.open(item.url, "_blank", "noopener,noreferrer")}><ExternalLink />Ir a URL</ActionButton><EditActionButton size="icon-sm" title="Editar link" aria-label={`Editar ${item.descripcion}`} onClick={() => openEdit(item)}><Pencil /></EditActionButton><DeleteActionButton size="icon-sm" title="Eliminar link" aria-label={`Eliminar ${item.descripcion}`} onClick={() => setDeleteItem(item)}><Trash2 /></DeleteActionButton></div></td></tr>) : <tr><td colSpan={3} className="px-3 py-10 text-center text-sm text-muted-foreground"><Link2 className="mx-auto mb-2" size={24} />Todavía no hay links cargados.</td></tr>}</tbody></table></div></section>}{dialogOpen ? <LinkDialog item={dialogItem} close={() => setDialogOpen(false)} /> : null}{deleteItem ? <DeleteDialog item={deleteItem} close={() => setDeleteItem(undefined)} /> : null}</div>;
}
