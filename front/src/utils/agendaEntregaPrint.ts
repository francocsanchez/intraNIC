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

const escapeSvgText = (value: string) =>
  escapeHtml(value).replace(/\n/g, " ").replace(/\r/g, " ");

const TIME_SLOT_OPTIONS = Array.from({ length: 21 }, (_, index) => {
  const totalMinutes = 8 * 60 + index * 30;
  const hours = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
  const minutes = String(totalMinutes % 60).padStart(2, "0");
  return `${hours}:${minutes}`;
});

type EmptyPrintRow = {
  tipo: "vacio";
  horaAgenda: string;
};

type BlockedPrintRow = {
  tipo: "bloqueado";
  horaAgenda: string;
};

type AgendaPrintRow = AgendaEntrega | EmptyPrintRow | BlockedPrintRow;

const stripCssStyle = (style: string, property: string, fallback: string) => {
  const match = style.match(new RegExp(`${property}:([^;]+);?`, "i"));
  return match?.[1]?.trim() || fallback;
};

const truncateText = (value: string, maxLength: number) => {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`;
};

const buildAgendaSvg = (params: {
  items: AgendaEntrega[];
  fecha: string;
  sucursal: string;
  horariosHabilitados: string[];
}) => {
  const pageWidth = 794;
  const pageHeight = 1123;
  const marginX = 18;
  const tableTop = 66;
  const rowHeight = 33;
  const headerHeight = 22;
  const tableWidth = pageWidth - marginX * 2;
  const colWidths = [72, 92, 126, 468];
  const xPositions = colWidths.reduce<number[]>((acc, _width, index) => {
    const currentX = index === 0 ? marginX : acc[index - 1] + colWidths[index - 1];
    acc.push(currentX);
    return acc;
  }, []);
  const totalTableHeight = headerHeight + TIME_SLOT_OPTIONS.length * rowHeight;
  const borderColor = "#9ca3af";
  const tableHeaderBg = "#b7b7b7";

  const enabledTimeSlots = new Set(params.horariosHabilitados);
  const displayRows: AgendaPrintRow[] = TIME_SLOT_OPTIONS.flatMap((timeSlot): AgendaPrintRow[] => {
    const matchingItems = params.items.filter((item) => item.horaAgenda === timeSlot);
    if (matchingItems.length) {
      return matchingItems;
    }

    if (!enabledTimeSlots.has(timeSlot)) {
      return [{ tipo: "bloqueado", horaAgenda: timeSlot }];
    }

    return [{ tipo: "vacio", horaAgenda: timeSlot }];
  });

  const line = (x1: number, y1: number, x2: number, y2: number) =>
    `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${borderColor}" stroke-width="1" />`;

  const rect = (x: number, y: number, width: number, height: number, fill: string) =>
    `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${fill}" />`;

  const text = (
    x: number,
    y: number,
    value: string,
    options?: {
      size?: number;
      weight?: string;
      anchor?: "start" | "middle" | "end";
      fill?: string;
    },
  ) =>
    `<text x="${x}" y="${y}" font-family="Arial, Helvetica, sans-serif" font-size="${options?.size ?? 8}" font-weight="${options?.weight ?? "400"}" text-anchor="${options?.anchor ?? "start"}" fill="${options?.fill ?? "#111827"}">${escapeSvgText(value)}</text>`;

  const svgParts: string[] = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${pageWidth}" height="${pageHeight}" viewBox="0 0 ${pageWidth} ${pageHeight}">`,
    rect(0, 0, pageWidth, pageHeight, "#ffffff"),
    text(marginX, 30, "Agenda de entrega", { size: 18, weight: "700" }),
    text(marginX, 45, "Vista diaria lista para impresion", { size: 10, fill: "#4b5563" }),
    text(pageWidth - marginX, 24, `Fecha: ${params.fecha || "-"}`, { size: 10, weight: "700", anchor: "end" }),
    text(pageWidth - marginX, 38, `Sucursal: ${params.sucursal}`, { size: 10, weight: "700", anchor: "end" }),
    text(pageWidth - marginX, 52, `Turnos: ${params.items.length}`, { size: 10, weight: "700", anchor: "end" }),
    rect(marginX, tableTop, tableWidth, headerHeight, tableHeaderBg),
  ];

  ["Hora", "Interno", "Vendedor", "Datos"].forEach((label, index) => {
    const x = xPositions[index];
    svgParts.push(text(x + colWidths[index] / 2, tableTop + 14, label.toUpperCase(), { size: 8, weight: "700", anchor: "middle" }));
  });

  displayRows.forEach((row, rowIndex) => {
    const y = tableTop + headerHeight + rowIndex * rowHeight;

    if ("tipo" in row && row.tipo === "vacio") {
      svgParts.push(rect(marginX, y, tableWidth, rowHeight, "#ffffff"));
      svgParts.push(rect(xPositions[1], y, colWidths[1], rowHeight, "#f3f4f6"));
      svgParts.push(rect(xPositions[2], y, colWidths[2], rowHeight, "#f9fafb"));
      svgParts.push(text(xPositions[0] + colWidths[0] / 2, y + 20, row.horaAgenda, { size: 10, weight: "700", anchor: "middle" }));
      return;
    }

    if ("tipo" in row && row.tipo === "bloqueado") {
      svgParts.push(rect(marginX, y, tableWidth, rowHeight, "#e5e7eb"));
      svgParts.push(rect(xPositions[1], y, colWidths[1], rowHeight, "#d1d5db"));
      svgParts.push(rect(xPositions[2], y, colWidths[2], rowHeight, "#d1d5db"));
      svgParts.push(text(xPositions[0] + colWidths[0] / 2, y + 20, row.horaAgenda, { size: 10, weight: "700", anchor: "middle" }));
      svgParts.push(text(xPositions[1] + colWidths[1] / 2, y + 18, "BLOQUEADO", { size: 9, weight: "700", anchor: "middle", fill: "#4b5563" }));
      svgParts.push(text(xPositions[3] + 8, y + 13, "HORARIO BLOQUEADO", { size: 8, weight: "700", fill: "#4b5563" }));
      svgParts.push(text(xPositions[3] + 8, y + 25, "NO DISPONIBLE PARA AGENDAR", { size: 7, weight: "700", fill: "#4b5563" }));
      return;
    }

    const item = row as AgendaEntrega;
    const reserva = item.tipoRegistro === "reserva";
    const entregada = item.siac?.estado === 35 || item.siac?.estado === 40;
    const rowBg = reserva ? "#fef3c7" : entregada ? "#dcfce7" : "#ffffff";
    const internoBg = reserva ? "#fde68a" : entregada ? "#bbf7d0" : "#f3f4f6";
    const cliente = truncateText(item.siac?.cliente || (reserva ? "Reserva" : "-"), 62);
    const modelo = truncateText([item.siac?.modelo, item.siac?.version].filter(Boolean).join(" ") || (reserva ? "" : "-"), 56);
    const identificado = truncateText((item.siac?.chasis ?? item.siac?.serie ?? item.siac?.nroFabricacion ?? "-").trim(), 28);
    const color = truncateText(item.siac?.color || "-", 18);
    const observacion = truncateText(item.observaciones?.trim() || "", 28);
    const vendedor = truncateText(item.siac?.vendedor || "-", 20);
    const colorStyle = getInlineBadgeStyle(item.siac?.color);
    const badgeFill = stripCssStyle(colorStyle, "background", "#f3f4f6");
    const badgeText = stripCssStyle(colorStyle, "color", "#374151");

    svgParts.push(rect(marginX, y, tableWidth, rowHeight, rowBg));
    svgParts.push(rect(xPositions[1], y, colWidths[1], rowHeight, internoBg));
    svgParts.push(rect(xPositions[2], y, colWidths[2], rowHeight, "#ffffff"));
    svgParts.push(text(xPositions[0] + colWidths[0] / 2, y + 20, item.horaAgenda, { size: 10, weight: "700", anchor: "middle" }));
    svgParts.push(text(xPositions[1] + colWidths[1] / 2, y + 13, reserva ? "RESERVA" : String(item.interno), { size: 9, weight: "700", anchor: "middle", fill: "#111827" }));
    svgParts.push(text(xPositions[2] + colWidths[2] / 2, y + 18, reserva ? "-" : vendedor, { size: 8, weight: "700", anchor: "middle", fill: "#374151" }));

    if (reserva) {
      svgParts.push(text(xPositions[3] + 8, y + 12, "RESERVA", { size: 9, weight: "700", fill: "#92400e" }));
      svgParts.push(text(xPositions[3] + 8, y + 25, truncateText(item.observaciones?.trim() || "-", 56), { size: 8, weight: "400", fill: "#92400e" }));
    } else {
      svgParts.push(text(xPositions[3] + 8, y + 9, cliente, { size: 7, weight: "700" }));
      svgParts.push(text(xPositions[3] + 8, y + 20, modelo || "-", { size: 9.5, weight: "700", fill: "#374151" }));
      svgParts.push(text(xPositions[3] + 8, y + 31, `${identificado} / COLOR:`, { size: 9, weight: "700" }));

      const badgeX = xPositions[3] + 144;
      svgParts.push(`<rect x="${badgeX}" y="${y + 19}" width="74" height="14" rx="3" ry="3" fill="${badgeFill}" stroke="#cbd5e1" stroke-width="1" />`);
      svgParts.push(text(badgeX + 37, y + 29.5, color, { size: 8.5, weight: "700", anchor: "middle", fill: badgeText }));

      if (observacion) {
        svgParts.push(text(xPositions[3] + 226, y + 30, `Obs: ${observacion}`, { size: 6.5, fill: "#4b5563" }));
      }
    }

    const flags: string[] = [];
    if (!reserva && item.equipado) flags.push("EQUIPADO");
    if (!reserva && item.entregaUsado) flags.push("ENTREGA USADO");
    flags.forEach((flag, flagIndex) => {
      svgParts.push(text(xPositions[1] + colWidths[1] / 2, y + 24 + flagIndex * 8, flag, { size: 7.5, weight: "700", anchor: "middle", fill: "#374151" }));
    });
  });

  svgParts.push(rect(marginX, tableTop, tableWidth, totalTableHeight, "none"));
  svgParts.push(line(marginX, tableTop, marginX + tableWidth, tableTop));
  svgParts.push(line(marginX, tableTop + totalTableHeight, marginX + tableWidth, tableTop + totalTableHeight));

  xPositions.forEach((x, index) => {
    svgParts.push(line(x, tableTop, x, tableTop + totalTableHeight));
    svgParts.push(line(x + colWidths[index], tableTop, x + colWidths[index], tableTop + totalTableHeight));
  });

  for (let rowIndex = 0; rowIndex <= displayRows.length; rowIndex += 1) {
    const y = tableTop + headerHeight + rowIndex * rowHeight;
    svgParts.push(line(marginX, y, marginX + tableWidth, y));
  }

  svgParts.push("</svg>");

  return svgParts.join("");
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
  const svgMarkup = buildAgendaSvg({
    items: params.items,
    fecha: params.fecha,
    sucursal,
    horariosHabilitados,
  });
  const svgDataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgMarkup)}`;
  printDocument.write(`
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="UTF-8" />
        <title>${escapeHtml(title)}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 0;
          }

          * {
            box-sizing: border-box;
          }

          html, body {
            margin: 0;
            width: 210mm;
            min-height: 297mm;
            background: #ffffff;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .page {
            width: 210mm;
            min-height: 297mm;
          }

          .page img {
            display: block;
            width: 210mm;
            height: 297mm;
          }
        </style>
      </head>
      <body>
        <div class="page">
          <img src="${svgDataUrl}" alt="${escapeHtml(title)}" />
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
