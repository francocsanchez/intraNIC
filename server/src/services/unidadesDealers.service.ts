import { get } from "https";
import UnidadDealer from "../models/UnidadDealer";

const DEALERS_SOURCE_URL =
  "https://raw.githubusercontent.com/CristianFurlong2025/furlong-toyota-data/refs/heads/main/datos_toyota_nippon.json";

type UnidadDealerSourceRecord = {
  vin: unknown;
  fechaCarga: unknown;
  fechaArribo: unknown;
  dealer: unknown;
  estado: unknown;
};

type UnidadDealerSyncSummary = {
  total: number;
  created: number;
  updated: number;
  errors: number;
};

type UnidadDealerSummaryRow = {
  dealer: string;
  states: Record<string, number>;
  total: number;
};

type UnidadDealerSummaryResponse = {
  states: string[];
  rows: UnidadDealerSummaryRow[];
};

type UnidadDealerTreemapItem = {
  name: string;
  value: number;
};

type UnidadDealerTreemapResponse = {
  data: UnidadDealerTreemapItem[];
};

const normalizeText = (value: unknown) =>
  String(value ?? "")
    .trim()
    .replace(/\s+/g, " ");

const buildUtcDate = (year: number, month: number, day: number, fieldName: string) => {
  const parsedDate = new Date(Date.UTC(year, month - 1, day));

  if (
    !Number.isFinite(parsedDate.getTime()) ||
    parsedDate.getUTCFullYear() !== year ||
    parsedDate.getUTCMonth() !== month - 1 ||
    parsedDate.getUTCDate() !== day
  ) {
    throw new Error(`El campo "${fieldName}" contiene una fecha invalida`);
  }

  return parsedDate;
};

const parseSourceDate = (value: unknown, fieldName: string) => {
  if (value instanceof Date && Number.isFinite(value.getTime())) {
    return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
  }

  const normalized = normalizeText(value);

  if (!normalized) {
    return null;
  }

  const dayFirstMatch = normalized.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);

  if (dayFirstMatch) {
    const day = Number(dayFirstMatch[1]);
    const month = Number(dayFirstMatch[2]);
    const year = Number(dayFirstMatch[3]);
    return buildUtcDate(year, month, day, fieldName);
  }

  const isoMatch = normalized.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:T.*)?$/);

  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]);
    const day = Number(isoMatch[3]);
    return buildUtcDate(year, month, day, fieldName);
  }

  throw new Error(`El campo "${fieldName}" no tiene un formato de fecha valido`);
};

const fetchJson = async () =>
  new Promise<unknown>((resolve, reject) => {
    get(DEALERS_SOURCE_URL, (response) => {
      const statusCode = response.statusCode ?? 0;

      if (statusCode < 200 || statusCode >= 300) {
        response.resume();
        reject(new Error(`No se pudo descargar el JSON externo. Status ${statusCode}`));
        return;
      }

      let rawData = "";
      response.setEncoding("utf8");

      response.on("data", (chunk) => {
        rawData += chunk;
      });

      response.on("end", () => {
        try {
          resolve(JSON.parse(rawData));
        } catch (error) {
          reject(error instanceof Error ? error : new Error("No se pudo parsear el JSON externo"));
        }
      });
    }).on("error", (error) => {
      reject(error);
    });
  });

const validateRecord = (record: UnidadDealerSourceRecord) => {
  const vin = normalizeText(record.vin);
  const dealer = normalizeText(record.dealer);
  const estado = normalizeText(record.estado);
  const fechaCarga = parseSourceDate(record.fechaCarga, "fechaCarga");
  const fechaArribo = parseSourceDate(record.fechaArribo, "fechaArribo");

  if (!vin) {
    throw new Error('El campo "vin" es obligatorio');
  }

  if (!dealer) {
    throw new Error('El campo "dealer" es obligatorio');
  }

  if (!estado) {
    throw new Error('El campo "estado" es obligatorio');
  }

  return {
    vin,
    dealer,
    estado,
    fechaCarga,
    fechaArribo,
  };
};

const logSummary = (summary: UnidadDealerSyncSummary) => {
  console.log(`[unidades-dealers-sync] total leido: ${summary.total}`);
  console.log(`[unidades-dealers-sync] creados: ${summary.created}`);
  console.log(`[unidades-dealers-sync] actualizados: ${summary.updated}`);
  console.log(`[unidades-dealers-sync] con error: ${summary.errors}`);
};

export class UnidadesDealersService {
  static async syncFromSource(): Promise<UnidadDealerSyncSummary> {
    console.log(`[unidades-dealers-sync] inicio ${new Date().toISOString()}`);

    const payload = await fetchJson();

    if (!Array.isArray(payload)) {
      throw new Error("La fuente externa no devolvio un array de unidades");
    }

    const summary: UnidadDealerSyncSummary = {
      total: payload.length,
      created: 0,
      updated: 0,
      errors: 0,
    };

    for (const rawRecord of payload) {
      try {
        const record = validateRecord(rawRecord as UnidadDealerSourceRecord);
        const existing = await UnidadDealer.exists({ vin: record.vin });

        await UnidadDealer.findOneAndUpdate(
          { vin: record.vin },
          {
            vin: record.vin,
            fechaCarga: record.fechaCarga,
            fechaArribo: record.fechaArribo,
            dealer: record.dealer,
            estado: record.estado,
          },
          {
            upsert: true,
            new: true,
            setDefaultsOnInsert: true,
            runValidators: true,
          },
        );

        if (existing) {
          summary.updated += 1;
        } else {
          summary.created += 1;
        }
      } catch (error) {
        summary.errors += 1;
        console.error("[unidades-dealers-sync] error al procesar registro", rawRecord);
        console.error(error);
      }
    }

    logSummary(summary);

    return summary;
  }

  static async getResumenPorDealerYEstado(): Promise<UnidadDealerSummaryResponse> {
    const units = await UnidadDealer.find(
      {},
      {
        dealer: 1,
        estado: 1,
        _id: 0,
      },
    ).lean<Array<{ dealer: string; estado: string }>>();

    const stateSet = new Set<string>();
    const grouped = new Map<string, UnidadDealerSummaryRow>();

    units.forEach((unit) => {
      const dealer = normalizeText(unit.dealer);
      const estado = normalizeText(unit.estado);

      if (!dealer || !estado) {
        return;
      }

      stateSet.add(estado);

      const existingRow = grouped.get(dealer) ?? {
        dealer,
        states: {},
        total: 0,
      };

      existingRow.states[estado] = (existingRow.states[estado] ?? 0) + 1;
      existingRow.total += 1;
      grouped.set(dealer, existingRow);
    });

    const states = Array.from(stateSet).sort((a, b) => a.localeCompare(b));
    const rows = Array.from(grouped.values())
      .map((row) => ({
        dealer: row.dealer,
        states: states.reduce<Record<string, number>>((acc, state) => {
          acc[state] = row.states[state] ?? 0;
          return acc;
        }, {}),
        total: row.total,
      }))
      .sort((a, b) => a.dealer.localeCompare(b.dealer));

    return {
      states,
      rows,
    };
  }

  static async getTreemapPorDealer(): Promise<UnidadDealerTreemapResponse> {
    const units = await UnidadDealer.find(
      {},
      {
        dealer: 1,
        _id: 0,
      },
    ).lean<Array<{ dealer: string }>>();

    const grouped = new Map<string, number>();

    units.forEach((unit) => {
      const dealer = normalizeText(unit.dealer);

      if (!dealer) {
        return;
      }

      grouped.set(dealer, (grouped.get(dealer) ?? 0) + 1);
    });

    return {
      data: Array.from(grouped.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name)),
    };
  }
}
