import Loading from "@/components/Loading";
import { getStockConsolidado } from "@/api/dms/dmsAPI";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  LabelList,
} from "recharts";

type PorEstado = Record<string, number>;

type ResumenAgrupadoItem = {
  nombre: string;
  total: number;
  porEstado: PorEstado;
};

type ResumenNIC = {
  total: number;
  totalUsados: number;
  totalNuevos: number;
  usadosPorMarca: Record<string, ResumenAgrupadoItem>;
  nuevosPorTipoOrder: {
    convencional: Record<string, ResumenAgrupadoItem>;
    "v. especiales": Record<string, ResumenAgrupadoItem>;
    "plan de ahorro": Record<string, ResumenAgrupadoItem>;
  };
};

type ResumenLiessMarcaItem = {
  marca: string;
  total: number;
  nuevo: number;
  usado: number;
};

type ResumenLiess = {
  total: number;
  marcas: Record<string, ResumenLiessMarcaItem>;
};

type ResumenResponse = {
  resumen: {
    totales: {
      nic: number;
      liess: number;
      general: number;
    };
    nic: ResumenNIC;
    liess: ResumenLiess;
  };
};

type PieDatum = {
  name: string;
  value: number;
};

type BarDatum = {
  name: string;
  total: number;
};

const CHART_COLORS = [
  "#15aa9a",
  "#43bbb0",
  "#6ccbc2",
  "#95dbd4",
  "#beeae6",
  "#e4f3fa",
  "#8fd7eb",
  "#bfe7f3",
];

function sumGroupedTotal(group: Record<string, ResumenAgrupadoItem>) {
  return Object.values(group).reduce((acc, item) => acc + item.total, 0);
}

function buildEstadoChartFromGrouped(
  group: Record<string, ResumenAgrupadoItem>
): PieDatum[] {
  const acumulado: Record<string, number> = {};

  Object.values(group).forEach((item) => {
    Object.entries(item.porEstado).forEach(([estado, cantidad]) => {
      acumulado[estado] = (acumulado[estado] ?? 0) + cantidad;
    });
  });

  return Object.entries(acumulado)
    .map(([name, value]) => ({ name, value }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value);
}

function buildBarFromGrouped(
  group: Record<string, ResumenAgrupadoItem>
): BarDatum[] {
  return Object.values(group)
    .map((item) => ({
      name: item.nombre,
      total: item.total,
    }))
    .filter((item) => item.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);
}

function buildLiessEstadoChart(
  group: Record<string, ResumenLiessMarcaItem>
): PieDatum[] {
  let nuevo = 0;
  let usado = 0;

  Object.values(group).forEach((item) => {
    nuevo += item.nuevo;
    usado += item.usado;
  });

  return [
    { name: "Nuevo", value: nuevo },
    { name: "Usado", value: usado },
  ].filter((item) => item.value > 0);
}

function buildBarFromLiess(
  group: Record<string, ResumenLiessMarcaItem>
): BarDatum[] {
  return Object.values(group)
    .map((item) => ({
      name: item.marca,
      total: item.total,
    }))
    .filter((item) => item.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);
}

function ChartEmptyState({ text }: { text: string }) {
  return (
    <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 text-sm text-gray-500">
      {text}
    </div>
  );
}

function PieCard({
  title,
  data,
  total,
}: {
  title: string;
  data: PieDatum[];
  total: number;
}) {
  return (
    <article className="min-w-0 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold tracking-tight text-gray-900">
        {title}
      </h2>

      <div className="relative mt-4 h-52 w-full min-w-0">
        {data.length ? (
          <>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={32}
                  outerRadius={54}
                  paddingAngle={3}
                >
                  {data.map((entry, index) => (
                    <Cell
                      key={`${entry.name}-${index}`}
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [Number(value ?? 0), "Cantidad"]} />
              </PieChart>
            </ResponsiveContainer>

            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-lg font-bold text-gray-900">{total}</p>
                <p className="text-[10px] uppercase tracking-wider text-gray-500">
                  Total
                </p>
              </div>
            </div>
          </>
        ) : (
          <ChartEmptyState text="Sin datos disponibles." />
        )}
      </div>

      {!!data.length && (
        <div className="mt-3 flex flex-wrap gap-x-3 gap-y-2">
          {data.map((item, index) => (
            <div
              key={item.name}
              className="flex items-center gap-2 text-[11px] text-gray-700"
            >
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{
                  backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
                }}
              />
              <span>
                {item.name}: {item.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}

function BarCard({
  title,
  data,
}: {
  title: string;
  data: BarDatum[];
}) {
  return (
    <article className="min-w-0 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold tracking-tight text-gray-900">
        {title}
      </h2>

      <div className="mt-4 h-64 w-full min-w-0">
        {data.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 8, right: 24, left: 8, bottom: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis type="number" allowDecimals={false} />
              <YAxis
                type="category"
                dataKey="name"
                width={88}
                tick={{ fontSize: 10 }}
              />
              <Tooltip formatter={(value) => [Number(value ?? 0), "Cantidad"]} />
              <Bar dataKey="total" fill="#15aa9a" radius={[0, 6, 6, 0]}>
                <LabelList
                  dataKey="total"
                  position="right"
                  style={{ fill: "#374151", fontSize: 11 }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <ChartEmptyState text="Sin datos disponibles." />
        )}
      </div>
    </article>
  );
}

export default function ConsolidadoView() {
  const { data, isLoading, isError } = useQuery<ResumenResponse>({
    queryKey: ["stock", "consolidado"],
    queryFn: getStockConsolidado,
    refetchOnWindowFocus: true,
  });

  const resumen = data?.resumen;

  const dataset = useMemo(() => {
    if (!resumen) {
      return {
        totalGeneral: 0,
        totalConvencional: 0,
        totalVEspeciales: 0,
        totalPlanAhorro: 0,
        totalUsados: 0,
        totalLiess: 0,
        pieConvencional: [] as PieDatum[],
        pieVEspeciales: [] as PieDatum[],
        piePlanAhorro: [] as PieDatum[],
        pieUsados: [] as PieDatum[],
        pieLiess: [] as PieDatum[],
        barConvencional: [] as BarDatum[],
        barVEspeciales: [] as BarDatum[],
        barPlanAhorro: [] as BarDatum[],
        barUsados: [] as BarDatum[],
        barLiess: [] as BarDatum[],
      };
    }

    const convencionalGroup = resumen.nic.nuevosPorTipoOrder.convencional;
    const vEspecialesGroup = resumen.nic.nuevosPorTipoOrder["v. especiales"];
    const planAhorroGroup = resumen.nic.nuevosPorTipoOrder["plan de ahorro"];
    const usadosGroup = resumen.nic.usadosPorMarca;
    const liessGroup = resumen.liess.marcas;

    const totalConvencional = sumGroupedTotal(convencionalGroup);
    const totalVEspeciales = sumGroupedTotal(vEspecialesGroup);
    const totalPlanAhorro = sumGroupedTotal(planAhorroGroup);
    const totalUsados = sumGroupedTotal(usadosGroup);
    const pieLiess = buildLiessEstadoChart(liessGroup);
    const totalLiess = pieLiess.reduce((acc, item) => acc + item.value, 0);

    return {
      totalGeneral:
        totalConvencional +
        totalVEspeciales +
        totalPlanAhorro +
        totalUsados +
        totalLiess,
      totalConvencional,
      totalVEspeciales,
      totalPlanAhorro,
      totalUsados,
      totalLiess,
      pieConvencional: buildEstadoChartFromGrouped(convencionalGroup),
      pieVEspeciales: buildEstadoChartFromGrouped(vEspecialesGroup),
      piePlanAhorro: buildEstadoChartFromGrouped(planAhorroGroup),
      pieUsados: buildEstadoChartFromGrouped(usadosGroup),
      pieLiess,
      barConvencional: buildBarFromGrouped(convencionalGroup),
      barVEspeciales: buildBarFromGrouped(vEspecialesGroup),
      barPlanAhorro: buildBarFromGrouped(planAhorroGroup),
      barUsados: buildBarFromGrouped(usadosGroup),
      barLiess: buildBarFromLiess(liessGroup),
    };
  }, [resumen]);

  if (isLoading) return <Loading />;

  if (isError || !resumen) {
    return (
      <div className="w-full px-4 py-6">
        <section className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold tracking-tight text-gray-900">
            Error al cargar consolidado de stock
          </h1>
          <p className="mt-2 text-sm text-red-600">
            No fue posible obtener la información.
          </p>
        </section>
      </div>
    );
  }

  const cards = [
    { label: "Total general", value: dataset.totalGeneral, accent: "text-gray-900" },
    {
      label: "Convencional",
      value: dataset.totalConvencional,
      accent: "text-[#15aa9a]",
    },
    {
      label: "V. especiales",
      value: dataset.totalVEspeciales,
      accent: "text-[#15aa9a]",
    },
    {
      label: "Plan de ahorro",
      value: dataset.totalPlanAhorro,
      accent: "text-[#15aa9a]",
    },
    { label: "Usados", value: dataset.totalUsados, accent: "text-gray-900" },
    { label: "Liess", value: dataset.totalLiess, accent: "text-gray-900" },
  ];

  return (
    <div className="w-full space-y-6 px-4 py-6">
      <section className="min-w-0 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          Consolidado de stock
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Resumen general de stock con análisis por estado, modelo y marca.
        </p>
      </section>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {cards.map((card) => (
          <article
            key={card.label}
            className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
              {card.label}
            </p>
            <p className={`mt-3 text-3xl font-bold ${card.accent}`}>{card.value}</p>
          </article>
        ))}
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-gray-900">
            Gráficos por estado
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          <PieCard
            title="Convencional"
            data={dataset.pieConvencional}
            total={dataset.totalConvencional}
          />
          <PieCard
            title="V. especiales"
            data={dataset.pieVEspeciales}
            total={dataset.totalVEspeciales}
          />
          <PieCard
            title="Plan de ahorro"
            data={dataset.piePlanAhorro}
            total={dataset.totalPlanAhorro}
          />
          <PieCard
            title="Usados"
            data={dataset.pieUsados}
            total={dataset.totalUsados}
          />
          <PieCard
            title="Liess"
            data={dataset.pieLiess}
            total={dataset.totalLiess}
          />
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-gray-900">
            Gráficos comparativos
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <BarCard
            title="Convencional (por modelo)"
            data={dataset.barConvencional}
          />
          <BarCard
            title="V. especiales (por modelo)"
            data={dataset.barVEspeciales}
          />
          <BarCard
            title="Plan de ahorro (por modelo)"
            data={dataset.barPlanAhorro}
          />
          <BarCard title="Usados (por marca)" data={dataset.barUsados} />
          <BarCard title="Liess (por marca)" data={dataset.barLiess} />
        </div>
      </section>
    </div>
  );
}
