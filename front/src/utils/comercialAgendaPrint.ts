import type { ComercialAgendaSemana } from "@/types/index";

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const formatUserLabel = (name: string, lastName: string) => `${name} ${lastName}`.trim();

export function openComercialAgendaPrintView(params: {
  week: ComercialAgendaSemana;
}) {
  const { week } = params;
  const title = `Agenda comercial - ${week.weekLabel}`;
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  iframe.setAttribute("aria-hidden", "true");
  document.body.appendChild(iframe);

  const printDocument = iframe.contentDocument;

  if (!printDocument) {
    document.body.removeChild(iframe);
    throw new Error("No se pudo preparar la vista de impresion.");
  }

  const headColumns = week.puestos
    .map(
      (puesto) => `
        <th>${escapeHtml(puesto.nombre)}</th>
      `,
    )
    .join("");

  const bodyRows = week.days
    .map(
      (day) => `
        <tr>
          <td class="fecha-cell">
            <div class="fecha-main">${escapeHtml(day.fechaLabel)}</div>
            <div class="fecha-sub">${escapeHtml(day.weekdayLabel)}</div>
          </td>
          ${day.cells
            .map(
              (cell) => `
                <td>
                  ${
                    cell.asistentes.length
                      ? `<div class="stack">
                          ${cell.asistentes
                            .map(
                              (asistente) => `
                                <div class="stack-row">${escapeHtml(
                                  formatUserLabel(asistente.name, asistente.lastName),
                                )}</div>
                              `,
                            )
                            .join("")}
                        </div>`
                      : `<span class="empty">-</span>`
                  }
                </td>
              `,
            )
            .join("")}
        </tr>
      `,
    )
    .join("");

  printDocument.open();
  printDocument.write(`
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="UTF-8" />
        <title>${escapeHtml(title)}</title>
        <style>
          @page {
            size: A4 landscape;
            margin: 8mm;
          }

          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          html, body {
            margin: 0;
            background: #ffffff;
            color: #111827;
            font-family: Arial, Helvetica, sans-serif;
          }

          body {
            padding: 0;
          }

          .header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 10px;
            margin-bottom: 10px;
            padding-bottom: 6px;
            border-bottom: 1px solid #d1d5db;
          }

          .eyebrow {
            font-size: 8px;
            font-weight: 700;
            letter-spacing: 0.16em;
            text-transform: uppercase;
            color: #6b7280;
          }

          h1 {
            margin: 3px 0 0;
            font-size: 16px;
            line-height: 1.1;
            letter-spacing: -0.03em;
          }

          .subtitle {
            margin-top: 3px;
            font-size: 9px;
            color: #4b5563;
          }

          .meta {
            text-align: right;
            font-size: 9px;
            color: #374151;
            min-width: 160px;
          }

          .meta strong {
            display: block;
            margin-bottom: 2px;
            font-size: 10px;
            color: #111827;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
          }

          th, td {
            border: 1px solid #d1d5db;
            vertical-align: top;
            padding: 4px 5px;
            font-size: 10px;
          }

          th {
            background: #e5e7eb;
            text-align: left;
            font-size: 8px;
            font-weight: 700;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            color: #4b5563;
            padding-top: 5px;
            padding-bottom: 5px;
          }

          .fecha-cell {
            width: 86px;
            background: #f3f4f6;
          }

          .fecha-main {
            font-weight: 700;
            color: #111827;
            font-size: 10px;
            line-height: 1.05;
          }

          .fecha-sub {
            margin-top: 2px;
            text-transform: capitalize;
            color: #6b7280;
            font-size: 8px;
            line-height: 1.05;
          }

          .stack {
            display: block;
            width: 100%;
          }

          .stack-row {
            display: block;
            padding: 2px 0;
            color: #111827;
            font-size: 9px;
            font-weight: 700;
            line-height: 1.08;
            word-break: break-word;
            overflow-wrap: anywhere;
            text-transform: uppercase;
          }

          .stack-row + .stack-row {
            border-top: 1px solid #d1d5db;
          }

          .empty {
            color: #9ca3af;
            font-size: 9px;
            font-weight: 700;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="eyebrow">Comercial</div>
            <h1>Agenda semanal de puestos</h1>
            <div class="subtitle">Vista lista para imprimir o guardar como PDF.</div>
          </div>
          <div class="meta">
            <strong>${escapeHtml(week.weekLabel)}</strong>
            <div>Puestos activos: ${week.puestos.length}</div>
            <div>Dias visibles: ${week.days.length}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              ${headColumns}
            </tr>
          </thead>
          <tbody>
            ${bodyRows}
          </tbody>
        </table>
      </body>
    </html>
  `);
  printDocument.close();

  const printWindow = iframe.contentWindow;

  if (!printWindow) {
    document.body.removeChild(iframe);
    throw new Error("No se pudo abrir la vista de impresion.");
  }

  const cleanup = () => {
    window.setTimeout(() => {
      if (iframe.parentNode) {
        iframe.parentNode.removeChild(iframe);
      }
    }, 1000);
  };

  printWindow.onafterprint = cleanup;

  window.setTimeout(() => {
    printWindow.focus();
    printWindow.print();
    cleanup();
  }, 250);
}
