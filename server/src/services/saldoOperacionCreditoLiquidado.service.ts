import * as XLSX from "xlsx";
import SaldoOperacionCreditoLiquidado from "../models/SaldoOperacionCreditoLiquidado";
import SaldoOperacionSnapshot from "../models/SaldoOperacionSnapshot";

type ImportUser = { _id: string; name: string; lastName: string };
type ParsedCredit = { chasis: string; chasisOriginal: string; monto: number; row: number };
type ImportError = { row: number; chasis?: string; message: string };

export const normalizeSaldoOperacionChasis = (value: unknown) =>
  String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "");

const normalizeHeader = (value: unknown) =>
  String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");

const parseAmount = (value: unknown) => {
  if (typeof value === "number") return Number.isFinite(value) && value > 0 ? Math.round(value * 100) / 100 : null;
  let normalized = String(value ?? "").trim().replace(/[^0-9,.-]/g, "");
  if (!normalized) return null;
  if (normalized.includes(",")) normalized = normalized.replace(/\./g, "").replace(",", ".");
  else if (/^\d{1,3}(\.\d{3})+$/.test(normalized) || (normalized.match(/\./g)?.length ?? 0) > 1) normalized = normalized.replace(/\./g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed * 100) / 100 : null;
};

const findImportSheet = (workbook: XLSX.WorkBook) => {
  for (const sheetName of workbook.SheetNames) {
    const rows = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[sheetName], { header: 1, raw: true, defval: null });
    const searchLimit = Math.min(rows.length, 30);
    for (let rowIndex = 0; rowIndex < searchLimit; rowIndex += 1) {
      const headers = rows[rowIndex].map(normalizeHeader);
      const chasisIndex = headers.indexOf("chasis");
      const montoIndex = headers.indexOf("$afinanciar");
      if (chasisIndex >= 0 && montoIndex >= 0) return { rows, rowIndex, chasisIndex, montoIndex };
    }
  }
  throw new Error("El archivo debe contener las columnas Chasis y $ a Financiar");
};

export const parseSaldoOperacionCreditoWorkbook = (buffer: Buffer) => {
  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(buffer, { type: "buffer", cellDates: false });
  } catch {
    throw new Error("No se pudo leer el archivo Excel");
  }
  const { rows, rowIndex, chasisIndex, montoIndex } = findImportSheet(workbook);
  const dataRows = rows.slice(rowIndex + 1);
  const parsed = new Map<string, ParsedCredit>();
  const rowOccurrences = new Map<string, number[]>();
  const repeatedByChasis = new Map<string, number>();
  const conflicts = new Set<string>();
  const errors: ImportError[] = [];

  dataRows.forEach((row, index) => {
    const excelRow = rowIndex + index + 2;
    const chasisOriginal = String(row[chasisIndex] ?? "").trim();
    const chasis = normalizeSaldoOperacionChasis(chasisOriginal);
    const monto = parseAmount(row[montoIndex]);
    if (!chasis && monto === null) {
      errors.push({ row: excelRow, message: "Fila sin chasis ni monto" });
      return;
    }
    if (!/^[A-Z0-9]{17}$/.test(chasis)) {
      errors.push({ row: excelRow, ...(chasis ? { chasis } : {}), message: "El chasis debe tener 17 caracteres alfanuméricos" });
      return;
    }
    if (monto === null) {
      errors.push({ row: excelRow, chasis, message: "El monto a financiar debe ser un número mayor a cero" });
      return;
    }

    rowOccurrences.set(chasis, [...(rowOccurrences.get(chasis) ?? []), excelRow]);
    const previous = parsed.get(chasis);
    if (!previous) {
      parsed.set(chasis, { chasis, chasisOriginal, monto, row: excelRow });
      return;
    }
    if (previous.monto === monto) repeatedByChasis.set(chasis, (repeatedByChasis.get(chasis) ?? 0) + 1);
    else conflicts.add(chasis);
  });

  conflicts.forEach((chasis) => {
    parsed.delete(chasis);
    (rowOccurrences.get(chasis) ?? []).forEach((row) => errors.push({ row, chasis, message: "El mismo chasis tiene montos diferentes dentro del archivo" }));
  });

  return {
    totalRows: dataRows.length,
    entries: [...parsed.values()],
    errors,
    repeatedRows: [...repeatedByChasis.entries()].reduce((total, [chasis, count]) => total + (conflicts.has(chasis) ? 0 : count), 0),
  };
};

export class SaldoOperacionCreditoLiquidadoService {
  static async importWorkbook(file: Express.Multer.File, user: ImportUser) {
    const parsed = parseSaldoOperacionCreditoWorkbook(file.buffer);
    if (!parsed.entries.length) throw new Error("El archivo no contiene créditos válidos para importar");

    const now = new Date();
    const fileName = file.originalname.split(/[\\/]/).pop()?.trim() || "creditos-liquidados.xlsx";
    const userName = `${user.name} ${user.lastName}`.trim();
    const chassis = parsed.entries.map((entry) => entry.chasis);
    const existing = await SaldoOperacionCreditoLiquidado.find({ chasisNormalizado: { $in: chassis } }).lean();
    const existingByChasis = new Map(existing.map((item) => [item.chasisNormalizado, item]));
    let created = 0;
    let updated = 0;
    let repeated = parsed.repeatedRows;

    const writes = parsed.entries.flatMap((entry) => {
      const current = existingByChasis.get(entry.chasis);
      if (current && current.montoLiquidado === entry.monto) {
        repeated += 1;
        return [];
      }
      if (current) updated += 1;
      else created += 1;
      return [{
        updateOne: {
          filter: { chasisNormalizado: entry.chasis },
          update: {
            $set: {
              chasisNormalizado: entry.chasis,
              chasisOriginal: entry.chasisOriginal,
              montoLiquidado: entry.monto,
              archivoUltimo: fileName,
              usuarioIdUltimo: user._id,
              usuarioNombreUltimo: userName,
              liquidadoEn: now,
            },
            $push: {
              historial: {
                montoAnterior: current?.montoLiquidado ?? null,
                montoNuevo: entry.monto,
                archivo: fileName,
                usuarioId: user._id,
                usuarioNombre: userName,
                importadoEn: now,
              },
            },
          },
          upsert: true,
        },
      }];
    });
    if (writes.length) await SaldoOperacionCreditoLiquidado.bulkWrite(writes, { ordered: false });

    const matchedChassis = new Set((await SaldoOperacionSnapshot.distinct("chasis", { chasis: { $in: chassis } })).map(normalizeSaldoOperacionChasis));
    const reconciliationWrites = parsed.entries.map((entry) => {
      const current = existingByChasis.get(entry.chasis);
      return {
        updateMany: {
          filter: { chasis: entry.chasis },
          update: {
            $set: {
              creditoLiquidadoMonto: entry.monto,
              creditoLiquidadoEn: current && current.montoLiquidado === entry.monto ? current.liquidadoEn : now,
            },
          },
        },
      };
    });
    if (reconciliationWrites.length) await SaldoOperacionSnapshot.bulkWrite(reconciliationWrites, { ordered: false });

    return {
      totalFilas: parsed.totalRows,
      validas: parsed.entries.length,
      nuevas: created,
      actualizadas: updated,
      repetidas: repeated,
      conciliadas: matchedChassis.size,
      sinCoincidencia: parsed.entries.length - matchedChassis.size,
      descartadas: parsed.errors.length,
      errores: parsed.errors.sort((left, right) => left.row - right.row),
    };
  }
}
