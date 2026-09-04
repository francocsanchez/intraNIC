const chartTokens = [
  "--chart-1",
  "--chart-2",
  "--chart-3",
  "--chart-4",
  "--chart-5",
] as const;

export function resolveChartColor(value: string) {
  if (typeof document === "undefined" || (!value.includes("var(") && !value.includes("oklch("))) {
    return value;
  }

  const sample = document.createElement("span");
  sample.style.color = value;
  sample.style.position = "absolute";
  sample.style.visibility = "hidden";
  document.body.appendChild(sample);
  const resolved = window.getComputedStyle(sample).color;
  sample.remove();
  return resolved || value;
}

export function getPresetChartColors() {
  if (typeof window === "undefined") return [];

  const styles = window.getComputedStyle(document.documentElement);
  return chartTokens
    .map((token) => resolveChartColor(styles.getPropertyValue(token).trim()))
    .filter(Boolean);
}

export function getPresetChartColor(index: number) {
  const colors = getPresetChartColors();
  return colors[index % colors.length] ?? "currentColor";
}
