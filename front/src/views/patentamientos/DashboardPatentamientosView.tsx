import Loading from "@/components/Loading";
import PatentamientosGeneralSection from "@/components/patentamientos/PatentamientosGeneralSection";
import PatentamientosComparisonTable from "@/components/patentamientos/PatentamientosComparisonTable";
import PatentamientosToyotaEvolutionChart from "@/components/patentamientos/PatentamientosToyotaEvolutionChart";
import {
  getPatentamientosAvailableYears,
  getPatentamientosGeneralZonaNic,
  type PatentamientosPlanFilter,
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
import { paths } from "@/routes/paths";
import { useQueries, useQuery } from "@tanstack/react-query";
import { BarChart3, FileSpreadsheet, LayoutGrid, LineChart, Table2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { toast } from "sonner";

const dashboardSections = ["general", "marcas", "pickup", "suv", "b-suv"] as const;
type DashboardSection = (typeof dashboardSections)[number];

const sectionContent = {
  general: {
    heading: "Vista General",
    icon: LayoutGrid,
  },
  marcas: {
    heading: "Top 10 Marcas Patentadas",
    icon: Table2,
  },
  pickup: {
    heading: "Comparativa Segmento Pickup",
    icon: BarChart3,
  },
  suv: {
    heading: "Comparativa Segmento SUV",
    icon: BarChart3,
  },
  "b-suv": {
    heading: "Comparativa Segmento B-SUV",
    icon: BarChart3,
  },
} satisfies Record<DashboardSection, { heading: string; icon: typeof Table2 }>;

export default function DashboardPatentamientosView() {
  const { section } = useParams<{ section: string }>();
  const [userSelectedYear, setUserSelectedYear] = useState<number | null>(null);
  const [planFilter, setPlanFilter] = useState<PatentamientosPlanFilter>("with-plan");

  const isValidSection = dashboardSections.includes((section ?? "") as DashboardSection);
  const activeSection: DashboardSection = isValidSection ? (section as DashboardSection) : "general";

  const yearsQuery = useQuery({
    queryKey: ["patentamientos-dashboard", "years"],
    queryFn: getPatentamientosAvailableYears,
  });
  const selectedYear = userSelectedYear ?? yearsQuery.data?.selectedYear ?? null;
  const isGeneralSection = activeSection === "general";
  const isMarcasSection = activeSection === "marcas";
  const isPickupSection = activeSection === "pickup";
  const isSuvSection = activeSection === "suv";
  const isBSuvSection = activeSection === "b-suv";

  const results = useQueries({
    queries: [
      {
        queryKey: ["patentamientos-dashboard", "general-zona-nic", selectedYear],
        queryFn: () => getPatentamientosGeneralZonaNic(selectedYear!),
        enabled: selectedYear !== null && isGeneralSection,
      },
      {
        queryKey: ["patentamientos-dashboard", "top-marcas-pais", selectedYear, planFilter],
        queryFn: () => getPatentamientosTopMarcasPais(selectedYear!, planFilter),
        enabled: selectedYear !== null && isMarcasSection,
      },
      {
        queryKey: ["patentamientos-dashboard", "top-marcas-zona-nic", selectedYear, planFilter],
        queryFn: () => getPatentamientosTopMarcasZonaNic(selectedYear!, planFilter),
        enabled: selectedYear !== null && isMarcasSection,
      },
      {
        queryKey: ["patentamientos-dashboard", "pickup-pais", selectedYear],
        queryFn: () => getPatentamientosSegmentoPickupPais(selectedYear!),
        enabled: selectedYear !== null && isPickupSection,
      },
      {
        queryKey: ["patentamientos-dashboard", "pickup-zona-nic", selectedYear],
        queryFn: () => getPatentamientosSegmentoPickupZonaNic(selectedYear!),
        enabled: selectedYear !== null && isPickupSection,
      },
      {
        queryKey: ["patentamientos-dashboard", "suv-pais", selectedYear],
        queryFn: () => getPatentamientosSegmentoSuvPais(selectedYear!),
        enabled: selectedYear !== null && isSuvSection,
      },
      {
        queryKey: ["patentamientos-dashboard", "suv-zona-nic", selectedYear],
        queryFn: () => getPatentamientosSegmentoSuvZonaNic(selectedYear!),
        enabled: selectedYear !== null && isSuvSection,
      },
      {
        queryKey: ["patentamientos-dashboard", "b-suv-pais", selectedYear],
        queryFn: () => getPatentamientosSegmentoBSuvPais(selectedYear!),
        enabled: selectedYear !== null && isBSuvSection,
      },
      {
        queryKey: ["patentamientos-dashboard", "b-suv-zona-nic", selectedYear],
        queryFn: () => getPatentamientosSegmentoBSuvZonaNic(selectedYear!),
        enabled: selectedYear !== null && isBSuvSection,
      },
      {
        queryKey: ["patentamientos-dashboard", "toyota-evolucion", selectedYear, planFilter],
        queryFn: () => getPatentamientosToyotaEvolution(selectedYear!, planFilter),
        enabled: selectedYear !== null && isMarcasSection,
      },
    ],
  });

  const [generalZonaNic, topPais, topZonaNic, pickupPais, pickupZonaNic, suvPais, suvZonaNic, bSuvPais, bSuvZonaNic, toyotaEvolution] =
    results;

  const hasAvailableYears = (yearsQuery.data?.years.length ?? 0) > 0;
  const isWaitingYearSelection = yearsQuery.isSuccess && hasAvailableYears && selectedYear === null;
  const isLoading = yearsQuery.isLoading || isWaitingYearSelection || (selectedYear !== null && results.some((result) => result.isLoading));
  const firstError =
    (yearsQuery.error instanceof Error ? yearsQuery.error : undefined) ?? results.find((result) => result.error instanceof Error)?.error;

  useEffect(() => {
    if (firstError instanceof Error) {
      toast.error(firstError.message);
    }
  }, [firstError]);

  if (!isValidSection) {
    return <Navigate to={paths.analisis.patentamientos.dashboardGeneral} replace />;
  }

  if (isLoading) return <Loading />;

  if (firstError instanceof Error) {
    return (
      <div className="w-full px-1 py-1">
        <section className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold tracking-tight text-gray-900">Error al cargar Dashboard Patentamientos</h1>
          <p className="mt-2 text-sm text-red-600">{firstError.message}</p>
        </section>
      </div>
    );
  }

  if (yearsQuery.isSuccess && !hasAvailableYears) {
    return (
      <div className="w-full px-1 py-1">
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold tracking-tight text-gray-900">Dashboard Patentamientos</h1>
          <p className="mt-2 text-sm text-gray-500">
            Todavia no hay anos disponibles para analizar. Importa al menos un dataset de patentamientos para habilitar el dashboard.
          </p>
          <div className="mt-5">
            <Link
              to={paths.analisis.patentamientos.importar}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              <FileSpreadsheet size={16} />
              Cargar archivos
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 px-1 py-1">
      <section className="px-1 py-1">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Dashboard Patentamientos</h1>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              to={paths.analisis.patentamientos.importar}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              <FileSpreadsheet size={16} />
              Actualizar base
            </Link>

            <div className="flex items-center gap-3">
              {isMarcasSection ? (
                <>
                  <label htmlFor="patentamientos-plan-filter" className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
                    C/ Plan
                  </label>
                  <select
                    id="patentamientos-plan-filter"
                    value={planFilter}
                    onChange={(event) => setPlanFilter(event.target.value as PatentamientosPlanFilter)}
                    className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition-colors focus:border-[#15aa9a]"
                  >
                    <option value="with-plan">Si</option>
                    <option value="without-plan">No</option>
                  </select>
                </>
              ) : null}

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
          </div>
        </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          {(() => {
            const SectionIcon = sectionContent[activeSection].icon;
            return <SectionIcon size={18} className="text-[#128c80]" />;
          })()}
          <h2 className="text-lg font-semibold tracking-tight text-gray-900">{sectionContent[activeSection].heading}</h2>
        </div>

        {isGeneralSection && generalZonaNic.data && selectedYear !== null ? (
          <PatentamientosGeneralSection data={generalZonaNic.data} />
        ) : null}

        {isMarcasSection ? (
          <>
            {topPais.data ? <PatentamientosComparisonTable data={topPais.data} /> : null}
            {topZonaNic.data ? <PatentamientosComparisonTable data={topZonaNic.data} /> : null}
          </>
        ) : null}

        {isPickupSection ? (
          <>
            {pickupPais.data ? <PatentamientosComparisonTable data={pickupPais.data} /> : null}
            {pickupZonaNic.data ? <PatentamientosComparisonTable data={pickupZonaNic.data} /> : null}
          </>
        ) : null}

        {isSuvSection ? (
          <>
            {suvPais.data ? <PatentamientosComparisonTable data={suvPais.data} /> : null}
            {suvZonaNic.data ? <PatentamientosComparisonTable data={suvZonaNic.data} /> : null}
          </>
        ) : null}

        {isBSuvSection ? (
          <>
            {bSuvPais.data ? <PatentamientosComparisonTable data={bSuvPais.data} /> : null}
            {bSuvZonaNic.data ? <PatentamientosComparisonTable data={bSuvZonaNic.data} /> : null}
          </>
        ) : null}
      </section>

      {isMarcasSection ? (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <LineChart size={18} className="text-[#128c80]" />
            <h2 className="text-lg font-semibold tracking-tight text-gray-900">Evolucion Toyota PAIS vs Zona NIC</h2>
          </div>
          {toyotaEvolution.data ? <PatentamientosToyotaEvolutionChart data={toyotaEvolution.data} /> : null}
        </section>
      ) : null}
    </div>
  );
}
