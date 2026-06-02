import Loading from "@/components/Loading";
import PatentamientosComparisonTable from "@/components/patentamientos/PatentamientosComparisonTable";
import PatentamientosToyotaEvolutionChart from "@/components/patentamientos/PatentamientosToyotaEvolutionChart";
import {
  getPatentamientosAvailableYears,
  getPatentamientosSegmentoBSuvPais,
  getPatentamientosSegmentoBSuvZonaNic,
  getPatentamientosSegmentoPickupPais,
  getPatentamientosSegmentoPickupZonaNic,
  getPatentamientosSegmentoSuvPais,
  getPatentamientosSegmentoSuvZonaNic,
  getPatentamientosTopMarcasPais,
  getPatentamientosTopMarcasZonaNic,
  getPatentamientosToyotaEvolution,
} from "@/services/patentamientosDashboardService";
import { useQueries, useQuery } from "@tanstack/react-query";
import { BarChart3, LineChart, Table2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

export default function DashboardPatentamientosView() {
  const [userSelectedYear, setUserSelectedYear] = useState<number | null>(null);

  const yearsQuery = useQuery({
    queryKey: ["patentamientos-dashboard", "years"],
    queryFn: getPatentamientosAvailableYears,
  });
  const selectedYear = userSelectedYear ?? yearsQuery.data?.selectedYear ?? null;

  const results = useQueries({
    queries: [
      {
        queryKey: ["patentamientos-dashboard", "top-marcas-pais", selectedYear],
        queryFn: () => getPatentamientosTopMarcasPais(selectedYear!),
        enabled: selectedYear !== null,
      },
      {
        queryKey: ["patentamientos-dashboard", "top-marcas-zona-nic", selectedYear],
        queryFn: () => getPatentamientosTopMarcasZonaNic(selectedYear!),
        enabled: selectedYear !== null,
      },
      {
        queryKey: ["patentamientos-dashboard", "pickup-pais", selectedYear],
        queryFn: () => getPatentamientosSegmentoPickupPais(selectedYear!),
        enabled: selectedYear !== null,
      },
      {
        queryKey: ["patentamientos-dashboard", "pickup-zona-nic", selectedYear],
        queryFn: () => getPatentamientosSegmentoPickupZonaNic(selectedYear!),
        enabled: selectedYear !== null,
      },
      {
        queryKey: ["patentamientos-dashboard", "suv-pais", selectedYear],
        queryFn: () => getPatentamientosSegmentoSuvPais(selectedYear!),
        enabled: selectedYear !== null,
      },
      {
        queryKey: ["patentamientos-dashboard", "suv-zona-nic", selectedYear],
        queryFn: () => getPatentamientosSegmentoSuvZonaNic(selectedYear!),
        enabled: selectedYear !== null,
      },
      {
        queryKey: ["patentamientos-dashboard", "b-suv-pais", selectedYear],
        queryFn: () => getPatentamientosSegmentoBSuvPais(selectedYear!),
        enabled: selectedYear !== null,
      },
      {
        queryKey: ["patentamientos-dashboard", "b-suv-zona-nic", selectedYear],
        queryFn: () => getPatentamientosSegmentoBSuvZonaNic(selectedYear!),
        enabled: selectedYear !== null,
      },
      {
        queryKey: ["patentamientos-dashboard", "toyota-evolucion", selectedYear],
        queryFn: () => getPatentamientosToyotaEvolution(selectedYear!),
        enabled: selectedYear !== null,
      },
    ],
  });

  const [topPais, topZonaNic, pickupPais, pickupZonaNic, suvPais, suvZonaNic, bSuvPais, bSuvZonaNic, toyotaEvolution] =
    results;

  const hasAvailableYears = (yearsQuery.data?.years.length ?? 0) > 0;
  const isWaitingYearSelection = yearsQuery.isSuccess && hasAvailableYears && selectedYear === null;
  const isLoading = yearsQuery.isLoading || isWaitingYearSelection || (selectedYear !== null && results.some((result) => result.isLoading));
  const firstError =
    (yearsQuery.error instanceof Error ? yearsQuery.error : undefined) ??
    results.find((result) => result.error instanceof Error)?.error;

  useEffect(() => {
    if (firstError instanceof Error) {
      toast.error(firstError.message);
    }
  }, [firstError]);

  if (isLoading) return <Loading />;

  if (firstError instanceof Error) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-6">
        <section className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold tracking-tight text-gray-900">Error al cargar Dashboard Patentamientos</h1>
          <p className="mt-2 text-sm text-red-600">{firstError.message}</p>
        </section>
      </div>
    );
  }

  if (yearsQuery.isSuccess && !hasAvailableYears) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-6">
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold tracking-tight text-gray-900">Dashboard Patentamientos</h1>
          <p className="mt-2 text-sm text-gray-500">
            Todavia no hay anos disponibles para analizar. Importa al menos un dataset de patentamientos para habilitar el dashboard.
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Analisis visual</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-gray-900">Dashboard Patentamientos</h1>
            <p className="mt-1 max-w-3xl text-sm text-gray-500">
              Vista descriptiva enfocada en ranking de marcas, comparativas de segmentos y evolucion mensual de Toyota.
            </p>
            <div className="mt-4 flex items-center gap-3">
              <label htmlFor="patentamientos-year" className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
                Ano
              </label>
              <select
                id="patentamientos-year"
                value={selectedYear ?? ""}
                onChange={(event) => setUserSelectedYear(Number(event.target.value))}
                className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition-colors focus:border-[#15aa9a]"
              >
                {(yearsQuery.data?.years ?? []).map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Link
            to="/patentamientos"
            className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-900 transition hover:border-gray-400 hover:bg-gray-100"
          >
            Volver a importaciones
          </Link>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Table2 size={18} className="text-[#128c80]" />
          <h2 className="text-lg font-semibold tracking-tight text-gray-900">Top 10 Marcas Patentadas</h2>
        </div>
        {topPais.data ? <PatentamientosComparisonTable data={topPais.data} /> : null}
        {topZonaNic.data ? <PatentamientosComparisonTable data={topZonaNic.data} /> : null}
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <BarChart3 size={18} className="text-[#128c80]" />
          <h2 className="text-lg font-semibold tracking-tight text-gray-900">Comparativa Segmento Pickup</h2>
        </div>
        {pickupPais.data ? <PatentamientosComparisonTable data={pickupPais.data} /> : null}
        {pickupZonaNic.data ? <PatentamientosComparisonTable data={pickupZonaNic.data} /> : null}
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <BarChart3 size={18} className="text-[#128c80]" />
          <h2 className="text-lg font-semibold tracking-tight text-gray-900">Comparativa Segmento SUV</h2>
        </div>
        {suvPais.data ? <PatentamientosComparisonTable data={suvPais.data} /> : null}
        {suvZonaNic.data ? <PatentamientosComparisonTable data={suvZonaNic.data} /> : null}
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <BarChart3 size={18} className="text-[#128c80]" />
          <h2 className="text-lg font-semibold tracking-tight text-gray-900">Comparativa Segmento B-SUV</h2>
        </div>
        {bSuvPais.data ? <PatentamientosComparisonTable data={bSuvPais.data} /> : null}
        {bSuvZonaNic.data ? <PatentamientosComparisonTable data={bSuvZonaNic.data} /> : null}
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <LineChart size={18} className="text-[#128c80]" />
          <h2 className="text-lg font-semibold tracking-tight text-gray-900">Evolucion Toyota PAIS vs Zona NIC</h2>
        </div>
        {toyotaEvolution.data ? <PatentamientosToyotaEvolutionChart data={toyotaEvolution.data} /> : null}
      </section>
    </div>
  );
}
