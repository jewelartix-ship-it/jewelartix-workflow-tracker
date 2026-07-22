"""Shared styles for the project's PDF documentation, echoing the app's own
warm cream/beige/brown palette so the docs feel like part of the same product."""

from reportlab.lib.pagesizes import LETTER
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT
from reportlab.platypus import Paragraph, Spacer, Table, TableStyle, Preformatted
from reportlab.pdfbase.pdfmetrics import registerFont
from reportlab.pdfbase.ttfonts import TTFont

# ---- Palette (matches frontend/tailwind.config.js) ----
INK = colors.HexColor('#2B2420')
INK_MUTED = colors.HexColor('#6B6153')
ACCENT = colors.HexColor('#8B5E3C')
ACCENT_SOFT = colors.HexColor('#EFE1D1')
SURFACE_ALT = colors.HexColor('#F2ECE1')
BORDER = colors.HexColor('#E6DECD')
WARNING = colors.HexColor('#9C6B24')
PAGE_BG = colors.HexColor('#FFFFFF')

PAGE_SIZE = LETTER
MARGINS = dict(leftMargin=0.85 * inch, rightMargin=0.85 * inch, topMargin=0.9 * inch, bottomMargin=0.9 * inch)

_base = getSampleStyleSheet()

styles = {
    'DocTitle': ParagraphStyle('DocTitle', parent=_base['Title'], fontName='Helvetica-Bold', fontSize=26,
                                leading=30, textColor=INK, spaceAfter=6, alignment=TA_LEFT),
    'DocSubtitle': ParagraphStyle('DocSubtitle', parent=_base['Normal'], fontName='Helvetica', fontSize=12.5,
                                   leading=17, textColor=INK_MUTED, spaceAfter=28),
    'H1': ParagraphStyle('H1', parent=_base['Heading1'], fontName='Helvetica-Bold', fontSize=17, leading=21,
                          textColor=INK, spaceBefore=22, spaceAfter=10, borderColor=BORDER,
                          borderWidth=0, borderPadding=0),
    'H2': ParagraphStyle('H2', parent=_base['Heading2'], fontName='Helvetica-Bold', fontSize=13, leading=17,
                          textColor=ACCENT, spaceBefore=16, spaceAfter=7),
    'Body': ParagraphStyle('Body', parent=_base['Normal'], fontName='Helvetica', fontSize=10, leading=15,
                            textColor=INK, spaceAfter=8),
    'BodyMuted': ParagraphStyle('BodyMuted', parent=_base['Normal'], fontName='Helvetica-Oblique', fontSize=9.5,
                                 leading=14, textColor=INK_MUTED, spaceAfter=8),
    'Bullet': ParagraphStyle('Bullet', parent=_base['Normal'], fontName='Helvetica', fontSize=10, leading=15,
                              textColor=INK, leftIndent=14, spaceAfter=4, bulletIndent=2),
    'TableHeader': ParagraphStyle('TableHeader', parent=_base['Normal'], fontName='Helvetica-Bold', fontSize=9,
                                   leading=12, textColor=INK),
    'TableCell': ParagraphStyle('TableCell', parent=_base['Normal'], fontName='Helvetica', fontSize=9,
                                 leading=13, textColor=INK),
    'TableCellMuted': ParagraphStyle('TableCellMuted', parent=_base['Normal'], fontName='Helvetica', fontSize=9,
                                      leading=13, textColor=INK_MUTED),
    'Code': ParagraphStyle('Code', parent=_base['Code'], fontName='Courier', fontSize=8.6, leading=12.5,
                            textColor=INK),
    'TOCItem': ParagraphStyle('TOCItem', parent=_base['Normal'], fontName='Helvetica', fontSize=10.5, leading=20,
                               textColor=INK),
    'Footer': ParagraphStyle('Footer', parent=_base['Normal'], fontName='Helvetica', fontSize=8, textColor=INK_MUTED),
}


def code_block(text: str, width: float):
    """A shaded, monospace block for shell commands / file contents."""
    pre = Preformatted(text.strip('\n'), styles['Code'])
    t = Table([[pre]], colWidths=[width])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), SURFACE_ALT),
        ('BOX', (0, 0), (-1, -1), 0.75, BORDER),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    return t


def styled_table(header, rows, col_widths, header_bg=ACCENT_SOFT):
    """A table with a tinted header row and hairline borders, matching the app's card style."""
    header_row = [Paragraph(f'<b>{h}</b>', styles['TableHeader']) for h in header]
    data = [header_row]
    for row in rows:
        data.append([Paragraph(str(cell), styles['TableCell']) for cell in row])
    t = Table(data, colWidths=col_widths, repeatRows=1)
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), header_bg),
        ('LINEBELOW', (0, 0), (-1, 0), 1, ACCENT),
        ('LINEBELOW', (0, 1), (-1, -2), 0.5, BORDER),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    return t


def bullets(items):
    return [Paragraph(f'&bull;&nbsp;&nbsp;{item}', styles['Bullet']) for item in items]


def h1(text):
    return Paragraph(text, styles['H1'])


def h2(text):
    return Paragraph(text, styles['H2'])


def body(text):
    return Paragraph(text, styles['Body'])


def spacer(h=10):
    return Spacer(1, h)


def make_page_decorator(doc_label: str):
    """Returns an onPage callback: thin accent bar at the top, page number +
    document label in the footer."""
    def _decorate(canvas, doc):
        canvas.saveState()
        width, height = PAGE_SIZE
        # Top accent bar
        canvas.setFillColor(ACCENT)
        canvas.rect(0, height - 6, width, 6, stroke=0, fill=1)
        # Footer
        canvas.setFont('Helvetica', 8)
        canvas.setFillColor(INK_MUTED)
        canvas.drawString(0.85 * inch, 0.55 * inch, doc_label)
        canvas.drawRightString(width - 0.85 * inch, 0.55 * inch, f'Page {doc.page}')
        canvas.restoreState()
    return _decorate

