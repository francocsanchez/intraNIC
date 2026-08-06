import mongoose from "mongoose";
import Counter from "../models/Counter";
import Version from "../models/Version";

type ProformaUnidadPayload = {
  version?: string;
  cantidad?: number;
  ivaUnidad?: number;
  totalUnidad?: number;
  descuentoUnidad?: number;
  totalPatentamiento?: number;
  totalFlete?: number;
};

export type ProformaPayload = {
  senores?: string;
  cliente?: string;
  cuit?: string;
  observaciones?: string;
  unidades?: ProformaUnidadPayload[];
};

export type ProformaPdfRow = {
  detalle: string;
  cantidad: number;
  iva: number;
  neto: number;
  total: number;
  totales: number;
};

export type ProformaCalculatedUnidad = {
  versionId: string;
  versionNombre: string;
  cantidad: number;
  ivaUnidad: number;
  totalUnidad: number;
  descuentoUnidad: number;
  totalPatentamiento: number;
  totalFlete: number;
  rows: ProformaPdfRow[];
};

export type ProformaCalculated = {
  senores: string;
  cliente: string;
  cuit: string;
  observaciones: string;
  unidades: ProformaCalculatedUnidad[];
  totalNeto: number;
};

const safeTrim = (value: unknown) => (typeof value === "string" ? value.trim() : "");

const parseNonNegativeNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
};

export const formatMonthYearEs = (date: Date) =>
  new Intl.DateTimeFormat("es-AR", {
    month: "long",
    year: "numeric",
    timeZone: "America/Argentina/Buenos_Aires",
  })
    .format(date)
    .toLowerCase()
    .replace(" de ", "-");

export const formatDateEs = (date: Date) =>
  new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(date);

export const formatMoneyAr = (value: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

export const formatPercentAr = (value: number) =>
  `${new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)}%`;

export const roundTo2 = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

export const getNextProformaNumber = async () => {
  const counter = await Counter.findOneAndUpdate(
    { key: "proformas" },
    { $inc: { seq: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  ).lean();

  return counter.seq;
};

export const validateAndCalculateProforma = async (payload: ProformaPayload): Promise<ProformaCalculated> => {
  const senores = safeTrim(payload.senores);
  const cliente = safeTrim(payload.cliente);
  const cuit = safeTrim(payload.cuit);
  const observaciones = safeTrim(payload.observaciones);
  const unidadesInput = Array.isArray(payload.unidades) ? payload.unidades : [];

  if (!senores) {
    throw new Error("El campo señores es obligatorio");
  }

  if (!unidadesInput.length) {
    throw new Error("Debes agregar al menos una unidad");
  }

  const versionIds = unidadesInput.map((unidad, index) => {
    const versionId = safeTrim(unidad.version);

    if (!mongoose.isValidObjectId(versionId)) {
      throw new Error(`La versión de la unidad ${index + 1} es obligatoria`);
    }

    return versionId;
  });

  const versiones = await Version.find({
    _id: { $in: versionIds },
    activo: true,
  }).lean();

  const versionesMap = new Map(versiones.map((version) => [String(version._id), version]));

  const unidades = unidadesInput.map((unidad, index) => {
    const versionId = safeTrim(unidad.version);
    const version = versionesMap.get(versionId);

    if (!version) {
      throw new Error(`La versión de la unidad ${index + 1} no existe o está inactiva`);
    }

    const cantidad = parseNonNegativeNumber(unidad.cantidad);
    const ivaUnidad = parseNonNegativeNumber(unidad.ivaUnidad);
    const totalUnidad = parseNonNegativeNumber(unidad.totalUnidad);
    const descuentoUnidad = parseNonNegativeNumber(unidad.descuentoUnidad ?? 0);
    const totalPatentamiento = parseNonNegativeNumber(unidad.totalPatentamiento);
    const totalFlete = parseNonNegativeNumber(unidad.totalFlete);

    if (!Number.isFinite(cantidad) || cantidad <= 0) {
      throw new Error(`La cantidad de la unidad ${index + 1} debe ser mayor a 0`);
    }

    if (!Number.isFinite(ivaUnidad) || ivaUnidad < 0) {
      throw new Error(`El IVA de la unidad ${index + 1} debe ser mayor o igual a 0`);
    }

    if (!Number.isFinite(totalUnidad) || totalUnidad < 0) {
      throw new Error(`El total de la unidad ${index + 1} debe ser mayor o igual a 0`);
    }

    if (!Number.isFinite(descuentoUnidad) || descuentoUnidad < 0) {
      throw new Error(`El descuento de la unidad ${index + 1} debe ser mayor o igual a 0`);
    }

    if (!Number.isFinite(totalPatentamiento) || totalPatentamiento < 0) {
      throw new Error(`El patentamiento de la unidad ${index + 1} debe ser mayor o igual a 0`);
    }

    if (!Number.isFinite(totalFlete) || totalFlete < 0) {
      throw new Error(`El flete de la unidad ${index + 1} debe ser mayor o igual a 0`);
    }

    const unitRow: ProformaPdfRow = {
      detalle: version.nombre,
      cantidad,
      iva: ivaUnidad,
      neto: roundTo2(totalUnidad / (1 + ivaUnidad / 100)),
      total: roundTo2(totalUnidad),
      totales: roundTo2(cantidad * totalUnidad),
    };

    const patentamientoRow: ProformaPdfRow = {
      detalle: "Patentamiento",
      cantidad,
      iva: 0,
      neto: roundTo2(totalPatentamiento),
      total: roundTo2(totalPatentamiento),
      totales: roundTo2(cantidad * totalPatentamiento),
    };

    const fleteRow: ProformaPdfRow = {
      detalle: "Flete",
      cantidad,
      iva: 21,
      neto: roundTo2(totalFlete / 1.21),
      total: roundTo2(totalFlete),
      totales: roundTo2(cantidad * totalFlete),
    };

    const descuentoRow: ProformaPdfRow = {
      detalle: "Descuento",
      cantidad,
      iva: ivaUnidad,
      neto: roundTo2((descuentoUnidad / (1 + ivaUnidad / 100)) * -1),
      total: roundTo2(descuentoUnidad * -1),
      totales: roundTo2(cantidad * descuentoUnidad * -1),
    };

    const rows = [unitRow];

    if (totalPatentamiento > 0) rows.push(patentamientoRow);
    if (totalFlete > 0) rows.push(fleteRow);
    if (descuentoUnidad > 0) rows.push(descuentoRow);

    return {
      versionId,
      versionNombre: version.nombre,
      cantidad,
      ivaUnidad,
      totalUnidad: roundTo2(totalUnidad),
      descuentoUnidad: roundTo2(descuentoUnidad),
      totalPatentamiento: roundTo2(totalPatentamiento),
      totalFlete: roundTo2(totalFlete),
      rows,
    };
  });

  const totalNeto = roundTo2(
    unidades.flatMap((unidad) => unidad.rows).reduce((acc, row) => acc + row.totales, 0),
  );

  return {
    senores,
    cliente,
    cuit,
    observaciones,
    unidades,
    totalNeto,
  };
};

export const buildProformaResponse = (proforma: any) => {
  const fecha = proforma.fecha instanceof Date ? proforma.fecha : new Date(proforma.fecha);

  const unidades = Array.isArray(proforma.unidades)
    ? proforma.unidades.map((unidad: any) => {
        const cantidad = Number(unidad.cantidad);
        const ivaUnidad = Number(unidad.ivaUnidad);
        const totalUnidad = Number(unidad.totalUnidad);
        const descuentoUnidad = Number(unidad.descuentoUnidad ?? 0);
        const totalPatentamiento = Number(unidad.totalPatentamiento);
        const totalFlete = Number(unidad.totalFlete);

        const rows: ProformaPdfRow[] = [
          {
            detalle: unidad.versionNombre,
            cantidad,
            iva: ivaUnidad,
            neto: roundTo2(totalUnidad / (1 + ivaUnidad / 100)),
            total: roundTo2(totalUnidad),
            totales: roundTo2(cantidad * totalUnidad),
          },
        ];

        if (totalPatentamiento > 0) {
          rows.push({
            detalle: "Patentamiento",
            cantidad,
            iva: 0,
            neto: roundTo2(totalPatentamiento),
            total: roundTo2(totalPatentamiento),
            totales: roundTo2(cantidad * totalPatentamiento),
          });
        }

        if (totalFlete > 0) {
          rows.push({
            detalle: "Flete",
            cantidad,
            iva: 21,
            neto: roundTo2(totalFlete / 1.21),
            total: roundTo2(totalFlete),
            totales: roundTo2(cantidad * totalFlete),
          });
        }

        if (descuentoUnidad > 0) {
          rows.push({
            detalle: "Descuento",
            cantidad,
            iva: ivaUnidad,
            neto: roundTo2((descuentoUnidad / (1 + ivaUnidad / 100)) * -1),
            total: roundTo2(descuentoUnidad * -1),
            totales: roundTo2(cantidad * descuentoUnidad * -1),
          });
        }

        return {
          _id: String(unidad._id),
          versionId: String(unidad.versionId),
          versionNombre: unidad.versionNombre,
          cantidad,
          ivaUnidad,
          totalUnidad,
          descuentoUnidad,
          totalPatentamiento,
          totalFlete,
          rows,
          subtotal: roundTo2(rows.reduce((acc, row) => acc + row.totales, 0)),
        };
      })
    : [];

  return {
    _id: String(proforma._id),
    numeroProforma: Number(proforma.numeroProforma),
    fecha: fecha.toISOString(),
    fechaLabel: formatDateEs(fecha),
    listaPrecioLabel: formatMonthYearEs(fecha),
    senores: proforma.senores,
    cliente: proforma.cliente ?? "",
    cuit: proforma.cuit ?? "",
    observaciones: proforma.observaciones ?? "",
    asesorComercial: proforma.asesorComercial,
    emailAsesor: proforma.emailAsesor,
    usuarioId: String(proforma.usuarioId),
    unidades,
    totalNeto: roundTo2(unidades.reduce((acc, unidad) => acc + unidad.subtotal, 0)),
    createdAt: proforma.createdAt ? new Date(proforma.createdAt).toISOString() : undefined,
    updatedAt: proforma.updatedAt ? new Date(proforma.updatedAt).toISOString() : undefined,
  };
};
