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
  vendedoresDisponibleLIES: z.array(z.string()),
  vendedoresStockGuardadoLIES: z.array(z.string()),
  vendedoresReservasLIES: z.array(z.string()),

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