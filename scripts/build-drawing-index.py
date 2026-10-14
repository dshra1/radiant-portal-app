"""Builds src/data/drawing-index.json: one entry per sheet (page) of the PMC
drawing PDFs, with its title, flat and room, so every programme stage can link
straight to its sheets and site photos can be checked against them.

Run after the drawing sets are revised:
    python3 scripts/build-drawing-index.py <folder with the PDFs>
"""
import json, re, sys, glob, os
from pypdf import PdfReader

folder = sys.argv[1] if len(sys.argv) > 1 else "."
out = []
for path in sorted(glob.glob(os.path.join(folder, "Cyber-Enclave-*.pdf"))):
    name = re.sub(r"_\d+(\.pdf)$", r"\1", os.path.basename(path))
    if name != os.path.basename(path) and os.path.exists(os.path.join(folder, name)):
        continue  # keep the newest copy only
    if "-VE." in name:
        continue
    reader = PdfReader(path)
    for i, page in enumerate(reader.pages):
        text = (page.extract_text() or "").split("\n")
        parts = [p.strip() for p in text if p.strip()]
        title = parts[0] if parts else ""
        sub = parts[1] if len(parts) > 1 else ""
        m = re.match(r"FLAT-0(\d) · ([AB]\d{2}) · (.+?)( \(CONTINUED\))?$", title)
        entry = {"file": name, "page": i + 1, "title": title[:140], "sub": sub[:140]}
        if m:
            entry["flat"] = int(m.group(1))
            entry["room"] = m.group(3).title().replace("Bhk", "BHK")
            entry["roomCode"] = m.group(2)
            if m.group(4):
                entry["cont"] = True
        out.append(entry)

dest = os.path.join(os.path.dirname(__file__), "..", "src", "data", "drawing-index.json")
with open(dest, "w") as f:
    json.dump(out, f, ensure_ascii=False, separators=(",", ":"))
print(len(out), "sheets ->", dest)
