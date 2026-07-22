import sys
sys.path.insert(0, '.')
from reportlab.platypus import SimpleDocTemplate, Paragraph
from reportlab.lib.units import inch
from pdf_common import styles, PAGE_SIZE, MARGINS, styled_table, spacer, make_page_decorator, body

OUT = '../Software-Requirements.pdf'
CONTENT_WIDTH = PAGE_SIZE[0] - MARGINS['leftMargin'] - MARGINS['rightMargin']

doc = SimpleDocTemplate(OUT, pagesize=PAGE_SIZE, title='Software Requirements — Workflow Tracker', **MARGINS)

story = []
story.append(Paragraph('Workflow Tracker', styles['DocSubtitle']))
story.append(Paragraph('Software Requirements', styles['DocTitle']))
story.append(Paragraph(
    'Everything below must be installed before setting up the project. See the '
    '<b>Setup and Operations Guide</b> for step-by-step installation instructions for each item.',
    styles['Body']
))
story.append(spacer(16))

header = ['Software', 'Minimum Version', 'Needed For', 'Download']
rows = [
    ['Node.js', '22.x (LTS)', 'Running the backend and building the frontend', 'nodejs.org'],
    ['npm', '10.x', 'Installing project dependencies', 'Included with Node.js'],
    ['Git', 'Any recent version', 'Getting the code, deploying updates', 'git-scm.com'],
    ['Docker + Compose', 'Docker 24+, Compose v2', 'Running the app in production', 'docker.com'],
    ['Code editor', 'Optional', 'Editing the code', 'code.visualstudio.com (or any editor)'],
]
story.append(styled_table(header, rows, col_widths=[1.3 * inch, 1.25 * inch, 2.55 * inch, 1.3 * inch]))
story.append(spacer(16))

story.append(Paragraph('Not required', styles['H2']))
story.append(body(
    'No database server needs to be installed. The application uses SQLite, which ships as part of '
    'a Node.js package (<font face="Courier">better-sqlite3</font>) — there is nothing separate to '
    'install, configure, or run.'
))

story.append(Paragraph('Minimum machine specs', styles['H2']))
story.append(body(
    'Development: any laptop from the last several years is more than sufficient. '
    'Production: a single small VPS (1 vCPU / 1GB RAM) comfortably serves 10–20 users.'
))

story.append(Paragraph('Operating systems', styles['H2']))
story.append(body(
    'Development works on Windows, macOS, and Linux. Production deployment (via Docker) works on any '
    'Linux server; the instructions in this documentation assume Ubuntu/Debian.'
))

doc.build(story, onFirstPage=make_page_decorator('Workflow Tracker — Software Requirements'),
          onLaterPages=make_page_decorator('Workflow Tracker — Software Requirements'))
print(f'Wrote {OUT}')
