/** Vehicle colours are labels, not an additional visual palette. */
export const tablaColores: Record<string, string> = {};

export function textToColor(color: string | null | undefined): string | null {
  if (!color?.trim()) return null;
  return "bg-secondary text-secondary-foreground border border-border";
}
