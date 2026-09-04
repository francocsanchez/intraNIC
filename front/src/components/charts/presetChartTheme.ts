const chartTokens = [
  "--chart-1",
  "--chart-2",
  "--chart-3",
  "--chart-4",
  "--chart-5",
] as const;

export function getPresetChartColors() {
  if (typeof window === "undefined") return [];

  const styles = window.getComputedStyle(document.documentElement);
  return chartTokens
    .map((token) => styles.getPropertyValue(token).trim())
    .filter(Boolean);
}

export function getPresetChartColor(index: number) {
  const colors = getPresetChartColors();
  return colors[index % colors.length] ?? "currentColor";
}
