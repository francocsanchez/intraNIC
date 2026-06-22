export const tablaColores: Record<string, string> = {
  // ROJOS
  ROJO: "bg-red-50 text-red-600",
  "Ignition Red": "bg-red-50 text-red-600",
  "Rojo Metalizado Bi-": "bg-red-50 text-red-600",
  "Rojo Metalizado": "bg-red-50 text-red-600",
  "Rojo Mica Metalizad": "bg-red-50 text-red-600",
  "Body Rojo Techo Neg": "bg-red-50 text-red-600",
  "Rojo Bitono": "bg-red-50 text-red-600",
  "RED MICA M": "bg-red-50 text-red-600",
  "Rojo Mica": "bg-red-50 text-red-600",
  "Rojo Mica ": "bg-red-50 text-red-600",
  "RED METALL": "bg-red-50 text-red-600",
  "Rojo Metal": "bg-red-50 text-red-600",

  // PLATA / GRIS CLARO
  "Plata Metalizado": "bg-slate-100 text-slate-600",
  "SILVER METALLIC": "bg-slate-100 text-slate-600",
  "Gris Plata Metaliza": "bg-slate-100 text-slate-600",
  "Gris Plata": "bg-slate-100 text-slate-600",
  "GRIS PLA": "bg-slate-100 text-slate-600",
  "GRIS PLATA": "bg-slate-100 text-slate-600",
  "Plata Metalizado Bi": "bg-slate-100 text-slate-600",
  "SILVER MET": "bg-slate-100 text-slate-600",
  "PLATEADO": "bg-slate-100 text-slate-600",
  "SILVER MIC": "bg-slate-100 text-slate-600",
  "Plata Meta": "bg-slate-100 text-slate-600",

  // GRIS OSCURO
  GRIS: "bg-slate-200 text-slate-700",
  "Gris Oscuro": "bg-slate-200 text-slate-700",
  "Gris Oscuro Metaliz": "bg-slate-200 text-slate-700",
  "GRIS OSCUR": "bg-slate-200 text-slate-700",
  "GRIS OSC": "bg-slate-200 text-slate-700",
  "Gris Oscur": "bg-slate-200 text-slate-700",
  "GRAY METAL": "bg-slate-200 text-slate-700",
  "GRAY METALLIC": "bg-slate-200 text-slate-700",
  "DARK STEEL MICA": "bg-slate-300 text-slate-800",

  // BORDO
  BORDO: "bg-rose-200 text-rose-700",
  "VINOTINTO": "bg-rose-200 text-rose-700",

  // AZULES
  "Gris Azulado": "bg-blue-50 text-blue-600",
  "Azul Metalizado": "bg-blue-50 text-blue-600",
  "Azul Oscuro Metaliz": "bg-blue-50 text-blue-600",
  CELESTE: "bg-blue-50 text-blue-600",
  AZUL: "bg-blue-50 text-blue-600",
  "AZUL CLA": "bg-blue-50 text-blue-600",
  "DARK BLUE": "bg-blue-50 text-blue-600",
  "GRIS AZULA": "bg-blue-50 text-blue-600",
  "AZUL ELECT": "bg-blue-50 text-blue-600",
  "BLUE": "bg-blue-50 text-blue-600",
  "Gris Azula": "bg-blue-50 text-blue-600",
  "Azul Metal": "bg-blue-50 text-blue-600",
  "AZUL METAL": "bg-blue-50 text-blue-600",
  "Azul Oscur": "bg-blue-50 text-blue-600",
  "DARK BLUE MICA": "bg-blue-100 text-blue-800",

  // NEGROS
  "Negro Mica": "bg-gray-200 text-gray-700",
  BLACK: "bg-gray-200 text-gray-700",
  "BLACK MICA": "bg-gray-200 text-gray-700",
  NEGRO: "bg-gray-200 text-gray-700",
  Negro: "bg-gray-200 text-gray-700",
  NEG: "bg-gray-200 text-gray-700",

  // NARANJA
  NARANJA: "bg-orange-50 text-orange-600 ring-1 ring-orange-200",

  // BRONCE
  BRONCE: "bg-amber-50 text-amber-600 ring-1 ring-amber-200",
  "SILKY GOLD": "bg-amber-50 text-amber-600 ring-1 ring-amber-200",
  "SILKY GOLD MICA META": "bg-amber-50 text-amber-600 ring-1 ring-amber-200",
  MARRON: "bg-amber-100 text-amber-800 ring-1 ring-amber-200",
  CREMA: "bg-stone-100 text-stone-700 ring-1 ring-stone-200",

  // VERDE
  VERDE: "bg-green-50 text-green-600 ring-1 ring-green-200",
  "DARK GREEN MICA": "bg-green-100 text-green-800 ring-1 ring-green-200",
  // BLANCO
  BLANCO: "bg-neutral-50 text-neutral-700 ring-1 ring-neutral-300",
  "BLANCO PERLADO": "bg-neutral-50 text-neutral-700 ring-1 ring-neutral-300",
  "SUPER WHITE": "bg-neutral-50 text-neutral-700 ring-1 ring-neutral-300",
};

const normalizeColorText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();

const normalizedColorTable = Object.fromEntries(
  Object.entries(tablaColores).map(([key, value]) => [normalizeColorText(key), value]),
) as Record<string, string>;

export function textToColor(color: string | null | undefined): string | null {
  if (color) {
    const normalized = normalizeColorText(color);

    const colorFinal =
      normalizedColorTable[normalized] ??
      Object.entries(normalizedColorTable).find(([key]) => normalized.includes(key) || key.includes(normalized))?.[1];

    if (colorFinal) {
      return colorFinal;
    }

    if (normalized.includes("BLANCO") || normalized.includes("WHITE") || normalized.includes("PERLA")) {
      return "bg-neutral-50 text-neutral-700 ring-1 ring-neutral-300";
    }

    if (normalized.includes("NEGRO") || normalized.includes("BLACK")) {
      return "bg-gray-200 text-gray-700";
    }

    if (normalized.includes("ROJO") || normalized.includes("RED")) {
      return "bg-red-50 text-red-600";
    }

    if (normalized.includes("AZUL") || normalized.includes("BLUE") || normalized.includes("CELESTE")) {
      return "bg-blue-50 text-blue-600";
    }

    if (normalized.includes("VERDE") || normalized.includes("GREEN")) {
      return "bg-green-50 text-green-600 ring-1 ring-green-200";
    }

    if (
      normalized.includes("PLATA") ||
      normalized.includes("SILVER") ||
      normalized.includes("GRIS") ||
      normalized.includes("GRAY")
    ) {
      return "bg-slate-100 text-slate-700";
    }

    if (normalized.includes("BORDO") || normalized.includes("VINOTINTO")) {
      return "bg-rose-200 text-rose-700";
    }

    if (normalized.includes("NARANJA")) {
      return "bg-orange-50 text-orange-600 ring-1 ring-orange-200";
    }

    if (
      normalized.includes("BRONCE") ||
      normalized.includes("GOLD") ||
      normalized.includes("MARRON") ||
      normalized.includes("CREMA")
    ) {
      return "bg-amber-50 text-amber-700 ring-1 ring-amber-200";
    }
  }
  return null;
}
