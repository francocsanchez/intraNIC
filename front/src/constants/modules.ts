export const moduleKeys = [
  "convencional",
  "valorizacion",
  "usados",
  "belgrano",
  "liess",
  "preventas",
  "proformas",
  "reventaPendientes",
  "listaPrevia",
  "facturasAnticipo",
  "asignaciones",
  "planNegocio",
  "registroAsignaciones",
  "pedidoMensual",
  "pedidoUnidades",
  "analisisStock",
  "pendFac",
  "noReparado",
  "pendienteDocumentacion",
  "ingresos",
  "operaciones",
  "centralDeudores",
  "analisisOperaciones",
  "analisisVendedor",
  "saldoOperacion",
  "ranking",
  "promedio",
  "patentamientos",
  "transferencias",
  "actualizacionRegistros",
  "agendaEntrega",
  "pendientesTurnar",
  "usuarios",
  "configuracion",
  "testDrive",
  "registroTestDriveConvencional",
  "registroTestDrive",
  "promediosPlanAhorro",
  "minutas",
  "ssiVentas",
] as const;

export type ModuleKey = (typeof moduleKeys)[number];
export type UserModules = Partial<Record<ModuleKey, number | null>>;

export const moduleLabels: Record<ModuleKey, string> = {
  convencional: "Convencional",
  valorizacion: "Valorizacion",
  usados: "Usados",
  belgrano: "Belgrano",
  liess: "Liess",
  preventas: "Preventas",
  proformas: "Proformas",
  reventaPendientes: "Reventa pendientes",
  listaPrevia: "Lista previa",
  facturasAnticipo: "Facturas anticipo",
  asignaciones: "Asignaciones",
  planNegocio: "Plan de negocio",
  registroAsignaciones: "Registro asignaciones",
  pedidoMensual: "Pedido mensual",
  pedidoUnidades: "Pedido unidades",
  analisisStock: "Analisis de stock",
  pendFac: "Pend Fac",
  noReparado: "No reparado",
  pendienteDocumentacion: "Pendiente documentacion",
  ingresos: "Ingresos",
  operaciones: "Operaciones",
  centralDeudores: "Central de Deudores",
  analisisOperaciones: "Analisis Operaciones",
  analisisVendedor: "Analisis Vendedor",
  saldoOperacion: "Saldo de operacion",
  ranking: "Ranking",
  promedio: "Promedio",
  patentamientos: "Patentamientos",
  transferencias: "Transferencias",
  actualizacionRegistros: "Act. Registros",
  agendaEntrega: "Agenda de entrega",
  pendientesTurnar: "Pendientes de turnar",
  usuarios: "Usuarios",
  configuracion: "Configuracion",
  testDrive: "TestDrive",
  registroTestDriveConvencional: "Registro TestDrive Comercial",
  registroTestDrive: "Registro TestDrive Plan de ahorro",
  promediosPlanAhorro: "Promedios Plan de ahorro",
  minutas: "Minutas",
  ssiVentas: "SSI Ventas",
};

export const moduleSections: Array<{
  title: string;
  modules: ModuleKey[];
}> = [
  {
    title: "Stock de unidades",
    modules: ["convencional", "valorizacion", "usados", "belgrano", "liess"],
  },
  {
    title: "Comercial",
    modules: ["preventas", "proformas", "registroTestDriveConvencional", "minutas"],
  },
  {
    title: "Plan de ahorro",
    modules: ["registroTestDrive", "promediosPlanAhorro"],
  },
  {
    title: "Administracion convencional",
    modules: ["reventaPendientes", "listaPrevia", "facturasAnticipo"],
  },
  {
    title: "Gestion de stock convencional",
    modules: ["asignaciones", "planNegocio", "registroAsignaciones", "pedidoMensual", "pedidoUnidades", "analisisStock", "pendFac"],
  },
  {
    title: "Gestion de stock usados",
    modules: ["noReparado", "pendienteDocumentacion", "ingresos"],
  },
  {
    title: "Analisis",
    modules: ["operaciones", "centralDeudores", "analisisOperaciones", "analisisVendedor", "saldoOperacion", "ranking", "promedio", "patentamientos", "transferencias"],
  },
  {
    title: "Entregas",
    modules: ["agendaEntrega", "pendientesTurnar"],
  },
  {
    title: "Sistema",
    modules: ["usuarios", "configuracion", "testDrive", "actualizacionRegistros"],
  },
  {
    title: "Calidad",
    modules: ["ssiVentas"],
  },
];

export const normalizeModules = (value: unknown): UserModules => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const modules: UserModules = {};

  for (const moduleKey of moduleKeys) {
    const moduleValue = (value as Record<string, unknown>)[moduleKey];

    if (moduleValue === undefined) {
      continue;
    }

    modules[moduleKey] =
      moduleValue === 1 || moduleValue === "1" || moduleValue === true ? 1 : 0;
  }

  return modules;
};

export const getDefaultModules = (): UserModules =>
  Object.fromEntries(moduleKeys.map((moduleKey) => [moduleKey, 0])) as UserModules;
