import json
import os
import sys
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.lib.utils import ImageReader
from reportlab.platypus import KeepTogether, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


PAGE_WIDTH, PAGE_HEIGHT = A4
LEFT_MARGIN = 16 * mm
RIGHT_MARGIN = 16 * mm
TOP_MARGIN = 76 * mm
BOTTOM_MARGIN = 15 * mm

LOGO_PATH = os.environ.get(
    "PROFORMA_LOGO_PATH",
    os.path.join(os.path.dirname(__file__), "..", "assets", "proformas", "logo-nipponcar-negro.png"),
)

PRIMARY = colors.HexColor("#111827")
GRAY_SOFT = colors.HexColor("#F3F4F6")
TEXT_MUTED = colors.HexColor("#6B7280")


def build_styles():
    styles = getSampleStyleSheet()
    styles.add(
        ParagraphStyle(
            name="MinutaSection",
            parent=styles["Heading3"],
            fontName="Helvetica-Bold",
            fontSize=9,
            leading=11,
            textColor=colors.black,
            spaceAfter=4,
            spaceBefore=4,
        )
    )
    styles.add(
        ParagraphStyle(
            name="MinutaBody",
            parent=styles["BodyText"],
            fontName="Helvetica",
            fontSize=8.5,
            leading=11,
            textColor=colors.black,
        )
    )
    styles.add(
        ParagraphStyle(
            name="MinutaSmall",
            parent=styles["BodyText"],
            fontName="Helvetica",
            fontSize=8,
            leading=10,
            textColor=colors.HexColor("#444444"),
        )
    )
    return styles


def paragraph(text, style):
    return Paragraph(str(text or "").replace("\n", "<br/>"), style)


def draw_logo(pdf):
    if not os.path.exists(LOGO_PATH):
        return

    image = ImageReader(LOGO_PATH)
    pdf.drawImage(
        image,
        LEFT_MARGIN,
        PAGE_HEIGHT - 34 * mm,
        width=86 * mm,
        height=18 * mm,
        preserveAspectRatio=True,
        mask="auto",
    )


def build_tema_table(data, styles):
    table = Table(
        [[paragraph("Tema", styles["MinutaSection"]), paragraph(data["tema"], styles["MinutaBody"])]],
        colWidths=[24 * mm, 151 * mm],
        hAlign="LEFT",
    )
    table.setStyle(
        TableStyle(
            [
                ("BOX", (0, 0), (-1, -1), 0.75, colors.black),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.black),
                ("BACKGROUND", (0, 0), (0, 0), GRAY_SOFT),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("PADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    return table


def build_moderador_table(data, styles):
    moderador = f'{data["moderador"]["lastName"]}, {data["moderador"]["name"]}'
    rows = [
        [
            paragraph("MODERADOR", styles["MinutaSection"]),
            paragraph(moderador, styles["MinutaBody"]),
            paragraph("Firma", styles["MinutaSection"]),
        ],
        [
            paragraph(" ", styles["MinutaBody"]),
            paragraph(" ", styles["MinutaBody"]),
            paragraph("______________________________", styles["MinutaSmall"]),
        ],
    ]

    table = Table(rows, colWidths=[28 * mm, 110 * mm, 37 * mm], hAlign="LEFT")
    table.setStyle(
        TableStyle(
            [
                ("BOX", (0, 0), (-1, -1), 0.75, colors.black),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.black),
                ("BACKGROUND", (0, 0), (0, 0), GRAY_SOFT),
                ("BACKGROUND", (2, 0), (2, 0), GRAY_SOFT),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("PADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    return table


def build_participantes_table(data, styles):
    rows = [[
        paragraph("N°", styles["MinutaSection"]),
        paragraph("Nombre y apellido", styles["MinutaSection"]),
        paragraph("Firma", styles["MinutaSection"]),
    ]]

    for index, participant in enumerate(data["participantes"], start=1):
        full_name = f'{participant["lastName"]}, {participant["name"]}'
        rows.append(
            [
                paragraph(index, styles["MinutaBody"]),
                paragraph(full_name, styles["MinutaBody"]),
                paragraph(" ", styles["MinutaBody"]),
            ]
        )

    table = Table(rows, colWidths=[16 * mm, 105 * mm, 54 * mm], repeatRows=1, hAlign="LEFT")
    table.setStyle(
        TableStyle(
            [
                ("BOX", (0, 0), (-1, -1), 0.75, colors.black),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.black),
                ("BACKGROUND", (0, 0), (-1, 0), GRAY_SOFT),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("PADDING", (0, 0), (-1, -1), 5),
                ("MINROWHEIGHT", (1, 1), (-1, -1), 14 * mm),
            ]
        )
    )
    return table


def build_temario_table(data, styles):
    rows = [[
        paragraph("Orden", styles["MinutaSection"]),
        paragraph("Descripción", styles["MinutaSection"]),
    ]]

    for topic in data["temario"]:
        rows.append(
            [
                paragraph(topic["orden"], styles["MinutaBody"]),
                paragraph(topic["nombre"], styles["MinutaBody"]),
            ]
        )

    table = Table(rows, colWidths=[22 * mm, 153 * mm], repeatRows=1, hAlign="LEFT")
    table.setStyle(
        TableStyle(
            [
                ("BOX", (0, 0), (-1, -1), 0.75, colors.black),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.black),
                ("BACKGROUND", (0, 0), (-1, 0), GRAY_SOFT),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("PADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )
    return table


def build_desarrollo_table(topic, styles):
    rows = [
        [
            paragraph("Orden", styles["MinutaSection"]),
            paragraph("Desarrollo del tema", styles["MinutaSection"]),
        ],
        [
            paragraph(topic["orden"], styles["MinutaBody"]),
            paragraph(topic["desarrollo"], styles["MinutaBody"]),
        ],
    ]

    table = Table(rows, colWidths=[22 * mm, 153 * mm], repeatRows=1, hAlign="LEFT")
    table.setStyle(
        TableStyle(
            [
                ("BOX", (0, 0), (-1, -1), 0.75, colors.black),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.black),
                ("BACKGROUND", (0, 0), (-1, 0), GRAY_SOFT),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("PADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )
    return table


def draw_page(pdf, doc):
    pdf.saveState()
    draw_logo(pdf)

    banner_y = PAGE_HEIGHT - 60 * mm
    banner_h = 26 * mm
    banner_w = PAGE_WIDTH - LEFT_MARGIN - RIGHT_MARGIN

    pdf.setFillColor(PRIMARY)
    pdf.roundRect(LEFT_MARGIN, banner_y, banner_w, banner_h, 10, stroke=0, fill=1)

    pdf.setFillColor(colors.white)
    pdf.setFont("Helvetica-Bold", 16)
    pdf.drawString(LEFT_MARGIN + 12, banner_y + 16, "MINUTA INTERNA")

    pdf.setFont("Helvetica-Bold", 8)
    pdf.drawRightString(PAGE_WIDTH - RIGHT_MARGIN - 72, banner_y + 16, "FECHA")
    pdf.setFont("Helvetica", 8)
    pdf.drawRightString(PAGE_WIDTH - RIGHT_MARGIN - 8, banner_y + 16, doc.minuta_fecha_label)

    pdf.setFillColor(TEXT_MUTED)
    pdf.setFont("Helvetica", 8)
    pdf.drawRightString(PAGE_WIDTH - RIGHT_MARGIN, 9 * mm, f"Página {pdf.getPageNumber()}")
    pdf.restoreState()


def build_story(data):
    styles = build_styles()
    story = [
        Spacer(1, 2 * mm),
        build_tema_table(data, styles),
        Spacer(1, 5 * mm),
        build_moderador_table(data, styles),
        Spacer(1, 6 * mm),
        paragraph("PARTICIPANTES", styles["MinutaSection"]),
        build_participantes_table(data, styles),
        Spacer(1, 6 * mm),
        paragraph("TEMARIO", styles["MinutaSection"]),
        build_temario_table(data, styles),
        Spacer(1, 6 * mm),
        paragraph("DESARROLLO", styles["MinutaSection"]),
    ]

    for index, topic in enumerate(data["temario"]):
        block = KeepTogether(
            [
                paragraph(f'{topic["orden"]}. {topic["nombre"]}', styles["MinutaBody"]),
                Spacer(1, 2 * mm),
                build_desarrollo_table(topic, styles),
            ]
        )
        story.append(block)
        if index < len(data["temario"]) - 1:
            story.append(Spacer(1, 5 * mm))

    return story


def main():
    if len(sys.argv) != 3:
        raise SystemExit("Uso: generate_minuta_pdf.py <input.json> <output.pdf>")

    input_path = Path(sys.argv[1])
    output_path = Path(sys.argv[2])
    payload = json.loads(input_path.read_text(encoding="utf-8"))

    output_path.parent.mkdir(parents=True, exist_ok=True)
    doc = SimpleDocTemplate(
        str(output_path),
        pagesize=A4,
        leftMargin=LEFT_MARGIN,
        rightMargin=RIGHT_MARGIN,
        topMargin=TOP_MARGIN,
        bottomMargin=BOTTOM_MARGIN,
    )
    doc.minuta_fecha_label = payload["fechaLabel"]
    doc.build(build_story(payload), onFirstPage=draw_page, onLaterPages=draw_page)


if __name__ == "__main__":
    main()
