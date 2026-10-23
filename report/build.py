"""Builds report/report.html and report/slides.html: self-contained files (images embedded).

Run from the repo folder:  python report/build.py
- every <img src="img/..."> is replaced by an embedded data URL
- <!--TOKENOMICS_TABLE--> is replaced by the per-run table from output/report_evidence/tokenomics.json
- <!--BLIND_RESULT-->, <!--SURVEY_RESULT-->, <!--TIME_RESULT--> are filled from eval/results when available
"""

import base64
import json
import mimetypes
import re
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent

NAMES = {
    "bridge": "Message Bridge",
    "photo_reader": "Photo Reader (per photo)",
    "digest_writer": "Digest Writer",
    "letter_explorer": "Letter Explorer",
    "call_planner": "Call Planner (+ tool)",
    "calendar_reader": "Calendar Reader",
}


def embed_images(html: str) -> str:
    def repl(m: re.Match) -> str:
        path = HERE / m.group(2)
        if not path.exists():
            print(f"  missing image: {m.group(2)}")
            return m.group(0)
        mime = mimetypes.guess_type(path.name)[0] or "image/png"
        data = base64.b64encode(path.read_bytes()).decode()
        return f'{m.group(1)}data:{mime};base64,{data}"'

    return re.sub(r'(<img[^>]*?src=")(img/[^"]+)"', repl, html)


def tokenomics_table() -> str:
    t = json.loads((ROOT / "output" / "report_evidence" / "tokenomics.json").read_text(encoding="utf-8"))
    rows = [
        "<table><tr><th>Agent</th><th class='num'>Runs</th><th class='num'>Avg input</th><th class='num'>Cached</th>"
        "<th class='num'>Avg output</th><th class='num'>Requests</th><th class='num'>Cost/run</th>"
        "<th class='num'>Without cache</th></tr>"
    ]
    for key, name in NAMES.items():
        a = t["per_agent"].get(key)
        if not a:
            continue
        rows.append(
            f"<tr><td>{name}</td><td class='num'>{a['runs']}</td><td class='num'>{a['avg_input']:,}</td>"
            f"<td class='num'>{a['avg_cached']:,} ({a['cache_share']:.0%})</td><td class='num'>{a['avg_output']:,}</td>"
            f"<td class='num'>{a['avg_requests']}</td><td class='num'>${a['cost_per_run']:.5f}</td>"
            f"<td class='num'>${a['cost_per_run_no_cache']:.5f}</td></tr>"
        )
    rows.append("</table>")
    rows.append(
        "<table><tr><th class='num'>Families</th><th class='num'>Per month</th><th class='num'>Per year</th></tr>"
        + "".join(
            f"<tr><td class='num'>{int(n):,}</td><td class='num'>${s['per_month']:,.2f}</td>"
            f"<td class='num'>${s['per_year']:,.2f}</td></tr>"
            for n, s in t["scale"].items()
        )
        + "</table>"
    )
    return "\n".join(rows)


def blind_result() -> str:
    p = ROOT / "eval" / "results" / "blind_test_score.json"
    if not p.exists():
        return "<span class='todo'>Waiting for my mother's answers.</span>"
    s = json.loads(p.read_text(encoding="utf-8"))
    own = s["student_own_words"]
    return (
        f"my mother preferred the HomeBridge version in <b>{s['preferred_rewrite']} of {s['answered']}</b> pairs "
        f"({own['preferred_rewrite']} of {own['answered']} for messages in my own words)."
    )


def main() -> None:
    html = (HERE / "report_src.html").read_text(encoding="utf-8")
    html = html.replace("<!--TOKENOMICS_TABLE-->", tokenomics_table())
    html = html.replace("<!--BLIND_RESULT-->", blind_result())
    html = html.replace(
        "<!--SURVEY_RESULT-->", "<p class='todo'>More parent survey answers (q1 to q7) can be added here.</p>"
    )
    html = embed_images(html)
    out = HERE / "report.html"
    out.write_text(html, encoding="utf-8")
    print(f"Wrote {out} ({out.stat().st_size / 1024:.0f} KB)")

    # Slides reuse the report's architecture diagram, so both always match.
    diagram = re.search(r"<svg viewBox=\"0 0 860 470\".*?</svg>", html, re.DOTALL).group(0)
    slides = (HERE / "slides_src.html").read_text(encoding="utf-8").replace("<!--DIAGRAM-->", diagram)
    slides = embed_images(slides)
    out = HERE / "slides.html"
    out.write_text(slides, encoding="utf-8")
    print(f"Wrote {out} ({out.stat().st_size / 1024:.0f} KB)")


if __name__ == "__main__":
    main()
