import { QueryTypes } from "sequelize";
import { sequelizeNIC } from "../config/database";
import { getVendedoresActivosNuevoNic } from "../controllers/querys/dms.query";
import {
  analisisVendedorCreditoMensualQuery,
  analisisVendedorDescuentoMensualQuery,
  analisisVendedorMensualPorModeloQuery,
  analisisVendedorOperacionesQuery,
  analisisVendedorTotalSucursalQuery,
  analisisVendedorUsadosMensualQuery,
  analisisOperacionesPreventaCreditoMensualQuery,
  analisisOperacionesPreventaDescuentoMensualQuery,
  analisisOperacionesPreventaDescuentoMensualSucursalQuery,
  analisisOperacionesPreventaDescuentoMensualVendedorQuery,
  analisisOperacionesPreventaPromedioCreditoPorModeloQuery,
  analisisOperacionesPreventaFormaPagoQuery,
  analisisOperacionesPreventaQuery,
  analisisOperacionesPreventaResumenFinanciacionQuery,
  analisisOperacionesPreventaUsadosMensualQuery,
  operacionesDashboardQuery,
  saldoOperacionCountQuery,
  saldoOperacionEstadosQuery,
  saldoOperacionQuery,
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

type AnalisisVendedorFilters = {
  anio: number;
  vendedor: number | null;
};

type AnalisisVendedorFilterOption = {
  label: string;
  value: number;
};

type AnalisisVendedorFiltersResponse = {
  filters: {
    vendedores: AnalisisVendedorFilterOption[];
  };
};

type AnalisisVendedorChartItem = {
  mes: number;
  label: string;
  total: number;
  [modelo: string]: string | number;
};

type AnalisisVendedorResponse = {
  filters: {
    anio: number;
    vendedor: number | null;
    vendedores: AnalisisVendedorFilterOption[];
  };
  context: {
    vendedorLabel: string;
    modelos: string[];
  };
  chartData: AnalisisVendedorChartItem[];
  operations: AnalisisOperacionPreventaItem[];
  summary: {
    totalOperaciones: number;
    cantidadOperacionesCredito: number;
    cantidadOperacionesUsado: number;
    porcentajeToma: number | null;
    porcentajeVendedor: number | null;
    porcentajeVendedorSucursal: number | null;
  };
  usadosMensual: Array<{
    mes: number;
    totalOperaciones: number;
    cantidadUsados: number;
    promedioValorUsado: number | null;
  }>;
  creditoMensual: Array<{
    mes: number;
    totalOperaciones: number;
    cantidadOperacionesCredito: number;
    promedioCredito: number | null;
  }>;
  descuentoMensual: Array<{
    mes: number;
    descuentoPromedio: number | null;
    descuentoPromedioHilux: number | null;
  }>;
};

type AnalisisVendedorMensualPorModeloRow = {
  mes: number | string | null;
  modelo: string | null;
  total: number | string | null;
};

type AnalisisVendedorTotalRow = {
  total: number | string | null;
};

type AnalisisVendedorUsadosMensualRow = {
  mes: number | string | null;
  total_operaciones: number | string | null;
  cantidad_usados: number | string | null;
  promedio_valor_usado: number | string | null;
};

type AnalisisVendedorCreditoMensualRow = {
  mes: number | string | null;
  total_operaciones: number | string | null;
  cantidad_operaciones_credito: number | string | null;
  promedio_credito: number | string | null;
};

type AnalisisVendedorDescuentoMensualRow = {
  mes: number | string | null;
  descuento_promedio: number | string | null;
  descuento_promedio_hilux: number | string | null;
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
  fecha_factura: string | Date | null;
  sucursal: string | null;
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
  fechaFactura: string | null;
  sucursal: string;
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
  sucursal?: string | null;
  vendedor?: string | null;
  descuento_promedio: number | string | null;
};

type AnalisisOperacionPreventaDescuentoMensualItem = {
  mes: number;
  modelo?: string;
  sucursal?: string;
  vendedor?: string;
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

type AnalisisOperacionPreventaUsadosMensualRow = {
  mes: number | string | null;
  total_operaciones: number | string | null;
  cantidad_usados: number | string | null;
  promedio_valor_usado: number | string | null;
};

type AnalisisOperacionPreventaCreditoMensualRow = {
  mes: number | string | null;
  total_operaciones: number | string | null;
  cantidad_operaciones_credito: number | string | null;
  promedio_credito: number | string | null;
};

type AnalisisOperacionPreventaUsadosMensualResponse = {
  filters: {
    anio: number;
    tipo: OperacionesAnalisisTipo;
  };
  data: Array<{
    mes: number;
    totalOperaciones: number;
    cantidadUsados: number;
    promedioValorUsado: number | null;
  }>;
};

type AnalisisOperacionPreventaCreditoMensualResponse = {
  filters: {
    anio: number;
    tipo: OperacionesAnalisisTipo;
  };
  data: Array<{
    mes: number;
    totalOperaciones: number;
    cantidadOperacionesCredito: number;
    promedioCredito: number | null;
  }>;
};

type SaldoOperacionRow = {
  codigo_operacion: number | string | null;
  cliente_nombre: string | null;
  vendedor: string | null;
  numero_fabrica: string | null;
  pcio_venta: number | string | null;
  bonif_venta: number | string | null;
  gestoria: number | string | null;
  senas: number | string | null;
  usado: number | string | null;
  version: string | null;
  modelo_general: string | null;
  estado: string | null;
};

type SaldoOperacionItem = {
  codigoOperacion: number | null;
  clienteNombre: string;
  vendedor: string;
  numeroFabrica: string;
  pcioVenta: number | null;
  bonifVenta: number | null;
  gestoria: number | null;
  total: number | null;
  senas: number | null;
  usado: number | null;
  version: string;
  modeloGeneral: string;
  estado: string;
};

type SaldoOperacionResponse = {
  filters: {
    estado: string | null;
  };
  data: SaldoOperacionItem[];
  meta: {
    total: number;
    estados: string[];
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
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

const normalizeBoolean = (value: unknown) => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value !== 0;
  }

  const normalized = String(value ?? "").trim().toLowerCase();
  return normalized === "1" || normalized === "true";
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

const MONTH_LABELS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
] as const;

export class OperacionesDashboardService {
  static async getAnalisisVendedorFilters(): Promise<AnalisisVendedorFiltersResponse> {
    const vendedores = await sequelizeNIC.query<{ vendedor: string; codigo: number }>(getVendedoresActivosNuevoNic(), {
      type: QueryTypes.SELECT,
    });

    return {
      filters: {
        vendedores: vendedores
          .map((item) => ({
            label: String(item.vendedor ?? "").trim(),
            value: Number(item.codigo),
          }))
          .filter((item) => Number.isFinite(item.value) && item.value > 0 && item.label.length > 0)
          .sort((a, b) => a.label.localeCompare(b.label)),
      },
    };
  }

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
      fechaFactura: serializeNullableDate(row.fecha_factura),
      sucursal: normalizeNullableString(row.sucursal) ?? "SIN SUCURSAL",
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

  static async getAnalisisVendedor(
    filters: AnalisisVendedorFilters,
  ): Promise<AnalisisVendedorResponse> {
    const [vendedores, resumenRows, operationRows, usadosRows, creditoRows, descuentoRows, totalRows] = await Promise.all([
      this.getAnalisisVendedorFilters(),
      sequelizeNIC.query<AnalisisVendedorMensualPorModeloRow>(
        analisisVendedorMensualPorModeloQuery(filters.vendedor !== null),
        {
          type: QueryTypes.SELECT,
          replacements: {
            anio: filters.anio,
            vendedor: filters.vendedor ?? undefined,
          },
        },
      ),
      sequelizeNIC.query<AnalisisOperacionPreventaRow>(
        analisisVendedorOperacionesQuery(filters.vendedor !== null),
        {
          type: QueryTypes.SELECT,
          replacements: {
            anio: filters.anio,
            vendedor: filters.vendedor ?? undefined,
          },
        },
      ),
      sequelizeNIC.query<AnalisisVendedorUsadosMensualRow>(
        analisisVendedorUsadosMensualQuery(filters.vendedor !== null),
        {
          type: QueryTypes.SELECT,
          replacements: {
            anio: filters.anio,
            vendedor: filters.vendedor ?? undefined,
          },
        },
      ),
      sequelizeNIC.query<AnalisisVendedorCreditoMensualRow>(
        analisisVendedorCreditoMensualQuery(filters.vendedor !== null),
        {
          type: QueryTypes.SELECT,
          replacements: {
            anio: filters.anio,
            vendedor: filters.vendedor ?? undefined,
          },
        },
      ),
      sequelizeNIC.query<AnalisisVendedorDescuentoMensualRow>(
        analisisVendedorDescuentoMensualQuery(filters.vendedor !== null),
        {
          type: QueryTypes.SELECT,
          replacements: {
            anio: filters.anio,
            vendedor: filters.vendedor ?? undefined,
          },
        },
      ),
      sequelizeNIC.query<AnalisisVendedorTotalRow>(
        analisisVendedorMensualPorModeloQuery(false),
        {
          type: QueryTypes.SELECT,
          replacements: {
            anio: filters.anio,
          },
        },
      ),
    ]);

    const totalSucursalRows =
      filters.vendedor === null
        ? []
        : await sequelizeNIC.query<AnalisisVendedorTotalRow>(
            analisisVendedorTotalSucursalQuery(),
            {
              type: QueryTypes.SELECT,
              replacements: {
                anio: filters.anio,
                vendedor: filters.vendedor,
              },
            },
          );

    const modelos = Array.from(
      new Set(
        resumenRows
          .map((row) => String(row.modelo ?? "").trim())
          .filter(Boolean),
      ),
    ).sort((a, b) => a.localeCompare(b));

    const chartData: AnalisisVendedorChartItem[] = MONTH_LABELS.map((label, index) => {
      const baseRow: AnalisisVendedorChartItem = {
        mes: index + 1,
        label,
        total: 0,
      };

      modelos.forEach((modelo) => {
        baseRow[modelo] = 0;
      });

      return baseRow;
    });

    resumenRows.forEach((row) => {
      const mes = normalizeNullableNumber(row.mes);
      const total = normalizeNullableNumber(row.total) ?? 0;
      const modelo = normalizeNullableString(row.modelo) ?? "SIN MODELO";

      if (!mes || mes < 1 || mes > 12) {
        return;
      }

      const currentMonth = chartData[mes - 1];

      if (!currentMonth) {
        return;
      }

      currentMonth[modelo] = total;
      currentMonth.total += total;
    });

    const vendedorLabel =
      filters.vendedor === null
        ? "Todos los vendedores"
        : vendedores.filters.vendedores.find((item) => item.value === filters.vendedor)?.label ?? `Vendedor ${filters.vendedor}`;

    const operations = operationRows.map((row) => ({
      numero: normalizeNullableNumber(row.numero),
      interno: normalizeNullableNumber(row.interno),
      fecha: serializeNullableDate(row.fecha),
      fechaFactura: null,
      sucursal: "",
      version: normalizeNullableString(row.version) ?? "",
      modelo: normalizeNullableString(row.modelo) ?? "",
      precio: normalizeNullableNumber(row.precio),
      vehiculo: null,
      accesorios: null,
      patentamiento: normalizeNullableNumber(row.patentamiento),
      flete: normalizeNullableNumber(row.flete),
      formulario: normalizeNullableNumber(row.formulario),
      prenda: normalizeNullableNumber(row.prenda),
      equipamiento: normalizeNullableNumber(row.equipamiento),
      preentrega: null,
      otro: normalizeNullableNumber(row.otro),
      bonificacion: normalizeNullableNumber(row.bonificacion),
    }));

    const usadosMensual = usadosRows
      .map((row) => ({
        mes: normalizeNullableNumber(row.mes),
        totalOperaciones: normalizeNullableNumber(row.total_operaciones) ?? 0,
        cantidadUsados: normalizeNullableNumber(row.cantidad_usados) ?? 0,
        promedioValorUsado: normalizeNullableNumber(row.promedio_valor_usado),
      }))
      .filter(
        (row): row is { mes: number; totalOperaciones: number; cantidadUsados: number; promedioValorUsado: number | null } =>
          row.mes !== null && row.mes >= 1 && row.mes <= 12,
      );

    const creditoMensual = creditoRows
      .map((row) => ({
        mes: normalizeNullableNumber(row.mes),
        totalOperaciones: normalizeNullableNumber(row.total_operaciones) ?? 0,
        cantidadOperacionesCredito: normalizeNullableNumber(row.cantidad_operaciones_credito) ?? 0,
        promedioCredito: normalizeNullableNumber(row.promedio_credito),
      }))
      .filter(
        (row): row is { mes: number; totalOperaciones: number; cantidadOperacionesCredito: number; promedioCredito: number | null } =>
          row.mes !== null && row.mes >= 1 && row.mes <= 12,
      );

    const descuentoMensual = descuentoRows
      .map((row) => ({
        mes: normalizeNullableNumber(row.mes),
        descuentoPromedio: normalizeNullableNumber(row.descuento_promedio),
        descuentoPromedioHilux: normalizeNullableNumber(row.descuento_promedio_hilux),
      }))
      .filter(
        (row): row is { mes: number; descuentoPromedio: number | null; descuentoPromedioHilux: number | null } =>
          row.mes !== null && row.mes >= 1 && row.mes <= 12,
      );

    const totalOperaciones = chartData.reduce((acc, row) => acc + row.total, 0);
    const cantidadOperacionesCredito = creditoMensual.reduce((acc, row) => acc + row.cantidadOperacionesCredito, 0);
    const cantidadOperacionesUsado = usadosMensual.reduce((acc, row) => acc + row.cantidadUsados, 0);
    const totalNegocio = totalRows.reduce((acc, row) => acc + (normalizeNullableNumber(row.total) ?? 0), 0);
    const porcentajeToma = totalOperaciones > 0 ? (cantidadOperacionesUsado / totalOperaciones) * 100 : null;
    const porcentajeVendedor =
      totalNegocio > 0 ? (totalOperaciones / totalNegocio) * 100 : null;
    const totalSucursal = totalSucursalRows.reduce((acc, row) => acc + (normalizeNullableNumber(row.total) ?? 0), 0);
    const porcentajeVendedorSucursal =
      filters.vendedor !== null && totalSucursal > 0 ? (totalOperaciones / totalSucursal) * 100 : null;

    return {
      filters: {
        anio: filters.anio,
        vendedor: filters.vendedor,
        vendedores: vendedores.filters.vendedores,
      },
      context: {
        vendedorLabel,
        modelos,
      },
      chartData,
      operations,
      summary: {
        totalOperaciones,
        cantidadOperacionesCredito,
        cantidadOperacionesUsado,
        porcentajeToma,
        porcentajeVendedor,
        porcentajeVendedorSucursal,
      },
      usadosMensual,
      creditoMensual,
      descuentoMensual,
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
    modelo?: string,
  ): Promise<AnalisisOperacionPreventaDescuentoMensualResponse> {
    const [rowsModelo, rowsSucursal, rowsVendedor] = await Promise.all([
      sequelizeNIC.query<AnalisisOperacionPreventaDescuentoMensualRow>(
        analisisOperacionesPreventaDescuentoMensualQuery(),
        {
          type: QueryTypes.SELECT,
          replacements: {
            anio,
          },
        },
      ),
      sequelizeNIC.query<AnalisisOperacionPreventaDescuentoMensualRow>(
        analisisOperacionesPreventaDescuentoMensualSucursalQuery(),
        {
          type: QueryTypes.SELECT,
          replacements: {
            anio,
          },
        },
      ),
      sequelizeNIC.query<AnalisisOperacionPreventaDescuentoMensualRow>(
        analisisOperacionesPreventaDescuentoMensualVendedorQuery(Boolean(modelo)),
        {
          type: QueryTypes.SELECT,
          replacements: {
            anio,
            modelo,
          },
        },
      ),
    ]);

    const normalizedRows = [
      ...rowsModelo.map((row) => ({
        mes: normalizeNullableNumber(row.mes),
        modelo: normalizeNullableString(row.modelo) ?? "SIN MODELO",
        descuentoPromedio: normalizeNullableNumber(row.descuento_promedio),
      })),
      ...rowsSucursal.map((row) => ({
        mes: normalizeNullableNumber(row.mes),
        sucursal: normalizeNullableString(row.sucursal) ?? "SIN SUCURSAL",
        descuentoPromedio: normalizeNullableNumber(row.descuento_promedio),
      })),
      ...rowsVendedor.map((row) => ({
        mes: normalizeNullableNumber(row.mes),
        vendedor: normalizeNullableString(row.vendedor) ?? "SIN VENDEDOR",
        descuentoPromedio: normalizeNullableNumber(row.descuento_promedio),
      })),
    ];

    const data: AnalisisOperacionPreventaDescuentoMensualItem[] = normalizedRows
      .filter(
        (row) =>
          row.mes !== null &&
          row.mes >= 1 &&
          row.mes <= 12 &&
          row.descuentoPromedio !== null,
      )
      .map((row) => {
        const base = {
          mes: row.mes as number,
          descuentoPromedio: row.descuentoPromedio as number,
        };

        if ("modelo" in row) {
          return {
            ...base,
            modelo: row.modelo,
          };
        }

        if ("sucursal" in row) {
          return {
            ...base,
            sucursal: row.sucursal,
          };
        }

        return {
          ...base,
          vendedor: row.vendedor,
        };
      });

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

  static async getAnalisisPreventaUsadosMensual(
    anio: number,
  ): Promise<AnalisisOperacionPreventaUsadosMensualResponse> {
    const rows = await sequelizeNIC.query<AnalisisOperacionPreventaUsadosMensualRow>(
      analisisOperacionesPreventaUsadosMensualQuery(),
      {
        type: QueryTypes.SELECT,
        replacements: { anio },
      },
    );

    const data = rows
      .map((row) => ({
        mes: normalizeNullableNumber(row.mes),
        totalOperaciones: normalizeNullableNumber(row.total_operaciones) ?? 0,
        cantidadUsados: normalizeNullableNumber(row.cantidad_usados) ?? 0,
        promedioValorUsado: normalizeNullableNumber(row.promedio_valor_usado),
      }))
      .filter(
        (row): row is { mes: number; totalOperaciones: number; cantidadUsados: number; promedioValorUsado: number | null } =>
          row.mes !== null && row.mes >= 1 && row.mes <= 12,
      );

    return {
      filters: {
        anio,
        tipo: "Cero",
      },
      data,
    };
  }

  static async getAnalisisPreventaCreditoMensual(
    anio: number,
  ): Promise<AnalisisOperacionPreventaCreditoMensualResponse> {
    const rows = await sequelizeNIC.query<AnalisisOperacionPreventaCreditoMensualRow>(
      analisisOperacionesPreventaCreditoMensualQuery(),
      {
        type: QueryTypes.SELECT,
        replacements: { anio },
      },
    );

    const data = rows
      .map((row) => ({
        mes: normalizeNullableNumber(row.mes),
        totalOperaciones: normalizeNullableNumber(row.total_operaciones) ?? 0,
        cantidadOperacionesCredito: normalizeNullableNumber(row.cantidad_operaciones_credito) ?? 0,
        promedioCredito: normalizeNullableNumber(row.promedio_credito),
      }))
      .filter(
        (row): row is { mes: number; totalOperaciones: number; cantidadOperacionesCredito: number; promedioCredito: number | null } =>
          row.mes !== null && row.mes >= 1 && row.mes <= 12,
      );

    return {
      filters: {
        anio,
        tipo: "Cero",
      },
      data,
    };
  }

  static async getSaldoOperacion(
    estado: string | null,
    page: number,
    limit: number,
  ): Promise<SaldoOperacionResponse> {
    const normalizedEstado = normalizeNullableString(estado);
    const safePage = Number.isInteger(page) && page > 0 ? page : 1;
    const safeLimit = Number.isInteger(limit) && limit > 0 ? Math.min(limit, 200) : 100;
    const offset = (safePage - 1) * safeLimit;

    const [rows, countRows, estadoRows] = await Promise.all([
      sequelizeNIC.query<SaldoOperacionRow>(
        saldoOperacionQuery(Boolean(normalizedEstado)),
        {
          type: QueryTypes.SELECT,
          replacements: {
            estado: normalizedEstado ?? undefined,
            offset,
            limit: safeLimit,
          },
        },
      ),
      sequelizeNIC.query<{ total: number | string | null }>(
        saldoOperacionCountQuery(Boolean(normalizedEstado)),
        {
          type: QueryTypes.SELECT,
          replacements: {
            estado: normalizedEstado ?? undefined,
          },
        },
      ),
      sequelizeNIC.query<{ estado: string | null }>(
        saldoOperacionEstadosQuery(),
        {
          type: QueryTypes.SELECT,
        },
      ),
    ]);

    const data = rows.map((row) => ({
      codigoOperacion: normalizeNullableNumber(row.codigo_operacion),
      clienteNombre: normalizeNullableString(row.cliente_nombre) ?? "-",
      vendedor: normalizeNullableString(row.vendedor) ?? "-",
      numeroFabrica: normalizeNullableString(row.numero_fabrica) ?? "-",
      pcioVenta: normalizeNullableNumber(row.pcio_venta),
      bonifVenta: normalizeNullableNumber(row.bonif_venta),
      gestoria: normalizeNullableNumber(row.gestoria),
      total:
        (normalizeNullableNumber(row.pcio_venta) ?? 0) +
        (normalizeNullableNumber(row.gestoria) ?? 0) -
        (normalizeNullableNumber(row.bonif_venta) ?? 0),
      senas: normalizeNullableNumber(row.senas),
      usado: normalizeNullableNumber(row.usado),
      version: normalizeNullableString(row.version) ?? "",
      modeloGeneral: normalizeNullableString(row.modelo_general) ?? "",
      estado: normalizeNullableString(row.estado) ?? "Sin estado",
    }));

    const total = normalizeNullableNumber(countRows[0]?.total) ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / safeLimit));
    const estados = estadoRows
      .map((item) => normalizeNullableString(item.estado) ?? "Sin estado")
      .filter((item, index, array) => array.indexOf(item) === index)
      .sort((a, b) => a.localeCompare(b, "es"));

    return {
      filters: {
        estado: normalizedEstado,
      },
      data,
      meta: {
        total,
        estados,
      },
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages,
      },
    };
  }
}
