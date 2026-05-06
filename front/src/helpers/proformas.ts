export const formatCurrencyAr = (value: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

export const formatPercentAr = (value: number) =>
  `${new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)}%`;

export const formatDateAr = (value: string) =>
  new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(new Date(value));

export const roundTo2 = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

export const buildUnitRows = (unidad: {
  versionNombre: string;
  cantidad: number;
  ivaUnidad: number;
  totalUnidad: number;
  descuentoUnidad: number;
  totalPatentamiento: number;
  totalFlete: number;
}) => {
  const rows = [{
    detalle: unidad.versionNombre,
    cantidad: unidad.cantidad,
    iva: unidad.ivaUnidad,
    neto: roundTo2(unidad.totalUnidad / (1 + unidad.ivaUnidad / 100)),
    total: roundTo2(unidad.totalUnidad),
    totales: roundTo2(unidad.cantidad * unidad.totalUnidad),
  }];

  if (unidad.totalPatentamiento > 0) {
    rows.push({
      detalle: "Patentamiento",
      cantidad: unidad.cantidad,
      iva: 0,
      neto: roundTo2(unidad.totalPatentamiento),
      total: roundTo2(unidad.totalPatentamiento),
      totales: roundTo2(unidad.cantidad * unidad.totalPatentamiento),
    });
  }

  if (unidad.totalFlete > 0) {
    rows.push({
      detalle: "Flete",
      cantidad: unidad.cantidad,
      iva: 21,
      neto: roundTo2(unidad.totalFlete / 1.21),
      total: roundTo2(unidad.totalFlete),
      totales: roundTo2(unidad.cantidad * unidad.totalFlete),
    });
  }

  if (unidad.descuentoUnidad > 0) {
    rows.push({
      detalle: "Descuento",
      cantidad: unidad.cantidad,
      iva: unidad.ivaUnidad,
      neto: roundTo2((unidad.descuentoUnidad / (1 + unidad.ivaUnidad / 100)) * -1),
      total: roundTo2(unidad.descuentoUnidad * -1),
      totales: roundTo2(unidad.cantidad * unidad.descuentoUnidad * -1),
    });
  }

  return rows;
};
