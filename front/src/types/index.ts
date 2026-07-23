import { z } from "zod";
import { moduleKeys } from "@/constants/modules";

const modulesSchema = z.object(
  Object.fromEntries(
    moduleKeys.map((moduleKey) => [moduleKey, z.number().nullable().optional()]),
  ) as Record<string, z.ZodTypeAny>,
);

//**************************** */
// STOCK DISPONIBE - GUARDADO
//**************************** */
export const stockDisponibleConvencionalItemSchema = z.object({
  interno: z.number(),
  vendedorReserva: z.string(),
  version: z.string(),
  modelo: z.string(),
  color: z.string(),
  ubicacion: z.string().nullable(),
  chasis: z.string(),
  fechaRecepcion: z.string().datetime(),
});

export const stockDisponibleConvencionalResumenSchema = z.object({
  total: z.number(),
  totalNacionales: z.number(),
  totalImportadas: z.number(),
  nacionales: z.record(z.string(), z.number()),
  importadas: z.record(z.string(), z.number()),
  porModelo: z.record(z.string(), z.number()),
});

export const stockDisponibleConvencionalSchema = z.object({
  data: z.array(stockDisponibleConvencionalItemSchema),
  resumen: stockDisponibleConvencionalResumenSchema,
});

//**************************** */
// STOCK RESERVADO
//**************************** */

export const ReservaSchema = z.object({
  interno: z.number(),
  vendedorReserva: z.string(),
  version: z.string(),
  modelo: z.string(),
  color: z.string(),
  ubicacion: z.string().nullable(),
  chasis: z.string(),
  sucursal: z.string(),
  fechaReserva: z.string(),
  fechaRecepcion: z.string(),
});

export const ReservasDataSchema = z.record(z.string(), z.array(ReservaSchema));

export const ReservasResumenSchema = z.object({
  total: z.number(),
  sucursales: z.record(z.string(), z.number()),
});

export const ReservasResponseSchema = z.object({
  data: ReservasDataSchema,
  resumen: ReservasResumenSchema,
});

export type Reserva = z.infer<typeof ReservaSchema>;
export type ReservasResponse = z.infer<typeof ReservasResponseSchema>;

//**************************** */
// VENDEDORES
//**************************** */

export const vendedorSchema = z.object({
  vendedor: z.string(),
  codigo: z.number(),
  tpoNuevo: z.boolean(),
  tipoUsado: z.boolean(),
  tipoPlan: z.boolean(),
  tipoPosventa: z.boolean(),
  emailTecnom: z.string(),
  estado: z.number(),
  sucursal: z.string(),
});

export const vendedoresResponseSchema = z.object({
  data: z.array(vendedorSchema),
});
export type Vendedor = z.infer<typeof vendedorSchema>;

//**************************** */
// CONFIGURACION
//**************************** */

export const configuracionSchema = z.object({
  _id: z.string(),

  sistemaActivoConvencional: z.boolean(),
  vendedoresReservasConvencional: z.array(z.string()),
  vendedoresDisponibleConvencional: z.array(z.string()),
  vendedoresStockGuardadoConvencional: z.array(z.string()),

  sistemaActivoUsados: z.boolean(),
  vendedoresReservasUsados: z.array(z.string()),
  vendedoresDisponibleUsados: z.array(z.string()),
  vendedoresStockGuardadoUsados: z.array(z.string()),
  vendedoresStockNoReparadoUsados: z.array(z.string()).default([]),
  vendedoresStockPendDocuUsados: z.array(z.string()).default([]),

  sistemaActivoLIESS: z.boolean(),
  vendedoresDisponibleLIESS: z.array(z.string()),
  vendedoresStockGuardadoLIESS: z.array(z.string()),
  vendedoresReservasLIESS: z.array(z.string()),

  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),

  __v: z.number(),
});

export const configuracionResponseSchema = z.object({
  data: configuracionSchema,
});

//**************************** */
// USUARIOS
//**************************** */

export const usuarioSchema = z.object({
  _id: z.string(),
  email: z.string(),
  name: z.string(),
  lastName: z.string(),
  celular: z.string().optional().default(""),
  enable: z.boolean(),
  numberSaleNic: z.number(),
  numberSaleLiess: z.number(),
  role: z.array(z.string()),
  company: z.array(z.string()),
  modules: modulesSchema.optional().default({}),
  unidadNegocio: z
    .object({
      _id: z.string(),
      nombre: z.string(),
      activo: z.boolean(),
      orden: z.number(),
    })
    .nullable()
    .optional(),
  sucursalPredeterminada: z
    .object({
      _id: z.string(),
      nombre: z.string(),
      activa: z.boolean(),
      direccion: z.string().optional().default(""),
    })
    .nullable()
    .optional(),
  sucursalEntrega: z
    .object({
      _id: z.string(),
      nombre: z.string(),
      activa: z.boolean(),
      direccion: z.string().optional().default(""),
    })
    .nullable()
    .optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const usuariosResponseSchema = z.array(usuarioSchema);
export type Usuario = z.infer<typeof usuarioSchema>;

//**************************** */
// USUARIOS SCHEMA TOKEN
//**************************** */

export const userSchema = z.object({
  _id: z.string(),
  name: z.string(),
  lastName: z.string(),
  email: z.string().optional(),
  company: z.array(z.string()).optional(),
  role: z.array(z.string()),
  modules: modulesSchema.optional().default({}),
  enable: z.boolean(),
  unidadNegocio: z
    .object({
      _id: z.string(),
      nombre: z.string(),
      activo: z.boolean(),
      orden: z.number(),
    })
    .nullable()
    .optional(),
  sucursalPredeterminada: z
    .object({
      _id: z.string(),
      nombre: z.string(),
      activa: z.boolean(),
      direccion: z.string().optional().default(""),
    })
    .nullable()
    .optional(),
  sucursalEntrega: z
    .object({
      _id: z.string(),
      nombre: z.string(),
      activa: z.boolean(),
      direccion: z.string().optional().default(""),
    })
    .nullable()
    .optional(),
});

//**************************** */
// STOCK DISPONIBE - GUARDADO
//**************************** */
export const stockDisponibleLiesslItemSchema = z.object({
  interno: z.number(),
  estado: z.number(),
  marca: z.string(),
  version: z.string(),
  chasis: z.string().nullable(),
  color: z.string().nullable(),
  anioNuevo: z.number().nullable().optional(),
  anioUsado: z.number().nullable().optional(),
  precioVentaUsado: z.coerce.number().nullable().optional(),
  reservaVendedor: z.string(),
  tipo: z.string(),
  fechaRecepcion: z.string(),
});

export const stockDisponibleLiessResumenSchema = z.object({
  total: z.number(),
  totalNuevos: z.number(),
  totalUsados: z.number(),
  porMarca: z.record(z.string(), z.number()),
  porTipo: z.record(z.string(), z.number()),
  porReserva: z.record(z.string(), z.number()),
  marcas: z.array(z.string()),
  tablasPorMarca: z.record(z.string(), z.array(stockDisponibleLiesslItemSchema)),
});

export const stockDisponibleLiessSchema = z.object({
  data: z.array(stockDisponibleLiesslItemSchema),
  resumen: stockDisponibleLiessResumenSchema,
});
export type StockDisponibleLiessItem = z.infer<typeof stockDisponibleLiesslItemSchema>;
export type StockDisponibleLiessResponse = z.infer<typeof stockDisponibleLiessSchema>;

//**************************** */
// MIS RESERVAS
//**************************** */
export const misReservaSchema = z.object({
  interno: z.number(),
  vendedorReserva: z.string(),
  version: z.string(),
  modelo: z.string(),
  color: z.string(),
  ubicacion: z.string().nullable(),
  chasis: z.string(),
  sucursal: z.string(),
  fechaReserva: z.string(),
  fechaRecepcion: z.string(),
  clienteReserva: z.string(),
});

export const misReservasResponseSchema = z.object({
  data: z.array(misReservaSchema),
  resumen: z.object({
    total: z.number(),
    porModelo: z.record(z.string(), z.number()),
  }),
});

export type MisReservasResponse = z.infer<typeof misReservasResponseSchema>;

//**************************** */
// MI LISTA DE ESPERA
//**************************** */
export const miListaDeEsperaSchema = z.object({
  opera: z.number(),
  fecha: z.string(),
  clienteNombre: z.string(),
  version: z.string(),
  modelo: z.string(),
  color1: z.string().nullable().optional(),
  color2: z.string().nullable().optional(),
});

export const misListaDeEsperaResponseSchema = z.object({
  data: z.array(miListaDeEsperaSchema),
  resumen: z.object({
    total: z.number(),
    porModelo: z.record(z.string(), z.number()),
  }),
});

export type MiListaDeEsperaResponse = z.infer<typeof misListaDeEsperaResponseSchema>;

//**************************** */
// MIS OPERACIONES
//**************************** */

export const misOperacionesItemSchema = z.object({
  opera: z.number(),
  interno: z.number(),
  fechaFactura: z.string().nullable(),
  fecha: z.string().nullable(),
  clienteNombre: z.string(),
  fechaEntrega: z.string().nullable(),
  fechaAsignacion: z.string().nullable(),
  version: z.string(),
  modelo: z.string(),
  vendedor: z.string(),
  color: z.string(),
  descuentoPorcentaje: z.number().nullable().optional().default(null),
});

export const misOperacionesResumenSchema = z.object({
  total: z.number(),
  porDia: z.record(z.string(), z.number()),
  porModelo: z.record(z.string(), z.number()),
  anual: z
    .array(
      z.object({
        mes: z.number(),
        total: z.number(),
        porModelo: z.record(z.string(), z.number()),
      }),
    )
    .optional()
    .default([]),
  descuentoPromedioMes: z.number().nullable().optional().default(null),
});

export const misOperacionesSchema = z.object({
  data: z.array(misOperacionesItemSchema),
  resumen: misOperacionesResumenSchema,
});

export type MisOperacionesResponse = z.infer<typeof misOperacionesSchema>;

//**************************** */
// ASIGNACIONES
//**************************** */

export const asignacionRecepcionItemSchema = z.object({
  interno: z.number(),
  nrofab: z.string(),
  version: z.string(),
  modelo: z.string(),
  chasis: z.string().nullable(),
  fechaProblableRecep: z.string().nullable(),
  fechaRecepcionRemito: z.string().nullable(),
  color: z.string(),
  opera: z.number(),
  diferenciaDias: z.number().nullable(),
  sucursal: z.string().nullable(),
  fuePedido: z.boolean().optional(),
});

export const resumenAsignacionRecepcionSchema = z.object({
  total: z.number(),
  recibidos: z.number(),
  pendientes: z.number(),
  porDiaRecepcion: z.array(
    z.object({
      fecha: z.string(),
      cantidad: z.number(),
    }),
  ),
  estadoRecepcion: z.array(
    z.object({
      name: z.string(),
      value: z.number(),
    }),
  ),
});

export const getAsignacionRecepcionResponseSchema = z.object({
  data: z.array(asignacionRecepcionItemSchema),
  resumen: resumenAsignacionRecepcionSchema,
});
export type AsignacionRecepcionItem = z.infer<
  typeof asignacionRecepcionItemSchema
>;
export type ResumenAsignacionRecepcion = z.infer<
  typeof resumenAsignacionRecepcionSchema
>;
export type GetAsignacionRecepcionResponse = z.infer<
  typeof getAsignacionRecepcionResponseSchema
>;

//**************************** */
// STOCK DISPONIBLE USADOS
//**************************** */

export const unidadRowSchema = z.object({
  interno: z.number(),
  version: z.string(),
  marca: z.string(),
  observaciones: z.string().nullable(),
  color: z.string().nullable(),
  anio: z.number(),
  precioVenta: z.number(),
  fechaRecepcion: z.string().nullable(),
  dominio: z.string().nullable(),
  kilometros: z.number(),
});

export const resumenPorMarcaSchema = z.object({
  total: z.number(),
  porMarca: z.record(z.string(), z.number()),
});

export const stockUsadosResponseSchema = z.object({
  data: z.array(unidadRowSchema),
  resumen: resumenPorMarcaSchema,
});
export type UnidadRow = z.infer<typeof unidadRowSchema>;
export type StockUsadosResponse = z.infer<typeof stockUsadosResponseSchema>;

//**************************** */
// STOCK RESERVADO USADOS
//**************************** */

export const ReservaUsadosSchema = z.object({
  interno: z.number(),
  version: z.string(),
  modelo: z.string(),
  marca: z.string(),
  observaciones: z.string(),
  color: z.string(),
  anio: z.number(),
  precioVenta: z.number(),
  fechaRecepcion: z.string(),
  kilometros: z.number(),
  vendedorReserva: z.string(),
  sucursal: z.string(),
});

export const ReservasUsadosDataSchema = z.record(z.string(), z.array(ReservaUsadosSchema));

export const ReservasUsadosResumenSchema = z.object({
  data: ReservasUsadosDataSchema,
  resumen: z.object({
    total: z.number(),
    sucursales: z.record(z.string(), z.number()),
  }),
});

export type ReservaUsados = z.infer<typeof ReservaUsadosSchema>;
export type ReservasUsadosData = z.infer<typeof ReservasUsadosDataSchema>;
export type ReservasUsadosResumen = z.infer<typeof ReservasUsadosResumenSchema>;

//**************************** */
// CONSOLIDADO
//**************************** */

const resumenPorEstadoSchema = z.record(z.string(), z.number());

const resumenAgrupadoItemSchema = z.object({
  nombre: z.string(),
  total: z.number(),
  porEstado: resumenPorEstadoSchema,
});

const resumenStockConsolidadoSchema = z.object({
  total: z.number(),
  totalUsados: z.number(),
  totalNuevos: z.number(),
  usadosPorMarca: z.record(z.string(), resumenAgrupadoItemSchema),
  nuevosPorTipoOrder: z.object({
    convencional: z.record(z.string(), resumenAgrupadoItemSchema),
    "v. especiales": z.record(z.string(), resumenAgrupadoItemSchema),
    "plan de ahorro": z.record(z.string(), resumenAgrupadoItemSchema),
  }),
});

const resumenLiessMarcaItemSchema = z.object({
  marca: z.string(),
  total: z.number(),
  nuevo: z.number(),
  usado: z.number(),
});

const resumenLiessMarcaSchema = z.object({
  total: z.number(),
  marcas: z.record(z.string(), resumenLiessMarcaItemSchema),
});

export const resumenGeneralSchema = z.object({
  resumen: z.object({
    totales: z.object({
      nic: z.number(),
      liess: z.number(),
      general: z.number(),
    }),
    nic: resumenStockConsolidadoSchema,
    liess: resumenLiessMarcaSchema,
  }),
});

//**************************** */
// STOCK INGRESO USADOS
//**************************** */

export const stockIngresoUsadosItemSchema = z.object({
  interno: z.number(),
  marca: z.string(),
  version: z.string(),
  ultimoDueno: z.string().nullable(),
  color: z.string().nullable(),
  anio: z.number(),
  km: z.number(),
  observaciones: z.string().nullable().optional(),
  precioVenta: z.number().nullable().optional(),
});

export const stockIngresoUsadosResumenSchema = z.object({
  total: z.number(),
  porMarca: z.record(z.string(), z.number()),
});

export const stockIngresoUsadosSchema = z.object({
  data: z.array(stockIngresoUsadosItemSchema),
  resumen: stockIngresoUsadosResumenSchema,
});

export type StockIngresoUsadosItem = z.infer<typeof stockIngresoUsadosItemSchema>;
export type StockIngresoUsadosResumen = z.infer<typeof stockIngresoUsadosResumenSchema>;
export type StockIngresoUsadosResponse = z.infer<typeof stockIngresoUsadosSchema>;

//**************************** */
// PROMEDIOS CONVENCIONAL
//**************************** */

export const promedioOperacionMesSchema = z.object({
  key: z.string(),
  label: z.string(),
  mes: z.number(),
  ano: z.number(),
});

export const promedioOperacionVendedorSchema = z.object({
  vendedor: z.string(),
  sucursal: z.string(),
  meses: z.record(z.string(), z.number()),
  totalSemestre: z.number(),
  ventasMesActual: z.number(),
  promedio: z.number(),
});

export const promedioOperacionSucursalSchema = z.object({
  sucursal: z.string(),
  vendedores: z.array(promedioOperacionVendedorSchema),
  meses: z.record(z.string(), z.number()),
  totalSemestre: z.number(),
  ventasMesActual: z.number(),
  promedio: z.number(),
});

export const promedioOperacionTablaItemSchema = z.object({
  tipo: z.enum(["vendedor", "sucursal"]).default("vendedor"),
  vendedor: z.string(),
  meses: z.record(z.string(), z.number()),
  ventasMesActual: z.number(),
  promedio: z.number(),
});

export const promedioOperacionesConvencionalResumenSchema = z.object({
  total: z.number(),
  periodo: z.object({
    mes: z.number(),
    ano: z.number(),
  }),
  meses: z.array(promedioOperacionMesSchema),
  vendedores: z.array(promedioOperacionVendedorSchema),
  sucursales: z.array(promedioOperacionSucursalSchema),
  tablasPorSucursal: z.record(z.string(), z.array(promedioOperacionTablaItemSchema)),
});

export const promedioOperacionesConvencionalResponseSchema = z.object({
  resumen: promedioOperacionesConvencionalResumenSchema,
});

export type PromedioOperacionesConvencionalResponse = z.infer<typeof promedioOperacionesConvencionalResponseSchema>;

//**************************** */
// RANKING CONVENCIONAL
//**************************** */

export const rankingBaseItemSchema = z.object({
  nombre: z.string(),
  total: z.number(),
});

export const rankingVendedorItemSchema = rankingBaseItemSchema.extend({
  sucursal: z.string(),
  promedioMensual: z.number(),
  hilux: z.number(),
});

export const rankingMesItemSchema = z.object({
  mes: z.number(),
  label: z.string(),
  total: z.number(),
});

export const rankingDestacadosSchema = z.object({
  topVendedorDelAno: rankingVendedorItemSchema.nullable(),
  topModeloDelAno: rankingBaseItemSchema.nullable(),
  topSucursalDelAno: rankingBaseItemSchema.nullable(),
  topHiluxDelAno: rankingVendedorItemSchema.nullable(),
  mejorPromedioAnual: rankingVendedorItemSchema.nullable(),
});

export const rankingOperacionesConvencionalResumenSchema = z.object({
  periodo: z.object({
    ano: z.number(),
  }),
  totales: z.object({
    operaciones: z.number(),
    vendedores: z.number(),
    modelos: z.number(),
    sucursales: z.number(),
    hilux: z.number(),
  }),
  destacados: rankingDestacadosSchema,
  ventasPorMes: z.array(rankingMesItemSchema),
  rankingVendedores: z.array(rankingVendedorItemSchema),
  rankingModelos: z.array(rankingBaseItemSchema),
  rankingSucursales: z.array(rankingBaseItemSchema),
  rankingHilux: z.array(rankingVendedorItemSchema),
  ventasAcumuladasPorVendedor: z.array(rankingVendedorItemSchema),
});

export const rankingOperacionesConvencionalResponseSchema = z.object({
  resumen: rankingOperacionesConvencionalResumenSchema,
});

export type RankingOperacionesConvencionalResponse = z.infer<typeof rankingOperacionesConvencionalResponseSchema>;

//**************************** */
// PROMEDIOS PLAN AHORRO
//**************************** */

export const promedioPlanAhorroMesSchema = z.object({
  key: z.string(),
  label: z.string(),
  mes: z.number(),
  ano: z.number(),
});

export const promedioPlanAhorroVendedorSchema = z.object({
  vendedor: z.string(),
  sucursal: z.string(),
  meses: z.record(z.string(), z.number()),
  promedioAnualParcial: z.number(),
});

export const promedioPlanAhorroSucursalSchema = z.object({
  sucursal: z.string(),
  vendedores: z.array(promedioPlanAhorroVendedorSchema),
  meses: z.record(z.string(), z.number()),
  promedioAnualParcial: z.number(),
});

export const promedioPlanAhorroTablaItemSchema = z.object({
  tipo: z.enum(["vendedor", "sucursal"]).default("vendedor"),
  vendedor: z.string(),
  meses: z.record(z.string(), z.number()),
  promedioAnualParcial: z.number(),
});

export const promedioPlanAhorroResponseSchema = z.object({
  resumen: z.object({
    total: z.number(),
    periodo: z.object({
      ano: z.number(),
      hastaMes: z.number(),
    }),
    meses: z.array(promedioPlanAhorroMesSchema),
    vendedores: z.array(promedioPlanAhorroVendedorSchema),
    sucursales: z.array(promedioPlanAhorroSucursalSchema),
    tablasPorSucursal: z.record(z.string(), z.array(promedioPlanAhorroTablaItemSchema)),
    metricas: z.object({
      totalVendedores: z.number(),
      promedioGeneral: z.number(),
      mejorPromedio: z.number(),
      mejorSucursal: z.object({
        sucursal: z.string(),
        promedioAnualParcial: z.number(),
      }),
    }),
  }),
});

export type PromedioPlanAhorroResponse = z.infer<typeof promedioPlanAhorroResponseSchema>;

//**************************** */
// OPERACIONES DASHBOARD
//**************************** */

export const operacionDashboardSchema = z.object({
  codigoOperacion: z.number(),
  fechaAsignacion: z.string(),
  vendedorNombre: z.string(),
  sucursalNombre: z.string(),
  modeloNombre: z.string(),
  interno: z.string().nullable(),
  chasis: z.string().nullable(),
});

export const operacionesDashboardGraficoItemSchema = z.object({
  vendedor: z.string(),
  total: z.number(),
});

export const operacionesDashboardTablaItemSchema = z.object({
  vendedor: z.string(),
  total: z.number(),
  modelos: z.record(z.string(), z.number()),
});

export const operacionesDashboardFilterOptionSchema = z.object({
  label: z.string(),
  value: z.string(),
});

export const operacionesDashboardResponseSchema = z.object({
  operaciones: z.array(operacionDashboardSchema),
  grafico: z.array(operacionesDashboardGraficoItemSchema),
  tabla: z.array(operacionesDashboardTablaItemSchema),
  filtros: z.object({
    sucursales: z.array(operacionesDashboardFilterOptionSchema),
    modelos: z.array(operacionesDashboardFilterOptionSchema),
    dias: z.array(z.number()),
  }),
});

export type OperacionDashboard = z.infer<typeof operacionDashboardSchema>;
export type OperacionesDashboardResponse = z.infer<typeof operacionesDashboardResponseSchema>;

export const analisisOperacionesPreventaTipoSchema = z.enum(["Cero"]);

export const analisisOperacionesPreventaItemSchema = z.object({
  numero: z.number().nullable(),
  interno: z.number().nullable(),
  fecha: z.string().nullable(),
  fechaFactura: z.string().nullable(),
  sucursal: z.string(),
  version: z.string(),
  modelo: z.string(),
  precio: z.number().nullable(),
  vehiculo: z.number().nullable(),
  accesorios: z.number().nullable(),
  patentamiento: z.number().nullable(),
  flete: z.number().nullable(),
  formulario: z.number().nullable(),
  prenda: z.number().nullable(),
  equipamiento: z.number().nullable(),
  preentrega: z.number().nullable(),
  otro: z.number().nullable(),
  bonificacion: z.number().nullable(),
});

export const analisisOperacionesPreventaFormaPagoSchema = z.object({
  numero: z.number().nullable(),
  usados: z.number().nullable(),
  contado: z.number().nullable(),
  cheque: z.number().nullable(),
  credito_bancario: z.number().nullable(),
});

export const analisisOperacionesPreventaResponseSchema = z.object({
  filters: z.object({
    anio: z.number(),
    mes: z.number(),
    tipo: analisisOperacionesPreventaTipoSchema.default("Cero"),
  }),
  data: z.array(analisisOperacionesPreventaItemSchema),
});

export const analisisOperacionesPreventaFormaPagoResponseSchema = z.object({
  data: analisisOperacionesPreventaFormaPagoSchema,
});

export const analisisOperacionesPreventaDescuentoMensualItemSchema = z.object({
  mes: z.number(),
  modelo: z.string().optional(),
  sucursal: z.string().optional(),
  vendedor: z.string().optional(),
  descuentoPromedio: z.number(),
});

export const analisisOperacionesPreventaDescuentoMensualResponseSchema = z.object({
  filters: z.object({
    anio: z.number(),
    tipo: analisisOperacionesPreventaTipoSchema.default("Cero"),
  }),
  data: z.array(analisisOperacionesPreventaDescuentoMensualItemSchema),
});

export const analisisOperacionesPreventaResumenFinanciacionResponseSchema = z.object({
  filters: z.object({
    anio: z.number(),
    mes: z.number(),
    tipo: analisisOperacionesPreventaTipoSchema.default("Cero"),
  }),
  data: z.object({
    cantidadOperacionesCredito: z.number(),
    cantidadOperacionesUsado: z.number(),
    promedioValorUsado: z.number().nullable(),
    promedioCreditoPorModelo: z.array(
      z.object({
        modelo: z.string(),
        promedioCredito: z.number(),
      }),
    ),
  }),
});

export const analisisOperacionesPreventaUsadosMensualResponseSchema = z.object({
  filters: z.object({
    anio: z.number(),
    tipo: analisisOperacionesPreventaTipoSchema.default("Cero"),
  }),
  data: z.array(
    z.object({
      mes: z.number(),
      totalOperaciones: z.number(),
      cantidadUsados: z.number(),
      promedioValorUsado: z.number().nullable(),
    }),
  ),
});

export const analisisOperacionesPreventaCreditoMensualResponseSchema = z.object({
  filters: z.object({
    anio: z.number(),
    tipo: analisisOperacionesPreventaTipoSchema.default("Cero"),
  }),
  data: z.array(
    z.object({
      mes: z.number(),
      totalOperaciones: z.number(),
      cantidadOperacionesCredito: z.number(),
      promedioCredito: z.number().nullable(),
    }),
  ),
});

export type AnalisisOperacionesPreventaTipo = z.infer<typeof analisisOperacionesPreventaTipoSchema>;
export type AnalisisOperacionesPreventaItem = z.infer<typeof analisisOperacionesPreventaItemSchema>;
export type AnalisisOperacionesPreventaResponse = z.infer<typeof analisisOperacionesPreventaResponseSchema>;
export type AnalisisOperacionesPreventaFormaPago = z.infer<typeof analisisOperacionesPreventaFormaPagoSchema>;
export type AnalisisOperacionesPreventaFormaPagoResponse = z.infer<typeof analisisOperacionesPreventaFormaPagoResponseSchema>;
export type AnalisisOperacionesPreventaDescuentoMensualItem = z.infer<
  typeof analisisOperacionesPreventaDescuentoMensualItemSchema
>;
export type AnalisisOperacionesPreventaDescuentoMensualResponse = z.infer<
  typeof analisisOperacionesPreventaDescuentoMensualResponseSchema
>;
export type AnalisisOperacionesPreventaResumenFinanciacionResponse = z.infer<
  typeof analisisOperacionesPreventaResumenFinanciacionResponseSchema
>;
export type AnalisisOperacionesPreventaUsadosMensualResponse = z.infer<
  typeof analisisOperacionesPreventaUsadosMensualResponseSchema
>;
export type AnalisisOperacionesPreventaCreditoMensualResponse = z.infer<
  typeof analisisOperacionesPreventaCreditoMensualResponseSchema
>;

//**************************** */
// PEDIDO UNIDADES
//**************************** */

export const pedidoUnidadInfoInternoSchema = z.object({
  interno: z.number(),
  version: z.string().default("-"),
  order: z.string().default("-"),
  cliente: z.string().default("-"),
  vendedor: z.string().default("-"),
  chasis: z.string().nullable().default(null),
  modelo: z.string().default("-"),
});

export const pedidoUnidadItemSchema = pedidoUnidadInfoInternoSchema.extend({
  estadoUnidad: z.string().nullable().default(null),
  prioridad: z.enum(["normal", "media", "urgente"]).default("normal"),
  PDI: z.boolean(),
  listaPreviaCreatedAt: z.string().nullable().optional(),
  listaPreviaUsuario: z.string().nullable().optional(),
});

export const pedidoUnidadSchema = z.object({
  _id: z.string(),
  fecha: z.string(),
  usuario_id: z.string(),
  usuarioNombre: z.string(),
  items: z.array(pedidoUnidadItemSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const pedidoUnidadInfoInternoResponseSchema = z.object({
  data: pedidoUnidadInfoInternoSchema,
});

export const pedidoUnidadListResponseSchema = z.object({
  data: z.array(pedidoUnidadSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalRecords: z.number(),
    totalPages: z.number(),
  }),
});

export const pedidoUnidadRegistroSchema = z.object({
  pedidoId: z.string(),
  fecha: z.string(),
  usuario_id: z.string(),
  usuarioNombre: z.string(),
  createdAt: z.string(),
  interno: z.number(),
  version: z.string().default("-"),
  order: z.string().default("-"),
  cliente: z.string().default("-"),
  vendedor: z.string().default("-"),
  chasis: z.string().nullable().default(null),
  estadoUnidad: z.string().nullable().default(null),
  prioridad: z.enum(["normal", "media", "urgente"]).default("normal"),
  PDI: z.boolean(),
  listaPreviaCreatedAt: z.string().nullable().optional(),
  listaPreviaUsuario: z.string().nullable().optional(),
});

export const pedidoUnidadRegistroListResponseSchema = z.object({
  data: z.array(pedidoUnidadRegistroSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});

export const pedidoUnidadResponseSchema = z.object({
  data: pedidoUnidadSchema,
  message: z.string(),
});

export const pedidoUnidadInternosEstadoResponseSchema = z.object({
  data: z.record(z.string(), z.boolean()),
});
export type PedidoUnidadInternosEstadoResponse = z.infer<
  typeof pedidoUnidadInternosEstadoResponseSchema
>;

export const pedidoUnidadPreviaSchema = z.object({
  _id: z.string(),
  interno: z.number(),
  clienteNombre: z.string(),
  vendedorNombre: z.string(),
  chasis: z.string().nullable(),
  version: z.string(),
  modelo: z.string(),
  prioridad: z.enum(["normal", "media", "urgente"]),
  usuario_id: z.string(),
  usuario: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const pedidoUnidadPreviaListResponseSchema = z.object({
  data: z.array(pedidoUnidadPreviaSchema),
});

export const pedidoUnidadPreviaResponseSchema = z.object({
  data: pedidoUnidadPreviaSchema.optional(),
  message: z.string(),
});

export type PedidoUnidadInfoInterno = z.infer<typeof pedidoUnidadInfoInternoSchema>;
export type PedidoUnidadItem = z.infer<typeof pedidoUnidadItemSchema>;
export type PedidoUnidad = z.infer<typeof pedidoUnidadSchema>;
export type PedidoUnidadListResponse = z.infer<typeof pedidoUnidadListResponseSchema>;
export type PedidoUnidadRegistro = z.infer<typeof pedidoUnidadRegistroSchema>;
export type PedidoUnidadRegistroListResponse = z.infer<typeof pedidoUnidadRegistroListResponseSchema>;
export type PedidoUnidadPrioridad = PedidoUnidadItem["prioridad"];
export type PedidoUnidadPrevia = z.infer<typeof pedidoUnidadPreviaSchema>;

//**************************** */
// FACTURAS ANTICIPO
//**************************** */

export const facturaAnticipoSchema = z.object({
  _id: z.string(),
  numeroOp: z.number(),
  cliente: z.string(),
  version: z.string(),
  vendedor: z.string(),
  chasis: z.string(),
  usuarioCarga: z.string(),
  fechaCarga: z.string(),
  estaFacturada: z.boolean(),
});

export const facturaAnticipoListResponseSchema = z.object({
  data: z.array(facturaAnticipoSchema),
});

export const facturaAnticipoResponseSchema = z.object({
  data: facturaAnticipoSchema.optional(),
  message: z.string(),
});

export type FacturaAnticipo = z.infer<typeof facturaAnticipoSchema>;

//**************************** */
// SEG. UNIDADES FABRICA
//**************************** */

export const segUnidadFabricaSchema = z.object({
  _id: z.string(),
  orderNumber: z.string(),
  modelo: z.string().nullable(),
  version: z.string().nullable(),
  opera: z.number().nullable().optional(),
  cliente: z.string().optional().default("-"),
  color: z.string().optional().default("-"),
  ubicacion: z.string().nullable(),
  fechaLimiteDePago: z.string().nullable(),
  habilitacionFinanzas: z.string().nullable(),
  usuarioImportacion: z.string(),
  fechaImportacion: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const segUnidadesFabricaListResponseSchema = z.object({
  data: z.array(segUnidadFabricaSchema),
});

export const segUnidadesFabricaImportResponseSchema = z.object({
  data: z.object({
    totalRows: z.number(),
    importedRows: z.number(),
    omittedRows: z.number(),
    removedWithVin: z.number(),
    removedWithFinanzas: z.number(),
    removedMissing: z.number(),
  }),
  message: z.string(),
});

export type SegUnidadFabrica = z.infer<typeof segUnidadFabricaSchema>;

//**************************** */
// REGISTRO ASIGNACIONES
//**************************** */

export const registroAsignacionInfoOperacionSchema = z.object({
  operacion: z.number(),
  interno: z.number(),
  cliente: z.string(),
  modelo: z.string(),
  version: z.string(),
  chasis: z.string(),
  sucursal: z.string(),
  vendedor: z.string(),
});

export const registroAsignacionSchema = z.object({
  _id: z.string(),
  fecha: z.string(),
  usuario_id: z.string(),
  usuarioNombre: z.string(),
  operacion: z.number(),
  interno: z.number(),
  cliente: z.string(),
  modelo: z.string(),
  version: z.string(),
  chasis: z.string(),
  sucursal: z.string(),
  vendedor: z.string(),
  observaciones: z.string().optional().default(""),
  tipo: z.enum(["Asignado", "Desasignado"]),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const registroAsignacionListResponseSchema = z.object({
  data: z.array(registroAsignacionSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});

export const registroAsignacionInfoOperacionResponseSchema = z.object({
  data: registroAsignacionInfoOperacionSchema,
});

export const registroAsignacionResponseSchema = z.object({
  data: registroAsignacionSchema.optional(),
  message: z.string(),
});

export const registroAsignacionResumenResponseSchema = z.object({
  resumenMensual: z.object({
    periodo: z.object({
      mes: z.number(),
      ano: z.number(),
    }),
    porModelo: z.array(
      z.object({
        modelo: z.string(),
        asignadas: z.number(),
        desasignadas: z.number(),
        neto: z.number(),
      }),
    ),
    total: z.object({
      asignadas: z.number(),
      desasignadas: z.number(),
      neto: z.number(),
    }),
    sucursales: z.array(z.string()),
    porModeloSucursal: z.array(
      z.object({
        modelo: z.string(),
        total: z.number(),
        asignadas: z.number(),
        desasignadas: z.number(),
        sucursales: z.record(
          z.string(),
          z.object({
            asignadas: z.number(),
            desasignadas: z.number(),
            neto: z.number(),
          }),
        ),
      }),
    ),
    resumenSucursales: z.array(
      z.object({
        sucursal: z.string(),
        asignadas: z.number(),
        desasignadas: z.number(),
        neto: z.number(),
      }),
    ),
    porDia: z.array(
      z.object({
        dia: z.number(),
        label: z.string(),
        asignadas: z.number(),
        desasignadas: z.number(),
      }),
    ),
  }),
  resumenAnual: z.object({
    ano: z.number(),
    porMes: z.array(
      z.object({
        mes: z.number(),
        label: z.string(),
        asignadas: z.number(),
        desasignadas: z.number(),
      }),
    ),
  }),
});

export type RegistroAsignacion = z.infer<typeof registroAsignacionSchema>;
export type RegistroAsignacionInfoOperacion = z.infer<
  typeof registroAsignacionInfoOperacionSchema
>;
export type RegistroAsignacionListResponse = z.infer<
  typeof registroAsignacionListResponseSchema
>;
export type RegistroAsignacionResumenResponse = z.infer<
  typeof registroAsignacionResumenResponseSchema
>;

//**************************** */
// PREVENTAS
//**************************** */

export const catalogoSchema = z.object({
  _id: z.string(),
  nombre: z.string(),
  activo: z.boolean(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const catalogoListResponseSchema = z.object({
  data: z.array(catalogoSchema),
});

export const catalogoResponseSchema = z.object({
  data: catalogoSchema,
  message: z.string(),
});

export const planNegocioSchema = z.object({
  _id: z.string(),
  modelo: z.string(),
  anio: z.number(),
  objetivo: z.number(),
  activo: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const planNegocioListResponseSchema = z.object({
  data: z.array(planNegocioSchema),
});

export const planNegocioResponseSchema = z.object({
  data: planNegocioSchema,
  message: z.string(),
});

const planNegocioMesesSchema = z.object({
  ene: z.number(),
  feb: z.number(),
  mar: z.number(),
  abr: z.number(),
  may: z.number(),
  jun: z.number(),
  jul: z.number(),
  ago: z.number(),
  sep: z.number(),
  oct: z.number(),
  nov: z.number(),
  dic: z.number(),
});

export const planNegocioResumenRowSchema = z.object({
  modelo: z.string(),
  objetivo: z.number(),
  totalAsignado: z.number(),
  avance: z.number(),
  restante: z.number(),
  xMes: z.number(),
}).extend(planNegocioMesesSchema.shape);

export const planNegocioResumenResponseSchema = z.object({
  data: z.array(planNegocioResumenRowSchema),
  total: planNegocioResumenRowSchema,
  meta: z.object({
    anio: z.number(),
    mesesRestantes: z.number(),
  }),
});

export const planNegocioModelosResponseSchema = z.object({
  data: z.array(z.string()),
});

export const testDriveSchema = z.object({
  _id: z.string(),
  dominio: z.string(),
  modelo: z.string(),
  version: z.string(),
  versionNombre: z.string(),
  chasis: z.string(),
  color: z.string(),
    colorNombre: z.string(),
    negocio: z.enum(["convencional", "planAhorro"]),
    anio: z.number(),
    permiteStarlink: z.boolean(),
    activo: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const testDriveListResponseSchema = z.object({
  data: z.array(testDriveSchema),
});

export const testDriveResponseSchema = z.object({
  data: testDriveSchema.nullable().optional(),
  message: z.string(),
});

export const testDriveOptionSchema = z.object({
    _id: z.string(),
    dominio: z.string(),
    version: z.string(),
    versionNombre: z.string(),
    permiteStarlink: z.boolean(),
  });

export const testDriveOptionListResponseSchema = z.object({
  data: z.array(testDriveOptionSchema),
});

export const testDriveRegistroSchema = z.object({
  _id: z.string(),
  unidadId: z.string(),
  dominio: z.string(),
  versionNombre: z.string(),
  negocio: z.enum(["convencional", "planAhorro"]),
  fechaSolicitado: z.string(),
  fechaRetiro: z.string(),
  horaRetiro: z.string(),
  fechaRegreso: z.string(),
  horaRegreso: z.string(),
    retiroAt: z.string(),
    regresoAt: z.string(),
    starlink: z.boolean(),
    permiteStarlink: z.boolean().optional().default(false),
    observacion: z.string().optional().default(""),
  solicitadoPorId: z.string(),
  solicitadoPorNombre: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const testDriveRegistroListResponseSchema = z.object({
  data: z.array(testDriveRegistroSchema),
});

export const testDriveRegistroResponseSchema = z.object({
  data: testDriveRegistroSchema.nullable().optional(),
  message: z.string(),
});

export const preventaSchema = z.object({
  _id: z.string(),
  vendedor: z.number(),
  vendedorNombre: z.string(),
  numero_op: z.number().nullable().optional(),
  cliente: z.string(),
  version: catalogoSchema,
  colores: z.array(catalogoSchema),
  monto_reserva: z.number().nullable().optional(),
  observaciones: z.string().optional().default(""),
  mes_asigna: z.string(),
  mes_asigna_label: z.string(),
  asignado: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const preventaListResponseSchema = z.object({
  data: z.array(preventaSchema),
});

export const preventaResponseSchema = z.object({
  data: preventaSchema,
  message: z.string().optional().default(""),
});

export const preventaResumenItemSchema = z.object({
  mes_asigna: z.string(),
  mes_asigna_label: z.string(),
  version: z.string(),
  color: z.string(),
  vendedor: z.string(),
  cantidad: z.number(),
});

export const preventaResumenResponseSchema = z.object({
  data: z.array(preventaResumenItemSchema),
});

export const pedidoMensualSchema = z.object({
  _id: z.string(),
  version: catalogoSchema,
  cantidad: z.number(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const pedidoMensualListResponseSchema = z.object({
  data: z.array(pedidoMensualSchema),
});

export const pedidoMensualResponseSchema = z.object({
  data: pedidoMensualSchema,
  message: z.string(),
});

export const versionPrecioMensualSchema = z.object({
  _id: z.string(),
  version: catalogoSchema,
  mes: z.string(),
  precio: z.number(),
  descuentoReferenciaPct: z.number(),
  activo: z.boolean(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const versionPrecioMensualListResponseSchema = z.object({
  data: z.array(versionPrecioMensualSchema),
});

export const versionPrecioMensualResponseSchema = z.object({
  data: versionPrecioMensualSchema,
  message: z.string(),
});

export const planFinancieroPlazoSchema = z.object({
  _id: z.string(),
  plazo: z.number(),
  tna: z.number(),
  quebrantoTipo: z.enum(["porcentaje", "monto"]),
  quebrantoValor: z.number(),
  maxFinanciacionTipo: z.enum(["porcentaje", "monto"]),
  maxFinanciacionValor: z.number(),
  activo: z.boolean(),
});

export const planFinancieroSchema = z.object({
  _id: z.string(),
  entidad: z.string(),
  nombre: z.string(),
  activo: z.boolean(),
  plazos: z.array(planFinancieroPlazoSchema),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const planFinancieroListResponseSchema = z.object({
  data: z.array(planFinancieroSchema),
});

export const planFinancieroResponseSchema = z.object({
  data: planFinancieroSchema,
  message: z.string(),
});

export const cotizadorVersionSchema = z.object({
  _id: z.string(),
  nombre: z.string(),
  activo: z.boolean(),
  precioId: z.string().nullable(),
  precio: z.number().nullable(),
  descuentoReferenciaPct: z.number(),
  precioActivo: z.boolean(),
});

export const cotizadorCatalogoResponseSchema = z.object({
  data: z.object({
    mes: z.string(),
    versiones: z.array(cotizadorVersionSchema),
    entidades: z.array(z.string()),
    planes: z.array(planFinancieroSchema),
  }),
});

export const resumenPedidoMensualItemSchema = z.object({
  versionId: z.string(),
  version: z.string(),
  pedido: z.number(),
  preventas_pendientes: z.number(),
  disponible: z.number(),
});

export const resumenPedidoMensualResponseSchema = z.object({
  data: z.array(resumenPedidoMensualItemSchema),
});

export const analisisStockMonthSchema = z.object({
  key: z.string(),
  label: z.string(),
  month: z.number(),
  year: z.number(),
});

export const analisisStockDictionaryItemSchema = z.object({
  _id: z.string(),
  modelo: z.string(),
  modeloKey: z.string(),
  versionRaw: z.string(),
  versionRawKey: z.string(),
  versionCanonica: z.string(),
  versionCanonicaKey: z.string(),
  activa: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const analisisStockVersionesDisponiblesItemSchema = z.object({
  modelo: z.string(),
  marca: z.string(),
  versions: z.array(z.string()),
});

export const analisisStockRowSchema = z.object({
  version: z.string(),
  versionKey: z.string(),
  versionCanonica: z.string(),
  versionOriginales: z.array(z.string()),
  countsByMonth: z.record(z.string(), z.number()),
  unitsByMonth: z.record(
    z.string(),
    z.array(
      z.object({
        interno: z.number(),
        nrofab: z.string(),
        color: z.string(),
        fechaRecepcion: z.string(),
      }),
    ),
  ),
  unitsTotal: z.array(
    z.object({
      interno: z.number(),
      nrofab: z.string(),
      color: z.string(),
      fechaRecepcion: z.string(),
    }),
  ),
  stockTotal: z.number(),
  ped: z.number(),
  promedioVenta: z.number(),
  total: z.number(),
});

export const analisisStockGroupSchema = z.object({
  modelo: z.string(),
  rows: z.array(analisisStockRowSchema),
  total: z.number(),
  promedioVenta: z.number(),
  mesesStock: z.number(),
});

export const analisisStockDataSchema = z.object({
  months: z.array(analisisStockMonthSchema),
  groups: z.array(analisisStockGroupSchema),
  dictionary: z.array(analisisStockDictionaryItemSchema),
  totals: z.object({
    modelo: z.string(),
    countsByMonth: z.record(z.string(), z.number()),
    ped: z.number(),
    promedioVenta: z.number(),
    mesesStock: z.number(),
    total: z.number(),
  }),
  meta: z.object({
    totalUnidades: z.number(),
  }),
});

export const analisisStockResponseSchema = z.object({
  data: analisisStockDataSchema,
});

export const analisisStockPedResponseSchema = z.object({
  data: z.object({
    modelo: z.string(),
    version: z.string(),
    cantidad: z.number(),
  }),
  message: z.string(),
});

export const analisisStockDictionaryListResponseSchema = z.object({
  data: z.array(analisisStockDictionaryItemSchema),
});

export const analisisStockDictionaryResponseSchema = z.object({
  data: analisisStockDictionaryItemSchema,
  message: z.string(),
});

export const analisisStockVersionesDisponiblesResponseSchema = z.object({
  data: z.array(analisisStockVersionesDisponiblesItemSchema),
});

export const pendFacLocationSchema = z.object({
  key: z.string(),
  label: z.string(),
});

export const pendFacUnitSchema = z.object({
  interno: z.string(),
  nrofab: z.string(),
  version: z.string(),
  modelo: z.string(),
  chasis: z.string(),
  color: z.string(),
  cliente: z.string(),
  vendedor: z.string(),
  ubicacion: z.string(),
  opera: z.string(),
  diasAsignado: z.number(),
});

export const pendFacRowSchema = z.object({
  version: z.string(),
  versionKey: z.string(),
  countsByLocation: z.record(z.string(), z.number()),
  unitsByLocation: z.record(z.string(), z.array(pendFacUnitSchema)),
  unitsTotal: z.array(pendFacUnitSchema),
  total: z.number(),
});

export const pendFacGroupSchema = z.object({
  modelo: z.string(),
  rows: z.array(pendFacRowSchema),
});

export const pendFacDataSchema = z.object({
  locations: z.array(pendFacLocationSchema),
  groups: z.array(pendFacGroupSchema),
  totals: z.object({
    modelo: z.string(),
    countsByLocation: z.record(z.string(), z.number()),
    total: z.number(),
  }),
  meta: z.object({
    totalUnidades: z.number(),
  }),
});

export const pendFacResponseSchema = z.object({
  data: pendFacDataSchema,
});

export const fsanchezOperacionItemSchema = z.object({
  interno: z.string(),
  nrofab: z.string(),
  version: z.string(),
  modelo: z.string(),
  chasis: z.string(),
  certif: z.boolean().default(false),
  color: z.string(),
  cliente: z.string(),
  vendedor: z.string(),
  ubicacion: z.string(),
  opera: z.string(),
  diasAsignado: z.number(),
  cancelada: z.boolean(),
  alerta: z.enum(["normal", "media", "alta"]).default("normal"),
  comentario: z.string().default(""),
});

export const fsanchezOperacionesResponseSchema = z.object({
  data: z.array(fsanchezOperacionItemSchema),
  meta: z.object({
    total: z.number(),
    conSaldo: z.number(),
    canceladas: z.number(),
  }),
});

export const fsanchezOperacionEstadoResponseSchema = z.object({
  message: z.string(),
  data: z.object({
    _id: z.string(),
    opera: z.string(),
    cancelada: z.boolean(),
    alerta: z.enum(["normal", "media", "alta"]).default("normal"),
    comentario: z.string().default(""),
    updatedBy: z.string().nullable(),
    updatedByName: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
  }),
});

export type Catalogo = z.infer<typeof catalogoSchema>;
export type CatalogoListResponse = z.infer<typeof catalogoListResponseSchema>;
export type CatalogoResponse = z.infer<typeof catalogoResponseSchema>;
export type PlanNegocioItem = z.infer<typeof planNegocioSchema>;
export type PlanNegocioListResponse = z.infer<typeof planNegocioListResponseSchema>;
export type PlanNegocioResponse = z.infer<typeof planNegocioResponseSchema>;
export type PlanNegocioResumenRow = z.infer<typeof planNegocioResumenRowSchema>;
export type PlanNegocioResumenResponse = z.infer<typeof planNegocioResumenResponseSchema>;
export type PlanNegocioModelosResponse = z.infer<typeof planNegocioModelosResponseSchema>;
export type TestDrive = z.infer<typeof testDriveSchema>;
export type TestDriveListResponse = z.infer<typeof testDriveListResponseSchema>;
export type TestDriveResponse = z.infer<typeof testDriveResponseSchema>;
export type TestDriveOption = z.infer<typeof testDriveOptionSchema>;
export type TestDriveOptionListResponse = z.infer<typeof testDriveOptionListResponseSchema>;
export type TestDriveRegistro = z.infer<typeof testDriveRegistroSchema>;
export type TestDriveRegistroListResponse = z.infer<typeof testDriveRegistroListResponseSchema>;
export type TestDriveRegistroResponse = z.infer<typeof testDriveRegistroResponseSchema>;
export type Preventa = z.infer<typeof preventaSchema>;
export type PreventaListResponse = z.infer<typeof preventaListResponseSchema>;
export type PreventaResponse = z.infer<typeof preventaResponseSchema>;
export type PreventaResumenItem = z.infer<typeof preventaResumenItemSchema>;
export type PreventaResumenResponse = z.infer<typeof preventaResumenResponseSchema>;
export type PedidoMensual = z.infer<typeof pedidoMensualSchema>;
export type PedidoMensualListResponse = z.infer<typeof pedidoMensualListResponseSchema>;
export type PedidoMensualResponse = z.infer<typeof pedidoMensualResponseSchema>;
export type VersionPrecioMensual = z.infer<typeof versionPrecioMensualSchema>;
export type VersionPrecioMensualListResponse = z.infer<typeof versionPrecioMensualListResponseSchema>;
export type VersionPrecioMensualResponse = z.infer<typeof versionPrecioMensualResponseSchema>;
export type PlanFinancieroPlazo = z.infer<typeof planFinancieroPlazoSchema>;
export type PlanFinanciero = z.infer<typeof planFinancieroSchema>;
export type PlanFinancieroListResponse = z.infer<typeof planFinancieroListResponseSchema>;
export type PlanFinancieroResponse = z.infer<typeof planFinancieroResponseSchema>;
export type CotizadorVersion = z.infer<typeof cotizadorVersionSchema>;
export type CotizadorCatalogoResponse = z.infer<typeof cotizadorCatalogoResponseSchema>;
export type ResumenPedidoMensualItem = z.infer<typeof resumenPedidoMensualItemSchema>;
export type ResumenPedidoMensualResponse = z.infer<typeof resumenPedidoMensualResponseSchema>;
export type AnalisisStockMonth = z.infer<typeof analisisStockMonthSchema>;
export type AnalisisStockDictionaryItem = z.infer<typeof analisisStockDictionaryItemSchema>;
export type AnalisisStockVersionesDisponiblesItem = z.infer<typeof analisisStockVersionesDisponiblesItemSchema>;
export type AnalisisStockRow = z.infer<typeof analisisStockRowSchema>;
export type AnalisisStockGroup = z.infer<typeof analisisStockGroupSchema>;
export type AnalisisStockData = z.infer<typeof analisisStockDataSchema>;
export type AnalisisStockResponse = z.infer<typeof analisisStockResponseSchema>;
export type AnalisisStockPedResponse = z.infer<typeof analisisStockPedResponseSchema>;
export type AnalisisStockDictionaryListResponse = z.infer<typeof analisisStockDictionaryListResponseSchema>;
export type AnalisisStockDictionaryResponse = z.infer<typeof analisisStockDictionaryResponseSchema>;
export type AnalisisStockVersionesDisponiblesResponse = z.infer<typeof analisisStockVersionesDisponiblesResponseSchema>;
export type PendFacLocation = z.infer<typeof pendFacLocationSchema>;
export type PendFacUnit = z.infer<typeof pendFacUnitSchema>;
export type PendFacRow = z.infer<typeof pendFacRowSchema>;
export type PendFacGroup = z.infer<typeof pendFacGroupSchema>;
export type PendFacData = z.infer<typeof pendFacDataSchema>;
export type PendFacResponse = z.infer<typeof pendFacResponseSchema>;
export type FsanchezOperacionItem = z.infer<typeof fsanchezOperacionItemSchema>;
export type FsanchezOperacionesResponse = z.infer<typeof fsanchezOperacionesResponseSchema>;
export type FsanchezOperacionEstadoResponse = z.infer<typeof fsanchezOperacionEstadoResponseSchema>;

//**************************** */
// PROFORMAS
//**************************** */

export const proformaRowSchema = z.object({
  detalle: z.string(),
  cantidad: z.number(),
  iva: z.number(),
  neto: z.number(),
  total: z.number(),
  totales: z.number(),
});

export const proformaUnidadSchema = z.object({
  _id: z.string(),
  versionId: z.string(),
  versionNombre: z.string(),
  cantidad: z.number(),
  ivaUnidad: z.number(),
  totalUnidad: z.number(),
  descuentoUnidad: z.number(),
  totalPatentamiento: z.number(),
  totalFlete: z.number(),
  rows: z.array(proformaRowSchema),
  subtotal: z.number(),
});

export const proformaSchema = z.object({
  _id: z.string(),
  numeroProforma: z.number(),
  fecha: z.string(),
  fechaLabel: z.string(),
  listaPrecioLabel: z.string(),
  senores: z.string(),
  cliente: z.string(),
  cuit: z.string(),
  observaciones: z.string(),
  asesorComercial: z.string(),
  emailAsesor: z.string(),
  usuarioId: z.string(),
  unidades: z.array(proformaUnidadSchema),
  totalNeto: z.number(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const proformaListResponseSchema = z.object({
  data: z.array(proformaSchema),
});

export const proformaResponseSchema = z.object({
  data: proformaSchema,
  message: z.string().optional().default(""),
});

export type Proforma = z.infer<typeof proformaSchema>;
export type ProformaListResponse = z.infer<typeof proformaListResponseSchema>;
export type ProformaResponse = z.infer<typeof proformaResponseSchema>;

export const minutaUserSchema = z.object({
  _id: z.string(),
  name: z.string(),
  lastName: z.string(),
  email: z.string().optional().default(""),
});

export const minutaTemarioSchema = z.object({
  orden: z.number(),
  nombre: z.string(),
  desarrollo: z.string(),
});

export const minutaSchema = z.object({
  _id: z.string(),
  fecha: z.string(),
  fechaLabel: z.string(),
  tema: z.string(),
  moderador: minutaUserSchema,
  participantes: z.array(minutaUserSchema),
  participantesCount: z.number(),
  temasCount: z.number(),
  temario: z.array(minutaTemarioSchema),
  createdBy: z.string(),
  sentAt: z.string().nullable().optional().default(null),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const minutaListResponseSchema = z.object({
  data: z.array(minutaSchema),
});

export const minutaResponseSchema = z.object({
  data: minutaSchema.nullable().optional(),
  message: z.string().optional().default(""),
});

export const minutaParticipantsResponseSchema = z.object({
  data: z.array(minutaUserSchema),
});

export const minutaGrupoSchema = z.object({
  _id: z.string(),
  nombre: z.string(),
  participantes: z.array(minutaUserSchema),
  participantesCount: z.number(),
  createdBy: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const minutaGroupsListResponseSchema = z.object({
  data: z.array(minutaGrupoSchema),
});

export const minutaGroupResponseSchema = z.object({
  data: minutaGrupoSchema.nullable().optional(),
  message: z.string().optional().default(""),
});

export type Minuta = z.infer<typeof minutaSchema>;
export type MinutaTemario = z.infer<typeof minutaTemarioSchema>;
export type MinutaUser = z.infer<typeof minutaUserSchema>;
export type MinutaListResponse = z.infer<typeof minutaListResponseSchema>;
export type MinutaResponse = z.infer<typeof minutaResponseSchema>;
export type MinutaParticipantsResponse = z.infer<typeof minutaParticipantsResponseSchema>;
export type MinutaGrupo = z.infer<typeof minutaGrupoSchema>;
export type MinutaGroupsListResponse = z.infer<typeof minutaGroupsListResponseSchema>;
export type MinutaGroupResponse = z.infer<typeof minutaGroupResponseSchema>;

export const comercialAgendaUserSchema = z.object({
  _id: z.string(),
  name: z.string(),
  lastName: z.string(),
  email: z.string().optional().default(""),
});

export const comercialAgendaPuestoSchema = z.object({
  _id: z.string(),
  unidadNegocioId: z.string(),
  nombre: z.string(),
  orden: z.number(),
  activo: z.boolean(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const unidadNegocioSchema = z.object({
  _id: z.string(),
  nombre: z.string(),
  activo: z.boolean(),
  orden: z.number(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const comercialAgendaAsignacionSchema = z.object({
  fecha: z.string(),
  fechaLabel: z.string(),
  puestoId: z.string(),
  puestoNombre: z.string(),
  asignacionId: z.string().nullable().optional(),
  asistentes: z.array(comercialAgendaUserSchema),
});

export const comercialAgendaDaySchema = z.object({
  fecha: z.string(),
  fechaLabel: z.string(),
  weekdayLabel: z.string(),
  cells: z.array(comercialAgendaAsignacionSchema),
});

export const comercialAgendaSemanaSchema = z.object({
  weekStart: z.string(),
  weekEnd: z.string(),
  weekLabel: z.string(),
  puestos: z.array(comercialAgendaPuestoSchema),
  days: z.array(comercialAgendaDaySchema),
});

export const comercialAgendaUsersResponseSchema = z.object({
  data: z.array(comercialAgendaUserSchema),
});

export const unidadNegocioListResponseSchema = z.object({
  data: z.array(unidadNegocioSchema),
  message: z.string().optional().default(""),
});

export const unidadNegocioResponseSchema = z.object({
  data: unidadNegocioSchema,
  message: z.string().optional().default(""),
});

export const comercialAgendaPuestosResponseSchema = z.object({
  data: z.array(comercialAgendaPuestoSchema),
  message: z.string().optional().default(""),
});

export const comercialAgendaSemanaResponseSchema = z.object({
  data: comercialAgendaSemanaSchema,
});

export const comercialAgendaCellResponseSchema = z.object({
  data: comercialAgendaAsignacionSchema,
  message: z.string().optional().default(""),
});

export type ComercialAgendaUser = z.infer<typeof comercialAgendaUserSchema>;
export type ComercialAgendaPuesto = z.infer<typeof comercialAgendaPuestoSchema>;
export type ComercialAgendaAsignacion = z.infer<typeof comercialAgendaAsignacionSchema>;
export type ComercialAgendaDay = z.infer<typeof comercialAgendaDaySchema>;
export type ComercialAgendaSemana = z.infer<typeof comercialAgendaSemanaSchema>;
export type ComercialAgendaUsersResponse = z.infer<typeof comercialAgendaUsersResponseSchema>;
export type ComercialAgendaPuestosResponse = z.infer<typeof comercialAgendaPuestosResponseSchema>;
export type ComercialAgendaSemanaResponse = z.infer<typeof comercialAgendaSemanaResponseSchema>;
export type ComercialAgendaCellResponse = z.infer<typeof comercialAgendaCellResponseSchema>;
export type UnidadNegocio = z.infer<typeof unidadNegocioSchema>;
export type UnidadNegocioListResponse = z.infer<typeof unidadNegocioListResponseSchema>;
export type UnidadNegocioResponse = z.infer<typeof unidadNegocioResponseSchema>;

//**************************** */
// ENTREGAS
//**************************** */

export const agendaEntregaLookupSchema = z.object({
  interno: z.number(),
  estado: z.number().nullable(),
  tipoOperacion: z.string(),
  operacion: z.number().nullable().optional(),
  grupo: z.number().nullable().optional(),
  orden: z.number().nullable().optional(),
  cliente: z.string(),
  telefono: z.string().nullable().optional(),
  vendedor: z.string(),
  version: z.string().nullable().optional(),
  modelo: z.string().nullable().optional(),
  chasis: z.string().nullable().optional(),
  serie: z.string().nullable().optional(),
  nroFabricacion: z.string().nullable().optional(),
  dominio: z.string().nullable().optional(),
  fechaPatente: z.string().nullable().optional(),
  color: z.string(),
});

export const agendaEntregaLookupResponseSchema = z.object({
  data: agendaEntregaLookupSchema,
});

export const sucursalEntregaSchema = z.object({
  _id: z.string(),
  nombre: z.string(),
  direccion: z.string().optional().default(""),
  activa: z.boolean(),
  horariosHabilitados: z.array(z.string()).default([]),
  observaciones: z.string().optional().default(""),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const sucursalEntregaListResponseSchema = z.object({
  data: z.array(sucursalEntregaSchema),
});

export const sucursalEntregaResponseSchema = z.object({
  data: sucursalEntregaSchema,
  message: z.string(),
});

export const agendaEnvioConfigSchema = z.object({
  _id: z.string(),
  sucursal: z.object({
    _id: z.string(),
    nombre: z.string(),
    direccion: z.string().optional().default(""),
    activa: z.boolean(),
  }).nullable(),
  emails: z.array(z.string()).default([]),
  activo: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const agendaEnvioConfigListResponseSchema = z.object({
  data: z.array(agendaEnvioConfigSchema),
});

export const agendaEnvioConfigResponseSchema = z.object({
  data: agendaEnvioConfigSchema.nullable().optional(),
  message: z.string().optional().default(""),
});

export const agendaEntregaSiacSchema = z.object({
  interno: z.number(),
  estado: z.number().nullable(),
  tipoOperacion: z.string(),
  operacion: z.number().nullable().optional(),
  grupo: z.number().nullable().optional(),
  orden: z.number().nullable().optional(),
  cliente: z.string(),
  telefono: z.string().nullable().optional(),
  vendedor: z.string(),
  version: z.string().nullable().optional(),
  modelo: z.string().nullable().optional(),
  chasis: z.string().nullable().optional(),
  serie: z.string().nullable().optional(),
  nroFabricacion: z.string().nullable().optional(),
  dominio: z.string().nullable().optional(),
  fechaPatente: z.string().nullable().optional(),
  color: z.string(),
});

export const agendaEntregaSchema = z.object({
  _id: z.string(),
  tipoRegistro: z.enum(["turno", "reserva"]).default("turno"),
  interno: z.number().nullable(),
  tipoOperacion: z.string().default(""),
  sucursal: z.object({
    _id: z.string(),
    nombre: z.string(),
    direccion: z.string().optional().default(""),
    activa: z.boolean(),
  }).nullable(),
  fechaAgenda: z.string(),
  horaAgenda: z.string(),
  equipado: z.boolean(),
  entregaUsado: z.boolean(),
  siniestro: z.boolean(),
  entregadaPorMarcada: z.boolean(),
  entregadaPorUser: z.string().nullable().optional(),
  entregadaPorNombre: z.string().optional().default(""),
  entregadaPorFecha: z.string().nullable().optional(),
  observaciones: z.string().optional().default(""),
  createdBy: z.string(),
  createdByName: z.string(),
  updatedBy: z.string().nullable().optional(),
  updatedByName: z.string().optional().default(""),
  createdAt: z.string(),
  updatedAt: z.string(),
  siac: agendaEntregaSiacSchema.nullable().optional(),
  siacSyncError: z.boolean(),
  siacSyncMessage: z.string().optional().default(""),
});

export const agendaEntregaListResponseSchema = z.object({
  data: z.array(agendaEntregaSchema),
});

export const agendaEntregaResponseSchema = z.object({
  data: agendaEntregaSchema.nullable().optional(),
  message: z.string(),
});

export const agendaEntregaLogSchema = z.object({
  _id: z.string(),
  agendaEntrega: z.string().nullable(),
  interno: z.number().nullable(),
  accion: z.enum([
    "CREADA",
    "MODIFICADA",
    "ELIMINADA",
    "PENDIENTE_CREADA",
    "PENDIENTE_MODIFICADA",
    "PENDIENTE_ELIMINADA",
    "PENDIENTE_TURNADA",
    "RESERVA_CREADA",
    "RESERVA_MODIFICADA",
    "RESERVA_ELIMINADA",
      "RESERVA_CONVERTIDA",
      "ENTREGA_MARCADA",
      "ENTREGA_DESMARCADA",
      "EQUIPADO_MARCADO",
      "EQUIPADO_DESMARCADO",
    ]),
  usuario: z.string().nullable(),
  usuarioNombre: z.string(),
  fecha: z.string(),
  detalle: z.string().optional().default(""),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const paginationSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  totalPages: z.number(),
});

export const agendaEntregaLogListResponseSchema = z.object({
  data: z.array(agendaEntregaLogSchema),
  pagination: paginationSchema,
});

export const pendienteTurnarSchema = z.object({
  _id: z.string(),
  interno: z.number(),
  tipoOperacion: z.string().default(""),
  sucursal: z.object({
    _id: z.string(),
    nombre: z.string(),
    direccion: z.string().optional().default(""),
    activa: z.boolean(),
  }).nullable(),
  equipado: z.boolean(),
  entregaUsado: z.boolean(),
  siniestro: z.boolean(),
  observaciones: z.string().optional().default(""),
  createdBy: z.string(),
  createdByName: z.string(),
  updatedBy: z.string().nullable().optional(),
  updatedByName: z.string().optional().default(""),
  createdAt: z.string(),
  updatedAt: z.string(),
  siac: agendaEntregaSiacSchema.nullable().optional(),
  siacSyncError: z.boolean(),
  siacSyncMessage: z.string().optional().default(""),
});

export const pendienteTurnarListResponseSchema = z.object({
  data: z.array(pendienteTurnarSchema),
});

export const pendienteTurnarResponseSchema = z.object({
  data: pendienteTurnarSchema.nullable().optional(),
  message: z.string(),
});

export const pendienteTurnarImportSummarySchema = z.object({
  processedRows: z.number(),
  createdCount: z.number(),
  skippedCount: z.number(),
  skippedAlreadyPending: z.number(),
  skippedAlreadyScheduled: z.number(),
  skippedInvalidRows: z.number(),
});

export const pendienteTurnarImportResponseSchema = z.object({
  data: pendienteTurnarImportSummarySchema,
  message: z.string(),
});

export type AgendaEntregaLookup = z.infer<typeof agendaEntregaLookupSchema>;
export type AgendaEntrega = z.infer<typeof agendaEntregaSchema>;
export type AgendaEntregaResponse = z.infer<typeof agendaEntregaResponseSchema>;
export type SucursalEntrega = z.infer<typeof sucursalEntregaSchema>;
export type SucursalEntregaListResponse = z.infer<typeof sucursalEntregaListResponseSchema>;
export type SucursalEntregaResponse = z.infer<typeof sucursalEntregaResponseSchema>;
export type AgendaEnvioConfig = z.infer<typeof agendaEnvioConfigSchema>;
export type AgendaEnvioConfigListResponse = z.infer<typeof agendaEnvioConfigListResponseSchema>;
export type AgendaEnvioConfigResponse = z.infer<typeof agendaEnvioConfigResponseSchema>;
export type AgendaEntregaListResponse = z.infer<typeof agendaEntregaListResponseSchema>;
export type AgendaEntregaLog = z.infer<typeof agendaEntregaLogSchema>;
export type AgendaEntregaLogListResponse = z.infer<typeof agendaEntregaLogListResponseSchema>;
export type PendienteTurnar = z.infer<typeof pendienteTurnarSchema>;
export type PendienteTurnarListResponse = z.infer<typeof pendienteTurnarListResponseSchema>;
export type PendienteTurnarResponse = z.infer<typeof pendienteTurnarResponseSchema>;
export type PendienteTurnarImportSummary = z.infer<typeof pendienteTurnarImportSummarySchema>;
export type PendienteTurnarImportResponse = z.infer<typeof pendienteTurnarImportResponseSchema>;

//**************************** */
// CALL CENTER
//**************************** */

export const callCenterImportDataSchema = z.object({
  worksheetName: z.string(),
  importedRows: z.number(),
  createdOrigins: z.number(),
});

export const callCenterImportResponseSchema = z.object({
  data: callCenterImportDataSchema,
  message: z.string(),
});

export const callCenterSummaryOriginSchema = z.object({
  _id: z.string(),
  nombre: z.string(),
  activo: z.boolean(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const callCenterDataOriginSchema = z.object({
  _id: z.string(),
  origen: z.string(),
  origenResumidoId: z.string().nullable(),
  origenResumido: callCenterSummaryOriginSchema.nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const callCenterDataOriginsResponseSchema = z.object({
  data: z.array(callCenterDataOriginSchema),
  message: z.string(),
});

export const callCenterOriginResponseSchema = z.object({
  data: callCenterDataOriginSchema,
  message: z.string(),
});

export const callCenterSummaryOriginsResponseSchema = z.object({
  data: z.array(callCenterSummaryOriginSchema),
  message: z.string(),
});

export const callCenterSummaryOriginResponseSchema = z.object({
  data: callCenterSummaryOriginSchema,
  message: z.string(),
});

export type CallCenterImportData = z.infer<typeof callCenterImportDataSchema>;
export type CallCenterImportResponse = z.infer<typeof callCenterImportResponseSchema>;
export type CallCenterSummaryOrigin = z.infer<typeof callCenterSummaryOriginSchema>;
export type CallCenterDataOrigin = z.infer<typeof callCenterDataOriginSchema>;
export type CallCenterDataOriginsResponse = z.infer<typeof callCenterDataOriginsResponseSchema>;
export type CallCenterOriginResponse = z.infer<typeof callCenterOriginResponseSchema>;
export type CallCenterSummaryOriginsResponse = z.infer<typeof callCenterSummaryOriginsResponseSchema>;
export type CallCenterSummaryOriginResponse = z.infer<typeof callCenterSummaryOriginResponseSchema>;
