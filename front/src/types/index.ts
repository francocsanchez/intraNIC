import { z } from "zod";

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

//**************************** */
// CONFIGURACION
//**************************** */

export const configuracionSchema = z.object({
  _id: z.string(),

  sistemaActivoConvencional: z.boolean(),
  vendedoresReservasConvencional: z.array(z.string()),
  vendedoresDisponibleConvencional: z.array(z.string()),
  vendedoresStockGuardadoConvencional: z.array(z.string()),
  vendedorReventasConvencional: z.array(z.string()).default([]),

  sistemaActivoUsados: z.boolean(),
  vendedoresReservasUsados: z.array(z.string()),
  vendedoresDisponibleUsados: z.array(z.string()),
  vendedoresStockGuardadoUsados: z.array(z.string()),

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
  enable: z.boolean(),
  numberSaleNic: z.number(),
  numberSaleLiess: z.number(),
  role: z.array(z.string()),
  company: z.array(z.string()),
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
  role: z.array(z.string()),
  enable: z.boolean(),
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
});

export const misOperacionesResumenSchema = z.object({
  total: z.number(),
  porDia: z.record(z.string(), z.number()),
  porModelo: z.record(z.string(), z.number()),
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
// TRACKING OPERACIONES
//**************************** */

export const trackingOperacionesStatusSchema = z.object({
  key: z.enum(["bueno", "medio", "malo", "sin-datos"]),
  label: z.string(),
});

export const trackingOperacionesResponseSchema = z.object({
  resumen: z.object({
    periodo: z.object({
      mes: z.number(),
      ano: z.number(),
      label: z.string(),
    }),
    mensual: z.object({
      promedioDias: z.number(),
      totalOperaciones: z.number(),
      estado: trackingOperacionesStatusSchema,
    }),
    porSucursal: z.array(
      z.object({
        sucursal: z.string(),
        promedioDias: z.number(),
        totalOperaciones: z.number(),
        estado: trackingOperacionesStatusSchema,
        graficoAnual: z.array(
          z.object({
            mes: z.number(),
            label: z.string(),
            promedioDias: z.number(),
            totalOperaciones: z.number(),
          }),
        ),
      }),
    ),
    graficoAnual: z.array(
      z.object({
        mes: z.number(),
        label: z.string(),
        promedioDias: z.number(),
        totalOperaciones: z.number(),
      }),
    ),
  }),
});

export type TrackingOperacionesResponse = z.infer<typeof trackingOperacionesResponseSchema>;

//**************************** */
// PEDIDO UNIDADES
//**************************** */

export const pedidoUnidadInfoInternoSchema = z.object({
  interno: z.number(),
  version: z.string(),
  order: z.string(),
  cliente: z.string(),
  vendedor: z.string(),
  chasis: z.string(),
});

export const pedidoUnidadItemSchema = pedidoUnidadInfoInternoSchema.extend({
  PDI: z.boolean(),
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

export type PedidoUnidadInfoInterno = z.infer<typeof pedidoUnidadInfoInternoSchema>;
export type PedidoUnidadItem = z.infer<typeof pedidoUnidadItemSchema>;
export type PedidoUnidad = z.infer<typeof pedidoUnidadSchema>;
export type PedidoUnidadListResponse = z.infer<typeof pedidoUnidadListResponseSchema>;

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

export type Catalogo = z.infer<typeof catalogoSchema>;
export type CatalogoListResponse = z.infer<typeof catalogoListResponseSchema>;
export type CatalogoResponse = z.infer<typeof catalogoResponseSchema>;
export type Preventa = z.infer<typeof preventaSchema>;
export type PreventaListResponse = z.infer<typeof preventaListResponseSchema>;
export type PreventaResponse = z.infer<typeof preventaResponseSchema>;
export type PreventaResumenItem = z.infer<typeof preventaResumenItemSchema>;
export type PreventaResumenResponse = z.infer<typeof preventaResumenResponseSchema>;
export type PedidoMensual = z.infer<typeof pedidoMensualSchema>;
export type PedidoMensualListResponse = z.infer<typeof pedidoMensualListResponseSchema>;
export type PedidoMensualResponse = z.infer<typeof pedidoMensualResponseSchema>;
export type ResumenPedidoMensualItem = z.infer<typeof resumenPedidoMensualItemSchema>;
export type ResumenPedidoMensualResponse = z.infer<typeof resumenPedidoMensualResponseSchema>;
