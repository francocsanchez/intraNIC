import { QueryTypes } from "sequelize";
import { sequelizeNIC } from "../config/database";
import { operacionesDashboardQuery } from "../controllers/querys/operaciones.query";

type OperacionesDashboardFilters = {
  anio: number;
  meses: number[];
  sucursales: string[];
  modelos: string[];
  dias: number[];
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

const serializeFechaAsignacion = (fechaAsignacion: string | Date) =>
  fechaAsignacion instanceof Date ? fechaAsignacion.toISOString() : fechaAsignacion;

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
          hasMeses: filters.meses.length > 0,
          hasSucursales: filters.sucursales.length > 0,
          hasModelos: filters.modelos.length > 0,
          hasDias: filters.dias.length > 0,
        }),
        {
          type: QueryTypes.SELECT,
          replacements: {
            anio: filters.anio,
            meses: filters.meses,
            sucursales: filters.sucursales,
            modelos: filters.modelos,
            dias: filters.dias,
          },
        },
      ),
      sequelizeNIC.query<OperacionDashboardRow>(
        operacionesDashboardQuery({
          hasMeses: filters.meses.length > 0,
          hasSucursales: false,
          hasModelos: false,
          hasDias: false,
        }),
        {
          type: QueryTypes.SELECT,
          replacements: {
            anio: filters.anio,
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
}
