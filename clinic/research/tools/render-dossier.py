#!/usr/bin/env python3
"""Render the research dossier to a standalone, print-friendly HTML page.

    python3 clinic/research/tools/render-dossier.py

Reads  clinic/research/<name>.md  and writes the matching .html next to it.
The stylesheet is the one the design system uses — same tokens, same
typography, same dark-mode and print rules — so the rendered page and the
Markdown stay in step instead of drifting apart by hand.
"""

import html
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
RESEARCH = os.path.dirname(HERE)

# ── the design system ──────────────────────────────────────────────────────
# Kept in one place so the rendered page and the source Markdown agree.
CSS = """
  :root{
    --ink:#12252c;
    --ink-soft:#3f5a63;
    --paper:#fbf9f4;
    --card:#ffffff;
    --line:#e3ddd0;
    --accent:#0d6e63;
    --accent-soft:#e6f1ed;
    --gold:#9a7434;
    --warn:#8a4b1e;
    --warn-bg:#fdf2e6;
    --radius:14px;
    --maxw:860px;
  }
  @media (prefers-color-scheme: dark){
    :root{
      --ink:#eef2f1;
      --ink-soft:#a9bcc1;
      --paper:#0d1417;
      --card:#141e22;
      --line:#25353b;
      --accent:#5cc8b5;
      --accent-soft:#122d2a;
      --gold:#c8a25e;
      --warn:#e0a878;
      --warn-bg:#25190f;
    }
  }
  *{box-sizing:border-box}
  html{-webkit-text-size-adjust:100%}
  body{
    margin:0;
    background:var(--paper);
    color:var(--ink);
    font-family:"Segoe UI","Noto Naskh Arabic",Tahoma,"Helvetica Neue",Arial,sans-serif;
    font-size:17px;
    line-height:1.85;
  }
  .wrap{max-width:var(--maxw);margin:0 auto;padding:0 20px 80px}
  /* ── cover ─────────────────────────────────────────── */
  header.cover{padding:64px 0 36px;border-bottom:1px solid var(--line);margin-bottom:44px}
  .kicker{
    font-size:13px;letter-spacing:.16em;color:var(--accent);
    text-transform:uppercase;font-weight:700;margin:0 0 14px
  }
  h1{font-size:clamp(30px,6vw,46px);line-height:1.25;margin:0 0 10px;font-weight:800;letter-spacing:-.01em}
  .subtitle{font-size:clamp(16px,2.4vw,19px);color:var(--ink-soft);margin:0 0 22px;max-width:640px}
  .meta{font-size:13.5px;color:var(--ink-soft);display:flex;flex-wrap:wrap;gap:8px 18px}
  .meta span{white-space:nowrap}
  .rule{height:3px;width:64px;background:var(--gold);border-radius:2px;margin:26px 0 0}
  /* ── sections ──────────────────────────────────────── */
  section{margin:0 0 52px;scroll-margin-top:24px}
  h2{
    font-size:clamp(21px,3.4vw,27px);font-weight:800;margin:0 0 6px;
    display:flex;align-items:baseline;gap:12px;line-height:1.4
  }
  h2 .num{
    font-size:13px;font-weight:700;color:var(--accent);background:var(--accent-soft);
    border-radius:8px;padding:3px 9px;flex:0 0 auto;line-height:1.6;letter-spacing:.06em
  }
  h3{font-size:17.5px;font-weight:700;margin:30px 0 8px}
  p{margin:0 0 14px}
  .lead{color:var(--ink-soft);margin-bottom:22px;font-size:16px}
  ul,ol{margin:0 0 16px;padding-inline-start:22px}
  li{margin-bottom:8px}
  strong{font-weight:700}
  a{color:var(--accent);text-decoration:none;border-bottom:1px solid color-mix(in srgb,var(--accent) 35%,transparent)}
  a:hover{border-bottom-color:var(--accent)}
  code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:.86em;background:var(--accent-soft);color:var(--accent);padding:1px 6px;border-radius:5px;direction:ltr;display:inline-block}
  /* ── stat strip ────────────────────────────────────── */
  .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:26px 0 8px}
  .stat{background:var(--card);border:1px solid var(--line);border-radius:var(--radius);padding:16px 12px;text-align:center}
  .stat b{display:block;font-size:26px;line-height:1.2;color:var(--accent);font-weight:800}
  .stat span{display:block;font-size:12.5px;color:var(--ink-soft);margin-top:4px;line-height:1.5}
  /* ── tables ────────────────────────────────────────── */
  .tablewrap{overflow-x:auto;margin:0 0 18px;border:1px solid var(--line);border-radius:var(--radius);background:var(--card)}
  table{border-collapse:collapse;width:100%;font-size:15px;min-width:480px}
  th,td{padding:11px 14px;text-align:start;border-bottom:1px solid var(--line);vertical-align:top}
  th{background:var(--accent-soft);color:var(--accent);font-size:13px;font-weight:700;letter-spacing:.03em;white-space:nowrap}
  tr:last-child td{border-bottom:0}
  td.num{font-variant-numeric:tabular-nums;white-space:nowrap;direction:ltr;text-align:start}
  /* ── cards ─────────────────────────────────────────── */
  .cards{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:18px 0}
  .card{background:var(--card);border:1px solid var(--line);border-radius:var(--radius);padding:16px 18px}
  .card h4{margin:0 0 6px;font-size:15.5px;font-weight:700}
  .card p{margin:0;font-size:14.5px;color:var(--ink-soft);line-height:1.7}
  .card .tag{font-size:11.5px;color:var(--gold);font-weight:700;letter-spacing:.05em;display:block;margin-bottom:5px}
  /* ── surprise blocks ───────────────────────────────── */
  .surprise{
    background:var(--card);border:1px solid var(--line);border-inline-start:4px solid var(--gold);
    border-radius:var(--radius);padding:18px 20px;margin:0 0 14px
  }
  .surprise h4{margin:0 0 6px;font-size:16px;font-weight:800}
  .surprise p{margin:0;font-size:15px;color:var(--ink-soft)}
  .surprise .why{display:block;margin-top:8px;font-size:13px;color:var(--gold);font-weight:600}
  /* ── callouts ──────────────────────────────────────── */
  .note{
    background:var(--warn-bg);border:1px solid color-mix(in srgb,var(--warn) 30%,transparent);
    border-radius:var(--radius);padding:16px 18px;margin:0 0 18px;font-size:15px
  }
  .note b{color:var(--warn)}
  .quote{border-inline-start:3px solid var(--line);padding-inline-start:16px;margin:0 0 16px;color:var(--ink-soft);font-size:15.5px}
  .quote cite{display:block;font-size:13px;color:var(--gold);font-style:normal;margin-top:4px}
  /* ── timeline ──────────────────────────────────────── */
  .timeline{list-style:none;padding:0;margin:18px 0}
  .timeline li{
    position:relative;padding-inline-start:26px;padding-bottom:16px;
    border-inline-start:1px solid var(--line);margin-inline-start:6px
  }
  .timeline li:last-child{border-inline-start-color:transparent;padding-bottom:0}
  .timeline li::before{
    content:"";position:absolute;inset-inline-start:-5px;top:9px;width:9px;height:9px;
    border-radius:50%;background:var(--accent)
  }
  .timeline .yr{font-weight:800;color:var(--accent);font-variant-numeric:tabular-nums;margin-inline-end:8px;font-size:14.5px}
  /* ── toc ───────────────────────────────────────────── */
  .toc{background:var(--card);border:1px solid var(--line);border-radius:var(--radius);padding:18px 22px;margin:0 0 46px}
  .toc h3{margin:0 0 10px;font-size:13px;letter-spacing:.14em;color:var(--accent);text-transform:uppercase}
  .toc ol{margin:0;padding-inline-start:20px;columns:2;column-gap:28px;font-size:14.5px}
  .toc li{margin-bottom:5px;break-inside:avoid}
  .toc a{border-bottom:0}
  .toc a:hover{text-decoration:underline}
  /* ── sources ───────────────────────────────────────── */
  .src{font-size:14px;color:var(--ink-soft);list-style:none;padding:0}
  .src li{padding:9px 0;border-bottom:1px solid var(--line);margin:0}
  .src li:last-child{border-bottom:0}
  .src .u{direction:ltr;text-align:start;display:block;font-size:12.5px;word-break:break-all;color:var(--accent);margin-top:2px}
  footer{border-top:1px solid var(--line);padding-top:22px;font-size:13px;color:var(--ink-soft)}
  @media (max-width:640px){
    body{font-size:16px}
    .stats{grid-template-columns:1fr 1fr}
    .cards{grid-template-columns:1fr}
    .toc ol{columns:1}
    header.cover{padding-top:40px}
  }
  @media print{
    body{background:#fff;color:#000;font-size:11.5pt}
    .toc{display:none}
    section{break-inside:avoid-page}
    a{color:#000;border:0}
  }
"""

TEMPLATE = """<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="{description}">
<style>{css}</style>
</head>
<body>
<div class="wrap">

<header class="cover">
  <p class="kicker">ملف تعريفي — دوسيه</p>
  <h1>{h1}</h1>
  <p class="subtitle">
    {subtitle}
  </p>
  <div class="meta">
{meta}  </div>
  <div class="rule"></div>
</header>

<nav class="toc">
  <h3>محتويات الملف</h3>
  <ol>
{toc}  </ol>
</nav>

{body}

<footer>
  <p>{footer}</p>
</footer>

</div>
</body>
</html>
"""


# ── inline markdown ────────────────────────────────────────────────────────
def inline(text):
    """Escape, then re-apply the inline markdown the dossier actually uses."""
    out = html.escape(text, quote=False)

    # `code` — extracted first so its contents are not touched further.
    codes = []

    def stash(m):
        codes.append(m.group(1))
        return f"\x00CODE{len(codes) - 1}\x00"

    out = re.sub(r"`([^`]+)`", stash, out)

    # [text](url)
    out = re.sub(r"\[([^\]]+)\]\(([^)\s]+)\)", r'<a href="\2">\1</a>', out)

    # **bold** then *italic*
    out = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", out)
    out = re.sub(r"(?<![\w*])\*([^*\n]+)\*(?![\w*])", r"<em>\1</em>", out)

    for i, c in enumerate(codes):
        out = out.replace(f"\x00CODE{i}\x00", f"<code>{c}</code>")

    return out


def is_table_row(line):
    return line.strip().startswith("|") and line.strip().endswith("|")


def is_separator(line):
    s = line.strip()
    return bool(s) and set(s) <= set("|-: ") and "-" in s


def render_table(rows):
    """rows[0] is the header; the separator row is dropped."""
    out = ['<div class="tablewrap"><table>']
    header = [c.strip() for c in rows[0].strip().strip("|").split("|")]
    out.append("<thead><tr>" + "".join(f"<th>{inline(c)}</th>" for c in header) + "</tr></thead><tbody>")
    for row in rows[1:]:
        cells = [c.strip() for c in row.strip().strip("|").split("|")]
        tds = []
        for c in cells:
            # A cell that is only a number reads better LTR and tabular.
            cls = ' class="num"' if re.fullmatch(r"[\$€]?[\d٠-٩][\d٠-٩٬,\.]*", c) else ""
            tds.append(f"<td{cls}>{inline(c)}</td>")
        out.append("<tr>" + "".join(tds) + "</tr>")
    out.append("</tbody></table></div>")
    return "\n".join(out)


def convert(md):
    """Turn the dossier Markdown into the body HTML."""
    lines = md.split("\n")
    body = []
    toc = []
    section_open = False
    i = 0

    while i < len(lines):
        line = lines[i]

        # ── section heading: "## ٠١ · Title" ──
        m = re.match(r"^##\s+([٠-٩\d]+)\s*·\s*(.+)$", line)
        if m:
            num, title = m.group(1), m.group(2).strip()
            sid = "s" + str(len(toc) + 1)
            toc.append((sid, title))
            # Close the section that was open, then open the next one.
            if section_open:
                body.append("</section>")
                section_open = False
            body.append(f'<section id="{sid}">')
            section_open = True
            body.append(f'  <h2><span class="num">{inline(num)}</span> {inline(title)}</h2>')
            i += 1
            continue

        # ── sub-heading ──
        if line.startswith("### "):
            body.append(f"<h3>{inline(line[4:].strip())}</h3>")
            i += 1
            continue

        if line.startswith("#### "):
            body.append(f"<h4>{inline(line[5:].strip())}</h4>")
            i += 1
            continue

        # ── horizontal rule ──
        if re.match(r"^---+\s*$", line):
            body.append('<hr style="border:0;border-top:1px solid var(--line);margin:34px 0">')
            i += 1
            continue

        # ── table ──
        if is_table_row(line) and i + 1 < len(lines) and is_separator(lines[i + 1]):
            rows = [line]
            i += 2
            while i < len(lines) and is_table_row(lines[i]):
                rows.append(lines[i])
                i += 1
            body.append(render_table(rows))
            continue

        # ── blockquote → callout ──
        if line.startswith(">"):
            quote = []
            while i < len(lines) and lines[i].startswith(">"):
                quote.append(lines[i].lstrip(">").strip())
                i += 1
            text = " ".join(q for q in quote if q)
            body.append(f'<div class="note">{inline(text)}</div>')
            continue

        # ── unordered list ──
        if re.match(r"^[-*]\s+", line):
            items = []
            while i < len(lines) and re.match(r"^[-*]\s+", lines[i]):
                items.append(re.sub(r"^[-*]\s+", "", lines[i]).strip())
                i += 1
            body.append("<ul>" + "".join(f"<li>{inline(it)}</li>" for it in items) + "</ul>")
            continue

        # ── ordered list ──
        if re.match(r"^\d+\.\s+", line):
            items = []
            while i < len(lines) and re.match(r"^\d+\.\s+", lines[i]):
                items.append(re.sub(r"^\d+\.\s+", "", lines[i]).strip())
                i += 1
            body.append("<ol>" + "".join(f"<li>{inline(it)}</li>" for it in items) + "</ol>")
            continue

        # ── paragraph ──
        if line.strip():
            para = []
            while i < len(lines) and lines[i].strip() and not re.match(r"^(#{1,4}\s|>|\||[-*]\s|\d+\.\s|---)", lines[i]):
                para.append(lines[i].strip())
                i += 1
            body.append(f"<p>{inline(' '.join(para))}</p>")
            continue

        i += 1

    # close the last section
    if section_open:
        body.append("</section>")

    toc_html = "\n".join(f'    <li><a href="#{sid}">{html.escape(title)}</a></li>' for sid, title in toc)
    return "\n".join(body), toc_html


def main():
    src = sys.argv[1] if len(sys.argv) > 1 else os.path.join(RESEARCH, "دوسيه-أسامة-شعير.md")
    dst = os.path.splitext(src)[0] + ".html"

    md = open(src, encoding="utf-8").read()

    # The cover block is the Markdown title + the first blockquote.
    title_line = re.search(r"^#\s+(.+)$", md, re.M).group(1).strip()
    cover_quote = re.search(r"^>\s+(.+)$", md, re.M)
    subtitle = cover_quote.group(1).strip() if cover_quote else ""

    body_md = re.sub(r"^#\s+.+\n", "", md, count=1)
    body_md = re.sub(r"^>.*\n(>\s*\n)*", "", body_md, count=1, flags=re.M)

    body, toc = convert(body_md)

    meta = (
        "    <span>تاريخ التجميع: ٢٤ أكتوبر ٢٠٢٦</span>\n"
        "    <span>عدد المصادر: ١١</span>\n"
        "    <span>آخر تحديث منشوراته: ٢٠٢٦</span>\n"
    )

    footer = (
        "أُعدّ هذا الملف في ٢٤ أكتوبر ٢٠٢٦ من أحد عشر مصدرًا عامًا · "
        "عشرون قسمًا · كل رقم فيه منسوب إلى قائله."
    )

    out = TEMPLATE.format(
        title=f"{title_line} — دوسيه شامل",
        description=(
            "ملف تعريفي شامل عن أ.د. أسامة شعير، أستاذ طب وجراحة الذكورة بكلية الطب "
            "جامعة القاهرة: المؤهلات، البحث العلمي، التقنيات المبتكرة، العيادة، الحضور الرقمي، وملاحظات."
        ),
        css=CSS,
        h1=html.escape(title_line),
        subtitle=subtitle,
        meta=meta,
        toc=toc,
        body=body,
        footer=footer,
    )

    with open(dst, "w", encoding="utf-8") as fh:
        fh.write(out)

    print(f"  {os.path.basename(dst)}  {len(out) / 1024:.0f} KB")


if __name__ == "__main__":
    main()
