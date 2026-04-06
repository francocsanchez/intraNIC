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

  // NEGROS
  "Negro Mica": "bg-gray-200 text-gray-700",
  BLACK: "bg-gray-200 text-gray-700",
  NEGRO: "bg-gray-200 text-gray-700",
  Negro: "bg-gray-200 text-gray-700",
  NEG: "bg-gray-200 text-gray-700",

  // NARANJA
  NARANJA: "bg-orange-50 text-orange-600 ring-1 ring-orange-200",

  // BRONCE
  BRONCE: "bg-amber-50 text-amber-600 ring-1 ring-amber-200",
  "SILKY GOLD": "bg-amber-50 text-amber-600 ring-1 ring-amber-200",

  // VERDE
  VERDE: "bg-green-50 text-green-600 ring-1 ring-green-200",
};

export function textToColor(color: string | null | undefined): string | null {
  if (color) {
    const colorFinal = tablaColores[color as keyof typeof tablaColores];
    if (colorFinal) {
      return colorFinal;
    }
  }
  return null;
}
