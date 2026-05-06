import json
import os
import sys
from decimal import Decimal, ROUND_HALF_UP

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfgen import canvas


PAGE_WIDTH, PAGE_HEIGHT = A4
LEFT = 16 * mm
RIGHT = PAGE_WIDTH - 16 * mm
TOP = PAGE_HEIGHT - 16 * mm

LOGO_PATH = os.environ.get(
    "PROFORMA_LOGO_PATH",
    os.path.join(os.path.dirname(__file__), "..", "assets", "proformas", "logo-nipponcar-negro.png"),
)
SIGNATURE_PATH = os.environ.get(
    "PROFORMA_SIGNATURE_PATH",
    os.path.join(os.path.dirname(__file__), "..", "assets", "proformas", "firma-nippon.png"),
)

PRIMARY = colors.HexColor("#111827")
ACCENT = colors.HexColor("#111827")
ACCENT_SOFT = colors.HexColor("#f3f4f6")
GRAY_SOFT = colors.HexColor("#f9fafb")
GRAY_LINE = colors.HexColor("#d1d5db")
TEXT_MUTED = colors.HexColor("#4b5563")


def money(value):
    quantized = Decimal(str(value)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    integer, decimals = f"{quantized:.2f}".split(".")
    chunks = []
    while integer:
        chunks.append(integer[-3:])
        integer = integer[:-3]
    return "$ " + ".".join(reversed(chunks)) + "," + decimals


def percent(value):
    quantized = Decimal(str(value)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    integer, decimals = f"{quantized:.2f}".split(".")
    return f"{integer},{decimals}%"


def shrink_text(text, font_name, font_size, max_width):
    if stringWidth(text, font_name, font_size) <= max_width:
        return text

    ellipsis = "..."
    base = text
    while base and stringWidth(base + ellipsis, font_name, font_size) > max_width:
        base = base[:-1]
    return (base + ellipsis) if base else ellipsis


def wrap_text(text, font_name, font_size, max_width):
    words = str(text).split()
    if not words:
        return [""]

    lines = []
    current = words[0]

    for word in words[1:]:
        candidate = f"{current} {word}"
        if stringWidth(candidate, font_name, font_size) <= max_width:
            current = candidate
        else:
            lines.append(current)
            current = word

    lines.append(current)
    return lines


def draw_logo(pdf):
    if not os.path.exists(LOGO_PATH):
        return

    image = ImageReader(LOGO_PATH)
    pdf.drawImage(
        image,
        LEFT,
        TOP - 16 * mm,
        width=86 * mm,
        height=18 * mm,
        preserveAspectRatio=True,
        mask="auto",
    )


def draw_signature(pdf):
    if not os.path.exists(SIGNATURE_PATH):
        return

    image = ImageReader(SIGNATURE_PATH)
    pdf.drawImage(
        image,
        LEFT,
        8 * mm,
        width=34 * mm,
        height=24 * mm,
        preserveAspectRatio=True,
        mask="auto",
    )


def draw_info_box(pdf, x, y, width, height, label, value):
    pdf.setFillColor(colors.white)
    pdf.setStrokeColor(GRAY_LINE)
    pdf.roundRect(x, y - height, width, height, 8, stroke=1, fill=1)
    pdf.setFillColor(ACCENT)
    pdf.setFont("Helvetica-Bold", 6.2)
    pdf.drawString(x + 8, y - 12, label)
    pdf.setFillColor(PRIMARY)
    pdf.setFont("Helvetica", 6.4)
    pdf.drawString(x + 8, y - 24, value or "-")


def draw_static_header(pdf, data):
    draw_logo(pdf)

    pdf.setFillColor(ACCENT)
    pdf.roundRect(LEFT, 708, RIGHT - LEFT, 48, 10, stroke=0, fill=1)

    pdf.setFillColor(colors.white)
    pdf.setFont("Helvetica-Bold", 14)
    pdf.drawString(LEFT + 12, 736, "PRO FORMA")
    pdf.setFont("Helvetica-Bold", 7.2)
    pdf.drawString(LEFT + 12, 722, "DOCUMENTO NO VALIDO COMO FACTURA")

    pdf.setFont("Helvetica-Bold", 7)
    pdf.drawRightString(RIGHT - 88, 735, "N°")
    pdf.drawRightString(RIGHT - 88, 721, "FECHA")
    pdf.setFont("Helvetica", 7)
    pdf.drawRightString(RIGHT - 20, 735, str(data["numeroProforma"]))
    pdf.drawRightString(RIGHT - 20, 721, data["fechaLabel"])

    pdf.setFillColor(PRIMARY)
    pdf.setFont("Helvetica", 5.6)
    pdf.drawString(LEFT, 690, "NIPPON CAR S.R.L. CUIT 30-67277058-7")
    pdf.drawString(LEFT, 681, "PERTICONE 2095 - NEUQUEN")
    pdf.drawString(LEFT, 672, "IIBB 916-592555-5")
    pdf.drawString(LEFT, 663, "INICIO ACTIVIDADES 18/12/1996")

    pdf.setFillColor(ACCENT_SOFT)
    pdf.roundRect(LEFT, 628, RIGHT - LEFT, 26, 8, stroke=0, fill=1)
    pdf.setFillColor(ACCENT)
    pdf.setFont("Helvetica-Bold", 7)
    pdf.drawString(LEFT + 10, 638, "Señores:")
    pdf.setFillColor(PRIMARY)
    pdf.setFont("Helvetica", 7)
    pdf.drawString(LEFT + 58, 638, data["senores"])


def draw_table(pdf, start_y, rows, total_neto):
    col_x = [LEFT, 244, 292, 344, 406, 469, RIGHT]
    row_height = 18

    pdf.setFillColor(ACCENT)
    pdf.roundRect(LEFT, start_y - row_height, RIGHT - LEFT, row_height, 8, stroke=0, fill=1)
    pdf.setFillColor(colors.white)
    pdf.setFont("Helvetica-Bold", 6.2)

    headers = ["DETALLE", "CANTIDAD", "IVA", "NETO", "TOTAL", "TOTALES"]
    header_positions = [LEFT + 54, 268, 318, 376, 438, 514]
    for text, x in zip(headers, header_positions):
        pdf.drawCentredString(x, start_y - 12, text)

    current_top = start_y - row_height
    pdf.setFont("Helvetica", 6.2)

    for index, row in enumerate(rows):
        pdf.setFillColor(colors.white if index % 2 == 0 else GRAY_SOFT)
        pdf.roundRect(LEFT, current_top - row_height, RIGHT - LEFT, row_height, 4, stroke=0, fill=1)

        pdf.setStrokeColor(GRAY_LINE)
        pdf.line(LEFT, current_top - row_height, RIGHT, current_top - row_height)
        for x in col_x[1:-1]:
            pdf.line(x, current_top - 2, x, current_top - row_height + 2)

        detail = shrink_text(row["detalle"], "Helvetica", 6.2, 184)
        pdf.setFillColor(PRIMARY)
        pdf.drawString(LEFT + 6, current_top - 12.5, detail)
        pdf.drawCentredString(268, current_top - 12.5, str(row["cantidad"]))
        pdf.drawCentredString(318, current_top - 12.5, percent(row["iva"]))
        pdf.drawRightString(400, current_top - 12.5, money(row["neto"]))
        pdf.drawRightString(463, current_top - 12.5, money(row["total"]))
        pdf.setFillColor(ACCENT)
        pdf.drawRightString(RIGHT - 6, current_top - 12.5, money(row["totales"]))
        current_top -= row_height

    total_height = 20
    pdf.setFillColor(PRIMARY)
    pdf.roundRect(LEFT, current_top - total_height, RIGHT - LEFT, total_height, 8, stroke=0, fill=1)
    pdf.setFillColor(colors.white)
    pdf.setFont("Helvetica-Bold", 7.2)
    pdf.drawString(LEFT + 8, current_top - 13.5, "TOTAL NETO")
    pdf.drawRightString(RIGHT - 8, current_top - 13.5, money(total_neto))

    return current_top - total_height


def draw_footer(pdf, y, data):
    footer_top = y - 14
    info_y = y - 72
    asesor_y = info_y - 84

    draw_info_box(pdf, LEFT, footer_top, (RIGHT - LEFT - 8) / 2, 28, "CLIENTE", data["cliente"])
    draw_info_box(pdf, LEFT + (RIGHT - LEFT - 8) / 2 + 8, footer_top, (RIGHT - LEFT - 8) / 2, 28, "CUIT", data["cuit"])

    pdf.setFillColor(ACCENT_SOFT)
    pdf.roundRect(LEFT, info_y - 54, RIGHT - LEFT, 60, 8, stroke=0, fill=1)
    pdf.setFillColor(PRIMARY)
    pdf.setFont("Helvetica-Bold", 6.1)
    pdf.drawString(LEFT + 8, info_y - 10, "LUGAR DE ENTREGA: PERTICONE Y ALUMINE, NEUQUEN CAPITAL.")
    pdf.drawString(LEFT + 8, info_y - 22, "LOS VALORES SERAN ACTUALIZADOS A LA FECHA DE LLEGADA DE LA UNIDAD.")
    pdf.drawString(LEFT + 8, info_y - 34, "FACTURA LOS BIENES: NIPPON CAR S.R.L.")
    pdf.drawString(LEFT + 8, info_y - 46, f"VALORES EXPRESADOS SOBRE LA LISTA DE {data['listaPrecioLabel']}.")

    draw_info_box(pdf, LEFT, asesor_y, (RIGHT - LEFT - 8) / 2, 28, "ASESOR COMERCIAL", data["asesorComercial"])
    draw_info_box(pdf, LEFT + (RIGHT - LEFT - 8) / 2 + 8, asesor_y, (RIGHT - LEFT - 8) / 2, 28, "EMAIL", data["emailAsesor"])

    observaciones = (data.get("observaciones") or "").strip()
    if observaciones:
        observaciones_y = asesor_y - 42
        pdf.setFillColor(colors.white)
        pdf.setStrokeColor(GRAY_LINE)
        pdf.roundRect(LEFT, observaciones_y - 44, RIGHT - LEFT, 44, 8, stroke=1, fill=1)
        pdf.setFillColor(ACCENT)
        pdf.setFont("Helvetica-Bold", 6.2)
        pdf.drawString(LEFT + 8, observaciones_y - 12, "OBSERVACIONES")
        pdf.setFillColor(PRIMARY)
        pdf.setFont("Helvetica", 6.0)
        obs_lines = wrap_text(observaciones, "Helvetica", 6.0, RIGHT - LEFT - 16)
        obs_y = observaciones_y - 24
        for line in obs_lines[:2]:
            pdf.drawString(LEFT + 8, obs_y, line)
            obs_y -= 10
        reminder_top = observaciones_y - 58
    else:
        reminder_top = asesor_y - 14

    reminder = (
        "RECUERDE QUE: LA ORDEN DE COMPRA SE DEBE GENERAR A NOMBRE DE NIPPON CAR S.R.L., "
        "QUE NO SE PRESENTARA LA DOCUMENTACION PARA LA INSCRIPCION DE LA UNIDAD HASTA TANTO "
        "NO SEA CANCELADA EN SU TOTALIDAD Y QUE EL PRECIO SERA EL VIGENTE AL MOMENTO DE LA "
        "FACTURACION DE LA UNIDAD. LA RECEPCION DE LA ORDEN DE COMPRA NO IMPLICA OBLIGACION "
        "POR PARTE DEL CONCESIONARIO DE ASIGNAR Y FACTURAR LAS UNIDADES."
    )
    pdf.setFillColor(GRAY_SOFT)
    pdf.roundRect(LEFT, reminder_top - 90, RIGHT - LEFT, 78, 8, stroke=0, fill=1)
    pdf.setFillColor(TEXT_MUTED)
    pdf.setFont("Helvetica-Bold", 5.8)
    lines = wrap_text(reminder, "Helvetica-Bold", 5.8, RIGHT - LEFT - 16)
    reminder_y = reminder_top - 24
    for line in lines[:5]:
        pdf.drawString(LEFT + 8, reminder_y, line)
        reminder_y -= 9


def build_rows(data):
    rows = []
    for unidad in data["unidades"]:
        rows.extend(unidad["rows"])
    return rows


def main():
    input_path, output_path = sys.argv[1], sys.argv[2]
    with open(input_path, "r", encoding="utf8") as source:
        data = json.load(source)

    pdf = canvas.Canvas(output_path, pagesize=A4)
    rows = build_rows(data)

    draw_static_header(pdf, data)
    table_bottom = draw_table(pdf, 608, rows, data["totalNeto"])
    draw_footer(pdf, table_bottom, data)
    draw_signature(pdf)

    pdf.showPage()
    pdf.save()


if __name__ == "__main__":
    main()
