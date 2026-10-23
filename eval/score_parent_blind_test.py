"""Scores the parent's answers to the blind test.

Usage (from the repo folder):  python eval/score_parent_blind_test.py "1甲 2乙 3甲 ..."
Writes eval/results/blind_test_score.json.
"""

import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
OUT = HERE / "results"


def main() -> None:
    if len(sys.argv) < 2:
        sys.exit('Give the answers, e.g.  python eval/score_parent_blind_test.py "1甲 2乙 3甲"')
    key = {k["id"]: k for k in json.loads((OUT / "answer_key.json").read_text(encoding="utf-8"))}
    picks = {int(n): c for n, c in re.findall(r"(\d+)\s*([甲乙])", sys.argv[1])}
    rows = []
    for i, k in sorted(key.items()):
        if i not in picks:
            continue
        rows.append({"id": i, "topic": k["topic"], "source": k["source"], "picked_rewrite": picks[i] == k["rewrite_is"]})
    n = len(rows)
    wins = sum(r["picked_rewrite"] for r in rows)
    own = [r for r in rows if r["source"] == "student's own words"]
    summary = {
        "answered": n,
        "preferred_rewrite": wins,
        "share": round(wins / n, 2) if n else None,
        "student_own_words": {"answered": len(own), "preferred_rewrite": sum(r["picked_rewrite"] for r in own)},
        "rows": rows,
    }
    (OUT / "blind_test_score.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Parent preferred the HomeBridge rewrite in {wins} of {n} pairs.")
    for r in rows:
        print(f"  {r['id']}. {r['topic']:<24} {'rewrite' if r['picked_rewrite'] else 'original'}")


if __name__ == "__main__":
    main()
