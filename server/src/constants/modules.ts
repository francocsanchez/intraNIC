export const moduleKeys = [
  "convencional",
  "valorizacion",
  "usados",
  "belgrano",
  "liess",
  "saldoOperacionLiess",
  "liessReparaciones",
  "preventas",
  "proformas",
  "reventaPendientes",
  "listaPrevia",
  "facturasAnticipo",
  "asignaciones",
  "prediccionAsignaciones",
  "planNegocio",
  "registroAsignaciones",
  "pedidoMensual",
  "pedidoUnidades",
  "analisisStock",
  "pendFac",
  "solicitudCambioColor",
  "repuestosSiniestros",
  "noReparado",
  "pendienteDocumentacion",
  "ingresos",
  "talleresUsados",
  "operaciones",
  "dashboardSalon",
  "dashboardAdministracion",
  "saldoOperacion",
  "cobrosVendedor",
  "tableroCobranzas",
  "analisisOperaciones",
  "analisisVendedor",
  "promedio",
  "patentamientos",
  "transferencias",
  "actualizacionRegistros",
  "agendaEntrega",
  "pendientesTurnar",
  "usuarios",
  "configuracion",
  "links",
  "testDrive",
  "registroTestDriveConvencional",
  "registroTestDrive",
  "promediosPlanAhorro",
  "minutas",
  "kintoFlota",
  "kintoMatafuegos",
  "kintoMultas",
  "kintoNpsShare",
  "licitacionesAdministracion",
  "licitacionesResumen",
] as const;

export type ModuleKey = (typeof moduleKeys)[number];
export type UserModules = Partial<Record<ModuleKey, number | null>>;

const moduleKeySet = new Set<string>(moduleKeys);

const normalizeModuleValue = (value: unknown): number => {
  if (value === 1 || value === "1" || value === true) {
    return 1;
  }

  return 0;
};

export const sanitizeUserModules = (value: unknown): UserModules => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const modules: UserModules = {};

  for (const [key, entryValue] of Object.entries(value)) {
    if (!moduleKeySet.has(key)) {
      continue;
    }

    modules[key as ModuleKey] = normalizeModuleValue(entryValue);
  }

  return modules;
};

export const hasEnabledModule = (
  modules: UserModules | undefined,
  allowedModules: ModuleKey[],
) => {
  if (!modules) {
    return false;
  }

  return allowedModules.some((moduleKey) => Number(modules[moduleKey] ?? 0) === 1);
};
