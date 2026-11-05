import { deleteDashboardSalonSellerImage, getDashboardSalonSellerImages, saveDashboardSalonSellerImage } from "@/api/configuracionAPI";
import { getVendedoresActivosNic } from "@/api/dms/dmsAPI";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { paths } from "@/routes/paths";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const sellerInitials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toLocaleUpperCase("es-AR") || "V";

export default function ConfiguracionFotosVendedoresView() {
  const queryClient = useQueryClient();
  const [vendedorCodigo, setVendedorCodigo] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const sellersQuery = useQuery({ queryKey: ["vendedores-activos"], queryFn: getVendedoresActivosNic });
  const imagesQuery = useQuery({ queryKey: ["dashboard-salon-seller-images"], queryFn: getDashboardSalonSellerImages });
  const sellers = sellersQuery.data?.data ?? [];
  const images = imagesQuery.data?.data ?? [];
  const sellerByCode = new Map(sellers.map((seller) => [seller.codigo, seller]));
  const selectedSeller = sellerByCode.get(Number(vendedorCodigo));
  const refreshImages = () => queryClient.invalidateQueries({ queryKey: ["dashboard-salon-seller-images"] });
  const saveMutation = useMutation({
    mutationFn: saveDashboardSalonSellerImage,
    onSuccess: async (response) => { await refreshImages(); setImageUrl(""); toast.success(response.message ?? "Foto guardada correctamente"); },
    onError: (error) => toast.error(error instanceof Error ? error.message : "No se pudo guardar la foto."),
  });
  const deleteMutation = useMutation({
    mutationFn: deleteDashboardSalonSellerImage,
    onSuccess: async (response) => { await refreshImages(); toast.success(response.message ?? "Foto eliminada correctamente"); },
    onError: (error) => toast.error(error instanceof Error ? error.message : "No se pudo eliminar la foto."),
  });
  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const codigo = Number(vendedorCodigo);
    if (!Number.isInteger(codigo) || codigo < 1 || !imageUrl.trim()) return;
    saveMutation.mutate({ vendedorCodigo: codigo, imageUrl: imageUrl.trim() });
  };

  return <div className="font-preset w-full space-y-3 bg-muted px-2 py-3">
    <section className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-3 shadow-sm">
      <div><p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Dashboard Salón</p><h1 className="mt-1 text-xl font-semibold tracking-tight text-foreground">Fotos de vendedores</h1><p className="mt-1 text-sm text-muted-foreground">Asocia una foto por vendedor para mostrarla debajo del ranking de Dashboard Salón.</p></div>
      <Link to={paths.admin.configuracion} className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-3 text-xs font-semibold uppercase tracking-wide text-primary-foreground transition hover:bg-primary/90">Volver</Link>
    </section>
    <section className="rounded-lg border border-border bg-card p-3 shadow-sm">
      {sellersQuery.isLoading || imagesQuery.isLoading ? <p className="text-sm text-muted-foreground">Cargando vendedores y fotos...</p> : sellersQuery.isError || imagesQuery.isError ? <p className="text-sm text-destructive">No se pudo cargar la configuración de fotos. Intentá nuevamente.</p> : <>
        <form onSubmit={submit} className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)_auto] lg:items-end">
          <label className="grid gap-1.5 text-sm font-medium text-foreground">Vendedor<select value={vendedorCodigo} onChange={(event) => setVendedorCodigo(event.target.value)} required className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="">Seleccionar vendedor</option>{sellers.map((seller) => <option key={seller.codigo} value={seller.codigo}>{seller.vendedor} · {seller.sucursal}</option>)}</select></label>
          <label className="grid gap-1.5 text-sm font-medium text-foreground">URL de la foto<input type="url" value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} placeholder="https://..." required className="h-10 rounded-md border border-input bg-background px-3 text-sm" /></label>
          <div className="flex items-center gap-3"><Avatar className="size-10"><AvatarImage src={imageUrl || undefined} alt={selectedSeller ? `Foto de ${selectedSeller.vendedor}` : "Vista previa de vendedor"} /><AvatarFallback>{sellerInitials(selectedSeller?.vendedor ?? "Vendedor")}</AvatarFallback></Avatar><button type="submit" disabled={saveMutation.isPending} className="h-10 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-60">{saveMutation.isPending ? "Guardando..." : "Guardar foto"}</button></div>
        </form>
        {images.length ? <div className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{images.map((image) => { const seller = sellerByCode.get(image.vendedorCodigo); const name = seller?.vendedor ?? `Vendedor ${image.vendedorCodigo}`; return <div key={image.vendedorCodigo} className="flex items-center gap-3 rounded-md border border-border p-2"><Avatar className="size-10"><AvatarImage src={image.imageUrl} alt={`Foto de ${name}`} /><AvatarFallback>{sellerInitials(name)}</AvatarFallback></Avatar><span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">{name}</span><button type="button" onClick={() => deleteMutation.mutate(image.vendedorCodigo)} disabled={deleteMutation.isPending} className="text-xs font-semibold text-destructive hover:underline disabled:opacity-60">Eliminar</button></div>; })}</div> : <p className="mt-4 text-sm text-muted-foreground">Todavía no hay fotos configuradas.</p>}
      </>}
    </section>
  </div>;
}
