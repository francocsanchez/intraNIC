import type { SaldoOperacionCancelacionAnalysisNode } from "@/types/index";
import type { EChartsCoreOption } from "echarts/core";

const formatDays = (value: number) => `${Math.round(value)} día${Math.round(value) === 1 ? "" : "s"}`;
const formatDecimalDays = (value: number) => new Intl.NumberFormat("es-AR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value);
const formatMoney = (value: number) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(value);

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

const toChartNode = (node: SaldoOperacionCancelacionAnalysisNode, showSaldo: boolean): Record<string, unknown> => {
  const tone = toneForAverage(node.averageDays);
  const metric = showSaldo && typeof node.saldoTotal === "number"
    ? `${formatDays(node.averageDays)} · ${formatMoney(node.saldoTotal)}`
    : formatDays(node.averageDays);
  return {
    ...node,
    itemStyle: { color: tone.fill, borderColor: tone.stroke, borderWidth: 1.5, shadowBlur: 5, shadowColor: "rgba(24, 24, 27, 0.08)" },
    label: {
      formatter: `${wrapNodeName(node.name)}\n{days|${metric}}`,
      color: "#18181b",
      fontSize: 11,
      fontWeight: 600,
      lineHeight: 16,
      rich: { days: { color: tone.text, fontSize: 10, fontWeight: 400, lineHeight: 14 } },
    },
    children: node.children?.map((child) => toChartNode(child, showSaldo)),
  };
};

export const createSaldoOperacionTiempoTreeOption = (tree: SaldoOperacionCancelacionAnalysisNode, options: { showSaldo: boolean; operationLabel: string; edgeShape?: "curve" | "polyline" }): EChartsCoreOption => ({
  tooltip: {
    trigger: "item",
    backgroundColor: "#18181b",
    borderWidth: 0,
    textStyle: { color: "#fafafa" },
    formatter: (params: { data: SaldoOperacionCancelacionAnalysisNode }) => `<b>${params.data.name}</b><br/>Promedio: ${formatDecimalDays(params.data.averageDays)} días${options.showSaldo && typeof params.data.saldoTotal === "number" ? `<br/>Monto a cancelar: ${formatMoney(params.data.saldoTotal)}` : ""}<br/>${options.operationLabel}: ${params.data.operations}`,
  },
  series: [{
    type: "tree",
    data: [toChartNode(tree, options.showSaldo)],
    orient: "RL",
    top: "4%",
    bottom: "4%",
    left: "16%",
    right: "16%",
    symbol: "circle",
    symbolSize: 14,
    initialTreeDepth: -1,
    edgeShape: options.edgeShape ?? "polyline",
    roam: false,
    lineStyle: { color: "#cbd5e1", width: 1.4 },
    label: { position: "left", align: "right", verticalAlign: "middle" },
    leaves: { label: { position: "left", align: "right", verticalAlign: "middle" } },
  }],
});

export const countSaldoOperacionTreeLeaves = (node: SaldoOperacionCancelacionAnalysisNode): number => {
  if (!node.children?.length) return 1;
  return node.children.reduce((total, child) => total + countSaldoOperacionTreeLeaves(child), 0);
};
