import mongoose from "mongoose";
import csv from "csv-parser";
import { QueryTypes } from "sequelize";
import { Readable } from "stream";
import { sequelizeNIC } from "../config/database";
import {
  ssiVentasByOperacionQuery,
  ssiVentasCountQuery,
  ssiVentasListQuery,
} from "../controllers/querys/ssiVentas.query";
import SsiVentasAttempt, { type SsiVentasBinaryResponse, type SsiVentasIdentifier } from "../models/SsiVentasAttempt";
import SsiVentasCase, { type SsiVentasStatus } from "../models/SsiVentasCase";
import User from "../models/User";

type SqlOperacionRow = {
  operacion: number | string | null;
  fechaEntrega: string | Date | null;
  vendedorCodigo: number | string | null;
  vendedor: string | null;
  cliente: string | null;
  telefonoCliente: string | null;
  modelo: string | null;
  sucursal: string | null;
};

type SsiVentasSnapshot = {
  operacion: number;
  fechaEntrega: string | null;
  vendedorCodigo: number | null;
  vendedor: string;
  cliente: string;
  telefonoCliente: string;
  modelo: string;
  sucursal: string;
};

type SurveyNumericAnswers = {
  instalacionesConcesionario: number;
  atencionVendedor: number;
  atencionAdministrativa: number;
  informacionFechaEntrega: number;
  atencionAsesorEntregas: number;
  recomendariaConcesionario: number;
};

type SurveyBinaryAnswers = {
  usadoPartePago: SsiVentasBinaryResponse;
  financiacionCompra: SsiVentasBinaryResponse;
  seguroVehiculo: SsiVentasBinaryResponse;
  accesoriosVehiculo: SsiVentasBinaryResponse;
  aplicacionToyota: SsiVentasBinaryResponse;
  toyotaServiciosConectados: SsiVentasBinaryResponse;
};

type SurveyPayload = {
  numeric: SurveyNumericAnswers;
  binary: SurveyBinaryAnswers;
  hotAlert: boolean;
  observaciones?: string | null;
  administrativaId?: string | null;
  centralTelefonica?: boolean;
  identificadorCliente?: SsiVentasIdentifier | null;
  importMetadata?: {
    fechaEnvio?: string | null;
    fechaRespuesta?: string | null;
    categoriaOriginal?: string | null;
    nps?: number | null;
    contactoNombre?: string | null;
  } | null;
};

type NoAnswerPayload = {
  observaciones?: string | null;
  administrativaId?: string | null;
};

type UpdateAdministrativaPayload = {
  administrativaId: string;
};

type CurrentUser = {
  id: string;
  name: string;
};

type SsiVentasImportStatus =
  | "importada"
  | "ignoradaNoRespondida"
  | "operacionNoEncontrada"
  | "conflicto"
  | "errorValidacion";

type SsiCsvImportRow = Record<string, string | undefined>;

type SsiVentasImportRowResult = {
  rowNumber: number;
  status: SsiVentasImportStatus;
  operacion: number | null;
  contactoNombre: string;
  message: string;
};

const CSV_COLUMN_OPERACION = "Contacto: Operacion";
const CSV_COLUMN_CONTACTO_NOMBRE = "Contacto: Nombre";
const CSV_COLUMN_RESPONDIDA = "Respondida";
const CSV_COLUMN_FECHA_ENVIO = "Fecha Envio";
const CSV_COLUMN_FECHA_RESPUESTA = "Fecha Respuesta";
const CSV_COLUMN_CATEGORIA = "Categoría";
const CSV_COLUMN_NPS = "NPS";
const CSV_COLUMN_OBSERVACIONES = "Inserte cualquier comentario que quiera dejarnos ";

const CSV_NUMERIC_COLUMN_MAP: Record<keyof SurveyNumericAnswers, string> = {
  instalacionesConcesionario: "¿Cómo calificaría las instalaciones del concesionario?",
  atencionVendedor: "¿Cómo calificaría la atención del vendedor?",
  atencionAdministrativa: "¿Cómo calificaría la atención del sector administrativo del concesionario?",
  informacionFechaEntrega: "¿El concesionario lo mantuvo informado acerca de la fecha de entrega?",
  recomendariaConcesionario: "¿Qué tan probable es que le recomiendes el concesionario a tus colegas  familiares y amigos?",
  atencionAsesorEntregas: "¿Cómo calificaría el momento de la entrega de su vehículo?",
};

const CSV_BINARY_COLUMN_MAP: Record<keyof SurveyBinaryAnswers, string> = {
  usadoPartePago: "¿Le informaron la posibilidad de entregar su vehículo en parte de pago?",
  financiacionCompra: "¿Le ofrecieron financiar la compra de su nuevo vehículo?",
  seguroVehiculo: "¿Le ofrecieron un seguro para su nuevo vehículo?",
  accesoriosVehiculo: "¿Le ofrecieron accesorios para su vehículo 0 km  previo a la entrega?",
  aplicacionToyota:
    "¿Le recomendaron descargar la app de Toyota  que le permite agendar turnos de servicio  descargar cupón de pago  asociarse a Club Toyota  entre otras funciones?",
  toyotaServiciosConectados: "Si su vehículo posee “Servicios Conectados”  ¿pudo activar el paquete gratuito?",
};

const normalizeNullableNumber = (value: unknown) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeNullableString = (value: unknown) => {
  if (value === null || value === undefined) {
    return null;
  }

  const normalized = String(value).trim();
  return normalized.length ? normalized : null;
};

const normalizeString = (value: unknown) => {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
};

const normalizeYesNoText = (value: unknown) =>
  normalizeString(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const normalizeCsvObservation = (value: unknown) => {
  const normalized = normalizeString(value);
  if (!normalized) return "";

  const canonical = normalized
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (canonical === "s/d" || canonical === "sd") {
    return "";
  }

  return normalized;
};

const parseCsvNumericAnswer = (value: unknown) => {
  const parsed = normalizeNullableNumber(value);
  if (parsed === null) return null;
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 10 ? parsed : null;
};

const parseCsvBinaryAnswer = (value: unknown): SsiVentasBinaryResponse | null => {
  const normalized = normalizeYesNoText(value);

  if (!normalized) return "noSabe";
  if (normalized === "si") return "si";
  if (normalized === "no") return "no";
  if (normalized === "no sabe" || normalized === "ns/nc" || normalized === "nsnc") return "noSabe";

  return null;
};

const parseCsvRespondida = (value: unknown) => normalizeYesNoText(value) === "si";

const getIdentificadorCliente = (score: number): SsiVentasIdentifier => {
  if (score >= 9) return "promotor";
  if (score >= 7) return "neutro";
  return "detractor";
};

const shouldMarkImportedHotAlert = (numericAnswers: SurveyNumericAnswers) =>
  Object.values(numericAnswers).some((value) => value <= 8);

const formatImportTimestamp = (value: unknown) => {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    return null;
  }

  const day = String(value.getDate()).padStart(2, "0");
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const year = value.getFullYear();
  const hours = String(value.getHours()).padStart(2, "0");
  const minutes = String(value.getMinutes()).padStart(2, "0");

  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

const serializeCalendarDate = (value: string | Date | null) => {
  if (!value) return null;

  if (value instanceof Date) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  const normalized = String(value).trim();
  const match = normalized.match(/^(\d{4}-\d{2}-\d{2})/);
  if (match) {
    return match[1];
  }

  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) {
    return normalized;
  }

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const toSafeCalendarDate = (value: string | null) => {
  if (!value) return null;

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return new Date(`${value}T12:00:00`);
  }

  const [, year, month, day] = match;
  return new Date(Number(year), Number(month) - 1, Number(day), 12, 0, 0, 0);
};

const buildSnapshot = (row: SqlOperacionRow): SsiVentasSnapshot => {
  const operacion = normalizeNullableNumber(row.operacion);

  if (operacion === null) {
    throw new Error("La operacion consultada no es valida");
  }

  return {
    operacion,
    fechaEntrega: serializeCalendarDate(row.fechaEntrega),
    vendedorCodigo: normalizeNullableNumber(row.vendedorCodigo),
    vendedor: normalizeNullableString(row.vendedor) ?? "",
    cliente: normalizeNullableString(row.cliente) ?? "",
    telefonoCliente: normalizeNullableString(row.telefonoCliente) ?? "",
    modelo: normalizeNullableString(row.modelo) ?? "",
    sucursal: normalizeNullableString(row.sucursal) ?? "",
  };
};

const serializeAttempt = (attempt: any) => ({
  _id: String(attempt._id),
  operacion: Number(attempt.operacion),
  attemptNumber: Number(attempt.attemptNumber),
  result: attempt.result,
  surveyData: attempt.surveyData
    ? {
        numeric: attempt.surveyData.numeric,
        binary: attempt.surveyData.binary,
        hotAlert: Boolean(attempt.surveyData.hotAlert),
        observaciones: attempt.surveyData.observaciones ?? "",
      }
    : null,
  observaciones: attempt.observaciones ?? "",
  createdBy: attempt.createdBy ? String(attempt.createdBy) : null,
  createdByName: attempt.createdByName ?? "",
  centralTelefonica: Boolean(attempt.centralTelefonica),
  identificadorCliente: attempt.identificadorCliente ?? null,
  importMetadata: attempt.importMetadata
    ? {
        fechaEnvio: attempt.importMetadata.fechaEnvio ?? null,
        fechaRespuesta: attempt.importMetadata.fechaRespuesta ?? null,
        categoriaOriginal: attempt.importMetadata.categoriaOriginal ?? null,
        nps: normalizeNullableNumber(attempt.importMetadata.nps),
        contactoNombre: attempt.importMetadata.contactoNombre ?? null,
      }
    : null,
  createdAt: attempt.createdAt instanceof Date ? attempt.createdAt.toISOString() : String(attempt.createdAt),
  updatedAt: attempt.updatedAt instanceof Date ? attempt.updatedAt.toISOString() : String(attempt.updatedAt),
});

const serializeCase = (ssiCase: any, fallbackOperacion: number) => ({
  _id: ssiCase?._id ? String(ssiCase._id) : null,
  operacion: Number(ssiCase?.operacion ?? fallbackOperacion),
  surveyType: "convencional" as const,
  status: (ssiCase?.status ?? "pendiente") as SsiVentasStatus,
  attemptsCount: Number(ssiCase?.attemptsCount ?? 0),
  noAnswerCount: Number(ssiCase?.noAnswerCount ?? 0),
  closedAt: ssiCase?.closedAt ? new Date(ssiCase.closedAt).toISOString() : null,
  closedReason: ssiCase?.closedReason ?? null,
  fechaEntrega: serializeCalendarDate(ssiCase?.fechaEntrega ?? null),
  vendedorCodigo: normalizeNullableNumber(ssiCase?.vendedorCodigo),
  vendedor: ssiCase?.vendedor ?? "",
  cliente: ssiCase?.cliente ?? "",
  telefonoCliente: ssiCase?.telefonoCliente ?? "",
  modelo: ssiCase?.modelo ?? "",
  sucursal: ssiCase?.sucursal ?? "",
  hotAlert: Boolean(ssiCase?.hotAlert),
  centralTelefonica: Boolean(ssiCase?.centralTelefonica),
  identificadorCliente: ssiCase?.identificadorCliente ?? null,
  administrativaId: ssiCase?.administrativaId ? String(ssiCase.administrativaId) : null,
  administrativaNombre: ssiCase?.administrativaNombre ?? "",
  createdBy: ssiCase?.createdBy ? String(ssiCase.createdBy) : null,
  createdByName: ssiCase?.createdByName ?? "",
  updatedBy: ssiCase?.updatedBy ? String(ssiCase.updatedBy) : null,
  updatedByName: ssiCase?.updatedByName ?? "",
  createdAt: ssiCase?.createdAt ? new Date(ssiCase.createdAt).toISOString() : null,
  updatedAt: ssiCase?.updatedAt ? new Date(ssiCase.updatedAt).toISOString() : null,
});

const normalizeObjectId = (value: string) => {
  if (!mongoose.isValidObjectId(value)) {
    return null;
  }

  return new mongoose.Types.ObjectId(value);
};

const parseCsvBuffer = (fileBuffer: Buffer) =>
  new Promise<SsiCsvImportRow[]>((resolve, reject) => {
    const rows: SsiCsvImportRow[] = [];

    Readable.from([fileBuffer])
      .pipe(
        csv({
          mapHeaders: ({ header }) => header.replace(/^\uFEFF/, "").trim(),
          skipLines: 0,
        }),
      )
      .on("data", (row) => rows.push(row as SsiCsvImportRow))
      .on("end", () => resolve(rows))
      .on("error", reject);
  });

const getImportConflictMessage = (detail: Awaited<ReturnType<typeof SsiVentasService.getByOperacion>>) => {
  if (!detail) {
    return "La operacion ya tiene una encuesta registrada o el caso esta cerrado";
  }

  const respondedAttempts = detail.attempts.filter((attempt) => attempt.result === "respondio");
  const lastRespondedAttempt = respondedAttempts[0] ?? null;

  if (lastRespondedAttempt?.centralTelefonica) {
    const importedAt = formatImportTimestamp(new Date(lastRespondedAttempt.createdAt));
    return importedAt
      ? `La operacion ya fue importada previamente el ${importedAt}`
      : "La operacion ya fue importada previamente";
  }

  if (respondedAttempts.length) {
    return "La operacion ya tiene una encuesta manual registrada";
  }

  if (detail.case.status === "imposibleComunicarse") {
    return "El caso ya fue cerrado como imposible comunicarse";
  }

  if (detail.case.status === "encuestada") {
    return "La operacion ya tiene una encuesta registrada";
  }

  return "La operacion ya tiene una encuesta registrada o el caso esta cerrado";
};

export class SsiVentasService {
  static async listAdministrativas() {
    const users = await User.find(
      { enable: true },
      { _id: 1, name: 1, lastName: 1 },
    )
      .sort({ lastName: 1, name: 1 })
      .lean();

    return {
      data: users.map((user) => ({
        _id: String(user._id),
        nombre: `${user.lastName ?? ""} ${user.name ?? ""}`.trim(),
      })),
    };
  }

  static async list(page: number, limit: number, deliveryDate: string) {
    const safePage = Number.isInteger(page) && page > 0 ? page : 1;
    const safeLimit = Number.isInteger(limit) && limit > 0 ? Math.min(limit, 100) : 30;
    const offset = (safePage - 1) * safeLimit;

    const [rows, countRows] = await Promise.all([
      sequelizeNIC.query<SqlOperacionRow>(ssiVentasListQuery(), {
        type: QueryTypes.SELECT,
        replacements: { offset, limit: safeLimit, deliveryDate },
      }),
      sequelizeNIC.query<{ total: number | string | null }>(ssiVentasCountQuery(), {
        type: QueryTypes.SELECT,
        replacements: { deliveryDate },
      }),
    ]);

    const snapshots = rows.map(buildSnapshot);
    const operaciones = snapshots.map((item) => item.operacion);
    const cases = operaciones.length
      ? await SsiVentasCase.find({ operacion: { $in: operaciones } }).lean()
      : [];
    const caseMap = new Map(cases.map((item) => [Number(item.operacion), item]));

    const data = snapshots.map((snapshot) => {
      const ssiCase = caseMap.get(snapshot.operacion);
      const status = (ssiCase?.status ?? "pendiente") as SsiVentasStatus;
      const attemptsCount = Number(ssiCase?.attemptsCount ?? 0);
      const noAnswerCount = Number(ssiCase?.noAnswerCount ?? 0);

      return {
        ...snapshot,
        status,
        attemptsCount,
        noAnswerCount,
        hotAlert: Boolean(ssiCase?.hotAlert),
        centralTelefonica: Boolean(ssiCase?.centralTelefonica),
        identificadorCliente: ssiCase?.identificadorCliente ?? null,
        administrativaId: ssiCase?.administrativaId ? String(ssiCase.administrativaId) : null,
        administrativaNombre: ssiCase?.administrativaNombre ?? "",
        attemptProgressLabel:
          status === "enGestion" || status === "imposibleComunicarse" ? `${noAnswerCount}/3` : attemptsCount > 0 ? `${attemptsCount}` : "0",
        canManage: status !== "encuestada" && status !== "imposibleComunicarse",
        closedAt: ssiCase?.closedAt ? new Date(ssiCase.closedAt).toISOString() : null,
        updatedAt: ssiCase?.updatedAt ? new Date(ssiCase.updatedAt).toISOString() : null,
      };
    });

    const total = normalizeNullableNumber(countRows[0]?.total) ?? 0;

    return {
      data,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.max(1, Math.ceil(total / safeLimit)),
      },
    };
  }

  static async getByOperacion(operacion: number) {
    const rows = await sequelizeNIC.query<SqlOperacionRow>(ssiVentasByOperacionQuery(), {
      type: QueryTypes.SELECT,
      replacements: { operacion },
    });
    const firstRow = rows[0];

    if (!firstRow) {
      return null;
    }

    const snapshot = buildSnapshot(firstRow);
    const [ssiCase, attempts] = await Promise.all([
      SsiVentasCase.findOne({ operacion }).lean(),
      SsiVentasAttempt.find({ operacion }).sort({ attemptNumber: -1, createdAt: -1 }).lean(),
    ]);

    return {
      snapshot,
      case: serializeCase(ssiCase, operacion),
      attempts: attempts.map(serializeAttempt),
    };
  }

  private static async ensureOpenCase(snapshot: SsiVentasSnapshot, user: CurrentUser) {
    let ssiCase = await SsiVentasCase.findOne({ operacion: snapshot.operacion });

    if (!ssiCase) {
      ssiCase = await SsiVentasCase.create({
        operacion: snapshot.operacion,
        surveyType: "convencional",
        status: "pendiente",
        attemptsCount: 0,
        noAnswerCount: 0,
        fechaEntrega: toSafeCalendarDate(snapshot.fechaEntrega),
        vendedorCodigo: snapshot.vendedorCodigo,
        vendedor: snapshot.vendedor,
        cliente: snapshot.cliente,
        telefonoCliente: snapshot.telefonoCliente,
        modelo: snapshot.modelo,
        sucursal: snapshot.sucursal,
        hotAlert: false,
        centralTelefonica: false,
        identificadorCliente: null,
        createdBy: new mongoose.Types.ObjectId(user.id),
        createdByName: user.name,
        updatedBy: new mongoose.Types.ObjectId(user.id),
        updatedByName: user.name,
      });
    } else {
      ssiCase.fechaEntrega = toSafeCalendarDate(snapshot.fechaEntrega);
      ssiCase.vendedorCodigo = snapshot.vendedorCodigo;
      ssiCase.vendedor = snapshot.vendedor;
      ssiCase.cliente = snapshot.cliente;
      ssiCase.telefonoCliente = snapshot.telefonoCliente;
      ssiCase.modelo = snapshot.modelo;
      ssiCase.sucursal = snapshot.sucursal;
    }

    if (ssiCase.status === "encuestada" || ssiCase.status === "imposibleComunicarse") {
      throw new Error("El caso ya esta cerrado y no admite nuevas gestiones");
    }

    return ssiCase;
  }

  private static async resolveAdministrativa(administrativaId: string) {
    const objectId = normalizeObjectId(administrativaId);

    if (!objectId) {
      throw new Error("Debes seleccionar una administrativa valida");
    }

    const administrativa = await User.findOne(
      { _id: objectId, enable: true },
      { _id: 1, name: 1, lastName: 1 },
    ).lean();

    if (!administrativa) {
      throw new Error("La administrativa seleccionada no existe o esta inactiva");
    }

    return {
      id: objectId,
      nombre: `${administrativa.lastName ?? ""} ${administrativa.name ?? ""}`.trim(),
    };
  }

  private static async resolveAdministrativaIfPresent(administrativaId?: string | null) {
    const normalized = typeof administrativaId === "string" ? administrativaId.trim() : "";

    if (!normalized) {
      return null;
    }

    return this.resolveAdministrativa(normalized);
  }

  static async registerNoAnswer(operacion: number, payload: NoAnswerPayload, user: CurrentUser) {
    const detail = await this.getByOperacion(operacion);

    if (!detail) {
      throw new Error("La operacion indicada no existe en SSI Ventas");
    }

    const administrativa = await this.resolveAdministrativaIfPresent(payload.administrativaId);
    const ssiCase = await this.ensureOpenCase(detail.snapshot, user);
    const attemptNumber = Number(ssiCase.attemptsCount ?? 0) + 1;
    const noAnswerCount = Number(ssiCase.noAnswerCount ?? 0) + 1;
    const isFinalNoAnswer = noAnswerCount >= 3;

    const attempt = await SsiVentasAttempt.create({
      caseId: ssiCase._id,
      operacion,
      attemptNumber,
      result: "noAtendio",
      surveyData: null,
      observaciones: typeof payload.observaciones === "string" ? payload.observaciones.trim() : "",
      createdBy: new mongoose.Types.ObjectId(user.id),
      createdByName: user.name,
    });

    ssiCase.attemptsCount = attemptNumber;
    ssiCase.noAnswerCount = noAnswerCount;
    ssiCase.status = isFinalNoAnswer ? "imposibleComunicarse" : "enGestion";
    ssiCase.closedAt = isFinalNoAnswer ? new Date() : null;
    ssiCase.closedReason = isFinalNoAnswer ? "imposibleComunicarse" : null;
    if (administrativa) {
      ssiCase.administrativaId = administrativa.id;
      ssiCase.administrativaNombre = administrativa.nombre;
    }
    ssiCase.updatedBy = new mongoose.Types.ObjectId(user.id);
    ssiCase.updatedByName = user.name;
    await ssiCase.save();

    return {
      message: isFinalNoAnswer
        ? "Se registro el tercer no atendio y el caso quedo cerrado como imposible comunicarse"
        : "Intento no atendido registrado correctamente",
      data: {
        case: serializeCase(ssiCase.toObject(), operacion),
        attempt: serializeAttempt(attempt.toObject()),
      },
    };
  }

  static async registerSurvey(operacion: number, survey: SurveyPayload, user: CurrentUser) {
    const detail = await this.getByOperacion(operacion);

    if (!detail) {
      throw new Error("La operacion indicada no existe en SSI Ventas");
    }

    const administrativa = await this.resolveAdministrativaIfPresent(survey.administrativaId);
    const ssiCase = await this.ensureOpenCase(detail.snapshot, user);
    const attemptNumber = Number(ssiCase.attemptsCount ?? 0) + 1;
    const identificadorCliente = survey.identificadorCliente ?? getIdentificadorCliente(survey.numeric.recomendariaConcesionario);
    const centralTelefonica = Boolean(survey.centralTelefonica);

    const attempt = await SsiVentasAttempt.create({
      caseId: ssiCase._id,
      operacion,
      attemptNumber,
      result: "respondio",
      surveyData: {
        numeric: survey.numeric,
        binary: survey.binary,
        hotAlert: survey.hotAlert,
        observaciones: survey.observaciones?.trim() ?? "",
      },
      observaciones: survey.observaciones?.trim() ?? "",
      createdBy: new mongoose.Types.ObjectId(user.id),
      createdByName: user.name,
      centralTelefonica,
      identificadorCliente,
      importMetadata: survey.importMetadata ?? null,
    });

    ssiCase.attemptsCount = attemptNumber;
    ssiCase.status = "encuestada";
    ssiCase.closedAt = new Date();
    ssiCase.closedReason = "encuestaRespondida";
    ssiCase.hotAlert = survey.hotAlert;
    ssiCase.centralTelefonica = centralTelefonica;
    ssiCase.identificadorCliente = identificadorCliente;
    if (administrativa) {
      ssiCase.administrativaId = administrativa.id;
      ssiCase.administrativaNombre = administrativa.nombre;
    }
    ssiCase.updatedBy = new mongoose.Types.ObjectId(user.id);
    ssiCase.updatedByName = user.name;
    await ssiCase.save();

    return {
      message: "Encuesta SSI guardada correctamente",
      data: {
        case: serializeCase(ssiCase.toObject(), operacion),
        attempt: serializeAttempt(attempt.toObject()),
      },
    };
  }

  static async importCsv(fileBuffer: Buffer, user: CurrentUser) {
    if (!fileBuffer?.length) {
      throw new Error("Debes seleccionar un archivo CSV valido");
    }

    const rows = await parseCsvBuffer(fileBuffer);
    const results: SsiVentasImportRowResult[] = [];
    let imported = 0;
    let ignoredNoRespondida = 0;
    let notFound = 0;
    let conflicts = 0;
    let validationErrors = 0;

    for (const [index, row] of rows.entries()) {
      const rowNumber = index + 2;
      const operacion = normalizeNullableNumber(row[CSV_COLUMN_OPERACION]);
      const contactoNombre = normalizeString(row[CSV_COLUMN_CONTACTO_NOMBRE]);

      if (!parseCsvRespondida(row[CSV_COLUMN_RESPONDIDA])) {
        ignoredNoRespondida += 1;
        results.push({
          rowNumber,
          status: "ignoradaNoRespondida",
          operacion,
          contactoNombre,
          message: "La fila no fue respondida y se ignoro",
        });
        continue;
      }

      if (operacion === null) {
        validationErrors += 1;
        results.push({
          rowNumber,
          status: "errorValidacion",
          operacion: null,
          contactoNombre,
          message: "La operacion es invalida o esta vacia",
        });
        continue;
      }

      const detail = await this.getByOperacion(operacion);

      if (!detail) {
        notFound += 1;
        results.push({
          rowNumber,
          status: "operacionNoEncontrada",
          operacion,
          contactoNombre,
          message: "La operacion no existe en SSI Ventas",
        });
        continue;
      }

      const hasExistingSurvey = detail.attempts.some((attempt) => attempt.result === "respondio");
      const isClosed = detail.case.status === "encuestada" || detail.case.status === "imposibleComunicarse";

      if (hasExistingSurvey || isClosed) {
        conflicts += 1;
        results.push({
          rowNumber,
          status: "conflicto",
          operacion,
          contactoNombre,
          message: getImportConflictMessage(detail),
        });
        continue;
      }

      const numeric = Object.entries(CSV_NUMERIC_COLUMN_MAP).reduce(
        (acc, [key, column]) => {
          acc[key as keyof SurveyNumericAnswers] = parseCsvNumericAnswer(row[column]);
          return acc;
        },
        {} as Record<keyof SurveyNumericAnswers, number | null>,
      );

      const binary = Object.entries(CSV_BINARY_COLUMN_MAP).reduce(
        (acc, [key, column]) => {
          acc[key as keyof SurveyBinaryAnswers] = parseCsvBinaryAnswer(row[column]);
          return acc;
        },
        {} as Record<keyof SurveyBinaryAnswers, SsiVentasBinaryResponse | null>,
      );

      if (Object.values(numeric).some((value) => value === null)) {
        validationErrors += 1;
        results.push({
          rowNumber,
          status: "errorValidacion",
          operacion,
          contactoNombre,
          message: "Hay respuestas numericas vacias o fuera de rango",
        });
        continue;
      }

      if (Object.values(binary).some((value) => value === null)) {
        validationErrors += 1;
        results.push({
          rowNumber,
          status: "errorValidacion",
          operacion,
          contactoNombre,
          message: "Hay respuestas de seleccion con valores invalidos",
        });
        continue;
      }

      const recomendariaConcesionario = numeric.recomendariaConcesionario as number;
      const identificadorCliente = getIdentificadorCliente(recomendariaConcesionario);
      const hotAlert = shouldMarkImportedHotAlert(numeric as SurveyNumericAnswers);

      await this.registerSurvey(
        operacion,
        {
          numeric: numeric as SurveyNumericAnswers,
          binary: binary as SurveyBinaryAnswers,
          hotAlert,
          observaciones: normalizeCsvObservation(row[CSV_COLUMN_OBSERVACIONES]),
          centralTelefonica: true,
          identificadorCliente,
          importMetadata: {
            fechaEnvio: normalizeNullableString(row[CSV_COLUMN_FECHA_ENVIO]),
            fechaRespuesta: normalizeNullableString(row[CSV_COLUMN_FECHA_RESPUESTA]),
            categoriaOriginal: normalizeNullableString(row[CSV_COLUMN_CATEGORIA]),
            nps: normalizeNullableNumber(row[CSV_COLUMN_NPS]),
            contactoNombre: contactoNombre || null,
          },
        },
        user,
      );

      imported += 1;
      results.push({
        rowNumber,
        status: "importada",
        operacion,
        contactoNombre,
        message: "Encuesta importada correctamente",
      });
    }

    return {
      message: imported
        ? "Archivo SSI importado correctamente"
        : "El archivo fue procesado pero no genero encuestas importadas",
      data: {
        summary: {
          totalRead: rows.length,
          imported,
          ignoredNoRespondida,
          notFound,
          conflicts,
          validationErrors,
        },
        results,
      },
    };
  }

  static async updateAdministrativa(operacion: number, payload: UpdateAdministrativaPayload, user: CurrentUser) {
    const detail = await this.getByOperacion(operacion);

    if (!detail) {
      throw new Error("La operacion indicada no existe en SSI Ventas");
    }

    const administrativa = await this.resolveAdministrativa(payload.administrativaId);
    let ssiCase = await SsiVentasCase.findOne({ operacion });

    if (!ssiCase) {
      ssiCase = await SsiVentasCase.create({
        operacion: detail.snapshot.operacion,
        surveyType: "convencional",
        status: "pendiente",
        attemptsCount: 0,
        noAnswerCount: 0,
        fechaEntrega: toSafeCalendarDate(detail.snapshot.fechaEntrega),
        vendedorCodigo: detail.snapshot.vendedorCodigo,
        vendedor: detail.snapshot.vendedor,
        cliente: detail.snapshot.cliente,
        telefonoCliente: detail.snapshot.telefonoCliente,
        modelo: detail.snapshot.modelo,
        sucursal: detail.snapshot.sucursal,
        hotAlert: false,
        centralTelefonica: false,
        identificadorCliente: null,
        createdBy: new mongoose.Types.ObjectId(user.id),
        createdByName: user.name,
        updatedBy: new mongoose.Types.ObjectId(user.id),
        updatedByName: user.name,
      });
    }

    ssiCase.administrativaId = administrativa.id;
    ssiCase.administrativaNombre = administrativa.nombre;
    ssiCase.updatedBy = new mongoose.Types.ObjectId(user.id);
    ssiCase.updatedByName = user.name;
    await ssiCase.save();

    return {
      message: "ADM actualizada correctamente",
      data: {
        case: serializeCase(ssiCase.toObject(), operacion),
      },
    };
  }
}
