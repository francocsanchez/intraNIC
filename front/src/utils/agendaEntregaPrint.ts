import { textToColor } from "@/helpers/colores";
import type { AgendaEntrega, SucursalEntrega } from "@/types/index";

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const classColorMap: Record<string, string> = {
  "bg-red-50": "#fef2f2",
  "text-red-600": "#dc2626",
  "bg-slate-100": "#f1f5f9",
  "text-slate-600": "#475569",
  "bg-slate-200": "#e2e8f0",
  "text-slate-700": "#334155",
  "bg-slate-300": "#cbd5e1",
  "text-slate-800": "#1e293b",
  "bg-rose-200": "#fecdd3",
  "text-rose-700": "#be123c",
  "bg-blue-50": "#eff6ff",
  "text-blue-600": "#2563eb",
  "bg-blue-100": "#dbeafe",
  "text-blue-800": "#1e40af",
  "bg-gray-100": "#f3f4f6",
  "text-gray-700": "#374151",
  "bg-gray-200": "#e5e7eb",
  "bg-orange-50": "#fff7ed",
  "text-orange-600": "#ea580c",
  "bg-amber-50": "#fffbeb",
  "text-amber-600": "#d97706",
  "text-amber-700": "#b45309",
  "bg-amber-100": "#fef3c7",
  "text-amber-800": "#92400e",
  "bg-stone-100": "#f5f5f4",
  "text-stone-700": "#44403c",
  "bg-green-50": "#f0fdf4",
  "text-green-600": "#16a34a",
  "bg-green-100": "#dcfce7",
  "text-green-800": "#166534",
  "bg-neutral-50": "#fafafa",
  "text-neutral-700": "#404040",
};

const getInlineBadgeStyle = (colorName: string | null | undefined) => {
  const classes = textToColor(colorName);

  if (!classes) {
    return "background:#f3f4f6;color:#374151;border:1px solid #cbd5e1;";
  }

  const tokens = classes.split(/\s+/);
  const background = tokens.find((token) => token.startsWith("bg-"));
  const text = tokens.find((token) => token.startsWith("text-"));

  return [
    background ? `background:${classColorMap[background] ?? "#f3f4f6"};` : "background:#f3f4f6;",
    text ? `color:${classColorMap[text] ?? "#374151"};` : "color:#374151;",
    "border:1px solid #cbd5e1;",
  ].join("");
};

const formatOperacion = (item: AgendaEntrega) => {
  if (item.tipoRegistro === "reserva" || !item.siac) return "-";
  if (item.siac.operacion) return String(item.siac.operacion);
  if (item.siac.grupo && item.siac.orden) return `[${item.siac.grupo} | ${item.siac.orden}]`;
  return "-";
};

const TIME_SLOT_OPTIONS = Array.from({ length: 21 }, (_, index) => {
  const totalMinutes = 8 * 60 + index * 30;
  const hours = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
  const minutes = String(totalMinutes % 60).padStart(2, "0");
  return `${hours}:${minutes}`;
});

const buildRows = (items: AgendaEntrega[], horariosHabilitados: string[]) => {
  const enabledTimeSlots = new Set(horariosHabilitados);

  return TIME_SLOT_OPTIONS.flatMap((timeSlot) => {
    const matchingItems = items.filter((item) => item.horaAgenda === timeSlot);

    if (!matchingItems.length && !enabledTimeSlots.has(timeSlot)) {
      return `
        <tr class="bloqueado">
          <td class="hora">${escapeHtml(timeSlot)}</td>
          <td class="interno">BLOQUEADO</td>
          <td class="datos">
            <div class="cliente">Horario bloqueado</div>
            <div class="modelo">&nbsp;</div>
            <div class="detalle">No disponible para agendar</div>
          </td>
          <td class="vendedor">-</td>
          <td class="operacion">-</td>
        </tr>
      `;
    }

    if (!matchingItems.length) {
      return `
        <tr>
          <td class="hora">${escapeHtml(timeSlot)}</td>
          <td class="interno"></td>
          <td class="datos">
            <div class="cliente">&nbsp;</div>
            <div class="modelo">&nbsp;</div>
            <div class="detalle">&nbsp;</div>
          </td>
          <td class="vendedor"></td>
          <td class="operacion"></td>
        </tr>
      `;
    }

    return matchingItems.map((item) => {
      if (item.tipoRegistro === "reserva") {
        return `
          <tr class="reserva">
            <td class="hora">${escapeHtml(item.horaAgenda)}</td>
            <td class="interno">RESERVA</td>
            <td class="datos">
              <div class="cliente">Reserva</div>
              <div class="modelo">&nbsp;</div>
              <div class="detalle">${escapeHtml(item.observaciones?.trim() || "-")}</div>
            </td>
            <td class="vendedor">-</td>
            <td class="operacion">-</td>
          </tr>
        `;
      }

      const identificado = (item.siac?.chasis ?? item.siac?.serie ?? item.siac?.nroFabricacion ?? "-").trim();
      const entregada = item.siac?.estado === 35 || item.siac?.estado === 40;
      const colorStyle = getInlineBadgeStyle(item.siac?.color);

      return `
        <tr class="${entregada ? "entregada" : ""}">
          <td class="hora">${escapeHtml(item.horaAgenda)}</td>
          <td class="interno">
            <div>${escapeHtml(String(item.interno))}</div>
            ${item.equipado ? '<div class="equipado">EQUIPADO</div>' : ""}
            ${item.entregaUsado ? '<div class="equipado">ENTREGA USADO</div>' : ""}
          </td>
          <td class="datos">
            <div class="cliente">${escapeHtml(item.siac?.cliente || "-")}</div>
            <div class="modelo">${escapeHtml([item.siac?.modelo, item.siac?.version].filter(Boolean).join(" ") || "-")}</div>
            <div class="detalle">
              <span>${escapeHtml(identificado)}</span>
              <span>/</span>
              <span>COLOR:</span>
              <span class="badge-color" style="${colorStyle}">${escapeHtml(item.siac?.color || "-")}</span>
            </div>
            ${item.observaciones?.trim() ? `<div class="obs">Obs: ${escapeHtml(item.observaciones.trim())}</div>` : ""}
          </td>
          <td class="vendedor">${escapeHtml(item.siac?.vendedor || "-")}</td>
          <td class="operacion">${escapeHtml(formatOperacion(item))}</td>
        </tr>
      `;
    });
  }).join("");
};

export function openAgendaEntregaPrintView(params: {
  items: AgendaEntrega[];
  fecha: string;
  sucursalId: string;
  sucursales: SucursalEntrega[];
}) {
  const sucursalData = params.sucursales.find((item) => item._id === params.sucursalId) ?? null;
  const sucursal = sucursalData?.nombre ?? "Sucursal no seleccionada";
  const horariosHabilitados = sucursalData?.horariosHabilitados ?? [];
  const title = `Agenda de entrega ${params.fecha} - ${sucursal}`;
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

  printDocument.open();
  printDocument.write(`
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="UTF-8" />
        <title>${escapeHtml(title)}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 7mm;
          }

          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            font-family: Arial, Helvetica, sans-serif;
            color: #111827;
            background: #ffffff;
          }

          .page {
            width: 100%;
          }

          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 8px;
            gap: 8px;
          }

          .header h1 {
            margin: 0;
            font-size: 16px;
          }

          .header p {
            margin: 3px 0 0;
            font-size: 10px;
            color: #4b5563;
          }

          .meta {
            text-align: right;
            font-size: 10px;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
          }

          thead th {
            background: #b7b7b7;
            color: #000;
            font-size: 9px;
            padding: 5px 5px;
            text-transform: uppercase;
            border: 1px solid #9ca3af;
          }

          tbody td {
            border: 1px solid #9ca3af;
            padding: 4px 5px;
            vertical-align: middle;
            font-size: 8px;
          }

          tbody tr.entregada td {
            background: #dcfce7;
          }

          tbody tr.reserva td {
            background: #fef3c7;
          }

          tbody tr.reserva .interno {
            background: #fde68a;
          }

          tbody tr.bloqueado td {
            background: #e5e7eb;
            color: #4b5563;
          }

          tbody tr.bloqueado .interno {
            background: #d1d5db;
          }

          .hora, .interno, .vendedor, .operacion {
            text-align: center;
            font-weight: 700;
          }

          .hora {
            width: 11%;
            font-size: 12px;
          }

          .interno {
            width: 14%;
            font-size: 12px;
            background: #f3f4f6;
          }

          tr.entregada .interno {
            background: #bbf7d0;
          }

          .vendedor {
            width: 18%;
            font-size: 9px;
          }

          .operacion {
            width: 12%;
            font-size: 11px;
          }

          .datos {
            width: 45%;
            vertical-align: top;
          }

          .cliente {
            border-bottom: 1px dotted #9ca3af;
            padding-bottom: 2px;
            font-size: 9px;
            font-weight: 700;
            text-transform: uppercase;
          }

          .modelo {
            margin-top: 2px;
            font-size: 8px;
            font-weight: 700;
            text-transform: uppercase;
            color: #374151;
          }

          .detalle {
            margin-top: 2px;
            display: flex;
            flex-wrap: wrap;
            gap: 3px;
            align-items: center;
            font-size: 8px;
            font-weight: 700;
            text-transform: uppercase;
          }

          .badge-color {
            display: inline-flex;
            align-items: center;
            border-radius: 6px;
            padding: 2px 4px;
            font-size: 8px;
            line-height: 1;
            font-weight: 700;
          }

          .obs {
            margin-top: 3px;
            font-size: 8px;
            color: #4b5563;
          }

          .equipado {
            margin-top: 3px;
            font-size: 8px;
            font-weight: 700;
            letter-spacing: 0.04em;
          }
        </style>
      </head>
      <body>
        <div class="page">
          <div class="header">
            <div>
              <h1>Agenda de entrega</h1>
              <p>Vista diaria lista para impresion</p>
            </div>
            <div class="meta">
              <div><strong>Fecha:</strong> ${escapeHtml(params.fecha || "-")}</div>
              <div><strong>Sucursal:</strong> ${escapeHtml(sucursal)}</div>
              <div><strong>Turnos:</strong> ${params.items.length}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Hora</th>
                <th>Interno</th>
                <th>Datos</th>
                <th>Vendedor</th>
                <th>Operacion</th>
              </tr>
            </thead>
            <tbody>
              ${buildRows(params.items, horariosHabilitados)}
            </tbody>
          </table>
        </div>
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
