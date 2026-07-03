export const moduleKeys = [
  "convencional",
  "usados",
  "liess",
  "callCenter",
  "preventas",
  "proformas",
  "reventaPendientes",
  "listaPrevia",
  "facturasAnticipo",
  "segUnidadesFabrica",
  "asignaciones",
  "planNegocio",
  "registroAsignaciones",
  "pedidoMensual",
  "pedidoUnidades",
  "noReparado",
  "pendienteDocumentacion",
  "ingresos",
  "operaciones",
  "ranking",
  "promedio",
  "patentamientos",
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
] as const;

export type ModuleKey = (typeof moduleKeys)[number];
export type UserModules = Partial<Record<ModuleKey, number | null>>;

export const moduleLabels: Record<ModuleKey, string> = {
  convencional: "Convencional",
  usados: "Usados",
  liess: "Liess",
  callCenter: "Call Center",
  preventas: "Preventas",
  proformas: "Proformas",
  reventaPendientes: "Reventa pendientes",
  listaPrevia: "Lista previa",
  facturasAnticipo: "Facturas anticipo",
  segUnidadesFabrica: "Seg. unidades fabrica",
  asignaciones: "Asignaciones",
  planNegocio: "Plan de negocio",
  registroAsignaciones: "Registro asignaciones",
  pedidoMensual: "Pedido mensual",
  pedidoUnidades: "Pedido unidades",
  noReparado: "No reparado",
  pendienteDocumentacion: "Pendiente documentacion",
  ingresos: "Ingresos",
  operaciones: "Operaciones",
  ranking: "Ranking",
  promedio: "Promedio",
  patentamientos: "Patentamientos",
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
};

export const moduleSections: Array<{
  title: string;
  modules: ModuleKey[];
}> = [
  {
    title: "Stock de unidades",
    modules: ["convencional", "usados", "liess"],
  },
  {
    title: "Call Center",
    modules: ["callCenter"],
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
    modules: ["reventaPendientes", "listaPrevia", "facturasAnticipo", "segUnidadesFabrica"],
  },
  {
    title: "Gestion de stock convencional",
    modules: ["asignaciones", "planNegocio", "registroAsignaciones", "pedidoMensual", "pedidoUnidades"],
  },
  {
    title: "Gestion de stock usados",
    modules: ["noReparado", "pendienteDocumentacion", "ingresos"],
  },
  {
    title: "Analisis",
    modules: ["operaciones", "ranking", "promedio", "patentamientos"],
  },
  {
    title: "Entregas",
    modules: ["agendaEntrega", "pendientesTurnar"],
  },
  {
    title: "Sistema",
    modules: ["usuarios", "configuracion", "testDrive", "actualizacionRegistros"],
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
