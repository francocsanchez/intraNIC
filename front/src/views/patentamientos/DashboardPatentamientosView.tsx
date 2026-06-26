import Loading from "@/components/Loading";
import PatentamientosGeneralSection from "@/components/patentamientos/PatentamientosGeneralSection";
import PatentamientosComparisonTable from "@/components/patentamientos/PatentamientosComparisonTable";
import PatentamientosToyotaEvolutionChart from "@/components/patentamientos/PatentamientosToyotaEvolutionChart";
import {
  getPatentamientosAvailableYears,
  getPatentamientosSegmentoCCrossPais,
  getPatentamientosSegmentoCCrossZonaNic,
  getPatentamientosGeneralZonaNic,
  type PatentamientosMonthFilter,
  type PatentamientosPlanFilter,
  getPatentamientosSegmentoPickupPais,
  getPatentamientosSegmentoPickupZonaNic,
  getPatentamientosSegmentoSw4Pais,
  getPatentamientosSegmentoSw4ZonaNic,
  getPatentamientosSegmentoYarisPais,
  getPatentamientosSegmentoYarisZonaNic,
  getPatentamientosSegmentoYCrossPais,
  getPatentamientosSegmentoYCrossZonaNic,
  getPatentamientosTopMarcasPais,
  getPatentamientosTopMarcasZonaNic,
  getPatentamientosToyotaEvolution,
} from "@/services/patentamientosDashboardService";
import { paths } from "@/routes/paths";
import { useQueries, useQuery } from "@tanstack/react-query";
import { BarChart3, LayoutGrid, LineChart, Table2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { toast } from "sonner";

const dashboardSections = ["general", "marcas", "pickup", "sw4", "c-cross", "y-cross", "yaris"] as const;
type DashboardSection = (typeof dashboardSections)[number];

const monthOptions = [
  { value: "", label: "Todos" },
  { value: "1", label: "Enero" },
  { value: "2", label: "Febrero" },
  { value: "3", label: "Marzo" },
  { value: "4", label: "Abril" },
  { value: "5", label: "Mayo" },
  { value: "6", label: "Junio" },
  { value: "7", label: "Julio" },
  { value: "8", label: "Agosto" },
  { value: "9", label: "Septiembre" },
  { value: "10", label: "Octubre" },
  { value: "11", label: "Noviembre" },
  { value: "12", label: "Diciembre" },
] as const;

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
    heading: "Comparativa Hilux",
    icon: BarChart3,
  },
  sw4: {
    heading: "Comparativa SW4",
    icon: BarChart3,
  },
  "c-cross": {
    heading: "Comparativa C. Cross",
    icon: BarChart3,
  },
  "y-cross": {
    heading: "Comparativa Y. Cross",
    icon: BarChart3,
  },
  yaris: {
    heading: "Comparativa Yaris",
    icon: BarChart3,
  },
} satisfies Record<DashboardSection, { heading: string; icon: typeof Table2 }>;

export default function DashboardPatentamientosView() {
  const { section } = useParams<{ section: string }>();
  const [userSelectedYear, setUserSelectedYear] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<PatentamientosMonthFilter>(null);
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
  const isSw4Section = activeSection === "sw4";
  const isCCrossSection = activeSection === "c-cross";
  const isYCrossSection = activeSection === "y-cross";
  const isYarisSection = activeSection === "yaris";

  const results = useQueries({
    queries: [
      {
        queryKey: ["patentamientos-dashboard", "general-zona-nic", selectedYear, selectedMonth],
        queryFn: () => getPatentamientosGeneralZonaNic(selectedYear!, selectedMonth),
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
        queryKey: ["patentamientos-dashboard", "pickup-pais", selectedYear, planFilter],
        queryFn: () => getPatentamientosSegmentoPickupPais(selectedYear!, planFilter),
        enabled: selectedYear !== null && isPickupSection,
      },
      {
        queryKey: ["patentamientos-dashboard", "pickup-zona-nic", selectedYear, planFilter],
        queryFn: () => getPatentamientosSegmentoPickupZonaNic(selectedYear!, planFilter),
        enabled: selectedYear !== null && isPickupSection,
      },
      {
        queryKey: ["patentamientos-dashboard", "sw4-pais", selectedYear, planFilter],
        queryFn: () => getPatentamientosSegmentoSw4Pais(selectedYear!, planFilter),
        enabled: selectedYear !== null && isSw4Section,
      },
      {
        queryKey: ["patentamientos-dashboard", "sw4-zona-nic", selectedYear, planFilter],
        queryFn: () => getPatentamientosSegmentoSw4ZonaNic(selectedYear!, planFilter),
        enabled: selectedYear !== null && isSw4Section,
      },
      {
        queryKey: ["patentamientos-dashboard", "c-cross-pais", selectedYear, planFilter],
        queryFn: () => getPatentamientosSegmentoCCrossPais(selectedYear!, planFilter),
        enabled: selectedYear !== null && isCCrossSection,
      },
      {
        queryKey: ["patentamientos-dashboard", "c-cross-zona-nic", selectedYear, planFilter],
        queryFn: () => getPatentamientosSegmentoCCrossZonaNic(selectedYear!, planFilter),
        enabled: selectedYear !== null && isCCrossSection,
      },
      {
        queryKey: ["patentamientos-dashboard", "y-cross-pais", selectedYear, planFilter],
        queryFn: () => getPatentamientosSegmentoYCrossPais(selectedYear!, planFilter),
        enabled: selectedYear !== null && isYCrossSection,
      },
      {
        queryKey: ["patentamientos-dashboard", "y-cross-zona-nic", selectedYear, planFilter],
        queryFn: () => getPatentamientosSegmentoYCrossZonaNic(selectedYear!, planFilter),
        enabled: selectedYear !== null && isYCrossSection,
      },
      {
        queryKey: ["patentamientos-dashboard", "yaris-pais", selectedYear, planFilter],
        queryFn: () => getPatentamientosSegmentoYarisPais(selectedYear!, planFilter),
        enabled: selectedYear !== null && isYarisSection,
      },
      {
        queryKey: ["patentamientos-dashboard", "yaris-zona-nic", selectedYear, planFilter],
        queryFn: () => getPatentamientosSegmentoYarisZonaNic(selectedYear!, planFilter),
        enabled: selectedYear !== null && isYarisSection,
      },
      {
        queryKey: ["patentamientos-dashboard", "toyota-evolucion", selectedYear, planFilter],
        queryFn: () => getPatentamientosToyotaEvolution(selectedYear!, planFilter),
        enabled: selectedYear !== null && isMarcasSection,
      },
    ],
  });

  const [
    generalZonaNic,
    topPais,
    topZonaNic,
    pickupPais,
    pickupZonaNic,
    sw4Pais,
    sw4ZonaNic,
    cCrossPais,
    cCrossZonaNic,
    yCrossPais,
    yCrossZonaNic,
    yarisPais,
    yarisZonaNic,
    toyotaEvolution,
  ] = results;

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
            Todavia no hay anos disponibles para analizar. Ejecuta la actualizacion desde Act. Registros para habilitar el dashboard.
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 px-1 py-1">
      <section className="px-1 py-1">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Dashboard Patentamientos</h1>

          <div className="flex items-center gap-3">
            {isGeneralSection ? (
              <>
                <label htmlFor="patentamientos-month" className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
                  Mes
                </label>
                <select
                  id="patentamientos-month"
                  value={selectedMonth ?? ""}
                  onChange={(event) => setSelectedMonth(event.target.value ? Number(event.target.value) : null)}
                  className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition-colors focus:border-[#15aa9a]"
                >
                  {monthOptions.map((month) => (
                    <option key={month.value || "all"} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </select>
              </>
            ) : null}

            {isMarcasSection || isPickupSection || isSw4Section || isCCrossSection || isYCrossSection || isYarisSection ? (
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
          <PatentamientosGeneralSection
            data={generalZonaNic.data}
            selectedMonthLabel={
              selectedMonth === null
                ? null
                : monthOptions.find((month) => month.value === String(selectedMonth))?.label ?? null
            }
          />
        ) : null}

        {isMarcasSection ? (
          <>
            {topPais.data ? <PatentamientosComparisonTable data={topPais.data} showMonthlyParticipation /> : null}
            {topZonaNic.data ? <PatentamientosComparisonTable data={topZonaNic.data} showMonthlyParticipation /> : null}
          </>
        ) : null}

        {isPickupSection ? (
          <>
            {pickupPais.data ? <PatentamientosComparisonTable data={pickupPais.data} showMonthlyParticipation /> : null}
            {pickupZonaNic.data ? <PatentamientosComparisonTable data={pickupZonaNic.data} showMonthlyParticipation /> : null}
          </>
        ) : null}

        {isSw4Section ? (
          <>
            {sw4Pais.data ? <PatentamientosComparisonTable data={sw4Pais.data} showMonthlyParticipation /> : null}
            {sw4ZonaNic.data ? <PatentamientosComparisonTable data={sw4ZonaNic.data} showMonthlyParticipation /> : null}
          </>
        ) : null}

        {isCCrossSection ? (
          <>
            {cCrossPais.data ? <PatentamientosComparisonTable data={cCrossPais.data} showMonthlyParticipation /> : null}
            {cCrossZonaNic.data ? <PatentamientosComparisonTable data={cCrossZonaNic.data} showMonthlyParticipation /> : null}
          </>
        ) : null}

        {isYCrossSection ? (
          <>
            {yCrossPais.data ? <PatentamientosComparisonTable data={yCrossPais.data} showMonthlyParticipation /> : null}
            {yCrossZonaNic.data ? <PatentamientosComparisonTable data={yCrossZonaNic.data} showMonthlyParticipation /> : null}
          </>
        ) : null}

        {isYarisSection ? (
          <>
            {yarisPais.data ? <PatentamientosComparisonTable data={yarisPais.data} showMonthlyParticipation /> : null}
            {yarisZonaNic.data ? <PatentamientosComparisonTable data={yarisZonaNic.data} showMonthlyParticipation /> : null}
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
