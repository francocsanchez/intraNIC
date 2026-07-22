import { QueryTypes } from "sequelize";
import { sequelizeNIC } from "../config/database";
import {
  analisisOperacionesPreventaDescuentoMensualQuery,
  analisisOperacionesPreventaPromedioCreditoPorModeloQuery,
  analisisOperacionesPreventaFormaPagoQuery,
  analisisOperacionesPreventaQuery,
  analisisOperacionesPreventaResumenFinanciacionQuery,
  operacionesDashboardQuery,
} from "../controllers/querys/operaciones.query";

type OperacionesDashboardFilters = {
  anios: number[];
  meses: number[];
  sucursales: string[];
  modelos: string[];
  dias: number[];
};

export const OPERACIONES_ANALISIS_TIPO_VALUES = ["Cero"] as const;
export type OperacionesAnalisisTipo = (typeof OPERACIONES_ANALISIS_TIPO_VALUES)[number];

type OperacionesAnalisisPreventaFilters = {
  anio: number;
  mes: number;
  tipo: OperacionesAnalisisTipo;
};

type OperacionDashboardRow = {
  codigoOperacion: number;
  fechaAsignacion: string | Date;
  vendedorNombre: string;
  sucursalNombre: string;
  modeloNombre: string;
  interno: string | number | null;
  chasis: string | null;
  __sucursalCodigo: string;
};

type OperacionDashboard = Omit<OperacionDashboardRow, "__sucursalCodigo">;

type OperacionesGraficoItem = {
  vendedor: string;
  total: number;
};

type OperacionesTablaRow = {
  vendedor: string;
  total: number;
  modelos: Record<string, number>;
};

type OperacionesFiltroOption = {
  label: string;
  value: string;
};

type OperacionesDashboardResponse = {
  operaciones: OperacionDashboard[];
  grafico: OperacionesGraficoItem[];
  tabla: OperacionesTablaRow[];
  filtros: {
    sucursales: OperacionesFiltroOption[];
    modelos: OperacionesFiltroOption[];
    dias: number[];
  };
};

type AnalisisOperacionPreventaRow = {
  numero: number | string | null;
  interno: number | string | null;
  fecha: string | Date | null;
  version: string | null;
  modelo: string | null;
  precio: number | string | null;
  vehiculo: number | string | null;
  accesorios: number | string | null;
  patentamiento: number | string | null;
  flete: number | string | null;
  formulario: number | string | null;
  prenda: number | string | null;
  equipamiento: number | string | null;
  preentrega: number | string | null;
  otro: number | string | null;
  bonificacion: number | string | null;
};

type AnalisisOperacionPreventaItem = {
  numero: number | null;
  interno: number | null;
  fecha: string | null;
  version: string;
  modelo: string;
  precio: number | null;
  vehiculo: number | null;
  accesorios: number | null;
  patentamiento: number | null;
  flete: number | null;
  formulario: number | null;
  prenda: number | null;
  equipamiento: number | null;
  preentrega: number | null;
  otro: number | null;
  bonificacion: number | null;
};

type AnalisisOperacionPreventaFormaPagoRow = {
  numero: number | string | null;
  usados: number | null;
  contado: number | null;
  cheque: number | null;
  credito_bancario: number | null;
};

type AnalisisOperacionPreventaFormaPagoItem = {
  numero: number | null;
  usados: number | null;
  contado: number | null;
  cheque: number | null;
  credito_bancario: number | null;
};

type AnalisisOperacionPreventaResponse = {
  filters: OperacionesAnalisisPreventaFilters;
  data: AnalisisOperacionPreventaItem[];
};

type AnalisisOperacionPreventaFormaPagoResponse = {
  data: AnalisisOperacionPreventaFormaPagoItem;
};

type AnalisisOperacionPreventaDescuentoMensualRow = {
  mes: number | string | null;
  modelo: string | null;
  descuento_promedio: number | string | null;
};

type AnalisisOperacionPreventaDescuentoMensualItem = {
  mes: number;
  modelo: string;
  descuentoPromedio: number;
};

type AnalisisOperacionPreventaDescuentoMensualResponse = {
  filters: {
    anio: number;
    tipo: OperacionesAnalisisTipo;
  };
  data: AnalisisOperacionPreventaDescuentoMensualItem[];
};

type AnalisisOperacionPreventaResumenFinanciacionRow = {
  cantidad_operaciones_credito: number | string | null;
  cantidad_operaciones_usado: number | string | null;
  promedio_valor_usado: number | string | null;
};

type AnalisisOperacionPreventaPromedioCreditoPorModeloRow = {
  modelo: string | null;
  promedio_credito: number | string | null;
};

type AnalisisOperacionPreventaResumenFinanciacionResponse = {
  filters: {
    anio: number;
    mes: number;
    tipo: OperacionesAnalisisTipo;
  };
  data: {
    cantidadOperacionesCredito: number;
    cantidadOperacionesUsado: number;
    promedioValorUsado: number | null;
    promedioCreditoPorModelo: Array<{
      modelo: string;
      promedioCredito: number;
    }>;
  };
};

const serializeFechaAsignacion = (fechaAsignacion: string | Date) =>
  fechaAsignacion instanceof Date ? fechaAsignacion.toISOString() : fechaAsignacion;

const serializeNullableDate = (value: string | Date | null) => {
  if (!value) {
    return null;
  }

  return value instanceof Date ? value.toISOString() : value;
};

const normalizeNullableString = (value: unknown) => {
  if (value === null || value === undefined) {
    return null;
  }

  const normalized = String(value).trim();
  return normalized.length > 0 ? normalized : null;
};

const normalizeNullableNumber = (value: unknown) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const getDayFromFechaAsignacion = (fechaAsignacion: string | Date) => {
  if (fechaAsignacion instanceof Date) {
    const day = fechaAsignacion.getDate();
    return Number.isInteger(day) ? day : NaN;
  }

  const match = fechaAsignacion.match(/^\d{4}-\d{2}-(\d{2})/);

  if (match) {
    return Number(match[1]);
  }

  const parsed = new Date(fechaAsignacion).getDate();
  return Number.isInteger(parsed) ? parsed : NaN;
};

export class OperacionesDashboardService {
  static async getDashboard(
    filters: OperacionesDashboardFilters,
  ): Promise<OperacionesDashboardResponse> {
    const [data, filterRows] = await Promise.all([
      sequelizeNIC.query<OperacionDashboardRow>(
        operacionesDashboardQuery({
          hasAnios: filters.anios.length > 0,
          hasMeses: filters.meses.length > 0,
          hasSucursales: filters.sucursales.length > 0,
          hasModelos: filters.modelos.length > 0,
          hasDias: filters.dias.length > 0,
        }),
        {
          type: QueryTypes.SELECT,
          replacements: {
            anios: filters.anios,
            meses: filters.meses,
            sucursales: filters.sucursales,
            modelos: filters.modelos,
            dias: filters.dias,
          },
        },
      ),
      sequelizeNIC.query<OperacionDashboardRow>(
        operacionesDashboardQuery({
          hasAnios: filters.anios.length > 0,
          hasMeses: filters.meses.length > 0,
          hasSucursales: false,
          hasModelos: false,
          hasDias: false,
        }),
        {
          type: QueryTypes.SELECT,
          replacements: {
            anios: filters.anios,
            meses: filters.meses,
          },
        },
      ),
    ]);

    const operaciones: OperacionDashboard[] = data.map(
      ({ __sucursalCodigo: _ignore, interno, fechaAsignacion, ...row }) => ({
        ...row,
        fechaAsignacion: serializeFechaAsignacion(fechaAsignacion),
        interno: interno === null ? null : String(interno),
      }),
    );

    const graficoMap = new Map<string, number>();
    const tablaMap = new Map<string, OperacionesTablaRow>();

    for (const row of data) {
      graficoMap.set(row.vendedorNombre, (graficoMap.get(row.vendedorNombre) ?? 0) + 1);

      if (!tablaMap.has(row.vendedorNombre)) {
        tablaMap.set(row.vendedorNombre, {
          vendedor: row.vendedorNombre,
          total: 0,
          modelos: {},
        });
      }

      const tablaRow = tablaMap.get(row.vendedorNombre)!;
      tablaRow.total += 1;
      tablaRow.modelos[row.modeloNombre] = (tablaRow.modelos[row.modeloNombre] ?? 0) + 1;
    }

    const sucursalesMap = new Map<string, string>();
    const modelosSet = new Set<string>();
    const diasSet = new Set<number>();

    for (const row of filterRows) {
      sucursalesMap.set(row.__sucursalCodigo, row.sucursalNombre);
      modelosSet.add(row.modeloNombre);

      const day = getDayFromFechaAsignacion(row.fechaAsignacion);
      if (Number.isInteger(day) && day > 0) {
        diasSet.add(day);
      }
    }

    const grafico = Array.from(graficoMap.entries())
      .map(([vendedor, total]) => ({ vendedor, total }))
      .sort((a, b) => b.total - a.total || a.vendedor.localeCompare(b.vendedor));

    const modelosOrdenados = Array.from(modelosSet).sort((a, b) => a.localeCompare(b));

    const tabla = Array.from(tablaMap.values())
      .map((row) => {
        const modelos = modelosOrdenados.reduce<Record<string, number>>((acc, modelo) => {
          if (row.modelos[modelo]) {
            acc[modelo] = row.modelos[modelo];
          }

          return acc;
        }, {});

        return {
          vendedor: row.vendedor,
          total: row.total,
          modelos,
        };
      })
      .sort((a, b) => b.total - a.total || a.vendedor.localeCompare(b.vendedor));

    const filtros = {
      sucursales: Array.from(sucursalesMap.entries())
        .map(([value, label]) => ({ value, label }))
        .sort((a, b) => a.label.localeCompare(b.label)),
      modelos: modelosOrdenados.map((modelo) => ({ value: modelo, label: modelo })),
      dias: Array.from(diasSet).sort((a, b) => a - b),
    };

    return {
      operaciones,
      grafico,
      tabla,
      filtros,
    };
  }

  static async getAnalisisPreventa(
    filters: OperacionesAnalisisPreventaFilters,
  ): Promise<AnalisisOperacionPreventaResponse> {
    const rows = await sequelizeNIC.query<AnalisisOperacionPreventaRow>(
      analisisOperacionesPreventaQuery(),
      {
        type: QueryTypes.SELECT,
        replacements: {
          anio: filters.anio,
          mes: filters.mes,
        },
      },
    );

    const data = rows.map((row) => ({
      numero: normalizeNullableNumber(row.numero),
      interno: normalizeNullableNumber(row.interno),
      fecha: serializeNullableDate(row.fecha),
      version: normalizeNullableString(row.version) ?? "",
      modelo: normalizeNullableString(row.modelo) ?? "",
      precio: normalizeNullableNumber(row.precio),
      vehiculo: normalizeNullableNumber(row.vehiculo),
      accesorios: normalizeNullableNumber(row.accesorios),
      patentamiento: normalizeNullableNumber(row.patentamiento),
      flete: normalizeNullableNumber(row.flete),
      formulario: normalizeNullableNumber(row.formulario),
      prenda: normalizeNullableNumber(row.prenda),
      equipamiento: normalizeNullableNumber(row.equipamiento),
      preentrega: normalizeNullableNumber(row.preentrega),
      otro: normalizeNullableNumber(row.otro),
      bonificacion: normalizeNullableNumber(row.bonificacion),
    }));

    return {
      filters,
      data,
    };
  }

  static async getAnalisisPreventaFormaPago(
    numero: number,
  ): Promise<AnalisisOperacionPreventaFormaPagoResponse | null> {
    const rows = await sequelizeNIC.query<AnalisisOperacionPreventaFormaPagoRow>(
      analisisOperacionesPreventaFormaPagoQuery(),
      {
        type: QueryTypes.SELECT,
        replacements: {
          numero,
        },
      },
    );

    const row = rows[0];

    if (!row) {
      return null;
    }

    return {
      data: {
        numero: normalizeNullableNumber(row.numero),
        usados: normalizeNullableNumber(row.usados),
        contado: normalizeNullableNumber(row.contado),
        cheque: normalizeNullableNumber(row.cheque),
        credito_bancario: normalizeNullableNumber(row.credito_bancario),
      },
    };
  }

  static async getAnalisisPreventaDescuentoMensual(
    anio: number,
  ): Promise<AnalisisOperacionPreventaDescuentoMensualResponse> {
    const rows = await sequelizeNIC.query<AnalisisOperacionPreventaDescuentoMensualRow>(
      analisisOperacionesPreventaDescuentoMensualQuery(),
      {
        type: QueryTypes.SELECT,
        replacements: {
          anio,
        },
      },
    );

    const data = rows
      .map((row) => ({
        mes: normalizeNullableNumber(row.mes),
        modelo: normalizeNullableString(row.modelo) ?? "SIN MODELO",
        descuentoPromedio: normalizeNullableNumber(row.descuento_promedio),
      }))
      .filter(
        (row): row is AnalisisOperacionPreventaDescuentoMensualItem =>
          row.mes !== null &&
          row.mes >= 1 &&
          row.mes <= 12 &&
          row.descuentoPromedio !== null,
      );

    return {
      filters: {
        anio,
        tipo: "Cero",
      },
      data,
    };
  }

  static async getAnalisisPreventaResumenFinanciacion(
    anio: number,
    mes: number,
  ): Promise<AnalisisOperacionPreventaResumenFinanciacionResponse> {
    const [rowsResumen, rowsPromedioCredito] = await Promise.all([
      sequelizeNIC.query<AnalisisOperacionPreventaResumenFinanciacionRow>(
        analisisOperacionesPreventaResumenFinanciacionQuery(),
        {
          type: QueryTypes.SELECT,
          replacements: {
            anio,
            mes,
          },
        },
      ),
      sequelizeNIC.query<AnalisisOperacionPreventaPromedioCreditoPorModeloRow>(
        analisisOperacionesPreventaPromedioCreditoPorModeloQuery(),
        {
          type: QueryTypes.SELECT,
          replacements: {
            anio,
            mes,
          },
        },
      ),
    ]);

    const resumen = rowsResumen[0];

    return {
      filters: {
        anio,
        mes,
        tipo: "Cero",
      },
      data: {
        cantidadOperacionesCredito: normalizeNullableNumber(resumen?.cantidad_operaciones_credito) ?? 0,
        cantidadOperacionesUsado: normalizeNullableNumber(resumen?.cantidad_operaciones_usado) ?? 0,
        promedioValorUsado: normalizeNullableNumber(resumen?.promedio_valor_usado),
        promedioCreditoPorModelo: rowsPromedioCredito
          .map((row) => ({
            modelo: normalizeNullableString(row.modelo) ?? "SIN MODELO",
            promedioCredito: normalizeNullableNumber(row.promedio_credito),
          }))
          .filter(
            (
              row,
            ): row is {
              modelo: string;
              promedioCredito: number;
            } => row.promedioCredito !== null,
          )
          .sort((a, b) => a.modelo.localeCompare(b.modelo)),
      },
    };
  }
}
