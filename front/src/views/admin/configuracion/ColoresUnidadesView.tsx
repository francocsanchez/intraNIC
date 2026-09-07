import Loading from "@/components/Loading";
import { createColorUnidad, getColoresUnidades, updateColorUnidad } from "@/api/coloresUnidadesAPI";
import { getContrastForeground } from "@/helpers/colores";
import type { Catalogo } from "@/types/index";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const isHex = (value: string) => /^#[0-9A-Fa-f]{6}$/.test(value);

export default function ColoresUnidadesView() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Catalogo | null>(null);
  const [nombre, setNombre] = useState("");
  const [hex, setHex] = useState("#FFFFFF");
  const { data, isLoading, isError } = useQuery({ queryKey: ["colores-unidades"], queryFn: getColoresUnidades });

  const mutation = useMutation({
    mutationFn: () => {
      if (!nombre.trim() || !isHex(hex)) throw new Error("Ingresá un nombre y un color hexadecimal válido.");
      const payload = { nombre: nombre.trim(), hex, activo: editing?.activo ?? true };
      return editing ? updateColorUnidad(editing._id, payload) : createColorUnidad(payload);
    },
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries({ queryKey: ["colores-unidades"] });
      queryClient.invalidateQueries({ queryKey: ["colores-unidades", "badges"] });
      setEditing(null); setNombre(""); setHex("#FFFFFF");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const edit = (item: Catalogo) => { setEditing(item); setNombre(item.nombre); setHex(item.hex ?? "#FFFFFF"); };
  const style = isHex(hex) ? { backgroundColor: hex, borderColor: hex, color: getContrastForeground(hex) } : undefined;

  if (isLoading) return <Loading />;
  if (isError) return <div className="font-preset px-3 py-3 text-destructive">No se pudieron cargar los colores de unidades.</div>;

  return <div className="font-preset w-full space-y-3 px-2 py-3">
    <section className="rounded-lg border border-border bg-card px-3 py-3 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Configuración de stock</p>
      <h1 className="text-xl font-semibold tracking-tight text-foreground">Colores de unidades</h1>
      <p className="mt-1 text-sm text-muted-foreground">Define cómo se muestran los colores recibidos desde las unidades. No afecta el catálogo de Preventas.</p>
    </section>
    <section className="grid gap-3 rounded-lg border border-border bg-card p-3 md:grid-cols-[1fr_auto_auto] md:items-end">
      <label className="space-y-1.5"><span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Nombre recibido en stock</span><input value={nombre} onChange={(event) => setNombre(event.target.value)} placeholder="Ej. Blanco Perlado con" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" /></label>
      <label className="space-y-1.5"><span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Color</span><div className="flex gap-2"><input type="color" value={hex} onChange={(event) => setHex(event.target.value.toUpperCase())} className="h-10 w-12 rounded-md border border-input bg-background p-1" /><input value={hex} onChange={(event) => setHex(event.target.value.toUpperCase())} maxLength={7} className="w-24 rounded-md border border-input bg-background px-2 py-2 text-sm" /></div></label>
      <div className="flex items-center gap-2"><span className="inline-flex rounded-md border px-2 py-1 text-xs font-medium" style={style}>{nombre || "Vista previa"}</span><button type="button" onClick={() => mutation.mutate()} disabled={mutation.isPending} className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"><Plus size={16} />{editing ? "Guardar" : "Agregar"}</button></div>
    </section>
    <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm"><div className="border-b border-border px-3 py-3"><h2 className="text-base font-semibold">Colores configurados</h2></div><div className="overflow-x-auto"><table className="min-w-full text-sm"><thead className="bg-muted text-xs uppercase tracking-[0.18em] text-muted-foreground"><tr><th className="px-3 py-2 text-left">Nombre</th><th className="px-3 py-2 text-left">Vista</th><th className="px-3 py-2 text-right">Acción</th></tr></thead><tbody className="divide-y divide-border">{(data?.data ?? []).map((item) => <tr key={item._id}><td className="px-3 py-2">{item.nombre}</td><td className="px-3 py-2"><span className="inline-flex rounded-md border px-2 py-0.5 text-xs font-medium" style={item.hex ? { backgroundColor: item.hex, borderColor: item.hex, color: getContrastForeground(item.hex) } : undefined}>{item.nombre}</span></td><td className="px-3 py-2 text-right"><button type="button" onClick={() => edit(item)} className="inline-flex h-7 items-center gap-1 rounded-md border border-border bg-background px-2 text-xs font-semibold hover:bg-secondary"><Pencil size={14} />Editar</button></td></tr>)}{!(data?.data ?? []).length ? <tr><td colSpan={3} className="px-3 py-8 text-center text-muted-foreground">Todavía no hay colores de unidades configurados.</td></tr> : null}</tbody></table></div></section>
  </div>;
}
