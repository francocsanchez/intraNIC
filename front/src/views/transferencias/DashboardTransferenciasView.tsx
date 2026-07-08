import Loading from "@/components/Loading";
import TransferenciasGeneralSection from "@/components/transferencias/TransferenciasGeneralSection";
import {
  getTransferenciasAvailableYears,
  getTransferenciasGeneralZonaNic,
} from "@/services/transferenciasDashboardService";
import { paths } from "@/routes/paths";
import { useQuery } from "@tanstack/react-query";
import { LayoutGrid, Printer } from "lucide-react";
import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { toast } from "sonner";

const dashboardSections = ["general"] as const;
type DashboardSection = (typeof dashboardSections)[number];

export default function DashboardTransferenciasView() {
  const { section } = useParams<{ section: string }>();
  const [userSelectedYear, setUserSelectedYear] = useState<number | null>(null);
  const [page, setPage] = useState(1);

  const isValidSection = dashboardSections.includes((section ?? "") as DashboardSection);
  const activeSection: DashboardSection = isValidSection ? (section as DashboardSection) : "general";

  const yearsQuery = useQuery({
    queryKey: ["transferencias-dashboard", "years"],
    queryFn: getTransferenciasAvailableYears,
  });

  const selectedYear = userSelectedYear ?? yearsQuery.data?.selectedYear ?? null;

  const generalZonaNic = useQuery({
    queryKey: ["transferencias-dashboard", "general-zona-nic", selectedYear, page],
    queryFn: () => getTransferenciasGeneralZonaNic(selectedYear!, page, 15),
    enabled: selectedYear !== null && activeSection === "general",
  });

  const hasAvailableYears = (yearsQuery.data?.years.length ?? 0) > 0;
  const isWaitingYearSelection = yearsQuery.isSuccess && hasAvailableYears && selectedYear === null;
  const isLoading = yearsQuery.isLoading || isWaitingYearSelection || generalZonaNic.isLoading;
  const firstError =
    (yearsQuery.error instanceof Error ? yearsQuery.error : undefined) ??
    (generalZonaNic.error instanceof Error ? generalZonaNic.error : undefined);

  useEffect(() => {
    if (firstError instanceof Error) {
      toast.error(firstError.message);
    }
  }, [firstError]);

  useEffect(() => {
    setPage(1);
  }, [selectedYear]);

  if (!isValidSection) {
    return <Navigate to={paths.analisis.transferencias.dashboardGeneral} replace />;
  }

  if (isLoading) return <Loading />;

  if (firstError instanceof Error) {
    return (
      <div className="w-full px-1 py-1">
        <section className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold tracking-tight text-gray-900">Error al cargar Dashboard Transferencias</h1>
          <p className="mt-2 text-sm text-red-600">{firstError.message}</p>
        </section>
      </div>
    );
  }

  if (yearsQuery.isSuccess && !hasAvailableYears) {
    return (
      <div className="w-full px-1 py-1">
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold tracking-tight text-gray-900">Dashboard Transferencias</h1>
          <p className="mt-2 text-sm text-gray-500">
            Todavia no hay anos disponibles para analizar. Ejecuta la actualizacion desde Act. Registros para habilitar el dashboard.
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 px-1 py-1">
      <section className="print-hidden px-1 py-1">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Dashboard Transferencias</h1>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-900 transition-colors hover:border-[#15aa9a] hover:text-[#0f766e]"
            >
              <Printer size={16} />
              Imprimir PDF
            </button>

            <label htmlFor="transferencias-year" className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
              Ano
            </label>
            <select
              id="transferencias-year"
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

      <section className="dashboard-print-area space-y-4">
        <div className="print-hidden flex items-center gap-2">
          <LayoutGrid size={18} className="text-[#128c80]" />
          <h2 className="text-lg font-semibold tracking-tight text-gray-900">Vista General</h2>
        </div>

        {generalZonaNic.data ? <TransferenciasGeneralSection data={generalZonaNic.data} onPageChange={setPage} /> : null}
      </section>
    </div>
  );
}
