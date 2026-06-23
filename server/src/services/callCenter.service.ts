import * as XLSX from "xlsx";
import CallCenterDataOrigin from "../models/CallCenterDataOrigin";
import CallCenterOpportunity from "../models/CallCenterOpportunity";
import CallCenterSummaryOrigin from "../models/CallCenterSummaryOrigin";

type CallCenterImportFile = {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
};

type CallCenterImportRecord = {
  opportunityId: string;
  fechaCreacion: Date | null;
  nombreOportunidad: string;
  tipoRegistroOportunidad: string;
  origenOportunidad: string;
  nombreCuenta: string;
  etapa: string;
  fechaCierre: Date | null;
  fechaUltimaModificacionEtapa: Date | null;
  fechaUltimaActividad: Date | null;
  fechaFirmaContrato: Date | null;
  fechaVenta: Date | null;
  aliasCreado: string;
  aliasPropietarioOportunidad: string;
  propietarioOportunidad: string;
  creadoPor: string;
};

type CallCenterImportResult = {
  worksheetName: string;
  importedRows: number;
  createdOrigins: number;
  message: string;
};

type HeaderKey =
  | "opportunityId"
  | "fechaCreacion"
  | "nombreOportunidad"
  | "tipoRegistroOportunidad"
  | "origenOportunidad"
  | "nombreCuenta"
  | "etapa"
  | "fechaCierre"
  | "fechaUltimaModificacionEtapa"
  | "fechaUltimaActividad"
  | "fechaFirmaContrato"
  | "fechaVenta"
  | "aliasCreado"
  | "aliasPropietarioOportunidad"
  | "propietarioOportunidad"
  | "creadoPor";

const REQUIRED_HEADERS: Record<HeaderKey, string[]> = {
  opportunityId: ["id de la oportunidad", "id oportunidad"],
  fechaCreacion: ["fecha de creacion"],
  nombreOportunidad: ["nombre de la oportunidad"],
  tipoRegistroOportunidad: ["tipo de registro de la oportunidad"],
  origenOportunidad: ["origen de la oportunidad"],
  nombreCuenta: ["nombre de la cuenta"],
  etapa: ["etapa"],
  fechaCierre: ["fecha de cierre"],
  fechaUltimaModificacionEtapa: ["fecha de la ultima modificacion de etapa"],
  fechaUltimaActividad: ["fecha de ultima actividad"],
  fechaFirmaContrato: ["fecha de firma de contrato"],
  fechaVenta: ["fecha de venta"],
  aliasCreado: ["alias creado"],
  aliasPropietarioOportunidad: ["alias del propietario de la oportunidad"],
  propietarioOportunidad: ["propietario de oportunidad"],
  creadoPor: ["creado por"],
};

const HTML_ENTITY_MAP: Record<string, string> = {
  "&nbsp;": " ",
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&#171;": "«",
  "&#187;": "»",
};

const normalizeHeader = (value: unknown) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\w\s]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const normalizeText = (value: unknown) => String(value ?? "").trim();

const isRowEmpty = (row: unknown[]) => row.every((cell) => normalizeText(cell) === "");

const decodeHtmlEntities = (value: string) =>
  value
    .replace(/&nbsp;|&amp;|&lt;|&gt;|&quot;|&#39;|&#171;|&#187;/g, (match) => HTML_ENTITY_MAP[match] ?? match)
    .replace(/&#(\d+);/g, (_match, code) => String.fromCharCode(Number(code)));

const stripHtml = (value: string) =>
  decodeHtmlEntities(value.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "")).trim();

const parseDateValue = (value: unknown): Date | null => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    const parsed = XLSX.SSF.parse_date_code(value);

    if (!parsed) {
      return null;
    }

    const date = new Date(
      parsed.y,
      Math.max((parsed.m ?? 1) - 1, 0),
      parsed.d ?? 1,
      parsed.H ?? 0,
      parsed.M ?? 0,
      Math.floor(parsed.S ?? 0),
    );

    return Number.isNaN(date.getTime()) ? null : date;
  }

  const raw = normalizeText(value);

  if (!raw) {
    return null;
  }

  const dateTimeMatch = raw.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/,
  );

  if (dateTimeMatch) {
    const [, day, month, year, hours = "0", minutes = "0", seconds = "0"] = dateTimeMatch;
    const normalizedYear = Number(year.length === 2 ? `20${year}` : year);
    const date = new Date(
      normalizedYear,
      Number(month) - 1,
      Number(day),
      Number(hours),
      Number(minutes),
      Number(seconds),
    );

    return Number.isNaN(date.getTime()) ? null : date;
  }

  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const getWorkbookRows = (file: CallCenterImportFile) => {
  const workbook = XLSX.read(file.buffer, {
    type: "buffer",
    cellDates: true,
  });

  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    throw new Error("El archivo Excel no contiene hojas para procesar");
  }

  const worksheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
    header: 1,
    defval: "",
    blankrows: false,
    raw: true,
  });

  return {
    worksheetName: firstSheetName,
    rows,
  };
};

const parseHtmlTableRows = (content: string) => {
  const tableMatch = content.match(/<table[\s\S]*?<\/table>/i);

  if (!tableMatch) {
    return [];
  }

  const rows: string[][] = [];
  const rowMatches = tableMatch[0].match(/<tr[\s\S]*?<\/tr>/gi) ?? [];

  for (const rowHtml of rowMatches) {
    const cellMatches = rowHtml.match(/<t[dh][^>]*>[\s\S]*?<\/t[dh]>/gi) ?? [];
    const parsedRow = cellMatches.map((cellHtml) => stripHtml(cellHtml));

    if (parsedRow.length) {
      rows.push(parsedRow);
    }
  }

  return rows;
};

const getRowsFromFile = (file: CallCenterImportFile) => {
  const workbookRows = getWorkbookRows(file);
  const workbookHasUsableRows = workbookRows.rows.some(
    (row) => Array.isArray(row) && row.some((cell) => normalizeText(cell) !== ""),
  );

  const content = file.buffer.toString("latin1");
  const htmlRows = content.includes("<table") ? parseHtmlTableRows(content) : [];
  const htmlHasUsableRows = htmlRows.some((row) => row.some((cell) => normalizeText(cell) !== ""));

  const workbookHeaderIndex = findHeaderRowIndex(workbookRows.rows);

  if (workbookHasUsableRows && workbookHeaderIndex !== -1) {
    return workbookRows;
  }

  if (htmlHasUsableRows) {
    return {
      worksheetName: "HTML Table",
      rows: htmlRows,
    };
  }

  if (/sheet\d+\.htm/i.test(content)) {
    throw new Error(
      "El archivo parece ser un Excel HTML incompleto. Exportalo como .xlsx o sube la hoja de datos en un formato Excel compatible.",
    );
  }

  return workbookRows;
};

const findHeaderRowIndex = (rows: unknown[][]) =>
  rows.findIndex((row) => {
    const normalized = row.map((cell) => normalizeHeader(cell));

    return Object.values(REQUIRED_HEADERS).every((aliases) =>
      aliases.some((alias) => normalized.includes(alias)),
    );
  });

const buildColumnMap = (headerRow: unknown[]) => {
  const normalizedHeaders = headerRow.map((cell) => normalizeHeader(cell));
  const columnMap = {} as Record<HeaderKey, number>;

  (Object.keys(REQUIRED_HEADERS) as HeaderKey[]).forEach((key) => {
    const aliases = REQUIRED_HEADERS[key];
    const index = normalizedHeaders.findIndex((header) => aliases.includes(header));

    if (index === -1) {
      throw new Error(`No se encontro la columna requerida "${aliases[0]}"`);
    }

    columnMap[key] = index;
  });

  return columnMap;
};

const buildRecordFromRow = (row: unknown[], columnMap: Record<HeaderKey, number>): CallCenterImportRecord => ({
  opportunityId: normalizeText(row[columnMap.opportunityId]),
  fechaCreacion: parseDateValue(row[columnMap.fechaCreacion]),
  nombreOportunidad: normalizeText(row[columnMap.nombreOportunidad]),
  tipoRegistroOportunidad: normalizeText(row[columnMap.tipoRegistroOportunidad]),
  origenOportunidad: normalizeText(row[columnMap.origenOportunidad]),
  nombreCuenta: normalizeText(row[columnMap.nombreCuenta]),
  etapa: normalizeText(row[columnMap.etapa]),
  fechaCierre: parseDateValue(row[columnMap.fechaCierre]),
  fechaUltimaModificacionEtapa: parseDateValue(row[columnMap.fechaUltimaModificacionEtapa]),
  fechaUltimaActividad: parseDateValue(row[columnMap.fechaUltimaActividad]),
  fechaFirmaContrato: parseDateValue(row[columnMap.fechaFirmaContrato]),
  fechaVenta: parseDateValue(row[columnMap.fechaVenta]),
  aliasCreado: normalizeText(row[columnMap.aliasCreado]),
  aliasPropietarioOportunidad: normalizeText(row[columnMap.aliasPropietarioOportunidad]),
  propietarioOportunidad: normalizeText(row[columnMap.propietarioOportunidad]),
  creadoPor: normalizeText(row[columnMap.creadoPor]),
});

const prepareRecords = (file: CallCenterImportFile) => {
  const { rows, worksheetName } = getRowsFromFile(file);
  const headerRowIndex = findHeaderRowIndex(rows);

  if (headerRowIndex === -1) {
    throw new Error("No se encontro una fila de encabezados valida en el archivo");
  }

  const columnMap = buildColumnMap(rows[headerRowIndex]);
  const records = rows
    .slice(headerRowIndex + 1)
    .filter((row) => !isRowEmpty(row))
    .map((row) => buildRecordFromRow(row, columnMap))
    .filter((record) => record.opportunityId !== "");

  if (!records.length) {
    throw new Error("No se detectaron filas validas con Id. de la oportunidad");
  }

  return {
    worksheetName,
    records,
  };
};

const syncDataOrigins = async (records: CallCenterImportRecord[]) => {
  const originNames = Array.from(
    new Set(
      records
        .map((record) => record.origenOportunidad)
        .filter((origin) => origin !== ""),
    ),
  );

  if (!originNames.length) {
    return 0;
  }

  const existingOrigins = await CallCenterDataOrigin.find(
    { origen: { $in: originNames } },
    { origen: 1 },
  ).lean();

  const existingOriginSet = new Set(existingOrigins.map((origin) => origin.origen));
  const missingOrigins = originNames.filter((origin) => !existingOriginSet.has(origin));

  if (!missingOrigins.length) {
    return 0;
  }

  await CallCenterDataOrigin.insertMany(
    missingOrigins.map((origen) => ({
      origen,
      origenResumido: "",
    })),
    { ordered: false },
  );

  return missingOrigins.length;
};

const upsertOpportunities = async (records: CallCenterImportRecord[]) => {
  if (!records.length) {
    return;
  }

  await CallCenterOpportunity.bulkWrite(
    records.map((record) => ({
      updateOne: {
        filter: { opportunityId: record.opportunityId },
        update: {
          $set: record,
        },
        upsert: true,
      },
    })),
  );
};

export class CallCenterService {
  static async syncLegacySummaryOriginLinks() {
    const summaryOrigins = await CallCenterSummaryOrigin.find({}, { nombre: 1 }).lean();

    if (!summaryOrigins.length) {
      return;
    }

    const summaryOriginMap = new Map(
      summaryOrigins.map((item) => [item.nombre.trim().toLowerCase(), item._id]),
    );

    const legacyOrigins = await CallCenterDataOrigin.find({
      origenResumidoId: null,
      origenResumido: { $exists: true, $ne: "" },
    }).lean();

    if (!legacyOrigins.length) {
      return;
    }

    const operations = legacyOrigins
      .map((origin) => {
        const matchedId = summaryOriginMap.get(origin.origenResumido.trim().toLowerCase());

        if (!matchedId) {
          return null;
        }

        return {
          updateOne: {
            filter: { _id: origin._id },
            update: {
              $set: {
                origenResumidoId: matchedId,
              },
            },
          },
        };
      })
      .filter(Boolean);

    if (!operations.length) {
      return;
    }

    await CallCenterDataOrigin.bulkWrite(operations as NonNullable<(typeof operations)[number]>[]);
  }

  static async importFile(file: CallCenterImportFile): Promise<CallCenterImportResult> {
    const prepared = prepareRecords(file);
    const createdOrigins = await syncDataOrigins(prepared.records);
    await upsertOpportunities(prepared.records);

    return {
      worksheetName: prepared.worksheetName,
      importedRows: prepared.records.length,
      createdOrigins,
      message: `Archivo importado correctamente. Se procesaron ${prepared.records.length} oportunidades y se crearon ${createdOrigins} origenes nuevos.`,
    };
  }
}
