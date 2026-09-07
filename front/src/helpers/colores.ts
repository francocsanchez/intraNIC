/** Runtime class map populated by VehicleColorBadgeProvider. */
export let tablaColores: Record<string, string> = {};

export function setTablaColores(nextTabla: Record<string, string>) {
  tablaColores = nextTabla;
}

export function textToColor(color: string | null | undefined): string | null {
  if (!color?.trim()) return null;
  return tablaColores[normalizeColorName(color)] ?? "bg-secondary text-secondary-foreground border border-border";
}

export function normalizeColorName(color: string): string {
  return color
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("es-AR");
}

export function getContrastForeground(hex: string): "#111827" | "#FFFFFF" {
  const channels = [1, 3, 5].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16) / 255);
  const luminance = channels
    .map((value) => (value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4))
    .reduce((total, value, index) => total + value * [0.2126, 0.7152, 0.0722][index], 0);
  return luminance > 0.4 ? "#111827" : "#FFFFFF";
}
