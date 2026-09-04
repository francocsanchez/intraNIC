import {
  GridComponent,
  LegendComponent,
  TooltipComponent,
} from "echarts/components";
import { BarChart, LineChart, PieChart, TreemapChart } from "echarts/charts";
import {
  init,
  use as registerECharts,
  type EChartsCoreOption,
} from "echarts/core";
import { SVGRenderer } from "echarts/renderers";
import { useEffect, useRef } from "react";

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
};

export default function EChart({ option, className = "" }: EChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const chart = init(container, undefined, { renderer: "svg" });
    chart.setOption(option, { notMerge: true });

    const resizeObserver = new ResizeObserver(() => chart.resize());
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      chart.dispose();
    };
  }, [option]);

  return (
    <div ref={containerRef} className={`h-full w-full ${className}`.trim()} />
  );
}
