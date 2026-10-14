"""Builds src/data/drawing-index-7893.json: one entry per sheet of the 78:93 drawing
PDFs (78-93-*.pdf) with the programme stages (ST01 … ST38) it is issued for, so the
78:93 project's Stage Drawings page lists its own sheets (never 77:76's).

Run after the 78:93 drawing sets are revised:
    python3 scripts/build-drawing-index-7893.py <folder with the 78-93 PDFs>
"""
import json, os, re, sys, glob
from pypdf import PdfReader

folder = sys.argv[1] if len(sys.argv) > 1 else "."

R = lambda a, b: [f"ST{n:02d}" for n in range(a, b + 1)]
SLABS = ["ST08"] + R(12, 17)
COLS = ["ST06"] + R(12, 17)
FRAME = R(4, 10) + R(12, 18)
STMAP = {"F": "ST04", "TB": "ST04", "RW": "ST06", "CF": "ST09", "RP": "ST10", "LP": "ST05", "SP-S": "ST05",
         "SP-N": "ST05", "OH-S": "ST18", "OH-N": "ST18", "HR": "ST18", "C-L0": "ST06", "S-L0": "ST08",
         "C-L1": "ST12", "S-L1": "ST12", "C-L2": "ST13", "S-L2": "ST13", "C-L3": "ST14", "S-L3": "ST14",
         "C-L4": "ST15", "S-L4": "ST15", "C-L5": "ST16", "S-L5": "ST16", "C-LT": "ST17", "S-LT": "ST17",
         "ST-0": "ST08", "ST-1": "ST12", "ST-2": "ST13", "ST-3": "ST14", "ST-4": "ST15", "ST-5": "ST16", "ST-6": "ST17"}

# file → (group label, rule(page, title) → stages)
def structure(p, t):
    if p <= 2: return ["ST03", "ST04", "ST06", "ST07", "ST09", "ST10"]
    if p <= 5: return ["ST04"] + COLS
    if p <= 8: return ["ST04"]
    if p <= 12: return ["ST08"]
    if p <= 16: return R(12, 16)
    if p <= 20: return ["ST17"]
    if p == 21: return R(12, 17)
    if p == 22: return ["ST05", "ST08", "ST09"] + R(12, 18)
    if p <= 26: return FRAME
    return ["ST02"]

def reinforcement(p, t):
    m = re.match(r"STEEL FOR STAGE ([A-Z0-9-]+) ", t)
    if m: return [STMAP.get(m.group(1), "")]
    if p == 1: return FRAME
    if p <= 14: return ["ST04"]
    if p <= 16: return COLS
    if p <= 20: return ["ST08"]
    if p <= 24: return R(12, 16)
    return ["ST17"]

def civil(p, t):
    return {1: R(19, 23), 2: R(19, 23), 3: R(19, 23) + ["ST18"], 4: ["ST27", "ST32"], 5: ["ST26", "ST33"],
            6: ["ST24", "ST32"], 7: ["ST24", "ST32"], 8: ["ST24", "ST33", "ST35"], 9: ["ST33"], 10: ["ST33"],
            11: ["ST24", "ST33", "ST18"], 12: ["ST05", "ST18", "ST30"], 13: ["ST33", "ST37"],
            14: ["ST09", "ST10", "ST33"]}.get(p, [])

def mep(p, t):
    return {1: ["ST25", "ST36"], 2: ["ST05", "ST36"], 3: ["ST25", "ST29"], 4: SLABS, 5: SLABS, 6: ["ST25"],
            7: ["ST05", "ST18"], 8: ["ST34"], 9: ["ST34"], 10: SLABS, 11: ["ST34", "ST35"], 12: ["ST34"]}.get(p, [])

def water(p, t):
    return {1: ["ST25", "ST36"], 2: ["ST17", "ST28"], 3: ["ST28"], 4: ["ST18", "ST25"], 5: ["ST36"],
            6: ["ST25"], 7: ["ST09", "ST36"], 8: ["ST09", "ST36"], 9: ["ST08", "ST25"]}.get(p, [])

def elec(p, t):
    return {1: ["ST12", "ST34"], 2: ["ST08", "ST35"], 3: ["ST34"], 4: ["ST35"], 5: ["ST35"]}.get(p, [])

def unit_services(p, t):
    if p in (1, 3): return SLABS + ["ST31"]
    if p in (2, 4): return ["ST31"]
    return ["ST25", "ST29", "ST31"]

def unit_plans(p, t):
    return R(19, 23) + ["ST31"] if p in (9, 10, 11) else []

RULES = {
    "78-93-Structure-Set.pdf": ("Structure set", structure),
    "78-93-Reinforcement-Details.pdf": ("Reinforcement details and stage steel", reinforcement),
    "78-93-Common-Civil-Drawings.pdf": ("Common civil: walls, plaster, windows, granite, lift, parking", civil),
    "78-93-Common-MEP-Set.pdf": ("Common MEP: water, stacks, sleeves, electrical", mep),
    "78-93-Common-Water-Drainage-Terrace.pdf": ("Water, drainage and terrace", water),
    "78-93-Common-Electrical-Routes.pdf": ("Common electrical routes, ventilation, fire", elec),
    "78-93-Sleeve-Pack.pdf": ("Beam sleeves (drains + AC) before the pour", lambda p, t: SLABS),
    "78-93-Unit-Services-Conduit-Plumbing.pdf": ("Unit conduit and plumbing (hostel + office)", unit_services),
    "78-93-Wall-Conduit-Elevations.pdf": ("Wall-by-wall conduit (owners' fit-out)", lambda p, t: ["ST31"]),
    "78-93-Wet-Room-Plumbing-Sheets.pdf": ("Wet-room plumbing sheets", lambda p, t: ["ST25", "ST29", "ST31"]),
    "78-93-Unit-Plans-Final-RevK1.pdf": ("Unit plans (Rev K1)", unit_plans),
    "78-93-Elevations-Final.pdf": ("Elevations", lambda p, t: ["ST24", "ST27", "ST32"]),
    "78-93-Site-Works-Drawings.pdf": ("Site works", lambda p, t: ["ST37"]),
    "78-93-Owner-Pack-South-Plot93.pdf": ("Owner's pack · south wing (plot 93)", lambda p, t: ["ST31"]),
    "78-93-Owner-Pack-North-Plot78.pdf": ("Owner's pack · north wing (plot 78)", lambda p, t: ["ST31"]),
}

out = []
for name, (group, rule) in RULES.items():
    path = os.path.join(folder, name)
    if not os.path.exists(path):
        print("missing", name); continue
    for i, page in enumerate(PdfReader(path).pages):
        parts = [p.strip() for p in (page.extract_text() or "").split("\n") if p.strip()]
        title = parts[0] if parts else ""
        sub = parts[1] if len(parts) > 1 else ""
        stages = sorted({s for s in rule(i + 1, title) if s})
        out.append({"file": name, "page": i + 1, "title": title[:140], "sub": sub[:140], "group": group, "stages": stages})

dest = os.path.join(os.path.dirname(__file__), "..", "src", "data", "drawing-index-7893.json")
with open(dest, "w") as f:
    json.dump(out, f, ensure_ascii=False, separators=(",", ":"))
print(len(out), "sheets,", sum(1 for e in out if e["stages"]), "linked to stages ->", dest)
