import fs from "fs";
import csv from "csv-parser";
import type { IImportExecutionErrorDetail } from "../models/ImportExecutionLog";
import ImportedTransferenciaIdentifier from "../models/ImportedTransferenciaIdentifier";
import TransferenciaTotalizada from "../models/TransferenciaTotalizada";

const CSV_HEADERS = [
  "IdentificadorUnico",
  "Marca",
  "Modelo",
  "AnioModelo",
  "FechaTransferencia",
  "RegistroLocalidad",
  "RegistroProvincia",
] as const;

type CsvHeader = (typeof CSV_HEADERS)[number];
type CsvRow = Record<CsvHeader, string>;

type TransferenciaTotalizadaWritePayload = {
  anio: number;
  mes: number;
  dia: number;
  marca: string;
  modelo: string;
  anioModelo: number;
  registroProvincia: string;
  registroLocalidad: string;
  total: number;
  sourceUpdatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type TransferenciasCsvImportSummary = {
  totalRead: number;
  inserted: number;
  updated: number;
  discarded: number;
  errored: number;
  totalizedRows: number;
  errorSummary: string[];
  errorDetailsSample: IImportExecutionErrorDetail[];
};

type ProcessFileOptions = {
  batchSize: number;
  sourceFileName: string;
};

const ERROR_SAMPLE_LIMIT = 20;
const EMPTY_PROVINCE_LABEL = "SIN PROVINCIA";
const EMPTY_LOCALITY_LABEL = "SIN LOCALIDAD";

const trimCell = (value: unknown) =>
  String(value ?? "")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const normalizeText = (value: unknown) =>
  trimCell(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();

const normalizeDimensionValue = (value: unknown, fallback: string) => trimCell(value) || fallback;

const buildUtcDate = (year: number, month: number, day: number, fieldName: string) => {
  const parsedDate = new Date(Date.UTC(year, month - 1, day));

  if (
    Number.isNaN(parsedDate.getTime())
    || parsedDate.getUTCFullYear() !== year
    || parsedDate.getUTCMonth() !== month - 1
    || parsedDate.getUTCDate() !== day
  ) {
    throw new Error(`El campo "${fieldName}" contiene una fecha invalida`);
  }

  return parsedDate;
};

const parseRequiredDate = (value: unknown, fieldName: string) => {
  const raw = trimCell(value);

  if (!raw) {
    throw new Error(`El campo "${fieldName}" es obligatorio`);
  }

  const dayFirstMatch = raw.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);

  if (dayFirstMatch) {
    return buildUtcDate(
      Number(dayFirstMatch[3]),
      Number(dayFirstMatch[2]),
      Number(dayFirstMatch[1]),
      fieldName,
    );
  }

  const isoMatch = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:T.*)?$/);

  if (isoMatch) {
    return buildUtcDate(Number(isoMatch[1]), Number(isoMatch[2]), Number(isoMatch[3]), fieldName);
  }

  throw new Error(`El campo "${fieldName}" no tiene un formato de fecha valido`);
};

const parseRequiredYear = (value: unknown, fieldName: string) => {
  const raw = trimCell(value);

  if (!raw) {
    throw new Error(`El campo "${fieldName}" es obligatorio`);
  }

  if (!/^\d{4}$/.test(raw)) {
    throw new Error(`El campo "${fieldName}" debe contener un anio de 4 digitos`);
  }

  const parsed = Number(raw);

  if (!Number.isInteger(parsed) || parsed < 1900 || parsed > 3000) {
    throw new Error(`El campo "${fieldName}" contiene un anio invalido`);
  }

  return parsed;
};

const validateHeaders = (headers: string[]) => {
  const normalizedHeaders = headers.map((header) => trimCell(header).replace(/^\uFEFF/, ""));
  const missingHeaders = CSV_HEADERS.filter((header) => !normalizedHeaders.includes(header));

  if (missingHeaders.length) {
    throw new Error(`Faltan columnas requeridas: ${missingHeaders.join(", ")}`);
  }
};

const buildAggregationKey = (
  payload: Omit<TransferenciaTotalizadaWritePayload, "total" | "sourceUpdatedAt" | "createdAt" | "updatedAt">,
) =>
  [
    payload.anio,
    payload.mes,
    payload.dia,
    payload.marca,
    payload.modelo,
    payload.anioModelo,
    payload.registroProvincia,
    payload.registroLocalidad,
  ].join("|");

const buildTotalizadoPayload = (
  row: CsvRow,
): Omit<TransferenciaTotalizadaWritePayload, "total" | "sourceUpdatedAt" | "createdAt" | "updatedAt"> => {
  const identificadorUnico = trimCell(row.IdentificadorUnico);

  if (!identificadorUnico) {
    throw new Error('El campo "IdentificadorUnico" es obligatorio');
  }

  const fechaTransferencia = parseRequiredDate(row.FechaTransferencia, "FechaTransferencia");
  const marca = normalizeText(row.Marca);
  const modelo = normalizeText(row.Modelo);

  if (!marca) {
    throw new Error('El campo "Marca" es obligatorio');
  }

  return {
    anio: fechaTransferencia.getUTCFullYear(),
    mes: fechaTransferencia.getUTCMonth() + 1,
    dia: fechaTransferencia.getUTCDate(),
    marca,
    modelo: modelo || "SIN MODELO",
    anioModelo: parseRequiredYear(row.AnioModelo, "AnioModelo"),
    registroProvincia: normalizeDimensionValue(row.RegistroProvincia, EMPTY_PROVINCE_LABEL),
    registroLocalidad: normalizeDimensionValue(row.RegistroLocalidad, EMPTY_LOCALITY_LABEL),
  };
};

const pushError = (
  summary: TransferenciasCsvImportSummary,
  line: number,
  message: string,
  identificadorUnico = "",
) => {
  summary.discarded += 1;
  summary.errored += 1;

  if (summary.errorDetailsSample.length < ERROR_SAMPLE_LIMIT) {
    summary.errorDetailsSample.push({
      line,
      identificadorUnico,
      message,
    });
  }
};

const incrementAggregation = (
  totalsByKey: Map<
    string,
    Omit<TransferenciaTotalizadaWritePayload, "total" | "sourceUpdatedAt" | "createdAt" | "updatedAt"> & {
      total: number;
    }
  >,
  payload: Omit<TransferenciaTotalizadaWritePayload, "total" | "sourceUpdatedAt" | "createdAt" | "updatedAt">,
) => {
  const key = buildAggregationKey(payload);
  const current = totalsByKey.get(key);

  if (current) {
    current.total += 1;
  } else {
    totalsByKey.set(key, {
      ...payload,
      total: 1,
    });
  }
};

export class TransferenciasPrendasCsvService {
  private static async ensureCollectionIndexes() {
    await TransferenciaTotalizada.syncIndexes();
  }

  static async processFile(filePath: string, options: ProcessFileOptions): Promise<TransferenciasCsvImportSummary> {
    const summary: TransferenciasCsvImportSummary = {
      totalRead: 0,
      inserted: 0,
      updated: 0,
      discarded: 0,
      errored: 0,
      totalizedRows: 0,
      errorSummary: [],
      errorDetailsSample: [],
    };

    const totalsByKey = new Map<
      string,
      Omit<TransferenciaTotalizadaWritePayload, "total" | "sourceUpdatedAt" | "createdAt" | "updatedAt"> & {
        total: number;
      }
    >();
    const fileSeenIdentifiers = new Set<string>();
    let pendingRows: Array<{
      identificadorUnico: string;
      payload: Omit<TransferenciaTotalizadaWritePayload, "total" | "sourceUpdatedAt" | "createdAt" | "updatedAt">;
    }> = [];
    let lineNumber = 1;
    let hasHeaders = false;
    let hasAtLeastOneDataRow = false;

    await new Promise<void>((resolve, reject) => {
      const fileStream = fs.createReadStream(filePath);
      const parser = csv({
        separator: ";",
        strict: true,
        mapHeaders: ({ header }) => trimCell(header).replace(/^\uFEFF/, ""),
      });

      let isSettled = false;

      const rejectOnce = (error: unknown) => {
        if (isSettled) {
          return;
        }

        isSettled = true;
        reject(error);
      };

      const flushPendingRows = async () => {
        if (!pendingRows.length) {
          return;
        }

        const identifiers = pendingRows.map((row) => row.identificadorUnico);
        const existingIdentifiers = await ImportedTransferenciaIdentifier.find(
          { identificadorUnico: { $in: identifiers } },
          { identificadorUnico: 1, _id: 0 },
        ).lean<Array<{ identificadorUnico: string }>>();
        const existingIdentifierSet = new Set(existingIdentifiers.map((item) => item.identificadorUnico));
        const newRows = pendingRows.filter((row) => !existingIdentifierSet.has(row.identificadorUnico));

        newRows.forEach((row) => {
          incrementAggregation(totalsByKey, row.payload);
        });

        if (newRows.length) {
          await ImportedTransferenciaIdentifier.collection.insertMany(
            newRows.map((row) => ({
              identificadorUnico: row.identificadorUnico,
              sourceFileName: options.sourceFileName,
              importedAt: new Date(),
              createdAt: new Date(),
              updatedAt: new Date(),
            })),
            { ordered: false },
          );
        }

        summary.discarded += pendingRows.length - newRows.length;
        pendingRows = [];
      };

      parser.on("headers", (headers: string[]) => {
        try {
          validateHeaders(headers);
          hasHeaders = true;
        } catch (error) {
          rejectOnce(error);
        }
      });

      parser.on("data", async (rawRow: Record<string, string>) => {
        lineNumber += 1;
        parser.pause();

        try {
          hasAtLeastOneDataRow = true;
          summary.totalRead += 1;

          const row = rawRow as CsvRow;
          const identificadorUnico = trimCell(row.IdentificadorUnico);

          if (!identificadorUnico) {
            throw new Error('El campo "IdentificadorUnico" es obligatorio');
          }

          if (fileSeenIdentifiers.has(identificadorUnico)) {
            summary.discarded += 1;
            return;
          }

          fileSeenIdentifiers.add(identificadorUnico);
          const payload = buildTotalizadoPayload(row);
          pendingRows.push({
            identificadorUnico,
            payload,
          });

          if (pendingRows.length >= options.batchSize) {
            await flushPendingRows();
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "No se pudo procesar la fila";
          pushError(summary, lineNumber, errorMessage, trimCell(rawRow.IdentificadorUnico));
        } finally {
          parser.resume();
        }
      });

      parser.on("end", async () => {
        if (isSettled) {
          return;
        }

        try {
          await flushPendingRows();

          if (!hasHeaders) {
            throw new Error("El archivo CSV no contiene cabeceras validas");
          }

          if (!hasAtLeastOneDataRow) {
            throw new Error("El archivo CSV no contiene registros para importar");
          }

          isSettled = true;
          resolve();
        } catch (error) {
          rejectOnce(error);
        }
      });

      parser.on("error", (error) => {
        rejectOnce(new Error(`CSV corrupto o invalido: ${error.message}`));
      });

      fileStream.on("error", (error) => {
        rejectOnce(error);
      });

      fileStream.pipe(parser);
    });

    const sourceUpdatedAt = new Date();
    const totalizedRows = Array.from(totalsByKey.values());

    await TransferenciasPrendasCsvService.ensureCollectionIndexes();

    const totalsBefore = await TransferenciaTotalizada.aggregate([
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]);
    const previousPersistedTotal = totalsBefore[0]?.total ?? 0;

    if (totalizedRows.length) {
      const bulkOperations = totalizedRows.map((row) => ({
        updateOne: {
          filter: {
            anio: row.anio,
            mes: row.mes,
            dia: row.dia,
            marca: row.marca,
            modelo: row.modelo,
            anioModelo: row.anioModelo,
            registroProvincia: row.registroProvincia,
            registroLocalidad: row.registroLocalidad,
          },
          update: {
            $inc: { total: row.total },
            $set: { sourceUpdatedAt, updatedAt: sourceUpdatedAt },
            $setOnInsert: {
              anio: row.anio,
              mes: row.mes,
              dia: row.dia,
              marca: row.marca,
              modelo: row.modelo,
              anioModelo: row.anioModelo,
              registroProvincia: row.registroProvincia,
              registroLocalidad: row.registroLocalidad,
              createdAt: sourceUpdatedAt,
            },
          },
          upsert: true,
        },
      }));

      const bulkResult = await TransferenciaTotalizada.collection.bulkWrite(bulkOperations, { ordered: false });
      summary.inserted = bulkResult.upsertedCount ?? 0;
      summary.updated = bulkResult.modifiedCount ?? 0;
    }

    const insertedAggregation = await TransferenciaTotalizada.aggregate([
      { $group: { _id: null, total: { $sum: "$total" }, rows: { $sum: 1 } } },
    ]);

    const persistedTotalCount = insertedAggregation[0]?.total ?? 0;
    const validReadCount = summary.totalRead - summary.discarded;

    if (persistedTotalCount - previousPersistedTotal !== validReadCount) {
      throw new Error(
        `La acumulacion quedo inconsistente. Filas validas=${validReadCount}, delta persistido=${persistedTotalCount - previousPersistedTotal}`,
      );
    }

    summary.totalizedRows = totalizedRows.length;

    if (summary.errorDetailsSample.length) {
      summary.errorSummary = summary.errorDetailsSample.map((detail) =>
        detail.line ? `Linea ${detail.line}: ${detail.message}` : detail.message,
      );
    }

    return summary;
  }
}
