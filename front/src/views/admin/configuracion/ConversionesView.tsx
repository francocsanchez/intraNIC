import { createConversion, getConversiones, updateConversion } from "@/api/conversionesAPI";
import Loading from "@/components/Loading";
import type { Conversion } from "@/types/index";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function ConversionesView() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Conversion | null>(null);
  const [tipoConversion, setTipoConversion] = useState("");
  const [proveedor, setProveedor] = useState("");
  const { data, isLoading, isError } = useQuery({ queryKey: ["conversiones"], queryFn: getConversiones });

  const resetForm = () => {
    setEditing(null);
    setTipoConversion("");
    setProveedor("");
  };

  const mutation = useMutation({
    mutationFn: () => {
      const payload = { tipoConversion: tipoConversion.trim(), proveedor: proveedor.trim() };
      if (!payload.tipoConversion || !payload.proveedor) {
        throw new Error("Ingresá el tipo de conversión y el proveedor.");
      }
      return editing ? updateConversion(editing._id, payload) : createConversion(payload);
    },
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries({ queryKey: ["conversiones"] });
      resetForm();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const edit = (item: Conversion) => {
    setEditing(item);
    setTipoConversion(item.tipoConversion);
    setProveedor(item.proveedor);
  };

  if (isLoading) return <Loading />;
  if (isError) return <div className="font-preset px-3 py-3 text-destructive">No se pudieron cargar las conversiones.</div>;

  return <div className="font-preset w-full space-y-3 px-2 py-3">
    <section className="rounded-lg border border-border bg-card px-3 py-3 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Parámetros de sistema</p>
      <h1 className="text-xl font-semibold tracking-tight text-foreground">Conversiones</h1>
      <p className="mt-1 text-sm text-muted-foreground">Define los tipos de conversión y sus proveedores para utilizarlos en las unidades de licitación.</p>
    </section>

    <section className="grid gap-3 rounded-lg border border-border bg-card p-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
      <label className="space-y-1.5"><span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Tipo de conversión</span><input value={tipoConversion} onChange={(event) => setTipoConversion(event.target.value)} placeholder="Ej. GNC" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" /></label>
      <label className="space-y-1.5"><span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Proveedor</span><input value={proveedor} onChange={(event) => setProveedor(event.target.value)} placeholder="Ej. Proveedor S.A." className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" /></label>
      <div className="flex gap-2"><button type="button" onClick={() => mutation.mutate()} disabled={mutation.isPending} className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"><Plus size={16} />{editing ? "Guardar" : "Agregar"}</button>{editing ? <button type="button" onClick={resetForm} className="h-10 rounded-md border border-border bg-background px-3 text-sm font-semibold hover:bg-muted">Cancelar</button> : null}</div>
    </section>

    <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm"><div className="border-b border-border px-3 py-3"><h2 className="text-base font-semibold">Conversiones configuradas</h2></div><div className="overflow-x-auto"><table className="min-w-full text-sm"><thead className="bg-muted text-xs uppercase tracking-[0.18em] text-muted-foreground"><tr><th className="px-3 py-2 text-left">Tipo de conversión</th><th className="px-3 py-2 text-left">Proveedor</th><th className="px-3 py-2 text-right">Acción</th></tr></thead><tbody className="divide-y divide-border">{(data?.data ?? []).map((item) => <tr key={item._id}><td className="px-3 py-2">{item.tipoConversion}</td><td className="px-3 py-2">{item.proveedor}</td><td className="px-3 py-2 text-right"><button type="button" onClick={() => edit(item)} className="inline-flex h-7 items-center gap-1 rounded-md border border-border bg-background px-2 text-xs font-semibold hover:bg-secondary"><Pencil size={14} />Editar</button></td></tr>)}{!(data?.data ?? []).length ? <tr><td colSpan={3} className="px-3 py-8 text-center text-muted-foreground">Todavía no hay conversiones configuradas.</td></tr> : null}</tbody></table></div></section>
  </div>;
}
