import fs from "fs";
import path from "path";
import { generatePdfFromHtml } from "../pdf/playwrightPdf";

type PdfRendicion = {
  motivo: string; montoRetirado: number; totalGastado: number; saldo: number; saldoLabel: string; createdAtLabel: string;
  gastos: Array<{ fecha: string; fechaLabel: string; empresaNombre: string; empresaCuit: string; descripcion: string; monto: number }>;
};

const escapeHtml = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const money = (value: number) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 2 }).format(value);
const logoPath = path.resolve(__dirname, "../../assets/proformas/logo-nipponcar-negro.png");
const getLogoDataUri = () => fs.existsSync(logoPath) ? `data:image/png;base64,${fs.readFileSync(logoPath).toString("base64")}` : "";

export const generateRendicionGastoPdf = (rendicion: PdfRendicion, userName: string) => {
  const gastos = [...rendicion.gastos].sort((left, right) => left.fecha.localeCompare(right.fecha));
  const rows = gastos.map((gasto, index) => `<tr><td>${index + 1}</td><td>${escapeHtml(gasto.fechaLabel)}</td><td><strong>${escapeHtml(gasto.empresaNombre)}</strong><br><small>CUIT ${escapeHtml(gasto.empresaCuit)}</small></td><td>${escapeHtml(gasto.descripcion)}</td><td class="amount">${money(gasto.monto)}</td></tr>`).join("");
  const logoDataUri = getLogoDataUri();
  const logo = logoDataUri ? `<img class="brand-logo" src="${logoDataUri}" alt="Nippon Car" />` : '<div class="brand-fallback">NIPPON CAR</div>';
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><style>
    *{box-sizing:border-box}body{font-family:Arial,Helvetica,sans-serif;color:#111827;font-size:10px;margin:0}.page{min-height:255mm;display:flex;flex-direction:column}.brand-logo{display:block;width:86mm;height:18mm;object-fit:contain;object-position:left center}.brand-fallback{font-size:18px;font-weight:700}.document-head{display:flex;justify-content:space-between;align-items:center;min-height:18mm;margin-top:4mm;padding:0 5mm;border-radius:3mm;background:#e5e7eb;color:#1f2937}.document-head h1{font-size:15px;margin:0}.document-head__type{font-size:7px;font-weight:700;letter-spacing:.08em}.meta{display:grid;grid-template-columns:1fr 1fr;gap:8px;border:1px solid #d1d5db;margin:4mm 0 15px;padding:10px}.meta b{display:block;font-size:11px;margin-top:3px}table{width:100%;border-collapse:collapse}th{background:#e5e7eb;text-align:left;font-size:9px;text-transform:uppercase;letter-spacing:.06em;padding:7px;border-bottom:1px solid #9ca3af}td{padding:7px;border-bottom:1px solid #e5e7eb;vertical-align:top}small{color:#6b7280}.amount{text-align:right;white-space:nowrap}.summary{margin-top:14px;margin-left:auto;width:260px;border:1px solid #d1d5db}.summary div{display:flex;justify-content:space-between;padding:7px 9px;border-bottom:1px solid #e5e7eb}.summary div:last-child{border-bottom:0;font-weight:700;font-size:11px}.signature{margin-top:auto;padding-top:22px;break-inside:avoid}.signature-line{width:230px;border-top:1px solid #111827;padding-top:5px;text-align:center;font-size:9px}@media print{thead{display:table-header-group}tr{break-inside:avoid}}
  </style></head><body><main class="page"><header>${logo}<div class="document-head"><div><h1>Rendición de gastos</h1><div class="document-head__type">DOCUMENTO INTERNO</div></div><div class="document-head__type">INTRANIC</div></div></header><section class="meta"><div>Empleado<b>${escapeHtml(userName)}</b></div><div>Fecha de registro<b>${escapeHtml(rendicion.createdAtLabel)}</b></div><div style="grid-column:1/-1">Motivo<b>${escapeHtml(rendicion.motivo)}</b></div></section><table><thead><tr><th>#</th><th>Fecha</th><th>Empresa</th><th>Descripción</th><th class="amount">Monto</th></tr></thead><tbody>${rows}</tbody></table><section class="summary"><div><span>Monto retirado</span><span>${money(rendicion.montoRetirado)}</span></div><div><span>Total gastado</span><span>${money(rendicion.totalGastado)}</span></div><div><span>${escapeHtml(rendicion.saldoLabel)}</span><span>${money(Math.abs(rendicion.saldo))}</span></div></section><footer class="signature"><div class="signature-line">Firma del supervisor</div></footer></main></body></html>`;
  return generatePdfFromHtml(html, { format: "A4", margin: { top: "12mm", right: "14mm", bottom: "12mm", left: "14mm" } });
};
