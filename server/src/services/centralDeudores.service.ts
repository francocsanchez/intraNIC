type BcraEnvelope<T> = {
  status: number;
  results?: T;
  errorMessages?: string[];
};

type BcraDeudaEntidad = {
  entidad: string;
  situacion: number;
  fechaSit1: string | null;
  monto: number;
  diasAtrasoPago: number;
  refinanciaciones: boolean;
  recategorizacionOblig: boolean;
  situacionJuridica: boolean;
  irrecDisposicionTecnica: boolean;
  enRevision: boolean;
  procesoJud: boolean;
};

type BcraHistoricaEntidad = {
  entidad: string;
  situacion: number;
  monto: number;
  enRevision: boolean;
  procesoJud: boolean;
};

type BcraChequeDetalle = {
  nroCheque: number;
  fechaRechazo: string;
  monto: number;
  fechaPago: string | null;
  fechaPagoMulta: string | null;
  estadoMulta: string | null;
  ctaPersonal: boolean;
  denomJuridica: string | null;
  enRevision: boolean;
  procesoJud: boolean;
};

type BcraCurrentResponse = {
  identificacion: number | string;
  denominacion: string;
  periodos: Array<{
    periodo: string;
    entidades: BcraDeudaEntidad[];
  }>;
};

type BcraHistoricalResponse = {
  identificacion: number | string;
  denominacion: string;
  periodos: Array<{
    periodo: string;
    entidades: BcraHistoricaEntidad[];
  }>;
};

type BcraChequesResponse = {
  identificacion: number | string;
  denominacion: string;
  causales: Array<{
    causal: string;
    entidades: Array<{
      entidad: number;
      detalle: BcraChequeDetalle[];
    }>;
  }>;
};

type PartialSection<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; message: string };

export type CentralDeudoresPayload = {
  identificacion: string;
  denominacion: string;
  resumen: {
    periodoActual: string | null;
    peorSituacion: number | null;
    peorSituacionLabel: string;
    totalDeuda: number;
    cantidadEntidades: number;
    cantidadPeriodosHistoricos: number;
    cantidadChequesRechazados: number;
  };
  deudaActual: {
    periodo: string | null;
    entidades: BcraDeudaEntidad[];
    error: string | null;
  };
  historicas: {
    periodos: Array<{
      periodo: string;
      cantidadEntidades: number;
      montoTotal: number;
      peorSituacion: number | null;
      entidades: BcraHistoricaEntidad[];
    }>;
    error: string | null;
  };
  chequesRechazados: {
    causales: Array<{
      causal: string;
      cantidadCheques: number;
      entidades: Array<{
        entidad: number;
        detalle: BcraChequeDetalle[];
      }>;
    }>;
    error: string | null;
  };
  erroresParciales: string[];
};

export class CentralDeudoresError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

const BCRA_BASE_URL = "https://api.bcra.gob.ar/CentralDeDeudores/v1.0/Deudas";

const SITUACION_LABELS: Record<number, string> = {
  1: "Normal",
  2: "Seguimiento especial",
  3: "Riesgo medio",
  4: "Riesgo alto",
  5: "Irrecuperable",
};

const getSituacionLabel = (situacion: number | null) =>
  situacion ? SITUACION_LABELS[situacion] ?? `Situacion ${situacion}` : "Sin situacion informada";

const buildSectionError = (section: string, message: string) => `${section}: ${message}`;

const getErrorStatus = <T>(section: PartialSection<T>) => {
  if (section.ok) {
    return null;
  }

  return (section as { status: number }).status;
};

const getErrorMessage = <T>(section: PartialSection<T>) => {
  if (section.ok) {
    return null;
  }

  return (section as { message: string }).message;
};

async function fetchBcraSection<T>(path: string): Promise<PartialSection<T>> {
  try {
    const response = await fetch(`${BCRA_BASE_URL}${path}`, {
      headers: {
        Accept: "application/json",
      },
    });

    if (response.status === 204) {
      return {
        ok: false,
        status: 204,
        message: "Sin datos informados para esta seccion.",
      };
    }

    const rawText = await response.text();

    if (!rawText.trim()) {
      return {
        ok: false,
        status: response.status || 204,
        message: "Sin datos informados para esta seccion.",
      };
    }

    const body = JSON.parse(rawText) as BcraEnvelope<T>;

    if (!response.ok || body.status >= 400) {
      const message =
        body.errorMessages?.[0] ??
        (response.status === 404
          ? "No se encontraron datos para la identificacion ingresada."
          : "No fue posible consultar el servicio del BCRA.");

      return {
        ok: false,
        status: response.status || body.status || 500,
        message,
      };
    }

    if (!body.results) {
      return {
        ok: false,
        status: 502,
        message: "La respuesta del BCRA no contiene resultados.",
      };
    }

    return {
      ok: true,
      data: body.results,
    };
  } catch (_error) {
    return {
      ok: false,
      status: 502,
      message: "No fue posible conectar con el servicio del BCRA.",
    };
  }
}

const getCurrentPeriod = (current: PartialSection<BcraCurrentResponse>) =>
  current.ok ? current.data.periodos[0]?.periodo ?? null : null;

const getCurrentEntities = (current: PartialSection<BcraCurrentResponse>) =>
  current.ok ? current.data.periodos[0]?.entidades ?? [] : [];

const getHistoricalPeriods = (historical: PartialSection<BcraHistoricalResponse>) =>
  historical.ok ? historical.data.periodos : [];

const getChequeCausales = (cheques: PartialSection<BcraChequesResponse>) =>
  cheques.ok ? cheques.data.causales : [];

const countRejectedChecks = (causales: BcraChequesResponse["causales"]) =>
  causales.reduce(
    (acc, causal) =>
      acc +
      causal.entidades.reduce((entityAcc, entidad) => entityAcc + entidad.detalle.length, 0),
    0,
  );

const getWorstSituation = (
  currentEntities: BcraDeudaEntidad[],
  historicalPeriods: BcraHistoricalResponse["periodos"],
) => {
  const currentMax = currentEntities.reduce<number | null>(
    (acc, item) => (acc === null ? item.situacion : Math.max(acc, item.situacion)),
    null,
  );

  const historicalMax = historicalPeriods.reduce<number | null>((acc, period) => {
    const periodMax = period.entidades.reduce<number | null>(
      (entityAcc, item) => (entityAcc === null ? item.situacion : Math.max(entityAcc, item.situacion)),
      null,
    );

    if (periodMax === null) {
      return acc;
    }

    return acc === null ? periodMax : Math.max(acc, periodMax);
  }, null);

  if (currentMax === null) {
    return historicalMax;
  }

  if (historicalMax === null) {
    return currentMax;
  }

  return Math.max(currentMax, historicalMax);
};

export class CentralDeudoresService {
  static async getByIdentificacion(rawIdentificacion: string): Promise<CentralDeudoresPayload> {
    const identificacion = rawIdentificacion.trim();

    if (!/^\d{11}$/.test(identificacion)) {
      throw new CentralDeudoresError(400, "Ingresar 11 digitos para realizar la consulta.");
    }

    const [currentResult, historicalResult, chequesResult] = await Promise.all([
      fetchBcraSection<BcraCurrentResponse>(`/${identificacion}`),
      fetchBcraSection<BcraHistoricalResponse>(`/Historicas/${identificacion}`),
      fetchBcraSection<BcraChequesResponse>(`/ChequesRechazados/${identificacion}`),
    ]);

    const allFailed = !currentResult.ok && !historicalResult.ok && !chequesResult.ok;

    if (allFailed) {
      const firstStatus =
        getErrorStatus(currentResult) ??
        getErrorStatus(historicalResult) ??
        getErrorStatus(chequesResult);

      if (firstStatus === 404) {
        throw new CentralDeudoresError(404, "No se encontraron datos para la identificacion ingresada.");
      }

      if (firstStatus === 400) {
        throw new CentralDeudoresError(400, "Ingresar 11 digitos para realizar la consulta.");
      }

      throw new CentralDeudoresError(502, "No fue posible consultar el servicio del BCRA.");
    }

    const denominacion =
      (currentResult.ok && currentResult.data.denominacion) ||
      (historicalResult.ok && historicalResult.data.denominacion) ||
      (chequesResult.ok && chequesResult.data.denominacion) ||
      "-";

    const currentEntities = getCurrentEntities(currentResult);
    const historicalPeriods = getHistoricalPeriods(historicalResult);
    const chequeCausales = getChequeCausales(chequesResult);
    const totalDeuda = currentEntities.reduce((acc, item) => acc + Number(item.monto ?? 0), 0);
    const peorSituacion = getWorstSituation(currentEntities, historicalPeriods);

    return {
      identificacion,
      denominacion,
      resumen: {
        periodoActual: getCurrentPeriod(currentResult),
        peorSituacion,
        peorSituacionLabel: getSituacionLabel(peorSituacion),
        totalDeuda,
        cantidadEntidades: currentEntities.length,
        cantidadPeriodosHistoricos: historicalPeriods.length,
        cantidadChequesRechazados: countRejectedChecks(chequeCausales),
      },
      deudaActual: {
        periodo: getCurrentPeriod(currentResult),
        entidades: currentEntities,
        error: getErrorMessage(currentResult),
      },
      historicas: {
        periodos: historicalPeriods.map((periodo) => ({
          periodo: periodo.periodo,
          cantidadEntidades: periodo.entidades.length,
          montoTotal: periodo.entidades.reduce((acc, item) => acc + Number(item.monto ?? 0), 0),
          peorSituacion: periodo.entidades.reduce<number | null>(
            (acc, item) => (acc === null ? item.situacion : Math.max(acc, item.situacion)),
            null,
          ),
          entidades: periodo.entidades,
        })),
        error: getErrorMessage(historicalResult),
      },
      chequesRechazados: {
        causales: chequeCausales.map((causal) => ({
          causal: causal.causal,
          cantidadCheques: causal.entidades.reduce((acc, entidad) => acc + entidad.detalle.length, 0),
          entidades: causal.entidades,
        })),
        error: getErrorMessage(chequesResult),
      },
      erroresParciales: [
        ...(getErrorMessage(currentResult) ? [buildSectionError("Deuda actual", getErrorMessage(currentResult)!)] : []),
        ...(getErrorMessage(historicalResult) ? [buildSectionError("Historicas", getErrorMessage(historicalResult)!)] : []),
        ...(getErrorMessage(chequesResult) ? [buildSectionError("Cheques rechazados", getErrorMessage(chequesResult)!)] : []),
      ],
    };
  }
}
