import type { PatentamientosDashboardEvolution } from "@/services/patentamientosDashboardService";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type PatentamientosToyotaEvolutionChartProps = {
  data: PatentamientosDashboardEvolution;
};

export default function PatentamientosToyotaEvolutionChart({
  data,
}: PatentamientosToyotaEvolutionChartProps) {
  const formatPercentage = (value: number) =>
    `${value.toLocaleString("es-AR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}%`;

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-gray-900">{data.title}</h2>
        <p className="mt-1 text-sm text-gray-500">Comparacion mensual del porcentaje de participacion de Toyota entre PAIS y Zona NIC.</p>
      </div>

      <div className="mt-5 h-[360px] w-full">
        {data.series.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.series} margin={{ top: 16, right: 16, left: 0, bottom: 8 }}>
              <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#4b5563" }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#6b7280" }}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 16,
                  borderColor: "#cfe7ee",
                  boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
                }}
                formatter={(value, name) => [formatPercentage(Number(value)), name === "pais" ? "Toyota PAIS" : "Toyota Zona NIC"]}
              />
              <Legend
                formatter={(value) => (value === "pais" ? "Toyota PAIS" : "Toyota Zona NIC")}
              />
              <Line
                type="monotone"
                dataKey="pais"
                stroke="#15aa9a"
                strokeWidth={3}
                dot={{ r: 4, fill: "#15aa9a", stroke: "#15aa9a" }}
                activeDot={{ r: 6, fill: "#15aa9a", stroke: "#15aa9a" }}
              />
              <Line
                type="monotone"
                dataKey="zonaNic"
                stroke="#334155"
                strokeWidth={3}
                dot={{ r: 4, fill: "#334155", stroke: "#334155" }}
                activeDot={{ r: 6, fill: "#334155", stroke: "#334155" }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 px-6 text-center text-sm text-gray-500">
            No hay informacion suficiente para graficar la evolucion de Toyota todavia.
          </div>
        )}
      </div>
    </section>
  );
}
