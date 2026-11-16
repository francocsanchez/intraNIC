import json
import sys
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfgen import canvas

PAGE_W, PAGE_H = A4
MARGIN = 12 * mm
NAVY = colors.HexColor("#13243A")
TEAL = colors.HexColor("#087E8B")
TEAL_SOFT = colors.HexColor("#E7F5F6")
SLATE = colors.HexColor("#64748B")
LINE = colors.HexColor("#DCE5EC")
PANEL = colors.HexColor("#F6F8FA")
GREEN = colors.HexColor("#16803C")
AMBER = colors.HexColor("#D97706")
RED = colors.HexColor("#C2413A")

STATE_LABELS = {
    "PENDIENTE_TECNICA": "Pendiente de técnica", "ESPERANDO_MANTENIMIENTO": "Esperando mantenimiento",
    "PENDIENTE_PREADJUDICADO": "Pendiente de pre-adjudicación", "PENDIENTE_PAGARE": "Pendiente de pagaré",
    "PENDIENTE_OC": "Pendiente de OC", "ADJUDICADA": "Adjudicada", "PERDIDA": "Perdida",
}

def clipped(value, font, size, width):
    value = str(value or "-")
    if stringWidth(value, font, size) <= width: return value
    while value and stringWidth(value + "...", font, size) > width: value = value[:-1]
    return value + "..."

def decision(value): return "Pendiente" if value is None else ("Sí" if value else "No")

def conversion_label(unit):
    tipo = str(unit.get("conversionTipo") or "").strip()
    proveedor = str(unit.get("conversionProveedor") or "").strip()
    return " - ".join(part for part in (tipo, proveedor) if part) or "-"

def conversion_state_label(value):
    return {"PENDIENTE": "Pendiente", "EN_PROVEEDOR": "En Proveedor", "CONVERTIDA": "Convertida"}.get(value, "-")

def state_color(state):
    if state == "ADJUDICADA": return GREEN
    if state == "PERDIDA": return RED
    if state in ("ESPERANDO_MANTENIMIENTO", "PENDIENTE_PREADJUDICADO"): return AMBER
    return TEAL

def card(pdf, x, y, w, label, value):
    pdf.setFillColor(colors.white); pdf.setStrokeColor(LINE); pdf.setLineWidth(.45); pdf.roundRect(x, y - 24, w, 24, 5, fill=1, stroke=1)
    pdf.setFillColor(SLATE); pdf.setFont("Helvetica-Bold", 5.2); pdf.drawString(x + 6, y - 8, label.upper())
    pdf.setFillColor(NAVY); pdf.setFont("Helvetica-Bold", 7); pdf.drawString(x + 6, y - 18, clipped(value, "Helvetica-Bold", 7, w - 12))

def main(data):
    pdf = canvas.Canvas(sys.argv[2], pagesize=A4); pdf.setTitle("Resumen de licitación")
    units = data.get("unidades", []); assigned = sum(1 for unit in units if unit.get("estado") in ("ASIGNADA", "ENTREGADA")); pending = len(units) - assigned
    # Header de bajo consumo de tinta
    pdf.setStrokeColor(NAVY); pdf.setLineWidth(1); pdf.line(MARGIN, PAGE_H - MARGIN - 47, PAGE_W - MARGIN, PAGE_H - MARGIN - 47)
    pdf.setFillColor(NAVY); pdf.setFont("Helvetica-Bold", 18); pdf.drawString(MARGIN, PAGE_H - MARGIN - 25, clipped(data.get("entidad"), "Helvetica-Bold", 18, PAGE_W - 2 * MARGIN - 62))
    state = data.get("estado", ""); bubble_color = state_color(state); cx, cy = PAGE_W - MARGIN - 62, PAGE_H - MARGIN - 26
    pdf.setFillColor(colors.white); pdf.setStrokeColor(bubble_color); pdf.setLineWidth(1.5); pdf.roundRect(cx - 58, cy - 12, 116, 24, 5, fill=1, stroke=1); pdf.setFillColor(NAVY); pdf.setFont("Helvetica-Bold", 6.7)
    label = STATE_LABELS.get(state, state); pdf.drawCentredString(cx, cy - 2, clipped(label, "Helvetica-Bold", 6.7, 106))
    # Resumen operativo y conteo de unidades
    top = PAGE_H - MARGIN - 62; content_w = PAGE_W - 2 * MARGIN; facts_w = content_w * .58; card_w = (facts_w - 8) / 3
    card(pdf, MARGIN, top, card_w, "Apertura", data.get("fechaApertura")); card(pdf, MARGIN + card_w + 4, top, card_w, "Mantenimiento", f"{data.get('diasMantenimientoOferta', 0)} días"); card(pdf, MARGIN + 2 * (card_w + 4), top, card_w, "Días restantes", data.get("diasRestantes"))
    table_x = MARGIN + facts_w + 12; table_w = content_w - facts_w - 12; table_y = top
    pdf.setFillColor(colors.white); pdf.setStrokeColor(LINE); pdf.setLineWidth(.5); pdf.roundRect(table_x, table_y - 24, table_w, 24, 5, fill=1, stroke=1)
    count_cols = [("TOTAL", len(units)), ("ASIGNADAS", assigned), ("PENDIENTES", pending)]; count_w = table_w / 3
    for index, (label, value) in enumerate(count_cols):
        x = table_x + index * count_w
        if index: pdf.line(x, table_y - 22, x, table_y - 2)
        pdf.setFillColor(SLATE); pdf.setFont("Helvetica-Bold", 5.3); pdf.drawCentredString(x + count_w / 2, table_y - 8, label)
        pdf.setFillColor(NAVY); pdf.setFont("Helvetica-Bold", 11); pdf.drawCentredString(x + count_w / 2, table_y - 19, str(value))
    # Table
    table_top = top - 35
    row_h = max(5.8, min(12, (table_top - 24 * mm) / max(len(units) + 1, 1))); font_size = 6.2 if len(units) > 40 else 6.4 if len(units) > 25 else 7
    columns = [("#", .03), ("INTERNO", .075), ("VERSIÓN", .245), ("CONVERSIÓN", .17), ("EST. CONV.", .11), ("PAT.", .065), ("FLETE", .065), ("SERV.", .055), ("ACC", .045), ("ESTADO", .14)]
    widths = [content_w * ratio for _, ratio in columns]; x_positions = [MARGIN]
    for width in widths[:-1]: x_positions.append(x_positions[-1] + width)
    header_y = table_top - 8; pdf.setFillColor(colors.white); pdf.setStrokeColor(NAVY); pdf.setLineWidth(.8); pdf.roundRect(MARGIN, header_y - row_h, content_w, row_h, 3, fill=1, stroke=1)
    pdf.setFillColor(NAVY); pdf.setFont("Helvetica-Bold", max(font_size - .6, 4.2))
    for (label, _), x, width in zip(columns, x_positions, widths): pdf.drawString(x + 3, header_y - row_h + 2.2, label)
    y = header_y - row_h
    for index, unit in enumerate(units):
        y -= row_h
        pdf.setFillColor(colors.white); pdf.rect(MARGIN, y, content_w, row_h, fill=1, stroke=0)
        pdf.setStrokeColor(LINE); pdf.setLineWidth(.25); pdf.line(MARGIN, y, MARGIN + content_w, y)
        estado_unidad = "Entregada" if unit.get("estado") == "ENTREGADA" else "Asignada" if unit.get("estado") == "ASIGNADA" else "Pendiente"
        values = [index + 1, unit.get("interno") or "-", unit.get("versionNombre") or "-", conversion_label(unit), conversion_state_label(unit.get("estadoConversion")), "Sí" if unit.get("patentamiento") else "No", "Sí" if unit.get("flete") else "No", unit.get("cantidadServicios", 0), "Sí" if unit.get("acc") else "No", estado_unidad]
        for value, x, width, (_, _) in zip(values, x_positions, widths, columns):
            pdf.setFillColor(NAVY); pdf.setFont("Helvetica-Bold" if value in ("Asignada", "Entregada", "Pendiente") else "Helvetica", font_size); pdf.drawString(x + 3, y + max(1.5, row_h / 2 - font_size / 3), clipped(value, "Helvetica-Bold" if value in ("Asignada", "Entregada", "Pendiente") else "Helvetica", font_size, width - 6))
    pdf.setFillColor(SLATE); pdf.setFont("Helvetica", 5); pdf.drawRightString(PAGE_W - MARGIN, 10 * mm, "Resumen generado desde IntraNIC")
    pdf.save()

if __name__ == "__main__":
    with open(sys.argv[1], "r", encoding="utf-8") as source: main(json.load(source))
