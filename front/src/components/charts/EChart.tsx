import {
  GridComponent,
  LegendComponent,
  TooltipComponent,
} from "echarts/components";
import { BarChart, LineChart, PieChart, TreemapChart } from "echarts/charts";
import {
  init,
  use as registerECharts,
  type ECharts,
  type EChartsCoreOption,
} from "echarts/core";
import { SVGRenderer } from "echarts/renderers";
import { useLayoutEffect, useRef } from "react";
import { resolveChartColor } from "./presetChartTheme";

registerECharts([
  BarChart,
  GridComponent,
  LegendComponent,
  LineChart,
  PieChart,
  SVGRenderer,
  TooltipComponent,
  TreemapChart,
]);

type EChartProps = {
  option: EChartsCoreOption;
  className?: string;
  enableHoverEmphasis?: boolean;
};

function resolveChartOption<T>(value: T): T {
  if (typeof value === "string") {
    return resolveChartColor(value) as T;
  }

  if (Array.isArray(value)) {
    return value.map(resolveChartOption) as T;
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, resolveChartOption(entry)]),
    ) as T;
  }

  return value;
}

function getOptionObject(value: unknown) {
  return value && typeof value === "object" ? value as Record<string, unknown> : {};
}

function stabilizeInteractiveOption(option: EChartsCoreOption, enableHoverEmphasis: boolean): EChartsCoreOption {
  const resolved = resolveChartOption(option);
  const series = (Array.isArray(resolved.series)
    ? resolved.series
    : [resolved.series].filter(Boolean)) as Array<Record<string, unknown>>;
  const palette = Array.isArray(resolved.color) ? resolved.color : [];

  return {
    ...resolved,
    animation: false,
    stateAnimation: { duration: 0 },
    tooltip: {
      ...(resolved.tooltip && typeof resolved.tooltip === "object"
        ? resolved.tooltip
        : {}),
      confine: true,
      transitionDuration: 0,
    },
    series: series.map((item, index) => {
      if (enableHoverEmphasis) {
        const emphasis = getOptionObject(item.emphasis);
        const blur = getOptionObject(item.blur);
        const itemStyle = getOptionObject(item.itemStyle);
        const lineStyle = getOptionObject(item.lineStyle);
        const color = itemStyle.color ?? palette[index % palette.length];
        const lineColor = lineStyle.color ?? color;

        return {
          ...item,
          emphasis: {
            ...emphasis,
            disabled: false,
            focus: emphasis.focus ?? "series",
            itemStyle: { ...getOptionObject(emphasis.itemStyle), ...(color ? { color } : {}), opacity: 1 },
            lineStyle: { ...getOptionObject(emphasis.lineStyle), ...(lineColor ? { color: lineColor } : {}), opacity: 1 },
          },
          blur: {
            ...blur,
            itemStyle: { ...getOptionObject(blur.itemStyle), ...(color ? { color } : {}), opacity: 0.35 },
            lineStyle: { ...getOptionObject(blur.lineStyle), ...(lineColor ? { color: lineColor } : {}), opacity: 0.35 },
          },
        };
      }

      return {
        ...item,
        emphasis: { ...(item.emphasis as object | undefined), disabled: true },
        blur: { ...(item.blur as object | undefined), opacity: 1 },
      };
    }),
  } as EChartsCoreOption;
}

export default function EChart({ option, className = "", enableHoverEmphasis = true }: EChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<ECharts | null>(null);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const chart = init(container, undefined, { renderer: "svg" });
    chartRef.current = chart;

    const resizeObserver = new ResizeObserver(() => {
      if (!chart.isDisposed()) chart.resize();
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      chart.dispose();
      chartRef.current = null;
    };
  }, []);

  useLayoutEffect(() => {
    const chart = chartRef.current;
    if (!chart || chart.isDisposed()) return;

    // ECharts cannot reliably resolve CSS custom properties inside SVG attributes.
    chart.setOption(stabilizeInteractiveOption(option, enableHoverEmphasis), { notMerge: true });
  }, [enableHoverEmphasis, option]);

  return (
    <div ref={containerRef} className={`h-full w-full ${className}`.trim()} />
  );
}
