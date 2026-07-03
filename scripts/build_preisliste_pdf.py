from pathlib import Path

from PIL import Image as PILImage
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    HRFlowable,
    Image,
    KeepTogether,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

from build_preisliste_docx import CONTENT, IMAGES, OUTPUT_DIR, PRICES


PDF_PATH = OUTPUT_DIR / "Blitzkneisser_Preisliste_2026_27.pdf"

ACCENT = colors.HexColor("#AA8759")
INK = colors.HexColor("#1D1D1D")
MUTED = colors.HexColor("#6F6A66")
LINE = colors.HexColor("#D9D1C7")
SOFT = colors.HexColor("#F6F1EB")
BORDER = colors.HexColor("#E6DED4")

PAGE_WIDTH, PAGE_HEIGHT = letter
LEFT = RIGHT = 0.72 * inch
TOP = 0.65 * inch
BOTTOM = 0.68 * inch
CONTENT_WIDTH = PAGE_WIDTH - LEFT - RIGHT


def styles():
    sample = getSampleStyleSheet()
    return {
        "eyebrow": ParagraphStyle(
            "eyebrow",
            parent=sample["Normal"],
            fontName="Helvetica-Bold",
            fontSize=9,
            leading=11,
            textColor=ACCENT,
            alignment=TA_LEFT,
            spaceAfter=8,
        ),
        "display": ParagraphStyle(
            "display",
            parent=sample["Normal"],
            fontName="Helvetica-Bold",
            fontSize=34,
            leading=31,
            textColor=INK,
            alignment=TA_LEFT,
            spaceAfter=0,
        ),
        "display_small": ParagraphStyle(
            "display_small",
            parent=sample["Normal"],
            fontName="Helvetica-Bold",
            fontSize=28,
            leading=26,
            textColor=INK,
            alignment=TA_LEFT,
            spaceAfter=0,
        ),
        "subtitle": ParagraphStyle(
            "subtitle",
            parent=sample["Normal"],
            fontName="Helvetica",
            fontSize=12,
            leading=18,
            textColor=MUTED,
            alignment=TA_LEFT,
            spaceAfter=12,
        ),
        "body": ParagraphStyle(
            "body",
            parent=sample["BodyText"],
            fontName="Helvetica",
            fontSize=11.2,
            leading=18,
            textColor=INK,
            spaceAfter=10,
        ),
        "body_small": ParagraphStyle(
            "body_small",
            parent=sample["BodyText"],
            fontName="Helvetica",
            fontSize=10.3,
            leading=16,
            textColor=INK,
            spaceAfter=6,
        ),
        "muted": ParagraphStyle(
            "muted",
            parent=sample["BodyText"],
            fontName="Helvetica-Oblique",
            fontSize=10.5,
            leading=15,
            textColor=MUTED,
            spaceAfter=8,
        ),
        "meta_label": ParagraphStyle(
            "meta_label",
            parent=sample["Normal"],
            fontName="Helvetica",
            fontSize=8.5,
            leading=11,
            textColor=MUTED,
            spaceAfter=2,
        ),
        "meta_value": ParagraphStyle(
            "meta_value",
            parent=sample["Normal"],
            fontName="Helvetica-Bold",
            fontSize=10.5,
            leading=13,
            textColor=INK,
            spaceAfter=8,
        ),
        "h1": ParagraphStyle(
            "h1",
            parent=sample["Heading1"],
            fontName="Helvetica-Bold",
            fontSize=22,
            leading=23,
            textColor=INK,
            spaceAfter=8,
            spaceBefore=2,
        ),
        "h2": ParagraphStyle(
            "h2",
            parent=sample["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=12.5,
            leading=15,
            textColor=INK,
            spaceAfter=4,
        ),
        "price": ParagraphStyle(
            "price",
            parent=sample["Normal"],
            fontName="Helvetica-Bold",
            fontSize=16,
            leading=18,
            textColor=ACCENT,
            alignment=TA_CENTER,
        ),
        "price_small": ParagraphStyle(
            "price_small",
            parent=sample["Normal"],
            fontName="Helvetica-Bold",
            fontSize=14,
            leading=16,
            textColor=ACCENT,
            alignment=TA_CENTER,
        ),
        "step_no": ParagraphStyle(
            "step_no",
            parent=sample["Normal"],
            fontName="Helvetica-Bold",
            fontSize=10,
            leading=12,
            textColor=ACCENT,
            spaceAfter=0,
        ),
        "contact": ParagraphStyle(
            "contact",
            parent=sample["BodyText"],
            fontName="Helvetica",
            fontSize=11,
            leading=16,
            textColor=INK,
            spaceAfter=5,
        ),
    }


def fit_image(path, width, max_height=None):
    with PILImage.open(path) as img:
        img_w, img_h = img.size
    ratio = img_h / img_w
    height = width * ratio
    if max_height and height > max_height:
        width = max_height / ratio
        height = max_height
    image = Image(str(path), width=width, height=height)
    image.hAlign = "CENTER"
    return image


def tracked(text):
    parts = []
    for word in text.split(" "):
        parts.append(" ".join(list(word)))
    return "   ".join(parts)


def package_table(st, title, price, items):
    bullets = "<br/>".join([f"• {item}" for item in items])
    left = [
        Paragraph(title, st["h2"]),
        Paragraph(bullets, st["body_small"]),
    ]
    right = [
        Paragraph("ab", st["muted"]),
        Paragraph(price, st["price"]),
    ]
    table = Table([[left, right]], colWidths=[4.75 * inch, 1.55 * inch])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (1, 0), (1, 0), SOFT),
                ("BOX", (0, 0), (-1, -1), 0.75, LINE),
                ("INNERGRID", (0, 0), (-1, -1), 0.75, LINE),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 12),
                ("RIGHTPADDING", (0, 0), (-1, -1), 12),
                ("TOPPADDING", (0, 0), (-1, -1), 12),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
            ]
        )
    )
    return table


def simple_offer_table(st, offers):
    rows = []
    for title, price, copy in offers:
        rows.append(
            [
                [Paragraph(title, st["h2"]), Paragraph(copy, st["body_small"])],
                Paragraph(price, st["price_small"]),
            ]
        )
    table = Table(rows, colWidths=[4.75 * inch, 1.55 * inch])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (1, 0), (1, -1), SOFT),
                ("BOX", (0, 0), (-1, -1), 0.75, LINE),
                ("INNERGRID", (0, 0), (-1, -1), 0.75, LINE),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 12),
                ("RIGHTPADDING", (0, 0), (-1, -1), 12),
                ("TOPPADDING", (0, 0), (-1, -1), 11),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 11),
            ]
        )
    )
    return table


def process_table(st):
    rows = []
    for step_no, title, copy in CONTENT["process"]:
        rows.append(
            [
                Paragraph(step_no, st["step_no"]),
                [Paragraph(title.upper(), st["h2"]), Paragraph(copy, st["body_small"])],
            ]
        )
    table = Table(rows, colWidths=[0.55 * inch, 5.75 * inch])
    table.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LINEBELOW", (0, 0), (-1, -2), 0.5, LINE),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ]
        )
    )
    return table


def footer(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(BORDER)
    canvas.setLineWidth(0.6)
    canvas.line(LEFT, BOTTOM - 0.13 * inch, PAGE_WIDTH - RIGHT, BOTTOM - 0.13 * inch)
    canvas.setFillColor(MUTED)
    canvas.setFont("Helvetica", 8)
    canvas.drawString(LEFT, BOTTOM - 0.28 * inch, "Blitzkneisser Fotografie · foto@blitzkneisser.com · hochzeitsfotograf.tirol")
    canvas.drawRightString(PAGE_WIDTH - RIGHT, BOTTOM - 0.28 * inch, f"Seite {doc.page}")
    canvas.restoreState()


def page_background(canvas, doc):
    canvas.saveState()
    if doc.page in {2, 4}:
        canvas.setFillColor(SOFT)
        canvas.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, fill=1, stroke=0)
    else:
        canvas.setFillColor(colors.white)
        canvas.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, fill=1, stroke=0)
    canvas.restoreState()
    footer(canvas, doc)


def build_story():
    st = styles()
    flow = []

    flow.append(Paragraph(tracked(CONTENT["eyebrow"]), st["eyebrow"]))
    for line in CONTENT["title"].split("\n"):
        flow.append(Paragraph(line, st["display"]))
    flow.append(Spacer(1, 0.14 * inch))
    for line in CONTENT["subtitle"].split("\n"):
        flow.append(Paragraph(line, st["subtitle"]))
    flow.append(Paragraph(CONTENT["intro"], st["body"]))
    flow.append(Spacer(1, 0.08 * inch))
    flow.append(fit_image(IMAGES["cover"], CONTENT_WIDTH, max_height=4.95 * inch))

    flow.append(PageBreak())
    left_meta = [
        Paragraph(tracked("ÜBER MICH"), st["eyebrow"]),
        Paragraph("ZEITLOSE<br/>ERINNERUNGEN", st["display_small"]),
        Spacer(1, 0.25 * inch),
        Paragraph(tracked("STUDIO"), st["meta_label"]),
        Paragraph("Blitzkneisser Fotografie", st["meta_value"]),
        Paragraph(tracked("NAME"), st["meta_label"]),
        Paragraph("Andreas Kiss", st["meta_value"]),
        Paragraph(tracked("STANDORT"), st["meta_label"]),
        Paragraph("Innsbruck, Tirol", st["meta_value"]),
        Paragraph(tracked("E-MAIL"), st["meta_label"]),
        Paragraph("foto@blitzkneisser.com", st["meta_value"]),
    ]
    right_copy = [Paragraph(CONTENT["story_copy"][0], st["body"]), Paragraph(CONTENT["story_copy"][1], st["body"]), Paragraph(CONTENT["story_copy"][2], st["body"])]
    about_table = Table([[left_meta, right_copy]], colWidths=[2.1 * inch, 4.25 * inch])
    about_table.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
            ]
        )
    )
    flow.append(about_table)
    flow.append(Spacer(1, 0.15 * inch))
    flow.append(HRFlowable(width="100%", color=BORDER, thickness=0.8, spaceBefore=2, spaceAfter=12))
    flow.append(Paragraph(CONTENT["included_title"], st["h1"]))
    bullets = "<br/>".join([f"• {item}" for item in CONTENT["included"]])
    flow.append(Paragraph(bullets, st["body"]))
    flow.append(PageBreak())
    flow.append(Paragraph(tracked("REPORTAGEN"), st["eyebrow"]))
    flow.append(Paragraph(CONTENT["collections_title"], st["h1"]))
    flow.append(Paragraph(CONTENT["collections_intro"], st["body"]))
    flow.append(package_table(st, PRICES["package_1"]["title"], PRICES["package_1"]["price"], PRICES["package_1"]["items"]))
    flow.append(Spacer(1, 0.14 * inch))
    flow.append(package_table(st, PRICES["package_2"]["title"], PRICES["package_2"]["price"], PRICES["package_2"]["items"]))
    flow.append(Spacer(1, 0.08 * inch))
    flow.append(Paragraph(CONTENT["collections_note"], st["muted"]))
    flow.append(fit_image(IMAGES["collections"], CONTENT_WIDTH, max_height=3.4 * inch))

    flow.append(PageBreak())
    flow.append(Paragraph(tracked("FORMATE"), st["eyebrow"]))
    flow.append(Paragraph(CONTENT["formats_title"], st["h1"]))
    flow.append(Paragraph(CONTENT["formats_intro"], st["body"]))
    flow.append(
        simple_offer_table(
            st,
            [
                (PRICES["elopement"]["title"], PRICES["elopement"]["price"], PRICES["elopement"]["copy"]),
                (PRICES["civil"]["title"], PRICES["civil"]["price"], PRICES["civil"]["copy"]),
                (PRICES["after"]["title"], PRICES["after"]["price"], PRICES["after"]["copy"]),
                (PRICES["film"]["title"], PRICES["film"]["price"], PRICES["film"]["copy"]),
            ],
        )
    )
    flow.append(Spacer(1, 0.12 * inch))
    flow.append(fit_image(IMAGES["formats"], CONTENT_WIDTH, max_height=3.55 * inch))

    flow.append(PageBreak())
    flow.append(Paragraph(tracked("ZUSATZOPTIONEN"), st["eyebrow"]))
    flow.append(Paragraph(CONTENT["extras_title"], st["h1"]))
    flow.append(Paragraph(CONTENT["extras_intro"], st["body"]))
    flow.append(
        simple_offer_table(
            st,
            [
                (PRICES["extra_hour"]["title"], PRICES["extra_hour"]["price"], PRICES["extra_hour"]["copy"]),
                (PRICES["photobox"]["title"], PRICES["photobox"]["price"], PRICES["photobox"]["copy"]),
            ],
        )
    )
    flow.append(Spacer(1, 0.12 * inch))
    flow.append(fit_image(IMAGES["details"], CONTENT_WIDTH, max_height=4.45 * inch))

    flow.append(PageBreak())
    flow.append(Paragraph(tracked("ABLAUF"), st["eyebrow"]))
    flow.append(Paragraph(CONTENT["process_title"], st["h1"]))
    flow.append(process_table(st))
    flow.append(Spacer(1, 0.06 * inch))
    flow.append(HRFlowable(width="100%", color=BORDER, thickness=0.8, spaceBefore=4, spaceAfter=10))
    flow.append(Paragraph(CONTENT["closing_title"], st["h1"]))
    flow.append(Paragraph(CONTENT["closing_copy"], st["body"]))
    contacts = "<br/>".join(
        [f"<b>{CONTENT['contact_lines'][0]}</b>"] + CONTENT["contact_lines"][1:]
    )
    flow.append(Paragraph(contacts, st["contact"]))
    flow.append(Spacer(1, 0.05 * inch))
    flow.append(fit_image(IMAGES["closing"], CONTENT_WIDTH, max_height=2.15 * inch))

    return flow


def main():
    doc = SimpleDocTemplate(
        str(PDF_PATH),
        pagesize=letter,
        leftMargin=LEFT,
        rightMargin=RIGHT,
        topMargin=TOP,
        bottomMargin=BOTTOM,
        title="Blitzkneisser Preisliste 2026/27",
        author="Blitzkneisser Fotografie",
    )
    doc.build(build_story(), onFirstPage=page_background, onLaterPages=page_background)
    print(PDF_PATH)


if __name__ == "__main__":
    main()
