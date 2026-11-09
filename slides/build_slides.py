"""Build the presentation from the HUST 4:3 template.

    ../.venv/bin/python build_slides.py
    -> WSN_Presentation.pptx  (slides + speaker notes)
    -> speaker_notes.md       (same notes, for rehearsal)

The template's title slide (3) and "THANK YOU" slide (13) are reused; all other
template slides are dropped and content slides are built on the template layouts.
"""
import copy
import re
from pathlib import Path

from pptx import Presentation
from pptx.chart.data import CategoryChartData
from pptx.dml.color import RGBColor
from pptx.enum.chart import XL_CHART_TYPE, XL_LABEL_POSITION, XL_LEGEND_POSITION
from pptx.enum.shapes import MSO_SHAPE, PP_PLACEHOLDER
from pptx.enum.text import MSO_ANCHOR, MSO_AUTO_SIZE, PP_ALIGN
from pptx.opc.packuri import PackURI
from pptx.oxml.ns import qn
from pptx.util import Emu, Inches, Pt

from notes_vi import NOTES_VI, QA_VI

HERE = Path(__file__).resolve().parent
TEMPLATE = HERE.parent / "docs" / "HUST_PPT_template_2022_RED_4x3.pptx"
OUT_PPTX = HERE / "WSN_Presentation.pptx"
OUT_NOTES = HERE / "speaker_notes.md"

# ------------------------------------------------------------------ palette (sampled from the template)
RED = RGBColor(0xC0, 0x20, 0x34)       # header bar
TITLE_RED = RGBColor(0xC0, 0x00, 0x00)  # template title text
GOLD = RGBColor(0xE5, 0x9C, 0x0A)       # template accent bar
DARK = RGBColor(0x26, 0x26, 0x26)
GRAY = RGBColor(0x59, 0x59, 0x59)
LIGHT = RGBColor(0xF2, 0xF2, 0xF2)
RED_TINT = RGBColor(0xFB, 0xE9, 0xEB)
GOLD_TINT = RGBColor(0xFD, 0xF1, 0xDC)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
BAR_GRAY = RGBColor(0xA6, 0xA6, 0xA6)
FONT = "Lato"  # template font

# Content area of the layouts (inches, 10 x 7.5 slide)
X0, XW = 0.45, 9.1
TOP_THIN, TOP_THICK = 1.15, 1.45   # below thin / thick gold bar

In = Inches

# ------------------------------------------------------------------ text helpers
TOKEN = re.compile(r"(\*\*.+?\*\*|\*.+?\*|_\{.+?\}|\^\{.+?\})")


def add_runs(p, text, size, color, bold=False, italic=False):
    """Inline markup: **bold**, *italic*, _{subscript}, ^{superscript}."""
    for part in filter(None, TOKEN.split(text)):
        b, i, baseline = bold, italic, 0
        if part.startswith("**"):
            part, b = part[2:-2], True
        elif part.startswith("_{"):
            part, baseline = part[2:-1], -25000
        elif part.startswith("^{"):
            part, baseline = part[2:-1], 30000
        elif part.startswith("*"):
            part, i = part[1:-1], True
        r = p.add_run()
        r.text = part
        f = r.font
        f.size, f.bold, f.italic, f.name = Pt(size), b, i, FONT
        f.color.rgb = color
        if baseline:
            r._r.get_or_add_rPr().set("baseline", str(baseline))


def set_bullet(p, color=RED, indent=0.22):
    pPr = p._p.get_or_add_pPr()
    pPr.set("marL", str(int(In(indent))))
    pPr.set("indent", str(-int(In(indent))))
    for tag in ("a:buClr", "a:buFont", "a:buChar", "a:buNone"):
        for el in pPr.findall(qn(tag)):
            pPr.remove(el)
    clr = pPr.makeelement(qn("a:buClr"), {})
    clr.append(clr.makeelement(qn("a:srgbClr"), {"val": str(color)}))
    pPr.append(clr)
    pPr.append(pPr.makeelement(qn("a:buFont"), {"typeface": "Arial"}))
    pPr.append(pPr.makeelement(qn("a:buChar"), {"char": "•"}))


def fill_tf(tf, paras, size=14, color=DARK, align=PP_ALIGN.LEFT, anchor=MSO_ANCHOR.TOP,
            margin=0.08, after=4):
    """paras: list of str or dict(t=..., size, color, bold, italic, bullet, align, after)."""
    tf.word_wrap = True
    tf.auto_size = MSO_AUTO_SIZE.NONE
    tf.vertical_anchor = anchor
    tf.margin_left = tf.margin_right = In(margin)
    tf.margin_top = tf.margin_bottom = In(margin * 0.6)
    for k, para in enumerate(paras):
        para = {"t": para} if isinstance(para, str) else para
        p = tf.paragraphs[0] if k == 0 else tf.add_paragraph()
        p.alignment = para.get("align", align)
        p.space_after = Pt(para.get("after", after))
        add_runs(p, para["t"], para.get("size", size), para.get("color", color),
                 para.get("bold", False), para.get("italic", False))
        if para.get("bullet"):
            set_bullet(p, para.get("bullet_color", RED))


def text(slide, x, y, w, h, paras, name=None, **kw):
    s = slide.shapes.add_textbox(In(x), In(y), In(w), In(h))
    if name:
        s.name = name
    fill_tf(s.text_frame, paras, **kw)
    return s


def box(slide, x, y, w, h, fill, paras=None, shape=MSO_SHAPE.ROUNDED_RECTANGLE, radius=0.06,
        name=None, **kw):
    s = slide.shapes.add_shape(shape, In(x), In(y), In(w), In(h))
    if name:
        s.name = name
    s.fill.solid()
    s.fill.fore_color.rgb = fill
    s.line.fill.background()
    s.shadow.inherit = False
    if shape == MSO_SHAPE.ROUNDED_RECTANGLE:
        s.adjustments[0] = radius
    fill_tf(s.text_frame, paras or [""], **kw)
    return s


def badge(slide, x, y, d, label, fill=RED, size=16, name=None):
    return box(slide, x, y, d, d, fill, [{"t": label, "bold": True, "color": WHITE, "size": size}],
               shape=MSO_SHAPE.OVAL, align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE, margin=0, name=name)


# ------------------------------------------------------------------ deck helpers
prs = Presentation(str(TEMPLATE))
LAYOUT = {l.name: l for l in prs.slide_layouts}
THIN = LAYOUT["1_Section Header"]     # red header + thin gold line + HUST footer
THICK = LAYOUT["1_Two Content"]       # red header + thick gold bar + HUST footer
PANEL = LAYOUT["1_Title Only"]        # red HUST panel on the left
NOTES = []                            # (slide title, minutes, notes)


def drop_template_slides(keep):
    lst = prs.slides._sldIdLst
    for idx, sld_id in reversed(list(enumerate(list(lst), start=1))):
        if idx not in keep:
            prs.part.drop_rel(sld_id.rId)
            lst.remove(sld_id)
    renumber_parts()


def renumber_parts():
    """Name slide parts slide1..N in deck order (python-pptx names new slides by count)."""
    for k, slide in enumerate(prs.slides, start=1):
        slide.part.partname = PackURI(f"/ppt/slides/slide{k}.xml")


def add_slide_number(slide):
    for ph in slide.slide_layout.placeholders:
        if ph.placeholder_format.type == PP_PLACEHOLDER.SLIDE_NUMBER:
            el = copy.deepcopy(ph._element)
            el.find(qn("p:nvSpPr")).find(qn("p:cNvPr")).set("id", str(slide.shapes._next_shape_id))
            slide.shapes._spTree.append(el)
            return


def new_slide(layout, title, minutes, notes):
    s = prs.slides.add_slide(layout)
    for ph in list(s.placeholders):
        if ph.placeholder_format.type != PP_PLACEHOLDER.TITLE:
            ph._element.getparent().remove(ph._element)
    s.shapes.title.text_frame.text = title
    add_slide_number(s)
    s.notes_slide.notes_text_frame.text = notes
    NOTES.append((title, minutes, notes))
    return s


def section_label(slide, x, y, w, label):
    text(slide, x, y, w, 0.4, [{"t": label, "bold": True, "color": TITLE_RED, "size": 16}], margin=0)


# =================================================================== SLIDES
drop_template_slides(keep={3, 13})
title_slide, thanks_slide = prs.slides[0], prs.slides[1]

# ------------------------------------------------------------------ 1. Title (template slide 3)
NOTE_TITLE = NOTES_VI["Title"]
title_box, sub_box = [sh for sh in title_slide.shapes if sh.has_text_frame]
for shp, (x, y, w, h) in ((title_box, (0.45, 2.15, 6.9, 1.75)), (sub_box, (0.45, 4.1, 7.3, 1.9))):
    shp.left, shp.top, shp.width, shp.height = In(x), In(y), In(w), In(h)
    for p in list(shp.text_frame.paragraphs)[1:]:
        p._p.getparent().remove(p._p)
    shp.text_frame.paragraphs[0]._p.getparent().remove(shp.text_frame.paragraphs[0]._p)
    shp.text_frame._txBody.append(shp.text_frame._txBody.makeelement(qn("a:p"), {}))
fill_tf(title_box.text_frame, [
    {"t": "Wireless Sensor Networks", "size": 38, "bold": True, "color": TITLE_RED, "after": 6},
    {"t": "From Fundamentals and Applications to Innovations and Future Trends", "size": 22, "color": DARK},
], margin=0)
fill_tf(sub_box.text_frame, [
    {"t": "Paper summary · M. Trigka & E. Dritsas, *IEEE Access*, vol. 13, 2025", "size": 16, "color": DARK, "after": 14},
    {"t": "Presenter: Đỗ Thanh Tùng", "size": 16, "bold": True, "color": DARK, "after": 2},
    {"t": "Tung.DT252432M@sis.hust.edu.vn", "size": 14, "color": GRAY, "after": 2},
    {"t": "Wireless Sensor Networks course · Hà Nội, 11/2026", "size": 14, "color": GRAY},
], margin=0)
title_slide.notes_slide.notes_text_frame.text = NOTE_TITLE
NOTES.append(("Title", 0.5, NOTE_TITLE))

# ------------------------------------------------------------------ 2. Outline
s = new_slide(PANEL, "Outline", 0.5, NOTES_VI["Outline"])
outline = [
    ("The paper at a glance", "Scope, motivation and structure"),
    ("WSN fundamentals", "Architectures, energy models, MAC and routing"),
    ("Applications & innovations", "12 domains, three innovation pillars"),
    ("Challenges & future directions", "What is still open, what comes next"),
    ("Critical assessment", "Strengths, limitations, worked example"),
    ("Conclusion", "Key takeaways"),
]
for k, (head, sub) in enumerate(outline):
    y = 1.2 + k * 0.92
    badge(s, 3.9, y + 0.05, 0.56, str(k + 1), name=f"Outline badge {k + 1}")
    text(s, 4.65, y, 4.9, 0.8, [{"t": head, "bold": True, "size": 18, "after": 0},
                                 {"t": sub, "size": 14, "color": GRAY}], margin=0.02)

# ------------------------------------------------------------------ 3. Paper at a glance
s = new_slide(THIN, "The Paper at a Glance", 1.0, NOTES_VI["The Paper at a Glance"])
box(s, X0, TOP_THIN, XW, 1.4, LIGHT, [
    {"t": "Wireless Sensor Networks: From Fundamentals and Applications to Innovations and Future Trends",
     "bold": True, "size": 16, "after": 4},
    {"t": "Maria Trigka, Elias Dritsas · University of West Attica, Greece", "size": 14, "after": 2},
    {"t": "IEEE Access 13 (2025), pp. 96365–96399 · DOI 10.1109/ACCESS.2025.3572328", "size": 14, "color": GRAY},
], anchor=MSO_ANCHOR.MIDDLE, margin=0.18, name="Citation card")
stats = [("35", "pages"), ("355", "references"), ("10", "comparison tables"), ("12", "application domains")]
for k, (num, label) in enumerate(stats):
    x = X0 + k * 2.333
    box(s, x, 2.75, 2.1, 1.3, WHITE, [
        {"t": num, "bold": True, "size": 40, "color": TITLE_RED, "align": PP_ALIGN.CENTER, "after": 0},
        {"t": label, "size": 14, "color": GRAY, "align": PP_ALIGN.CENTER},
    ], anchor=MSO_ANCHOR.MIDDLE, name=f"Stat {label}").line.color.rgb = RGBColor(0xD9, 0xD9, 0xD9)
text(s, X0, 4.25, 4, 0.35, [{"t": "Survey structure", "bold": True, "size": 14, "color": GRAY}], margin=0)
parts = [("Fundamentals", "Sec. II"), ("Applications", "Sec. III"), ("Innovations", "Sec. IV"),
         ("Challenges", "Sec. V"), ("Future trends", "Sec. VI")]
for k, (lab, sec) in enumerate(parts):
    x = X0 + k * 1.81
    shape = MSO_SHAPE.PENTAGON if k == 0 else MSO_SHAPE.CHEVRON
    box(s, x, 4.65, 1.86, 0.8, RED if k % 2 == 0 else TITLE_RED,
        [{"t": lab, "bold": True, "size": 13, "color": WHITE, "align": PP_ALIGN.CENTER}],
        shape=shape, anchor=MSO_ANCHOR.MIDDLE, margin=0.02, name=f"Part {lab}")
    text(s, x, 5.5, 1.7, 0.3, [{"t": sec, "size": 12, "color": GRAY, "align": PP_ALIGN.CENTER}], margin=0)
text(s, X0, 6.0, XW, 0.75, [{"t": "*Goal: link classical WSN foundations with emerging topics — federated learning, "
                                  "blockchain trust, quantum sensing and digital twins.*", "size": 15, "color": DARK}],
     margin=0)

# ------------------------------------------------------------------ 4. Motivation
s = new_slide(THIN, "Why This Survey?", 1.0, NOTES_VI["Why This Survey?"])
forces = [
    ("Energy is the binding constraint", ["Finite batteries", "Harvesting depends on light, heat, vibration",
                                          "Lifetime drives every design choice"]),
    ("Harsh, insecure environments", ["Reliability and fault tolerance", "Attacks on cheap, exposed nodes",
                                      "Security must stay lightweight"]),
    ("IoT & AI integration", ["WSNs inside smart ecosystems", "More compute and interoperability",
                              "New data-privacy demands"]),
]
for k, (head, items) in enumerate(forces):
    x = X0 + k * 3.1
    box(s, x, TOP_THIN, 2.9, 3.6, LIGHT, name=f"Force card {k + 1}")
    badge(s, x + 0.2, TOP_THIN + 0.2, 0.5, str(k + 1))
    text(s, x + 0.15, TOP_THIN + 0.8, 2.6, 0.75, [{"t": head, "bold": True, "size": 17}], margin=0.05)
    text(s, x + 0.15, TOP_THIN + 1.6, 2.6, 1.9,
         [{"t": it, "size": 14, "bullet": True, "after": 6} for it in items], margin=0.05)
box(s, X0, 5.0, XW, 1.7, RED_TINT, [
    {"t": "**Positioning.** Earlier surveys focus on a single topic such as routing or clustering. This one links "
          "the fundamentals with emerging, interdisciplinary topics — federated intelligence, blockchain trust, "
          "quantum sensing, digital twins — and with under-explored settings such as underwater and space.",
     "size": 15},
], anchor=MSO_ANCHOR.MIDDLE, margin=0.2, name="Positioning")

# ------------------------------------------------------------------ 5. Architectures
s = new_slide(THIN, "WSN Architectures", 1.0, NOTES_VI["WSN Architectures"])
rows = [
    ("Architecture", "Strength", "Weakness"),
    ("Single-tier (flat)", "Simple, low cost", "Hot spots near the sink"),
    ("Multi-tier / clustered", "Scalable, less long-range traffic", "Cluster-head overhead and load"),
    ("Centralized", "Global view, rich analytics", "Bottleneck, single point of failure"),
    ("Distributed", "Robust, even energy use", "Consensus and coordination cost"),
    ("Duty-cycled", "Large lifetime gains", "Needs synchronisation, adds latency"),
]
gf = s.shapes.add_table(len(rows), 3, In(X0), In(TOP_THIN), In(XW), In(0.6 * len(rows)))
gf.name = "Architecture table"
tbl = gf.table
tbl.first_row, tbl.horz_banding = True, False
for c, w in enumerate((2.6, 3.25, 3.25)):
    tbl.columns[c].width = In(w)
for r, row in enumerate(rows):
    tbl.rows[r].height = In(0.6)
    for c, val in enumerate(row):
        cell = tbl.cell(r, c)
        cell.fill.solid()
        cell.fill.fore_color.rgb = RED if r == 0 else (LIGHT if r % 2 == 0 else WHITE)
        cell.text_frame.paragraphs[0].text = ""
        cell.vertical_anchor = MSO_ANCHOR.MIDDLE
        fill_tf(cell.text_frame, [{"t": val, "size": 14, "bold": r == 0 or c == 0,
                                   "color": WHITE if r == 0 else DARK}], margin=0.1, anchor=MSO_ANCHOR.MIDDLE)
box(s, X0, 5.0, 4.45, 1.7, RED_TINT, [
    {"t": "**Duty cycle**", "size": 15, "after": 4},
    {"t": "D = T_{active} / T_{cycle} — sleep most of the time, wake only to sense and communicate", "size": 14},
], anchor=MSO_ANCHOR.MIDDLE, margin=0.18, name="Duty cycle")
box(s, X0 + 4.65, 5.0, 4.45, 1.7, GOLD_TINT, [
    {"t": "**Insight from the authors**", "size": 15, "after": 4},
    {"t": "Cluster-based and multi-tier designs are structurally the same → one unified energy model", "size": 14},
], anchor=MSO_ANCHOR.MIDDLE, margin=0.18, name="Insight")

# ------------------------------------------------------------------ 6. Energy models
s = new_slide(THIN, "A Unified Energy-Modelling Thread", 1.25, NOTES_VI["A Unified Energy-Modelling Thread"])
eqs = [
    ("Centralized (one hop)", "E_{central} = Σ_{i} ( E_{sense,i} + E_{tx,i} )"),
    ("Clustered", "E_{cluster} = Σ_{clusters} [ Σ_{members} E_{local} + E_{CH} ]"),
    ("Duty-cycled", "E_{duty} = Σ_{i} [ D_{i} P_{active,i} + (1 − D_{i}) P_{sleep,i} ]"),
]
for k, (lab, eq) in enumerate(eqs):
    box(s, X0, TOP_THIN + k * 1.35, 5.5, 1.2, LIGHT, [
        {"t": lab, "bold": True, "size": 14, "color": TITLE_RED, "after": 4},
        {"t": eq, "size": 18},
    ], anchor=MSO_ANCHOR.MIDDLE, margin=0.18, name=f"Equation {lab}")
box(s, 6.15, TOP_THIN, 3.4, 3.9, WHITE, [
    {"t": "Same pattern for protocols", "bold": True, "size": 16, "after": 8},
    {"t": "**MAC:** add T·P for each radio state — listen, collision, preamble", "size": 14, "bullet": True, "after": 8},
    {"t": "**Routing:** Σ over H hops of (E_{tx} + E_{rx} + E_{extra})", "size": 14, "bullet": True, "after": 8},
    {"t": "E_{extra} = 0 (geographic), error control (QoS), crypto (secure)", "size": 14, "bullet": True},
], margin=0.18, name="Protocol models").line.color.rgb = RGBColor(0xD9, 0xD9, 0xD9)
box(s, X0, 5.3, XW, 1.4, GOLD_TINT, [
    {"t": "**Caveat:** these are bookkeeping identities — no distance, channel or collision terms. "
          "They cannot tell *when* clustering pays off (→ worked example).", "size": 15},
], anchor=MSO_ANCHOR.MIDDLE, margin=0.2, name="Caveat")

# ------------------------------------------------------------------ 7. Protocols
s = new_slide(THICK, "Communication Protocols: MAC & Routing", 1.25, NOTES_VI["Communication Protocols: MAC & Routing"])
section_label(s, X0, TOP_THICK, 4.4, "MAC — 4 classes")
mac = [
    ("Contention-free", "TDMA, FDMA, IEEE 802.15.4e TSCH", "No collisions; needs tight sync"),
    ("Contention-based", "CSMA/CA, S-MAC, T-MAC, B-MAC, X-MAC", "Idle listening and collisions grow with density"),
    ("Hybrid", "Z-MAC", "CSMA at low load, TDMA under contention"),
    ("Adaptive", "RL-based MAC", "Learns the access policy online"),
]
for k, (name, ex, note) in enumerate(mac):
    box(s, X0, 1.95 + k * 1.2, 4.4, 1.08, LIGHT, [
        {"t": name, "bold": True, "size": 15, "after": 1},
        {"t": ex, "size": 14, "color": GRAY, "after": 1},
        {"t": note, "size": 14},
    ], anchor=MSO_ANCHOR.MIDDLE, margin=0.14, name=f"MAC {name}")
section_label(s, 5.15, TOP_THICK, 4.4, "Routing — 6 families")
routing = [
    ("Data-centric", "Directed Diffusion, SPIN"), ("Hierarchical", "LEACH, PEGASIS, HEED"),
    ("Location-based", "GPSR, GEAR"), ("Multipath", "MPDD, ReInForM"),
    ("QoS-aware", "SPEED, SAR"), ("Security-oriented", "S-LEACH, INSENS"),
]
for k, (fam, ex) in enumerate(routing):
    x, y = 5.15 + (k % 2) * 2.28, 1.95 + (k // 2) * 1.6
    box(s, x, y, 2.12, 1.45, LIGHT, [
        {"t": fam, "bold": True, "size": 15, "after": 4},
        {"t": ex, "size": 14, "color": GRAY},
    ], anchor=MSO_ANCHOR.MIDDLE, margin=0.14, name=f"Routing {fam}")

# ------------------------------------------------------------------ 8. Applications
s = new_slide(THIN, "Applications: 12 Domains in Practice", 1.0, NOTES_VI["Applications: 12 Domains in Practice"])
apps = [
    ("Environment", "RNN microclimate forecasting; Kalman landslide warning", "Internet of Forests, Amazon"),
    ("Healthcare", "Body sensor networks; CNN/LSTM anomaly detection", "Smart-hospital vital signs"),
    ("Industry", "FFT / wavelet vibration analysis; WirelessHART", "Oil & gas pipelines, Nigeria"),
    ("Smart cities", "Traffic prediction (SVR); adaptive street lighting", "Cary, NC: water & flood alerts"),
    ("Agriculture", "Soil-moisture networks; CNN pest classification", "Nutrient sensing in tomato fields"),
    ("Defence", "Acoustic / seismic surveillance; ECC-secured links", "NATO iMUGS ground vehicles"),
]
for k, (dom, tech, case) in enumerate(apps):
    x, y = X0 + (k % 3) * 3.1, TOP_THIN + (k // 3) * 2.3
    box(s, x, y, 2.9, 2.15, LIGHT, [
        {"t": dom, "bold": True, "size": 16, "color": TITLE_RED, "after": 4},
        {"t": tech, "size": 14, "after": 6},
        {"t": f"*Case: {case}*", "size": 14, "color": GRAY},
    ], margin=0.16, name=f"App {dom}")
box(s, X0, 5.95, XW, 0.75, WHITE, [
    {"t": "**Also covered:** disaster response · energy & smart grids · transport · underwater · space · UAVs",
     "size": 14},
], anchor=MSO_ANCHOR.MIDDLE, margin=0.18, name="Other domains").line.color.rgb = RGBColor(0xD9, 0xD9, 0xD9)

# ------------------------------------------------------------------ 9. Innovations
s = new_slide(THIN, "Innovations: Three Pillars", 1.0, NOTES_VI["Innovations: Three Pillars"])
pillars = [
    ("Energy", ["Solar + MPPT, piezo, thermoelectric", "Hybrid multi-source harvesting", "Wake-up radios cut idle listening"]),
    ("Communication", ["IEEE 802.15.4e TSCH", "Acoustic–optical links underwater", "6LoWPAN / RPL for IPv6"]),
    ("Intelligence & security", ["TinyML on microcontrollers", "Federated learning, fog computing", "ECC, blockchain, ML-based IDS"]),
]
for k, (head, items) in enumerate(pillars):
    x = X0 + k * 3.1
    box(s, x, TOP_THIN, 2.9, 3.6, LIGHT, name=f"Pillar {head}")
    badge(s, x + 0.2, TOP_THIN + 0.2, 0.5, str(k + 1), fill=TITLE_RED)
    text(s, x + 0.15, TOP_THIN + 0.8, 2.6, 0.5, [{"t": head, "bold": True, "size": 17}], margin=0.05)
    text(s, x + 0.15, TOP_THIN + 1.35, 2.6, 2.15,
         [{"t": it, "size": 14, "bullet": True, "after": 8} for it in items], margin=0.05)
box(s, X0, 5.0, 4.45, 1.7, GOLD_TINT, [
    {"t": "**Software-defined WSNs**", "size": 15, "after": 4},
    {"t": "Programmable control plane; open issues: control overhead, controller robustness", "size": 14},
], anchor=MSO_ANCHOR.MIDDLE, margin=0.18, name="SDWSN")
box(s, X0 + 4.65, 5.0, 4.45, 1.7, RED_TINT, [
    {"t": "**Hardware & smart sensors**", "size": 15, "after": 4},
    {"t": "Cortex-M MCUs, LoRa, nanosensors, on-sensor ML and neuromorphic processing", "size": 14},
], anchor=MSO_ANCHOR.MIDDLE, margin=0.18, name="Hardware")

# ------------------------------------------------------------------ 10. Challenges & future
s = new_slide(THICK, "Challenges & Future Directions", 1.0, NOTES_VI["Challenges & Future Directions"])
section_label(s, X0, TOP_THICK, 4.4, "Persistent challenges")
challenges = ["Energy limits, harvesting variability", "Scalability and congestion", "Interference and resilience",
              "Security of constrained nodes", "Privacy (HIPAA, GDPR)", "Data overload",
              "Standards and interoperability", "Latency and QoS", "Cost and maintenance"]
box(s, X0, 1.95, 4.4, 3.85, LIGHT, [{"t": c, "size": 14, "bullet": True, "after": 5} for c in challenges],
    margin=0.18, anchor=MSO_ANCHOR.MIDDLE, name="Challenges")
section_label(s, 5.15, TOP_THICK, 4.4, "Future directions → required advance")
future = [("Self-sustaining nodes", "Hardware + algorithms"), ("Context-aware protocols", "Algorithms"),
          ("Federated intelligence", "Algorithms + architecture"), ("Bio-inspired designs", "Algorithms"),
          ("Digital twins", "Architecture"), ("Quantum sensing, QKD", "Hardware, long-term")]
for k, (d, adv) in enumerate(future):
    y = 1.95 + k * 0.65
    text(s, 5.15, y, 2.35, 0.55, [{"t": d, "bold": True, "size": 14}], anchor=MSO_ANCHOR.MIDDLE, margin=0.02)
    box(s, 7.5, y + 0.06, 2.05, 0.45, GOLD_TINT, [{"t": adv, "size": 12, "align": PP_ALIGN.CENTER}],
        anchor=MSO_ANCHOR.MIDDLE, margin=0.04, radius=0.3, name=f"Tag {d}")
box(s, X0, 6.0, XW, 0.8, RED_TINT, [
    {"t": "**Recurring tension:** almost every remedy (ML clustering, blockchain, federated learning) needs "
          "computation that sensor nodes lack.", "size": 14},
], anchor=MSO_ANCHOR.MIDDLE, margin=0.18, name="Tension")

# ------------------------------------------------------------------ 11. Critical assessment
s = new_slide(THICK, "Critical Assessment", 1.25, NOTES_VI["Critical Assessment"])
cols = [
    ("+", "Strengths", LIGHT, GOLD, [
        ("Clear structure", "fundamentals → future trends"),
        ("Unified energy view", "a model for every architecture and protocol"),
        ("Grounded", "a real deployment for each domain"),
        ("Balanced", "admits limits of quantum, PoW, SDWSN"),
        ("Roadmap", "trends tagged by required advance"),
    ]),
    ("−", "Limitations", RED_TINT, RED, [
        ("No quantitative evaluation", "no simulation or measured comparison"),
        ("Abstract energy models", "no distance, channel or collision terms"),
        ("No survey methodology", "search and inclusion criteria not stated"),
        ("Breadth over depth", "many protocols in a single sentence"),
        ("Minor inconsistency", "MAC sync/async split stated two ways"),
    ]),
]
for k, (sym, head, fill, accent, items) in enumerate(cols):
    x = X0 + k * 4.65
    box(s, x, TOP_THICK, 4.45, 4.35, fill, name=f"{head} card")
    badge(s, x + 0.2, TOP_THICK + 0.2, 0.5, sym, fill=accent, size=20)
    text(s, x + 0.85, TOP_THICK + 0.22, 3.4, 0.5, [{"t": head, "bold": True, "size": 18}],
         anchor=MSO_ANCHOR.MIDDLE, margin=0)
    text(s, x + 0.2, TOP_THICK + 0.9, 4.1, 3.4,
         [{"t": f"**{a}** — {b}", "size": 14, "after": 10} for a, b in items], margin=0.02)
box(s, X0, 6.0, XW, 0.75, GOLD_TINT, [
    {"t": "**Verdict:** an excellent map of the field — but not a source of quantitative design guidance.",
     "size": 15},
], anchor=MSO_ANCHOR.MIDDLE, margin=0.18, name="Verdict")

# ------------------------------------------------------------------ 12. Worked example
s = new_slide(THIN, "Does Clustering Always Save Energy?", 1.5, NOTES_VI["Does Clustering Always Save Energy?"])
cd = CategoryChartData()
cd.categories = ["30 m", "60 m", "90 m", "100 m", "150 m"]
cd.add_series("Direct to sink", (23.6, 34.4, 54.1, 72.0, 283.3))
cd.add_series("Clustered (5 CHs)", (42.7, 43.2, 44.2, 45.1, 55.7))
gf = s.shapes.add_chart(XL_CHART_TYPE.COLUMN_CLUSTERED, In(X0), In(TOP_THIN), In(5.7), In(4.45), cd)
gf.name = "Energy chart"
ch = gf.chart
ch.font.name, ch.font.size = FONT, Pt(12)
ch.font.color.rgb = DARK
ch.has_title = True
ch.chart_title.text_frame.text = "Energy per round (mJ) vs sink distance"
ch.chart_title.text_frame.paragraphs[0].runs[0].font.size = Pt(14)
ch.chart_title.text_frame.paragraphs[0].runs[0].font.bold = True
ch.has_legend = True
ch.legend.position, ch.legend.include_in_layout = XL_LEGEND_POSITION.BOTTOM, False
ch.legend.font.size = Pt(12)
plot = ch.plots[0]
plot.gap_width, plot.overlap = 60, -10
plot.has_data_labels = True
dl = plot.data_labels
dl.number_format, dl.number_format_is_linked = "0", False
dl.position = XL_LABEL_POSITION.OUTSIDE_END
dl.font.size = Pt(11)
for series, color in zip(plot.series, (BAR_GRAY, RED)):
    series.format.fill.solid()
    series.format.fill.fore_color.rgb = color
va = ch.value_axis
va.has_major_gridlines = True
va.major_gridlines.format.line.color.rgb = RGBColor(0xD9, 0xD9, 0xD9)
va.format.line.fill.background()
va.tick_labels.font.size = Pt(11)
va.maximum_scale = 320
ch.category_axis.tick_labels.font.size = Pt(12)
callouts = [("−81 %", TITLE_RED, "at 30 m: clustering costs **more**"),
            ("+37 %", GOLD, "saved at 100 m (d^{4} multipath regime)"),
            ("23×", DARK, "cluster-head load vs a member → rotate CHs (LEACH, HEED)")]
for k, (num, color, lab) in enumerate(callouts):
    text(s, 6.4, TOP_THIN + k * 1.5, 3.15, 1.4, [
        {"t": num, "bold": True, "size": 34, "color": color, "after": 0},
        {"t": lab, "size": 14},
    ], margin=0.02, name=f"Callout {num}")
box(s, X0, 5.8, XW, 0.9, LIGHT, [
    {"t": "**Setup (own calculation):** first-order radio model [Heinzelman 2002], 100 nodes, 5 clusters, "
          "4000-bit packets, members 20 m from their CH, perfect aggregation.", "size": 14},
], anchor=MSO_ANCHOR.MIDDLE, margin=0.18, name="Setup")

# ------------------------------------------------------------------ 13. Conclusion
s = new_slide(PANEL, "Conclusion", 0.75, NOTES_VI["Conclusion"])
takeaways = [
    ("A well-structured map of the field", "From architectures, MAC and routing to TinyML, federated learning, "
                                          "blockchain and digital twins."),
    ("Distinctive contributions", "Unified energy models, real-world case studies, future trends tagged by "
                                  "required advance."),
    ("Main gap: no quantitative evidence", "Concrete radio models change the answer — clustering pays off only "
                                           "when the sink is far."),
]
for k, (head, sub) in enumerate(takeaways):
    y = 1.25 + k * 1.55
    badge(s, 3.9, y + 0.05, 0.56, str(k + 1), name=f"Takeaway badge {k + 1}")
    text(s, 4.65, y, 4.9, 1.4, [{"t": head, "bold": True, "size": 18, "after": 4},
                                 {"t": sub, "size": 14, "color": GRAY}], margin=0.02)
text(s, 3.9, 6.0, 5.65, 0.7, [{"t": "*Best used as a map and a starting point for simulation studies.*",
                               "size": 16, "color": TITLE_RED, "bold": True}], margin=0.02)

# ------------------------------------------------------------------ 14. Thank you (template slide 13)
NOTE_THANKS = NOTES_VI["Thank You / Q&A"]
text(thanks_slide, 4.6, 4.25, 4.6, 0.6, [{"t": "Questions & discussion", "size": 22, "color": GRAY}], margin=0)
thanks_slide.notes_slide.notes_text_frame.text = NOTE_THANKS
lst = prs.slides._sldIdLst
thanks_id = lst[1]
lst.remove(thanks_id)
lst.append(thanks_id)
NOTES.append(("Thank You / Q&A", 0.25, NOTE_THANKS))

renumber_parts()
prs.save(str(OUT_PPTX))

# =================================================================== speaker notes (.md)
QA = QA_VI
total = sum(m for _, m, _ in NOTES)
lines = [
    "# Speaker Notes (tiếng Việt) – WSN Paper Summary",
    "",
    "*Paper:* M. Trigka & E. Dritsas, “Wireless Sensor Networks: From Fundamentals and Applications to Innovations "
    "and Future Trends,” *IEEE Access*, vol. 13, 2025.  ",
    f"*Slide:* `slides/WSN_Presentation.pptx` – {len(NOTES)} slide, khoảng {total:.0f} phút + phần hỏi đáp.  ",
    "*Ghi chú:* nội dung slide bằng tiếng Anh; notes dưới đây cũng được gắn sẵn vào file PowerPoint (Presenter View).",
    "",
    "| # | Slide | Thời lượng |",
    "|---|---|---|",
]
lines += [f"| {k} | {t} | {m:g} phút |" for k, (t, m, _) in enumerate(NOTES, start=1)]
lines.append("")
for k, (t, m, n) in enumerate(NOTES, start=1):
    lines += [f"## Slide {k} – {t} *(~{m:g} phút)*", "", n, ""]
lines += ["## Câu hỏi có thể gặp", ""]
for q, a in QA:
    lines += [f"**Hỏi: {q}**  ", f"Đáp: {a}", ""]
OUT_NOTES.write_text("\n".join(lines), encoding="utf-8")
print(f"Wrote {OUT_PPTX.name} ({len(prs.slides)} slides) and {OUT_NOTES.name} (~{total:.0f} min)")
