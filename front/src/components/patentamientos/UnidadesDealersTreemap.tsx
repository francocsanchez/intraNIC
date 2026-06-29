import Loading from "@/components/Loading";
import {
  getPatentamientosUnidadesDealersTreemap,
  type PatentamientosUnidadesDealersTreemap,
} from "@/services/patentamientosUnidadesDealersService";
import { useQuery } from "@tanstack/react-query";
import { ResponsiveContainer, Tooltip, Treemap } from "recharts";
import { useEffect } from "react";
import { toast } from "sonner";

const TREEMAP_COLORS = [
  "#15aa9a",
  "#2cb9ab",
  "#52c8ba",
  "#7ad4cb",
  "#9cddd7",
  "#bfe9e7",
  "#d7f1f1",
  "#e4f3fa",
];

const formatInteger = (value: number) => value.toLocaleString("es-AR");

const formatPercentage = (value: number) =>
  value.toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const LARGE_BLOCK_MIN_WIDTH = 140;
const LARGE_BLOCK_MIN_HEIGHT = 68;
const MEDIUM_BLOCK_MIN_WIDTH = 100;
const MEDIUM_BLOCK_MIN_HEIGHT = 42;
const BLOCK_PADDING_X = 8;
const BLOCK_PADDING_Y = 8;

const truncateLabel = (value: string, width: number, characterWidth = 6.2) => {
  const maxCharacters = Math.max(6, Math.floor(width / characterWidth));

  if (value.length <= maxCharacters) {
    return value;
  }

  return `${value.slice(0, Math.max(0, maxCharacters - 3)).trimEnd()}...`;
};

type TreemapNodePayload = {
  depth?: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  index?: number;
  name?: string;
  value?: number;
};

function CustomTreemapContent(props: TreemapNodePayload) {
  const { depth, x = 0, y = 0, width = 0, height = 0, index = 0, name = "", value = 0 } = props;

  if (depth !== 1 || width <= 0 || height <= 0) {
    return null;
  }

  const color = TREEMAP_COLORS[index % TREEMAP_COLORS.length];
  const innerWidth = Math.max(0, width - BLOCK_PADDING_X * 2);
  const canShowLargeLabel = width >= LARGE_BLOCK_MIN_WIDTH && height >= LARGE_BLOCK_MIN_HEIGHT;
  const canShowMediumLabel = width >= MEDIUM_BLOCK_MIN_WIDTH && height >= MEDIUM_BLOCK_MIN_HEIGHT;
  const dealerLabel = truncateLabel(name, innerWidth, 6.4);
  const valueLabel = formatInteger(value);

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={8}
        ry={8}
        fill={color}
        stroke="#ffffff"
        strokeWidth={3}
      />
      {canShowLargeLabel ? (
        <>
          <text
            x={x + BLOCK_PADDING_X}
            y={y + BLOCK_PADDING_Y + 12}
            fill="#0f172a"
            fontSize={11.5}
            fontWeight={600}
            stroke="none"
            strokeWidth={0}
            paintOrder="normal"
            filter="none"
            style={{ textShadow: "none", WebkitTextStroke: "0px transparent" }}
          >
            {dealerLabel}
          </text>
          <text
            x={x + BLOCK_PADDING_X}
            y={y + BLOCK_PADDING_Y + 30}
            fill="#0f172a"
            fontSize={12.5}
            fontWeight={700}
            stroke="none"
            strokeWidth={0}
            paintOrder="normal"
            filter="none"
            style={{ textShadow: "none", WebkitTextStroke: "0px transparent" }}
          >
            {valueLabel}
          </text>
        </>
      ) : canShowMediumLabel ? (
        <text
          x={x + BLOCK_PADDING_X}
          y={y + BLOCK_PADDING_Y + 12}
          fill="#0f172a"
          fontSize={11.5}
          fontWeight={600}
          stroke="none"
          strokeWidth={0}
          paintOrder="normal"
          filter="none"
          style={{ textShadow: "none", WebkitTextStroke: "0px transparent" }}
        >
          {dealerLabel}
        </text>
      ) : null}
    </g>
  );
}

function CustomTooltip({
  active,
  payload,
  total,
}: {
  active?: boolean;
  payload?: Array<{ payload?: PatentamientosUnidadesDealersTreemap["data"][number] }>;
  total: number;
}) {
  if (!active || !payload?.length || !payload[0]?.payload) {
    return null;
  }

  const item = payload[0].payload;
  const percentage = total > 0 ? (item.value / total) * 100 : 0;

  return (
    <div className="rounded-xl border border-gray-200 bg-white px-3 py-3 shadow-lg">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500">Dealer</p>
      <p className="mt-1 text-sm font-semibold text-gray-900">{item.name}</p>
      <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500">Unidades</p>
      <p className="mt-1 text-sm font-medium text-gray-800">{formatInteger(item.value)}</p>
      <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500">Participacion</p>
      <p className="mt-1 text-sm font-medium text-gray-800">{formatPercentage(percentage)}%</p>
    </div>
  );
}

export default function UnidadesDealersTreemap({ year }: { year: number | null }) {
  const treemapQuery = useQuery({
    queryKey: ["patentamientos-unidades-dealers", "treemap", year],
    queryFn: () => getPatentamientosUnidadesDealersTreemap(year),
  });

  useEffect(() => {
    if (treemapQuery.error instanceof Error) {
      toast.error(treemapQuery.error.message);
    }
  }, [treemapQuery.error]);

  if (treemapQuery.isLoading) {
    return (
      <section className="overflow-hidden rounded-xl border border-gray-300 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-4 py-3">
          <h2 className="text-base font-semibold tracking-tight text-gray-900">Participacion por dealer</h2>
        </div>
        <div className="flex h-[300px] items-center justify-center">
          <Loading />
        </div>
      </section>
    );
  }

  if (treemapQuery.error instanceof Error || !treemapQuery.data?.data.length) {
    return (
      <section className="overflow-hidden rounded-xl border border-gray-300 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-4 py-3">
          <h2 className="text-base font-semibold tracking-tight text-gray-900">Participacion por dealer</h2>
          <p className="mt-1 text-sm text-gray-500">Peso relativo de cada concesionario sobre el total de unidades Toyota.</p>
        </div>
        <div className="flex h-[300px] items-center justify-center px-6 text-center text-sm text-gray-500">
          No hay datos de unidades disponibles.
        </div>
      </section>
    );
  }

  const total = treemapQuery.data.data.reduce((sum, item) => sum + item.value, 0);

  return (
    <section className="overflow-hidden rounded-xl border border-gray-300 bg-white shadow-sm">
      <div className="border-b border-gray-200 px-4 py-3">
        <h2 className="text-base font-semibold tracking-tight text-gray-900">Participacion por dealer</h2>
        <p className="mt-1 text-sm text-gray-500">Peso relativo de cada concesionario sobre el total de unidades Toyota.</p>
      </div>

      <div className="h-[300px] w-full px-3 py-3">
        <ResponsiveContainer width="100%" height="100%">
          <Treemap
            data={treemapQuery.data.data}
            dataKey="value"
            stroke="#ffffff"
            content={<CustomTreemapContent />}
            isAnimationActive
          >
            <Tooltip content={<CustomTooltip total={total} />} />
          </Treemap>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
