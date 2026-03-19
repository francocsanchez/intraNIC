export type UnidadRow = {
  interno: number;
  version: string;
  marca: string;
  observaciones: string | null;
  color: string;
  anio: number;
  precioVenta: number;
  fechaRecepcion: string;
  kilometros: number;
};

export const buildReportePorMarca = (rows: UnidadRow[]) => {
  const porMarca: Record<string, number> = {};

  for (const r of rows) {
    const marca = (r.marca || "SIN MARCA").trim().toUpperCase();

    porMarca[marca] = (porMarca[marca] ?? 0) + 1;
  }

  const total = rows.length;

  return {
    total,
    porMarca,
  };
};
