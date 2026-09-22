import re, subprocess, sys, os

DPI = 200
SCALE = DPI / 72.0
PW_PX = 1654  # A4 width at 200dpi (595pt * 2.7778)

pat = re.compile(r'<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">(.*?)</word>')
num_pat = re.compile(r'^\d+$')


def bbox_html(pdf, out):
    subprocess.run(["pdftotext", "-bbox", pdf, out], check=True)


def page_layout(html_path):
    pages = re.findall(r'<page width="([\d.]+)" height="([\d.]+)">(.*?)</page>',
                       open(html_path).read(), re.S)
    out = []
    for w, ht, body in pages:
        words = []
        for m in pat.finditer(body):
            words.append((float(m.group(1)), float(m.group(2)), float(m.group(3)),
                          float(m.group(4)), m.group(5)))
        out.append((float(w), float(ht), words))
    return out


def find_headers(words):
    """Locate each 'Question Number : N' header, returning (y_pt, qnum).

    The PDF text layer sometimes splits a multi-digit question number into
    separate tokens (e.g. '12' arrives as '1' then '2'), so consecutive
    numeric tokens are joined until a non-numeric token ('Correct') appears.
    """
    heads = []
    for idx, (x0, y0, x1, y1, txt) in enumerate(words):
        if txt == 'Question' and idx + 1 < len(words) and words[idx + 1][4] == 'Number':
            digits = []
            for j in range(idx + 2, len(words)):
                tok = words[j][4]
                if num_pat.match(tok):
                    digits.append(tok)
                elif tok == ':' or tok == '':
                    continue
                else:
                    break
            if digits:
                heads.append((y0, int(''.join(digits))))
    return heads


def build_jobs(pdf, name, tmp):
    html = os.path.join(tmp, "%s_bbox.html" % name)
    bbox_html(pdf, html)
    pages = page_layout(html)
    jobs = []
    for pno, (pw, ph, words) in enumerate(pages, 1):
        heads = find_headers(words)
        for k, (y, qnum) in enumerate(heads):
            top = max(0.0, y - 4)
            bottom = heads[k + 1][0] - 4 if k + 1 < len(heads) else ph - 20
            jobs.append((qnum, pno, top, bottom))
    return jobs


def crop(pdf, pno, top_pt, bottom_pt, outpath, tmp):
    h_px = max(20, int((bottom_pt - top_pt) * SCALE))
    y_px = int(top_pt * SCALE)
    stem = os.path.join(tmp, "_tmpcrop")
    subprocess.run(["pdftoppm", "-png", "-r", str(DPI),
                    "-f", str(pno), "-l", str(pno),
                    "-x", "0", "-y", str(y_px),
                    "-W", str(PW_PX), "-H", str(h_px),
                    pdf, stem], check=True)
    src = "%s-%02d.png" % (stem, pno)
    if os.path.exists(src):
        os.rename(src, outpath)
        return True
    return False


if __name__ == "__main__":
    pdf, name, dest, tmp = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]
    if not os.path.isdir(dest):
        os.makedirs(dest)
    jobs = build_jobs(pdf, name, tmp)
    print("%s: %d question headers found" % (name, len(jobs)))
    ok = 0
    for qnum, pno, top, bottom in jobs:
        out = os.path.join(dest, "%s-q%02d.png" % (name, qnum))
        if crop(pdf, pno, top, bottom, out, tmp):
            ok += 1
    print("cropped %d files" % ok)
    if jobs:
        print("page span: %d..%d" % (jobs[0][1], jobs[-1][1]))
