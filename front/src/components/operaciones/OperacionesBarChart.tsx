import {
  CartesianGrid,
  LabelList,
  Legend,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type OperacionesChartDimension = "mes" | "dia" | "modelo" | "sucursal" | "vendedor";
export type OperacionesChartCompare = "none" | "anio";

export type OperacionesChartPoint = {
  label: string;
  total?: number;
  [seriesKey: string]: string | number | undefined;
};

type OperacionesBarChartProps = {
  data: OperacionesChartPoint[];
  dimension: OperacionesChartDimension;
  compareBy: OperacionesChartCompare;
  seriesKeys: string[];
  onDimensionChange: (dimension: OperacionesChartDimension) => void;
  onCompareByChange: (value: OperacionesChartCompare) => void;
};

const DIMENSION_LABELS: Record<OperacionesChartDimension, string> = {
  mes: "Mes",
  dia: "Dia",
  modelo: "Modelo",
  sucursal: "Sucursal",
  vendedor: "Vendedor",
};

const COMPARE_LABELS: Record<OperacionesChartCompare, string> = {
  none: "Sin comparar",
  anio: "Ano",
};

const SERIES_COLORS = ["#15aa9a", "#7c7c7c", "#0f766e", "#94a3b8", "#16a34a", "#f59e0b"];

export default function OperacionesBarChart({
  data,
  dimension,
  compareBy,
  seriesKeys,
  onDimensionChange,
  onCompareByChange,
}: OperacionesBarChartProps) {
  const chartWidth = Math.max(data.length * 88, 720);
  const effectiveSeriesKeys = compareBy === "anio" ? seriesKeys : ["total"];

  return (
    <section className="rounded-[28px] border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-gray-900">
            Operaciones por {DIMENSION_LABELS[dimension].toLowerCase()}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            La linea se recompone segun la dimension elegida y puede comparar por ano.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
              Dimension
            </span>
            <select
              value={dimension}
              onChange={(event) =>
                onDimensionChange(event.target.value as OperacionesChartDimension)
              }
              className="rounded-md border border-[#d6e7ed] bg-white px-2.5 py-1.5 text-xs text-gray-900 outline-none transition-colors focus:border-[#15aa9a]"
            >
              <option value="mes">Mes</option>
              <option value="dia">Dia</option>
              <option value="modelo" disabled={compareBy === "anio"}>Modelo</option>
              <option value="sucursal" disabled={compareBy === "anio"}>Sucursal</option>
              <option value="vendedor" disabled={compareBy === "anio"}>Vendedor</option>
            </select>
          </label>

          <label className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
              Comparar
            </span>
            <select
              value={compareBy}
              onChange={(event) =>
                onCompareByChange(event.target.value as OperacionesChartCompare)
              }
              className="rounded-md border border-[#d6e7ed] bg-white px-2.5 py-1.5 text-xs text-gray-900 outline-none transition-colors focus:border-[#15aa9a]"
            >
              <option value="none">{COMPARE_LABELS.none}</option>
              <option value="anio">{COMPARE_LABELS.anio}</option>
            </select>
          </label>

          <span className="w-fit rounded-full bg-[#e4f3fa] px-3 py-1 text-xs font-semibold text-[#128c80]">
            {data.length} puntos
          </span>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto pb-2">
        <div style={{ width: `${chartWidth}px`, minWidth: "100%" }}>
          <LineChart
            width={chartWidth}
            height={360}
            data={data}
            margin={{ top: 20, right: 16, left: 0, bottom: 20 }}
          >
            <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
            <XAxis
              dataKey="label"
              angle={data.length > 6 ? -35 : 0}
              textAnchor={data.length > 6 ? "end" : "middle"}
              height={data.length > 6 ? 88 : 40}
              axisLine={false}
              tickLine={false}
              interval={0}
              tick={{ fontSize: 12, fill: "#4b5563" }}
            />
            <YAxis
              allowDecimals={false}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "#6b7280" }}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 16,
                borderColor: "#cfe7ee",
                boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
              }}
              formatter={(value, name) => [`${value} operaciones`, compareBy === "anio" ? name : "Total"]}
              labelFormatter={(label) => `${DIMENSION_LABELS[dimension]}: ${label}`}
            />
            {compareBy === "anio" ? <Legend /> : null}

            {effectiveSeriesKeys.map((seriesKey, index) => (
              <Line
                key={seriesKey}
                type="monotone"
                dataKey={seriesKey}
                name={seriesKey}
                stroke={SERIES_COLORS[index % SERIES_COLORS.length]}
                strokeWidth={2.5}
                dot={{
                  r: 3,
                  fill: SERIES_COLORS[index % SERIES_COLORS.length],
                  stroke: SERIES_COLORS[index % SERIES_COLORS.length],
                }}
                activeDot={{
                  r: 5,
                  fill: SERIES_COLORS[index % SERIES_COLORS.length],
                  stroke: SERIES_COLORS[index % SERIES_COLORS.length],
                }}
                connectNulls
              >
                <LabelList dataKey={seriesKey} position="top" fill="#0f172a" fontSize={11} />
              </Line>
            ))}
          </LineChart>
        </div>
      </div>
    </section>
  );
}
