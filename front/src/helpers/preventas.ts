export function formatMonthLabel(dateString: string) {
  if (!dateString) return "";

  if (/^\d{4}-\d{2}$/.test(dateString)) {
    const [year, month] = dateString.split("-");
    return `${month}-${year}`;
  }

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;

  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const year = String(date.getUTCFullYear());

  return `${month}-${year}`;
}

export function toMonthInputValue(dateString: string) {
  if (!dateString) return "";
  if (/^\d{4}-\d{2}$/.test(dateString)) return dateString;
  if (/^\d{4}-\d{2}-\d{2}/.test(dateString)) return dateString.slice(0, 7);

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";

  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const year = String(date.getUTCFullYear());

  return `${year}-${month}`;
}

export function formatCurrency(value: number | null | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) return "-";

  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);
}
