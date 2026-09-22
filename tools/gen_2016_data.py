"""Generate cropped images and authoritative data files for GATE 2016 Civil Engineering.

Inputs:
  gate2016/s5_ce-1.pdf          (Session 5, CE1 Question Paper)
  gate2016/s7_ce-2.pdf          (Session 7, CE2 Question Paper)
  gate2016/ce-slot-1_anskey.pdf (Session 5, CE1 Official Answer Key)
  gate2016/ce-slot2_anskey.pdf  (Session 7, CE2 Official Answer Key)

Outputs:
  assets/images/2016/2016-ce1-q01.png ... q65.png
  assets/images/2016/2016-ce2-q01.png ... q65.png
  data/2016_ce1.js
  data/2016_ce2.js
"""
import os
import re
import pymupdf

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMAGE_DIR = os.path.join(ROOT, "assets", "images", "2016")
DATA_DIR = os.path.join(ROOT, "data")
DPI = 200

PAPERS = [
    {
        "registry_key": "2016-CE1",
        "title": "GATE Civil Engineering 2016 CE1",
        "aliases": ["2016-1", "2016_ce1", "2016"],
        "img_prefix": "2016-ce1",
        "data_file": "2016_ce1.js",
        "pdf_paper": os.path.join(ROOT, "gate2016", "s5_ce-1.pdf"),
        "pdf_key": os.path.join(ROOT, "gate2016", "ce-slot-1_anskey.pdf"),
    },
    {
        "registry_key": "2016-CE2",
        "title": "GATE Civil Engineering 2016 CE2",
        "aliases": ["2016-2", "2016_ce2"],
        "img_prefix": "2016-ce2",
        "data_file": "2016_ce2.js",
        "pdf_paper": os.path.join(ROOT, "gate2016", "s7_ce-2.pdf"),
        "pdf_key": os.path.join(ROOT, "gate2016", "ce-slot2_anskey.pdf"),
    },
]


def parse_answer_key(pdf_path):
    doc = pymupdf.open(pdf_path)
    lines = [l.strip() for page in doc for l in page.get_text().splitlines() if l.strip()]
    header_tokens = {"Q. No", "Q. No Type", "Type", "Section", "Key", "Marks"}
    filtered = [l for l in lines if l not in header_tokens]
    if len(filtered) != 65 * 5:
        raise ValueError(f"Expected 325 tokens in answer key {pdf_path}, got {len(filtered)}")

    key_rows = {}
    for i in range(0, len(filtered), 5):
        qnum_str = filtered[i]
        qtype = filtered[i + 1]
        sec = filtered[i + 2]
        key = filtered[i + 3]
        marks = int(filtered[i + 4])
        qnum = int(qnum_str)

        # In the answer key:
        # GA has Q1..Q10 -> map to global index 56..65
        # CE has Q1..Q55 -> map to global index 1..55
        if "GA" in sec:
            global_idx = 55 + qnum
            section = "GA"
        else:
            global_idx = qnum
            section = "CE"

        key_rows[global_idx] = {
            "orig_qnum": qnum,
            "section": section,
            "type": qtype,
            "key": key,
            "marks": marks,
        }
    return key_rows


def get_crop_bounds(pdf_path):
    doc = pymupdf.open(pdf_path)
    crops = {}  # global_idx (1..65) -> (pno (1-indexed), top_pt, bottom_pt)

    # GA section (pages 1 to 3) -> global 56..65
    for pno in range(3):
        page = doc[pno]
        blocks = page.get_text("blocks")
        q_heads = []
        end_y0 = None
        for b in blocks:
            txt = b[4].strip()
            first = txt.split("\n")[0].strip()
            if "END OF" in txt:
                end_y0 = b[1]
            if re.search(r"Q\.\s*\d+\s*[–-]\s*Q\.\s*\d+", first):
                continue
            m = re.match(r"^Q\.\s*(\d+)\b", first)
            if m:
                qnum = int(m.group(1))
                q_heads.append((qnum, b[1]))

        q_heads.sort(key=lambda x: x[1])
        for idx, (qnum, y0) in enumerate(q_heads):
            top = max(0.0, y0 - 4)
            if idx + 1 < len(q_heads):
                bottom = q_heads[idx + 1][1] - 4
            else:
                bottom = (end_y0 - 4) if end_y0 else 788.0
            global_idx = 55 + qnum
            crops[global_idx] = (pno + 1, top, bottom)

    # CE section (pages 4 to end) -> global 1..55
    for pno in range(3, len(doc)):
        page = doc[pno]
        blocks = page.get_text("blocks")
        q_heads = []
        instr_boxes = []
        end_y0 = None
        for b in blocks:
            txt = b[4].strip()
            first = txt.split("\n")[0].strip()
            if "END OF" in txt:
                end_y0 = b[1]
            if re.search(r"Q\.\s*\d+\s*[–-]\s*Q\.\s*\d+", first):
                instr_boxes.append(b[1])
                continue
            m = re.match(r"^Q\.\s*(\d+)\b", first)
            if m:
                qnum = int(m.group(1))
                q_heads.append((qnum, b[1]))

        q_heads.sort(key=lambda x: x[1])
        for idx, (qnum, y0) in enumerate(q_heads):
            top = max(0.0, y0 - 4)
            if idx + 1 < len(q_heads):
                next_y0 = q_heads[idx + 1][1]
                between = [iy for iy in instr_boxes if y0 < iy < next_y0]
                if between:
                    bottom = between[0] - 4
                else:
                    bottom = next_y0 - 4
            else:
                bottom = (end_y0 - 4) if end_y0 else 788.0
            crops[qnum] = (pno + 1, top, bottom)

    if len(crops) != 65:
        raise ValueError(f"Expected 65 questions cropped from {pdf_path}, found {len(crops)}")
    return crops


def crop_images(pdf_path, crops, img_prefix):
    os.makedirs(IMAGE_DIR, exist_ok=True)
    doc = pymupdf.open(pdf_path)
    count = 0
    for q_idx in range(1, 66):
        pno, top, bottom = crops[q_idx]
        page = doc[pno - 1]
        clip = pymupdf.Rect(0, top, page.rect.width, bottom)
        pix = page.get_pixmap(clip=clip, dpi=DPI)
        out_filename = f"{img_prefix}-q{q_idx:02d}.png"
        out_path = os.path.join(IMAGE_DIR, out_filename)
        pix.save(out_path)
        count += 1
    return count


def format_key_literal(raw_key, qtype, marks):
    k = raw_key.strip()
    low = k.lower()
    if "mta" in low or "marks to all" in low or "mark to all" in low:
        return '"Marks to All"', "null", None, True

    if qtype == "NAT":
        # Handle "lo : hi" or "lo to hi"
        rng = re.match(r"^\s*(-?[\d.]+)\s*(?::|to)\s*(-?[\d.]+)\s*$", k)
        if rng:
            lo, hi = float(rng.group(1)), float(rng.group(2))
            mid = round((lo + hi) / 2.0, 4)
            tol = round((hi - lo) / 2.0, 4) if lo != hi else "null"
            tol_str = repr(tol) if tol != "null" else "null"
            return repr(mid), tol_str, f"[[{repr(lo)}, {repr(hi)}]]", False
        try:
            val = float(k)
            return repr(val), "null", None, False
        except ValueError:
            return "null", "null", None, False

    # MCQ
    orm = re.match(r"^\s*([A-D])\s+or\s+([A-D])\s*$", k, re.I)
    if orm:
        return f'"{orm.group(1).upper()} OR {orm.group(2).upper()}"', "null", None, False
    return f'"{k.upper()}"', "null", None, False


def negative_for(marks, qtype):
    if qtype == "NAT":
        return "0"
    if marks == 1:
        return "1/3"
    if marks == 2:
        return "0.6666666666666666"
    return "0"


def generate_data_js(paper, key_rows):
    qs = []
    for n in range(1, 66):
        r = key_rows[n]
        section = r["section"]
        qid = f"{paper['registry_key']}-{section}-Q{n}"
        img_rel = f"assets/images/2016/{paper['img_prefix']}-q{n:02d}.png"
        correct, tolerance, ranges, is_mta = format_key_literal(r["key"], r["type"], r["marks"])
        qtype = "NAT" if r["type"] == "NAT" else "MCQ"
        neg = "0" if (qtype == "NAT" or is_mta) else negative_for(r["marks"], qtype)

        parts = [
            "    {",
            f'      "id": "{qid}",',
            f'      "section": "{section}",',
            f'      "type": "{qtype}",',
            f'      "marks": {r["marks"]},',
            f'      "negativeMarks": {neg},',
            f'      "image": "{img_rel}",',
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
            parts.append(f'      "correctAnswer": {correct},')
        if ranges:
            parts.append(f'      "ranges": {ranges},')
        parts.append(f'      "tolerance": {tolerance}')
        parts.append("    }")
        qs.append("\n".join(parts))

    body = ",\n".join(qs)
    out = [
        "window.GATE_PAPERS = window.GATE_PAPERS || {};",
        "",
        f'window.GATE_PAPERS["{paper["registry_key"]}"] = {{',
        '  "year": 2016,',
        '  "branch": "CE",',
        f'  "title": "{paper["title"]}",',
        '  "durationMinutes": 180,',
        '  "sections": [',
        '    { "id": "CE", "name": "Civil Engineering", "totalMarks": 85 },',
        '    { "id": "GA", "name": "General Aptitude", "totalMarks": 15 }',
        "  ],",
        '  "questions": [',
        body,
        "  ]",
        "};",
        "",
        "// Aliases for backward compatibility and flexible routing",
    ]
    for alias in paper["aliases"]:
        out.append(f'window.GATE_PAPERS["{alias}"] = window.GATE_PAPERS["{paper["registry_key"]}"];')
    out.append("")
    return "\n".join(out)


def main():
    print("=== Processing GATE 2016 Data and Images ===")
    for paper in PAPERS:
        print(f"\n--- {paper['registry_key']} ---")
        key_rows = parse_answer_key(paper["pdf_key"])
        print(f"Parsed {len(key_rows)} answer key entries from {paper['pdf_key']}")

        crops = get_crop_bounds(paper["pdf_paper"])
        print(f"Computed {len(crops)} crop bounds from {paper['pdf_paper']}")

        cropped_count = crop_images(paper["pdf_paper"], crops, paper["img_prefix"])
        print(f"Cropped {cropped_count} question images into {IMAGE_DIR}")

        js_content = generate_data_js(paper, key_rows)
        dest_js = os.path.join(DATA_DIR, paper["data_file"])
        with open(dest_js, "w") as f:
            f.write(js_content)
        print(f"Wrote {dest_js} ({len(js_content)} bytes)")


if __name__ == "__main__":
    main()
