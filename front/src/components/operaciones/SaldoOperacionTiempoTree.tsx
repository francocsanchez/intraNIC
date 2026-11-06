import type { SaldoOperacionCancelacionAnalysisNode } from "@/types/index";
import type { EChartsCoreOption } from "echarts/core";

const formatDays = (value: number) => `${Math.round(value)} día${Math.round(value) === 1 ? "" : "s"}`;
const formatDecimalDays = (value: number) => new Intl.NumberFormat("es-AR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value);
const formatMoney = (value: number) => `$ ${new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(Math.round(value / 1_000_000))}M`;

const toneForAverage = (averageDays: number) => averageDays < 15
  ? { fill: "#dcfce7", stroke: "#4ade80", text: "#166534" }
  : averageDays < 18
    ? { fill: "#fef9c3", stroke: "#facc15", text: "#854d0e" }
    : { fill: "#fee2e2", stroke: "#f87171", text: "#991b1b" };

const wrapNodeName = (name: string) => name.split(" ").reduce<string[]>((lines, word) => {
  const currentLine = lines.at(-1) ?? "";
  if (!currentLine) lines.push(word);
  else if (`${currentLine} ${word}`.length <= 18) lines[lines.length - 1] = `${currentLine} ${word}`;
  else lines.push(word);
  return lines;
}, []).join("\n");

const toChartNode = (node: SaldoOperacionCancelacionAnalysisNode, showSaldo: boolean, clickable: boolean, tvMode: boolean): Record<string, unknown> => {
  const tone = toneForAverage(node.averageDays);
  const metric = showSaldo && typeof node.saldoTotal === "number"
    ? `${formatDays(node.averageDays)} · ${formatMoney(node.saldoTotal)}`
    : formatDays(node.averageDays);
  return {
    ...node,
    ...(clickable ? { cursor: "pointer" } : {}),
    itemStyle: { color: tone.fill, borderColor: tone.stroke, borderWidth: tvMode ? 2 : 1.5, shadowBlur: tvMode ? 0 : 5, shadowColor: "rgba(24, 24, 27, 0.08)" },
    label: {
      formatter: `${wrapNodeName(node.name)}\n{days|${metric}}`,
      color: "#18181b",
      fontSize: tvMode ? 14 : 11,
      fontWeight: 600,
      lineHeight: tvMode ? 20 : 16,
      rich: { days: { color: tone.text, fontSize: tvMode ? 12 : 10, fontWeight: 500, lineHeight: tvMode ? 18 : 14 } },
    },
    children: node.children?.map((child) => toChartNode(child, showSaldo, clickable, tvMode)),
  };
};

export const createSaldoOperacionTiempoTreeOption = (tree: SaldoOperacionCancelacionAnalysisNode, options: { showSaldo: boolean; operationLabel: string; clickable?: boolean; edgeShape?: "curve" | "polyline"; tvMode?: boolean }): EChartsCoreOption => ({
  tooltip: {
    trigger: "item",
    backgroundColor: "#18181b",
    borderWidth: 0,
    textStyle: { color: "#fafafa" },
    formatter: (params: { data: SaldoOperacionCancelacionAnalysisNode }) => `<b>${params.data.name}</b><br/>Promedio: ${formatDecimalDays(params.data.averageDays)} días${options.showSaldo && typeof params.data.saldoTotal === "number" ? `<br/>Monto a cancelar: ${formatMoney(params.data.saldoTotal)}` : ""}<br/>${options.operationLabel}: ${params.data.operations}`,
  },
  series: [{
    type: "tree",
    data: [toChartNode(tree, options.showSaldo, Boolean(options.clickable), Boolean(options.tvMode))],
    orient: "RL",
    top: options.tvMode ? "5%" : "4%",
    bottom: options.tvMode ? "5%" : "4%",
    left: options.tvMode ? "19%" : "16%",
    right: options.tvMode ? "19%" : "16%",
    symbol: "circle",
    symbolSize: options.tvMode ? 19 : 14,
    initialTreeDepth: -1,
    edgeShape: options.edgeShape ?? "polyline",
    roam: false,
    lineStyle: { color: "#94a3b8", width: options.tvMode ? 2 : 1.4 },
    label: { position: "left", align: "right", verticalAlign: "middle" },
    leaves: { label: { position: "left", align: "right", verticalAlign: "middle" } },
  }],
});

export const countSaldoOperacionTreeLeaves = (node: SaldoOperacionCancelacionAnalysisNode): number => {
  if (!node.children?.length) return 1;
  return node.children.reduce((total, child) => total + countSaldoOperacionTreeLeaves(child), 0);
};
