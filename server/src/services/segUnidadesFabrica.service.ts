import { QueryTypes } from "sequelize";
import { sequelizeNIC } from "../config/database";
import { infoOrderNumbersQuery } from "../controllers/querys/convencional.query";
import SegUnidadFabrica from "../models/SegUnidadFabrica";

type ImportFilePayload = {
  buffer: Buffer;
};

type SegUnidadFabricaParsedRow = {
  orderNumber: string;
  modelo: string | null;
  version: string | null;
  ubicacion: string | null;
  fechaLimiteDePago: string | null;
  habilitacionFinanzas: string | null;
};

type SegUnidadFabricaImportResult = {
  totalRows: number;
  importedRows: number;
  omittedRows: number;
  removedWithVin: number;
  removedWithFinanzas: number;
  removedMissing: number;
  message: string;
};

const REQUIRED_HEADERS = [
  "ORDER_NUMBER",
  "VIN",
  "MODELO",
  "VERSION_DE_MODELO",
  "UBICACION",
  "FECHA_LIMITE_DE_PAGO",
  "HABILITACION_FINANZAS",
] as const;

const normalizeHeader = (value: unknown) =>
  String(value ?? "")
    .trim()
    .replace(/^\uFEFF/, "")
    .toUpperCase();

const normalizeCell = (value: unknown) => {
  const normalized = String(value ?? "").trim();
  return normalized === "" ? null : normalized;
};

const buildUsuarioImportacion = (user?: { lastName?: string; name?: string }) =>
  [user?.lastName?.trim() ?? "", user?.name?.trim() ?? ""].filter(Boolean).join(", ");

const parseTxtRows = (buffer: Buffer) => {
  const content = buffer.toString("utf8").replace(/^\uFEFF/, "");
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line) => line.trim() !== "");

  if (!lines.length) {
    throw new Error("El archivo TXT no contiene datos");
  }

  const headers = lines[0].split(";").map(normalizeHeader);
  const missingHeaders = REQUIRED_HEADERS.filter((header) => !headers.includes(header));

  if (missingHeaders.length) {
    throw new Error(`Faltan columnas requeridas: ${missingHeaders.join(", ")}`);
  }

  const headerMap = new Map(headers.map((header, index) => [header, index]));
  const rows = lines.slice(1).map((line) => line.split(";"));

  return {
    rows,
    headerMap,
  };
};

const buildParsedSets = (rows: string[][], headerMap: Map<string, number>) => {
  const activeMap = new Map<string, SegUnidadFabricaParsedRow>();
  const withVinSet = new Set<string>();
  const withFinanzasSet = new Set<string>();
  let totalRows = 0;

  for (const row of rows) {
    const orderNumber = normalizeCell(row[headerMap.get("ORDER_NUMBER") ?? -1]) ?? "";
    const vin = normalizeCell(row[headerMap.get("VIN") ?? -1]) ?? "";
    const habilitacionFinanzas = normalizeCell(row[headerMap.get("HABILITACION_FINANZAS") ?? -1]);

    if (!orderNumber) {
      continue;
    }

    totalRows += 1;

    if (!orderNumber.startsWith("NIC")) {
      continue;
    }

    if (vin) {
      withVinSet.add(orderNumber);
      withFinanzasSet.delete(orderNumber);
      activeMap.delete(orderNumber);
      continue;
    }

    if (habilitacionFinanzas) {
      withFinanzasSet.add(orderNumber);
      withVinSet.delete(orderNumber);
      activeMap.delete(orderNumber);
      continue;
    }

    withVinSet.delete(orderNumber);
    withFinanzasSet.delete(orderNumber);
    activeMap.set(orderNumber, {
      orderNumber,
      modelo: normalizeCell(row[headerMap.get("MODELO") ?? -1]),
      version: normalizeCell(row[headerMap.get("VERSION_DE_MODELO") ?? -1]),
      ubicacion: normalizeCell(row[headerMap.get("UBICACION") ?? -1]),
      fechaLimiteDePago: normalizeCell(row[headerMap.get("FECHA_LIMITE_DE_PAGO") ?? -1]),
      habilitacionFinanzas,
    });
  }

  return {
    totalRows,
    activeRows: Array.from(activeMap.values()),
    withVinSet,
    withFinanzasSet,
  };
};

export class SegUnidadesFabricaService {
  static async list() {
    const records = await SegUnidadFabrica.find({})
      .sort({ fechaLimiteDePago: 1, orderNumber: 1 })
      .lean();

    if (!records.length) {
      return records;
    }

    type OrderInfoRow = {
      order: string;
      opera: number;
      cliente: string;
      color: string;
    };

    const orderNumbers = records.map((record) => record.orderNumber);
    const rows = await sequelizeNIC.query<OrderInfoRow>(infoOrderNumbersQuery(), {
      replacements: { orderNumbers },
      type: QueryTypes.SELECT,
    });

    const infoByOrder = new Map(
      rows.map((row) => [
        row.order,
        {
          opera: Number.isFinite(Number(row.opera)) && Number(row.opera) > 0 ? Number(row.opera) : null,
          cliente: row.cliente?.trim?.() || "-",
          color: row.color?.trim?.() || "-",
        },
      ]),
    );

    return records.map((record) => {
      const info = infoByOrder.get(record.orderNumber);

      return {
        ...record,
        opera: info?.opera ?? null,
        cliente: info?.cliente ?? "-",
        color: info?.color ?? "-",
      };
    });
  }

  static async importFile(file: ImportFilePayload, user?: { lastName?: string; name?: string }) {
    const { rows, headerMap } = parseTxtRows(file.buffer);
    const { totalRows, activeRows, withVinSet, withFinanzasSet } = buildParsedSets(rows, headerMap);

    const activeOrderNumbers = activeRows.map((row) => row.orderNumber);
    const now = new Date();
    const usuarioImportacion = buildUsuarioImportacion(user);

    if (!activeOrderNumbers.length && !withVinSet.size && !withFinanzasSet.size) {
      await SegUnidadFabrica.deleteMany({});

      return {
        totalRows,
        importedRows: 0,
        omittedRows: totalRows,
        removedWithVin: 0,
        removedWithFinanzas: 0,
        removedMissing: 0,
        message: "Importacion finalizada sin unidades NIC activas pendientes",
      } satisfies SegUnidadFabricaImportResult;
    }

    const currentRecords = await SegUnidadFabrica.find({}, { orderNumber: 1 }).lean();
    const currentOrderNumbers = new Set(currentRecords.map((item) => item.orderNumber));

    const removedWithVinOrderNumbers = Array.from(withVinSet).filter((orderNumber) =>
      currentOrderNumbers.has(orderNumber),
    );
    const removedWithFinanzasOrderNumbers = Array.from(withFinanzasSet).filter((orderNumber) =>
      currentOrderNumbers.has(orderNumber),
    );

    const removedMissingOrderNumbers = Array.from(currentOrderNumbers).filter(
      (orderNumber) =>
        !activeOrderNumbers.includes(orderNumber)
        && !withVinSet.has(orderNumber)
        && !withFinanzasSet.has(orderNumber),
    );

    if (activeRows.length) {
      await SegUnidadFabrica.bulkWrite(
        activeRows.map((row) => ({
          updateOne: {
            filter: { orderNumber: row.orderNumber },
            update: {
              $set: {
                ...row,
                usuarioImportacion,
                fechaImportacion: now,
              },
            },
            upsert: true,
          },
        })),
      );
    }

    const orderNumbersToDelete = [
      ...removedWithVinOrderNumbers,
      ...removedWithFinanzasOrderNumbers,
      ...removedMissingOrderNumbers,
    ];

    if (orderNumbersToDelete.length) {
      await SegUnidadFabrica.deleteMany({
        orderNumber: { $in: orderNumbersToDelete },
      });
    }

    return {
      totalRows,
      importedRows: activeRows.length,
      omittedRows: Math.max(totalRows - activeRows.length, 0),
      removedWithVin: removedWithVinOrderNumbers.length,
      removedWithFinanzas: removedWithFinanzasOrderNumbers.length,
      removedMissing: removedMissingOrderNumbers.length,
      message: "Archivo importado correctamente",
    } satisfies SegUnidadFabricaImportResult;
  }
}
