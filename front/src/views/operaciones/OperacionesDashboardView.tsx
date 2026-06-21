import Loading from "@/components/Loading";
import OperacionesBarChart from "@/components/operaciones/OperacionesBarChart";
import type {
  OperacionesChartCompare,
  OperacionesChartDimension,
  OperacionesChartPoint,
} from "@/components/operaciones/OperacionesBarChart";
import OperacionesFilters from "@/components/operaciones/OperacionesFilters";
import OperacionesResumenTable from "@/components/operaciones/OperacionesResumenTable";
import { getOperacionesDashboard } from "@/services/operacionesService";
import type { OperacionDashboard, OperacionesDashboardResponse } from "@/types/index";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, Filter, Inbox } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const MONTH_LABELS = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];

const getFechaParts = (fechaAsignacion: string) => {
  const match = fechaAsignacion.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (match) {
    return {
      year: Number(match[1]),
      month: Number(match[2]),
      day: Number(match[3]),
    };
  }

  const fecha = new Date(fechaAsignacion);
  return {
    year: fecha.getFullYear(),
    month: fecha.getMonth() + 1,
    day: fecha.getDate(),
  };
};

export default function OperacionesDashboardView() {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const [selectedAnios, setSelectedAnios] = useState<number[]>([currentYear]);
  const [selectedMeses, setSelectedMeses] = useState<number[]>([currentMonth]);
  const [chartDimension, setChartDimension] = useState<OperacionesChartDimension>("vendedor");
  const [chartCompareBy, setChartCompareBy] = useState<OperacionesChartCompare>("none");
  const [selectedSucursales, setSelectedSucursales] = useState<string[]>([]);
  const [selectedModelos, setSelectedModelos] = useState<string[]>([]);
  const [selectedDias, setSelectedDias] = useState<number[]>([]);
  const effectiveChartDimension =
    chartCompareBy === "anio" && !["mes", "dia"].includes(chartDimension) ? "mes" : chartDimension;

  const anios = useMemo(
    () => Array.from({ length: 6 }, (_, index) => currentYear - 5 + index),
    [currentYear],
  );

  const { data, isLoading, isError, error } = useQuery<OperacionesDashboardResponse>({
    queryKey: ["operaciones-dashboard", selectedAnios, selectedMeses, selectedSucursales, selectedModelos, selectedDias],
    queryFn: () =>
      getOperacionesDashboard({
        anios: selectedAnios,
        meses: selectedMeses,
        sucursales: selectedSucursales,
        modelos: selectedModelos,
        dias: selectedDias,
      }),
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (error instanceof Error) {
      toast.error(error.message);
    }
  }, [error]);

  const validSucursales = useMemo(
    () => new Set(data?.filtros.sucursales.map((item) => item.value) ?? []),
    [data],
  );
  const validModelos = useMemo(
    () => new Set(data?.filtros.modelos.map((item) => item.value) ?? []),
    [data],
  );
  const validDias = useMemo(
    () => new Set(data?.filtros.dias ?? []),
    [data],
  );

  const effectiveSelectedSucursales = useMemo(
    () => selectedSucursales.filter((item) => validSucursales.size === 0 || validSucursales.has(item)),
    [selectedSucursales, validSucursales],
  );
  const effectiveSelectedModelos = useMemo(
    () => selectedModelos.filter((item) => validModelos.size === 0 || validModelos.has(item)),
    [selectedModelos, validModelos],
  );
  const effectiveSelectedDias = useMemo(
    () => selectedDias.filter((item) => validDias.size === 0 || validDias.has(item)),
    [selectedDias, validDias],
  );

  const chartState = useMemo(() => {
    const operaciones = data?.operaciones ?? [];
    const comparisonEnabled = chartCompareBy === "anio" && selectedAnios.length > 1;
    const grouped = new Map<string, Record<string, number>>();
    const labelOrder = new Map<string, number>();

    const getDimensionValue = (item: OperacionDashboard) => {
      const fecha = getFechaParts(item.fechaAsignacion);

      if (effectiveChartDimension === "mes") {
        const month = fecha.month;
        return {
          label: MONTH_LABELS[month - 1] ?? String(month),
          order: month,
        };
      }

      if (effectiveChartDimension === "dia") {
        const day = fecha.day;
        return {
          label: String(day).padStart(2, "0"),
          order: day,
        };
      }

      if (effectiveChartDimension === "modelo") {
        return { label: item.modeloNombre, order: 0 };
      }

      if (effectiveChartDimension === "sucursal") {
        return { label: item.sucursalNombre, order: 0 };
      }

      return { label: item.vendedorNombre, order: 0 };
    };

    operaciones.forEach((item) => {
      const { label, order } = getDimensionValue(item);
      const yearKey = String(getFechaParts(item.fechaAsignacion).year);

      if (!grouped.has(label)) {
        grouped.set(label, {});
      }

      if (effectiveChartDimension === "mes" || effectiveChartDimension === "dia") {
        labelOrder.set(label, order);
      }

      const bucket = grouped.get(label)!;
      const key = comparisonEnabled ? yearKey : "total";
      bucket[key] = (bucket[key] ?? 0) + 1;
    });

    let points: OperacionesChartPoint[] = Array.from(grouped.entries()).map(([label, values]) => ({
      label,
      ...values,
    }));

    if (effectiveChartDimension === "mes" || effectiveChartDimension === "dia") {
      points = points.sort((a, b) => (labelOrder.get(String(a.label)) ?? 0) - (labelOrder.get(String(b.label)) ?? 0));
    } else {
      const getTotal = (item: OperacionesChartPoint) =>
        Object.entries(item)
          .filter(([key]) => key !== "label")
          .reduce((acc, [, value]) => acc + Number(value ?? 0), 0);

      points = points.sort((a, b) => getTotal(b) - getTotal(a) || String(a.label).localeCompare(String(b.label)));
    }

    return {
      data: points,
      seriesKeys: comparisonEnabled ? selectedAnios.map(String) : ["total"],
      comparisonEnabled,
    };
  }, [chartCompareBy, data, effectiveChartDimension, selectedAnios]);

  if (isLoading) return <Loading />;

  if (isError) {
    return (
      <div className="w-full px-4 py-6">
        <section className="rounded-[28px] border border-red-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold tracking-tight text-gray-900">Error al cargar operaciones</h1>
          <p className="mt-2 text-sm text-red-600">
            {error instanceof Error ? error.message : "No fue posible obtener la informacion del dashboard."}
          </p>
        </section>
      </div>
    );
  }

  if (!data) return <Loading />;

  const modelosTabla = data.filtros.modelos.map((item) => item.label);

  return (
    <div className="w-full space-y-3 px-4 py-4">
      <section className="rounded-xl border border-[#c7e7e2] bg-white p-3 shadow-sm">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#128c80]">Modulo operativo</p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight text-gray-900">Dashboard de operaciones</h1>
            <p className="mt-1 max-w-3xl text-xs text-gray-600">
              Supervisa asignaciones por vendedor, cruza sucursales, modelos, dias y anios para detectar tendencias visuales.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <article className="rounded-lg bg-[#e4f3fa] px-3 py-2">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-white p-2 text-[#15aa9a] shadow-sm">
                  <BarChart3 size={14} />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500">Operaciones</p>
                  <p className="text-lg font-bold text-gray-900">{data.operaciones.length}</p>
                </div>
              </div>
            </article>

            <article className="rounded-lg bg-[#e4f3fa] px-3 py-2">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-white p-2 text-[#15aa9a] shadow-sm">
                  <Filter size={14} />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500">Puntos</p>
                  <p className="text-lg font-bold text-gray-900">{chartState.data.length}</p>
                </div>
              </div>
            </article>

            <article className="rounded-lg bg-[#e4f3fa] px-3 py-2">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-white p-2 text-[#15aa9a] shadow-sm">
                  <Inbox size={14} />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500">Series</p>
                  <p className="text-lg font-bold text-gray-900">{chartState.seriesKeys.length}</p>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      <OperacionesFilters
        anios={anios}
        selectedAnios={selectedAnios}
        selectedMeses={selectedMeses}
        sucursales={data.filtros.sucursales}
        modelos={data.filtros.modelos}
        dias={data.filtros.dias}
        selectedSucursales={effectiveSelectedSucursales}
        selectedModelos={effectiveSelectedModelos}
        selectedDias={effectiveSelectedDias}
        onAniosChange={setSelectedAnios}
        onMesesChange={setSelectedMeses}
        onSucursalesChange={setSelectedSucursales}
        onModelosChange={setSelectedModelos}
        onDiasChange={setSelectedDias}
      />

      {!data.operaciones.length ? (
        <section className="rounded-xl border border-dashed border-[#b7d8e3] bg-white px-5 py-10 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#e4f3fa] text-[#15aa9a]">
            <Inbox size={20} />
          </div>
          <h2 className="mt-3 text-lg font-semibold text-gray-900">No hay operaciones para mostrar</h2>
          <p className="mt-1 text-sm text-gray-500">
            Proba cambiar los anios o quitar algunos filtros para ampliar el resultado.
          </p>
        </section>
      ) : (
        <>
          <OperacionesBarChart
            data={chartState.data}
            dimension={effectiveChartDimension}
            compareBy={chartCompareBy}
            seriesKeys={chartState.seriesKeys}
            onDimensionChange={setChartDimension}
            onCompareByChange={setChartCompareBy}
          />
          <OperacionesResumenTable data={data.tabla} modelos={modelosTabla} />
        </>
      )}
    </div>
  );
}
