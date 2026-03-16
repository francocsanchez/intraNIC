export type StockLiessRow = {
  interno: number;
  estado: number;
  marca: string;
  version: string;
  chasis: string | null;
  color: string | null;
  reservaVendedor: string;
  tipo: "nuevo" | "usado";
  fechaRecepcion: string;
};

const normalizeText = (value: string) => (value || "").trim().toUpperCase().replace(/\s+/g, " ");

const toMarcaKey = (marca: string) => normalizeText(marca);
const toTipoKey = (tipo: string) => normalizeText(tipo);

export const buildResumenLiess = (rows: StockLiessRow[]) => {
  const porMarca: Record<string, number> = {};
  const porTipo: Record<string, number> = {};
  const porReserva: Record<string, number> = {};

  for (const row of rows) {
    const marcaKey = toMarcaKey(row.marca);
    const tipoKey = toTipoKey(row.tipo);
    const reservaKey = normalizeText(row.reservaVendedor || "SIN RESERVA");

    porMarca[marcaKey] = (porMarca[marcaKey] ?? 0) + 1;
    porTipo[tipoKey] = (porTipo[tipoKey] ?? 0) + 1;
    porReserva[reservaKey] = (porReserva[reservaKey] ?? 0) + 1;
  }

  const tablasPorMarca: Record<string, StockLiessRow[]> = {};

  for (const row of rows) {
    const marcaKey = toMarcaKey(row.marca);

    if (!tablasPorMarca[marcaKey]) {
      tablasPorMarca[marcaKey] = [];
    }

    tablasPorMarca[marcaKey].push(row);
  }

  return {
    total: rows.length,
    totalNuevos: porTipo.NUEVO ?? 0,
    totalUsados: porTipo.USADO ?? 0,
    porMarca,
    porTipo,
    porReserva,
    marcas: Object.keys(tablasPorMarca),
    tablasPorMarca,
  };
};
