"""Generate data/2017_ce1.js and data/2017_ce2.js from the extracted GATE 2017
answer keys.

Question text lives in the scanned PDFs, so each question references its
cropped page image (assets/images/2017/<paper>-qNN.png) via `image`. Answer
keys, marks, negative marks and NAT acceptance ranges come from
gate2017/CE*_AnsKey.pdf (text layer), so scoring data is authoritative.
"""
import re, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Q1-55 are the Civil Engineering section, Q56-65 General Aptitude.
GA_START = 56

PAPERS = [
    {
        "file": "2017_ce1.js",
        "pdf_key": os.path.join(ROOT, "gate2017/CE1_AnsKey.pdf"),
        "fallback_txt": "/tmp/g17/ce1_key.txt",
        "registry_key": "2017-CE1",
        "title": "GATE Civil Engineering 2017 CE1",
        "img_prefix": "2017-ce1",
        "aliases": ["2017-1", "2017_ce1"],
    },
    {
        "file": "2017_ce2.js",
        "pdf_key": os.path.join(ROOT, "gate2017/CE2_AnsKey.pdf"),
        "fallback_txt": "/tmp/g17/ce2_key.txt",
        "registry_key": "2017-CE2",
        "title": "GATE Civil Engineering 2017 CE2",
        "img_prefix": "2017-ce2",
        "aliases": ["2017-2", "2017_ce2"],
    },
]

ROW = re.compile(r"^\s*(\d+)\s+(MCQ|MSQ|NAT|MTA)\s+(\S+)\s+(.*?)\s+(\d+)\s*$")


def parse_key_pdf(pdf_path):
    import fitz
    doc = fitz.open(pdf_path)
    lines = []
    for page in doc:
        for l in page.get_text().splitlines():
            l = l.strip()
            if l:
                lines.append(l)
    header = ["Q. No.", "Type", "Section", "Key", "Marks"]
    i = 0
    rows = {}
    while i < len(lines):
        if lines[i] == "Q. No." and lines[i:i+5] == header:
            i += 5
            continue
        if lines[i].isdigit() and int(lines[i]) == len(rows) + 1:
            qnum = int(lines[i])
            qtype = lines[i+1]
            sec = lines[i+2]
            key = lines[i+3]
            marks = int(lines[i+4])
            rows[qnum] = {"type": qtype, "key": key, "marks": marks}
            i += 5
        else:
            i += 1
    return rows


def parse_key_txt(path):
    rows = {}
    for line in open(path):
        line = line.rstrip("\n")
        if not line.strip() or line.lstrip().startswith("Q. No."):
            continue
        m = ROW.match(line)
        if not m:
            m2 = re.match(r"^\s*(\d+)\s+(MCQ|MSQ|NAT|MTA)\s+(\S+)\s+(.*?)\s+(\d+)\s*$",
                          " ".join(line.split()))
            if not m2:
                continue
            m = m2
        qnum = int(m.group(1))
        qtype = m.group(2)
        key = " ".join(m.group(4).split())
        marks = int(m.group(5))
        rows[qnum] = {"type": qtype, "key": key, "marks": marks}
    return rows


def parse_key(paper):
    if os.path.exists(paper.get("pdf_key", "")):
        try:
            rows = parse_key_pdf(paper["pdf_key"])
            if len(rows) == 65:
                return rows
        except Exception:
            pass
    return parse_key_txt(paper["fallback_txt"])


def negative_for(marks):
    if marks == 1:
        return "1/3"
    if marks == 2:
        return "0.6666666666666666"
    return "0"


def key_literal(key, qtype, marks):
    """Return (correctAnswer_js, tolerance_js, ranges_js, is_mta)."""
    k = key.strip()
    low = k.lower()
    if low in ("mark to all", "marks to all", "mta"):
        return '"Marks to All"', "null", None, True
    if qtype == "NAT":
        rng = re.match(r"^\s*(-?[\d.]+)\s*to\s*(-?[\d.]+)\s*$", k)
        if rng:
            lo, hi = float(rng.group(1)), float(rng.group(2))
            mid = round((lo + hi) / 2.0, 4)
            tol = round((hi - lo) / 2.0, 4) if lo != hi else "null"
            tol_str = repr(tol) if tol != "null" else "null"
            return repr(mid), tol_str, "[[%s, %s]]" % (repr(lo), repr(hi)), False
        try:
            val = float(k)
            return repr(val), "null", None, False
        except ValueError:
            return "null", "null", None, False
    # MCQ: "A or B" -> "A OR B" (scoring splits on " OR ")
    orm = re.match(r"^\s*([A-D])\s+or\s+([A-D])\s*$", k, re.I)
    if orm:
        return '"%s OR %s"' % (orm.group(1).upper(), orm.group(2).upper()), "null", None, False
    return '"%s"' % k.upper(), "null", None, False


def build(paper):
    rows = parse_key(paper)
    missing = [n for n in range(1, 66) if n not in rows]
    if missing:
        raise SystemExit("missing key rows in %s: %s" % (paper["registry_key"], missing))

    qs = []
    for n in range(1, 66):
        r = rows[n]
        section = "GA" if n >= GA_START else "CE"
        qid = "%s-%s-Q%d" % (paper["registry_key"], section, n)
        img = "assets/images/2017/%s-q%02d.png" % (paper["img_prefix"], n)
        correct, tolerance, ranges, is_mta = key_literal(r["key"], r["type"], r["marks"])
        qtype = "NAT" if r["type"] == "NAT" else "MCQ"
        neg = "0" if qtype == "NAT" else negative_for(r["marks"])

        parts = [
            "    {",
            '      "id": "%s",' % qid,
            '      "section": "%s",' % section,
            '      "type": "%s",' % qtype,
            '      "marks": %d,' % r["marks"],
            '      "negativeMarks": %s,' % neg,
            '      "image": "%s",' % img,
            '      "statement": "",',
        ]
        if is_mta:
            parts.append('      "isMTA": true,')
        if qtype == "MCQ":
            parts.append('      "options": [')
            parts.append('        { "id": "A", "text": "", "image": null },')
            parts.append('        { "id": "B", "text": "", "image": null },')
            parts.append('        { "id": "C", "text": "", "image": null },')
            parts.append('        { "id": "D", "text": "", "image": null }')
            parts.append('      ],')
        else:
            parts.append('      "options": [],')
        if correct is not None:
            parts.append('      "correctAnswer": %s,' % correct)
        if ranges:
            parts.append('      "ranges": %s,' % ranges)
        parts.append('      "tolerance": %s' % tolerance)
        parts.append("    }")
        qs.append("\n".join(parts))

    body = ",\n".join(qs)
    out = []
    out.append("window.GATE_PAPERS = window.GATE_PAPERS || {};")
    out.append("")
    out.append('window.GATE_PAPERS["%s"] = {' % paper["registry_key"])
    out.append('  "year": 2017,')
    out.append('  "branch": "CE",')
    out.append('  "title": "%s",' % paper["title"])
    out.append('  "durationMinutes": 180,')
    out.append('  "sections": [')
    out.append('    { "id": "CE", "name": "Civil Engineering", "totalMarks": 85 },')
    out.append('    { "id": "GA", "name": "General Aptitude", "totalMarks": 15 }')
    out.append("  ],")
    out.append('  "questions": [')
    out.append(body)
    out.append("  ]")
    out.append("};")
    out.append("")
    out.append("// Aliases for backward compatibility and flexible routing")
    for a in paper["aliases"]:
        out.append('window.GATE_PAPERS["%s"] = window.GATE_PAPERS["%s"];'
                   % (a, paper["registry_key"]))
    return "\n".join(out) + "\n", rows


if __name__ == "__main__":
    for p in PAPERS:
        text, rows = build(p)
        dest = os.path.join(ROOT, "data", p["file"])
        with open(dest, "w") as fh:
            fh.write(text)
        mta = [n for n, r in rows.items() if "all" in r["key"].lower()]
        nat = [n for n, r in rows.items() if r["type"] == "NAT"]
        print("%s: 65 questions written (%d NAT, MTA at %s)"
              % (p["file"], len(nat), mta or "none"))
