import Loading from "@/components/Loading";
import InscripcionUnidadesTable from "@/components/patentamientos/InscripcionUnidadesTable";
import UnidadesDealersTreemap from "@/components/patentamientos/UnidadesDealersTreemap";
import {
  getPatentamientosUnidadesDealersYears,
  getPatentamientosUnidadesDealersResumen,
} from "@/services/patentamientosUnidadesDealersService";
import { useQuery } from "@tanstack/react-query";
import { LayoutGrid, Table2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function InscripcionUnidadesView() {
  const [userSelectedYear, setUserSelectedYear] = useState<number | null>(null);

  const yearsQuery = useQuery({
    queryKey: ["patentamientos-unidades-dealers", "years"],
    queryFn: getPatentamientosUnidadesDealersYears,
  });

  const selectedYear = userSelectedYear ?? yearsQuery.data?.selectedYear ?? null;

  const resumenQuery = useQuery({
    queryKey: ["patentamientos-unidades-dealers", "resumen", selectedYear],
    queryFn: () => getPatentamientosUnidadesDealersResumen(selectedYear),
    enabled: yearsQuery.isSuccess,
  });

  useEffect(() => {
    if (resumenQuery.error instanceof Error) {
      toast.error(resumenQuery.error.message);
    }
  }, [resumenQuery.error]);

  useEffect(() => {
    if (yearsQuery.error instanceof Error) {
      toast.error(yearsQuery.error.message);
    }
  }, [yearsQuery.error]);

  if (yearsQuery.isLoading || resumenQuery.isLoading) {
    return <Loading />;
  }

  if (yearsQuery.error instanceof Error || resumenQuery.error instanceof Error) {
    return (
      <div className="w-full px-1 py-1">
        <section className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold tracking-tight text-gray-900">Error al cargar Traslado Furlong</h1>
          <p className="mt-2 text-sm text-red-600">{yearsQuery.error instanceof Error ? yearsQuery.error.message : resumenQuery.error instanceof Error ? resumenQuery.error.message : ""}</p>
        </section>
      </div>
    );
  }

  if (!resumenQuery.data || !yearsQuery.data) {
    return null;
  }

  return (
    <div className="w-full space-y-6 px-1 py-1">
      <section className="px-1 py-1">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Traslado Furlong</h1>
            <p className="mt-1 max-w-3xl text-sm text-gray-500">
              Analisis de unidades Toyota por concesionario y estado.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label htmlFor="traslado-furlong-year" className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
              Ano
            </label>
            <select
              id="traslado-furlong-year"
              value={selectedYear ?? ""}
              onChange={(event) => setUserSelectedYear(Number(event.target.value))}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition-colors focus:border-[#15aa9a]"
            >
              {yearsQuery.data.years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <LayoutGrid size={18} className="text-[#128c80]" />
          <h2 className="text-lg font-semibold tracking-tight text-gray-900">Treemap por dealer</h2>
        </div>

        <UnidadesDealersTreemap year={selectedYear} />
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
