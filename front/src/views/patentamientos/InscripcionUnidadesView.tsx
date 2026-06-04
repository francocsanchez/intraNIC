import Loading from "@/components/Loading";
import InscripcionUnidadesTable from "@/components/patentamientos/InscripcionUnidadesTable";
import UnidadesDealersTreemap from "@/components/patentamientos/UnidadesDealersTreemap";
import {
  getPatentamientosUnidadesDealersResumen,
  syncPatentamientosUnidadesDealers,
} from "@/services/patentamientosUnidadesDealersService";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LayoutGrid, RefreshCcw, Table2 } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";

export default function InscripcionUnidadesView() {
  const queryClient = useQueryClient();

  const resumenQuery = useQuery({
    queryKey: ["patentamientos-unidades-dealers", "resumen"],
    queryFn: getPatentamientosUnidadesDealersResumen,
  });

  const syncMutation = useMutation({
    mutationFn: syncPatentamientosUnidadesDealers,
    onMutate: () => {
      toast.loading("Actualizando unidades de dealers...", { id: "sync-unidades-dealers" });
    },
    onSuccess: async () => {
      toast.success("Base de unidades actualizada correctamente", { id: "sync-unidades-dealers" });
      await queryClient.invalidateQueries({ queryKey: ["patentamientos-unidades-dealers"] });
    },
    onError: () => {
      toast.error("No se pudo actualizar la base de unidades", { id: "sync-unidades-dealers" });
    },
  });

  useEffect(() => {
    if (resumenQuery.error instanceof Error) {
      toast.error(resumenQuery.error.message);
    }
  }, [resumenQuery.error]);

  if (resumenQuery.isLoading) {
    return <Loading />;
  }

  if (resumenQuery.error instanceof Error) {
    return (
      <div className="w-full px-1 py-1">
        <section className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold tracking-tight text-gray-900">Error al cargar Inscripcion de unidades</h1>
          <p className="mt-2 text-sm text-red-600">{resumenQuery.error.message}</p>
        </section>
      </div>
    );
  }

  if (!resumenQuery.data) {
    return null;
  }

  return (
    <div className="w-full space-y-6 px-1 py-1">
      <section className="px-1 py-1">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Inscripcion de unidades</h1>
            <p className="mt-1 max-w-3xl text-sm text-gray-500">
              Analisis de unidades Toyota por concesionario y estado.
            </p>
          </div>

          <button
            type="button"
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCcw size={16} className={syncMutation.isPending ? "animate-spin" : ""} />
            {syncMutation.isPending ? "Actualizando..." : "Actualizar datos"}
          </button>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <LayoutGrid size={18} className="text-[#128c80]" />
          <h2 className="text-lg font-semibold tracking-tight text-gray-900">Treemap por dealer</h2>
        </div>

        <UnidadesDealersTreemap />
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Table2 size={18} className="text-[#128c80]" />
          <h2 className="text-lg font-semibold tracking-tight text-gray-900">Tabla consolidada</h2>
        </div>

        <InscripcionUnidadesTable data={resumenQuery.data} />
      </section>
    </div>
  );
}
