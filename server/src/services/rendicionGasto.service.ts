import EmpresaGasto from "../models/EmpresaGasto";
import type { IRendicionGasto, IRendicionGastoItem } from "../models/RendicionGasto";

type GastoPayload = { fecha?: unknown; empresaNombre?: unknown; empresaCuit?: unknown; descripcion?: unknown; monto?: unknown };
export type RendicionGastoPayload = { motivo?: unknown; montoRetirado?: unknown; gastos?: unknown };

const asText = (value: unknown) => String(value ?? "").trim();
const CUIT_PATTERN = /^\d{11}$/;

export const toCentavos = (value: unknown, required: boolean) => {
  if ((value === undefined || value === null || value === "") && !required) return 0;
  const numberValue = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numberValue) || numberValue < 0 || Math.round(numberValue * 100) !== numberValue * 100) {
    throw new Error("Los montos deben ser positivos y tener hasta dos decimales");
  }
  const centavos = Math.round(numberValue * 100);
  if (required && centavos <= 0) throw new Error("El monto de cada gasto debe ser mayor a cero");
  return centavos;
};

const toDate = (value: unknown) => {
  const text = asText(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) throw new Error("La fecha de cada gasto es obligatoria");
  const date = new Date(`${text}T12:00:00.000Z`);
  if (Number.isNaN(date.getTime())) throw new Error("La fecha de cada gasto no es válida");
  return date;
};

export const validateRendicionGasto = (payload: RendicionGastoPayload) => {
  const motivo = asText(payload?.motivo);
  if (!motivo) throw new Error("El motivo es obligatorio");
  if (!Array.isArray(payload?.gastos) || payload.gastos.length === 0) throw new Error("Debes ingresar al menos un gasto");

  const gastos = (payload.gastos as GastoPayload[]).map((gasto) => {
    const empresaNombre = asText(gasto.empresaNombre);
    const empresaCuit = asText(gasto.empresaCuit);
    const descripcion = asText(gasto.descripcion);
    if (!empresaNombre) throw new Error("El nombre de la empresa es obligatorio");
    if (!CUIT_PATTERN.test(empresaCuit)) throw new Error("El CUIT debe tener exactamente 11 dígitos sin guiones");
    if (!descripcion) throw new Error("La descripción de cada gasto es obligatoria");
    return { fecha: toDate(gasto.fecha), empresaNombre, empresaCuit, descripcion, montoCentavos: toCentavos(gasto.monto, true) };
  });

  return { motivo, montoRetiradoCentavos: toCentavos(payload?.montoRetirado, false), gastos };
};

export const upsertEmpresaCanonica = async (cuitValue: unknown, nombreValue: unknown) => {
  const cuit = asText(cuitValue);
  const nombre = asText(nombreValue);
  if (!CUIT_PATTERN.test(cuit)) throw new Error("El CUIT debe tener exactamente 11 dígitos sin guiones");
  if (!nombre) throw new Error("El nombre de la empresa es obligatorio");

  try {
    await EmpresaGasto.updateOne({ cuit }, { $setOnInsert: { nombre } }, { upsert: true });
  } catch (error: any) {
    if (error?.code !== 11000) throw error;
  }

  const empresa = await EmpresaGasto.findOne({ cuit }).lean();
  if (!empresa) throw new Error("No se pudo guardar la empresa");
  return { cuit: empresa.cuit, nombre: empresa.nombre };
};

export const upsertEmpresasCanonicas = async (gastos: IRendicionGastoItem[]) => {
  for (const gasto of gastos) {
    const empresa = await upsertEmpresaCanonica(gasto.empresaCuit, gasto.empresaNombre);
    gasto.empresaNombre = empresa.nombre;
  }
};

const toAmount = (centavos: number) => Number((centavos / 100).toFixed(2));
const dateLabel = (date: Date) => new Intl.DateTimeFormat("es-AR", { timeZone: "UTC" }).format(new Date(date));

export const buildRendicionGastoResponse = (item: IRendicionGasto | any) => {
  const totalGastadoCentavos = item.gastos.reduce((total: number, gasto: IRendicionGastoItem) => total + gasto.montoCentavos, 0);
  const saldoCentavos = item.montoRetiradoCentavos - totalGastadoCentavos;
  return {
    _id: String(item._id),
    motivo: item.motivo,
    montoRetirado: toAmount(item.montoRetiradoCentavos),
    totalGastado: toAmount(totalGastadoCentavos),
    saldo: toAmount(saldoCentavos),
    saldoLabel: saldoCentavos >= 0 ? "Monto a devolver" : "Monto a reintegrar",
    gastos: item.gastos.map((gasto: IRendicionGastoItem) => ({
      fecha: new Date(gasto.fecha).toISOString().slice(0, 10),
      fechaLabel: dateLabel(gasto.fecha), empresaNombre: gasto.empresaNombre, empresaCuit: gasto.empresaCuit,
      descripcion: gasto.descripcion, monto: toAmount(gasto.montoCentavos),
    })),
    createdBy: String(item.createdBy),
    createdAt: new Date(item.createdAt).toISOString(),
    createdAtLabel: dateLabel(item.createdAt),
  };
};
