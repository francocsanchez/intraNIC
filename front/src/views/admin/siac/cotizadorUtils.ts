export type AmortizationRow = {
  cuota: number;
  amort: number;
  interes: number;
  ivaInt: number;
  total: number;
  saldo: number;
};

export function getCurrentMonthValue() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${now.getFullYear()}-${month}`;
}

export function formatMoney(value: number | null | undefined) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0));
}

export function formatNumber(value: number | null | undefined, digits = 2) {
  return new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(Number(value ?? 0));
}

export function formatPercent(value: number | null | undefined, digits = 2) {
  return `${formatNumber(value ?? 0, digits)}%`;
}

export function parseNumericInput(value: string) {
  const normalized = value.replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function parseMoneyInput(value: string) {
  const digitsOnly = value.replace(/\D/g, "");
  const parsed = Number(digitsOnly);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatMoneyInput(value: string | number | null | undefined) {
  const digitsOnly = String(value ?? "").replace(/\D/g, "");

  if (!digitsOnly) {
    return "";
  }

  return new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(digitsOnly));
}

export function sanitizeDecimalInput(value: string, maxDecimals = 2) {
  const normalized = value.replace(",", ".");
  const cleaned = normalized.replace(/[^0-9.]/g, "");
  const [integerPart = "", ...rest] = cleaned.split(".");
  const decimalPart = rest.join("").slice(0, maxDecimals);

  if (cleaned.startsWith(".")) {
    return decimalPart ? `0.${decimalPart}` : "0.";
  }

  if (rest.length === 0) {
    return integerPart;
  }

  return `${integerPart}.${decimalPart}`;
}

export function calcFrances(capital: number, tnaPercent: number, meses: number): AmortizationRow[] {
  if (capital <= 0 || meses <= 0) {
    return [];
  }

  const tna = tnaPercent / 100;
  const tm = tna / 12;
  const rows: AmortizationRow[] = [];

  if (tm === 0) {
    const amortizacion = capital / meses;
    let saldo = capital;

    for (let cuota = 1; cuota <= meses; cuota += 1) {
      saldo -= amortizacion;
      rows.push({
        cuota,
        amort: amortizacion,
        interes: 0,
        ivaInt: 0,
        total: amortizacion,
        saldo: saldo < 0.01 ? 0 : saldo,
      });
    }

    return rows;
  }

  const cuotaBase = capital * (tm * Math.pow(1 + tm, meses)) / (Math.pow(1 + tm, meses) - 1);
  let saldo = capital;

  for (let cuota = 1; cuota <= meses; cuota += 1) {
    const interes = saldo * tm;
    const ivaInt = interes * 0.21;
    const amort = cuota === meses ? saldo : cuotaBase - interes;
    saldo -= amort;

    rows.push({
      cuota,
      amort,
      interes,
      ivaInt,
      total: amort + interes + ivaInt,
      saldo: saldo < 0.01 ? 0 : saldo,
    });
  }

  return rows;
}

export function calcCft(capital: number, rows: AmortizationRow[]) {
  if (capital <= 0 || rows.length === 0) {
    return 0;
  }

  const cashFlows = [-capital, ...rows.map((row) => row.total)];
  let rate = 0.02;

  for (let iteration = 0; iteration < 100; iteration += 1) {
    let f = 0;
    let df = 0;

    for (let index = 0; index < cashFlows.length; index += 1) {
      f += cashFlows[index] / Math.pow(1 + rate, index);
      df -= index * cashFlows[index] / Math.pow(1 + rate, index + 1);
    }

    if (Math.abs(df) < 1e-10) {
      break;
    }

    const delta = f / df;
    rate -= delta;

    if (Math.abs(delta) < 1e-10) {
      break;
    }
  }

  return (Math.pow(1 + rate, 12) - 1) * 100;
}

export function calcPlazoFijo(capital: number, tnaPercent: number, meses: number) {
  return capital * (tnaPercent / 100) * (meses / 12);
}
