export const moduleKeys = [
  "convencional",
  "usados",
  "liess",
  "preventas",
  "proformas",
  "reventaPendientes",
  "listaPrevia",
  "facturasAnticipo",
  "asignaciones",
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
  "usuarios",
  "configuracion",
  "testDrive",
  "registroTestDriveConvencional",
  "registroTestDrive",
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
