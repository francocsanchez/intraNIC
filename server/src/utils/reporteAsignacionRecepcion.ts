export type AsignacionRecepcionRow = {
  interno: number;
  nrofab: string;
  version: string;
  chasis: string | null;
  fechaProblableRecep: string | null;
  fechaRecepcionRemito: string | null;
  color: string;
  diferenciaDias: number | null;
};

export type ReporteAsignacionRecepcion = {
  total: number;
  recibidos: number;
  pendientes: number;
  porDiaRecepcion: {
    fecha: string;
    cantidad: number;
  }[];
  estadoRecepcion: {
    name: string;
    value: number;
  }[];
};

const formatFecha = (fecha: string | Date) => {
  if (!fecha) return "";

  if (fecha instanceof Date) {
    return fecha.toISOString().split("T")[0];
  }

  return fecha.split("T")[0];
};

export const getReporteAsignacionRecepcion = (
  data: AsignacionRecepcionRow[]
): ReporteAsignacionRecepcion => {
  const porDiaMap = new Map<string, number>();

  let recibidos = 0;
  let pendientes = 0;

  for (const item of data) {
    if (item.fechaRecepcionRemito) {
      recibidos++;

      const fecha = formatFecha(item.fechaRecepcionRemito);
      porDiaMap.set(fecha, (porDiaMap.get(fecha) || 0) + 1);
    } else {
      pendientes++;
    }
  }

  const porDiaRecepcion = Array.from(porDiaMap.entries())
    .map(([fecha, cantidad]) => ({
      fecha,
      cantidad,
    }))
    .sort((a, b) => a.fecha.localeCompare(b.fecha));

  const estadoRecepcion = [
    { name: "Recibidos", value: recibidos },
    { name: "Pendientes", value: pendientes },
  ];

  return {
    total: data.length,
    recibidos,
    pendientes,
    porDiaRecepcion,
    estadoRecepcion,
  };
};