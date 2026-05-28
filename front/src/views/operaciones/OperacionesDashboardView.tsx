import Loading from "@/components/Loading";
import OperacionesBarChart from "@/components/operaciones/OperacionesBarChart";
import type { OperacionesChartDimension } from "@/components/operaciones/OperacionesBarChart";
import OperacionesFilters from "@/components/operaciones/OperacionesFilters";
import OperacionesResumenTable from "@/components/operaciones/OperacionesResumenTable";
import { getOperacionesDashboard } from "@/services/operacionesService";
import type { OperacionDashboard, OperacionesDashboardResponse } from "@/types/index";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, Filter, Inbox } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

export default function OperacionesDashboardView() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const [anio, setAnio] = useState(currentYear);
  const [selectedMeses, setSelectedMeses] = useState<number[]>([currentMonth]);
  const [chartDimension, setChartDimension] = useState<OperacionesChartDimension>("vendedor");
  const [selectedSucursales, setSelectedSucursales] = useState<string[]>([]);
  const [selectedModelos, setSelectedModelos] = useState<string[]>([]);
  const [selectedDias, setSelectedDias] = useState<number[]>([]);

  const anios = useMemo(
    () => Array.from({ length: 6 }, (_, index) => currentYear - index),
    [currentYear],
  );

  const { data, isLoading, isError, error } = useQuery<OperacionesDashboardResponse>({
    queryKey: ["operaciones-dashboard", anio, selectedMeses, selectedSucursales, selectedModelos, selectedDias],
    queryFn: () =>
      getOperacionesDashboard({
        anio,
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

  useEffect(() => {
    if (!data) return;

    const validSucursales = new Set(data.filtros.sucursales.map((item) => item.value));
    const validModelos = new Set(data.filtros.modelos.map((item) => item.value));
    const validDias = new Set(data.filtros.dias);

    setSelectedSucursales((current) => current.filter((item) => validSucursales.has(item)));
    setSelectedModelos((current) => current.filter((item) => validModelos.has(item)));
    setSelectedDias((current) => current.filter((item) => validDias.has(item)));
  }, [data]);

  const chartData = useMemo(() => {
    const monthLabels = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];
    const operaciones = data?.operaciones ?? [];
    const grouped = new Map<string, number>();
    const monthOrder = new Map<number, string>();
    const dayOrder = new Map<number, string>();

    const pushValue = (key: string) => {
      grouped.set(key, (grouped.get(key) ?? 0) + 1);
    };

    operaciones.forEach((item: OperacionDashboard) => {
      const fecha = new Date(item.fechaAsignacion);

      if (chartDimension === "mes") {
        const month = fecha.getMonth() + 1;
        const label = monthLabels[month - 1] ?? String(month);
        monthOrder.set(month, label);
        pushValue(label);
        return;
      }

      if (chartDimension === "dia") {
        const day = fecha.getDate();
        const label = String(day).padStart(2, "0");
        dayOrder.set(day, label);
        pushValue(label);
        return;
      }

      if (chartDimension === "modelo") {
        pushValue(item.modeloNombre);
        return;
      }

      if (chartDimension === "sucursal") {
        pushValue(item.sucursalNombre);
        return;
      }

      pushValue(item.vendedorNombre);
    });

    if (chartDimension === "mes") {
      return Array.from(monthOrder.entries())
        .map(([month, label]) => ({
          order: month,
          label,
          total: grouped.get(label) ?? 0,
        }))
        .filter((item) => item.total > 0)
        .sort((a, b) => a.order - b.order)
        .map(({ label, total }) => ({ label, total }));
    }

    if (chartDimension === "dia") {
      return Array.from(dayOrder.entries())
        .map(([day, label]) => ({
          order: day,
          label,
          total: grouped.get(label) ?? 0,
        }))
        .filter((item) => item.total > 0)
        .sort((a, b) => a.order - b.order)
        .map(({ label, total }) => ({ label, total }));
    }

    return Array.from(grouped.entries())
      .map(([label, total]) => ({ label, total }))
      .sort((a, b) => b.total - a.total || a.label.localeCompare(b.label));
  }, [chartDimension, data]);

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
              Supervisa asignaciones por vendedor, cruza sucursales, modelos y dias, y detecta rapidamente donde se concentra la actividad.
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
                  <p className="text-lg font-bold text-gray-900">{chartData.length}</p>
                </div>
              </div>
            </article>

            <article className="rounded-lg bg-[#e4f3fa] px-3 py-2">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-white p-2 text-[#15aa9a] shadow-sm">
                  <Inbox size={14} />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500">Modelos</p>
                  <p className="text-lg font-bold text-gray-900">{modelosTabla.length}</p>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      <OperacionesFilters
        anio={anio}
        anios={anios}
        selectedMeses={selectedMeses}
        sucursales={data.filtros.sucursales}
        modelos={data.filtros.modelos}
        dias={data.filtros.dias}
        selectedSucursales={selectedSucursales}
        selectedModelos={selectedModelos}
        selectedDias={selectedDias}
        onAnioChange={setAnio}
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
            Proba cambiar el ano o quitar algunos filtros para ampliar el resultado.
          </p>
        </section>
      ) : (
        <>
          <OperacionesBarChart
            data={chartData}
            dimension={chartDimension}
            onDimensionChange={setChartDimension}
          />
          <OperacionesResumenTable data={data.tabla} modelos={modelosTabla} />
        </>
      )}
    </div>
  );
}
