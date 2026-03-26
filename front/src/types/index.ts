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
  ubicacion: z.string(),
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
  ubicacion: z.string(),
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
  ubicacion: z.string(),
  chasis: z.string(),
  sucursal: z.string(),
  fechaReserva: z.string(),
  fechaRecepcion: z.string(),
  clienteReserva:z.string()
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
  sucursal:z.string().nullable()
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