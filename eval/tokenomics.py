"""Cost analysis from real token counts (output/usage_log.jsonl, one line per agent run).

Run from the repo folder:  python eval/tokenomics.py
Writes output/report_evidence/tokenomics.md and tokenomics.json.

Prices: gpt-6-luna, USD per 1M tokens, as used in the course's tokenomics lecture
(Lecture 10/11 multi-agent tokenomics demo, "Sept 2026 published rates"). Output tokens include reasoning tokens.
"""

import json
from collections import defaultdict
from pathlib import Path
from statistics import mean

ROOT = Path(__file__).resolve().parent.parent
LOG = ROOT / "output" / "usage_log.jsonl"
OUT = ROOT / "output" / "report_evidence"

PRICE = {"input": 0.10, "cached_input": 0.01, "output": 0.50}  # USD per 1M tokens

# How often one family uses each agent per week (student + parents together). Assumptions, stated in the report.
WEEKLY_USE = {
    "bridge": 10,  # about 5 messages each way
    "photo_reader": 4,  # 4 photos in the weekly digest
    "digest_writer": 1,
    "letter_explorer": 1,  # the parent reads the letter
    "call_planner": 1,
    "calendar_reader": 0.5,  # calendar screenshots every other week
}
WEEKS_PER_MONTH = 52 / 12

NAMES = {
    "bridge": "Message Bridge",
    "photo_reader": "Photo Reader (per photo)",
    "digest_writer": "Digest Writer",
    "letter_explorer": "Letter Explorer",
    "call_planner": "Call Planner (+ tool)",
    "calendar_reader": "Calendar Reader",
}


def cost(inp: float, cached: float, out: float) -> float:
    """Cost of one run. input_tokens includes the cached part, which is billed at the cached rate."""
    return ((inp - cached) * PRICE["input"] + cached * PRICE["cached_input"] + out * PRICE["output"]) / 1e6


def cost_no_cache(inp: float, out: float) -> float:
    return (inp * PRICE["input"] + out * PRICE["output"]) / 1e6


def main() -> None:
    runs = defaultdict(list)
    for line in LOG.read_text(encoding="utf-8").splitlines():
        if line.strip():
            r = json.loads(line)
            runs[r["agent"]].append(r)

    per_agent = {}
    for agent, rs in runs.items():
        inp = mean(r["input_tokens"] for r in rs)
        cached = mean(r["cached_input_tokens"] for r in rs)
        out = mean(r["output_tokens"] for r in rs)
        per_agent[agent] = {
            "runs": len(rs),
            "avg_input": round(inp),
            "avg_cached": round(cached),
            "cache_share": round(cached / inp, 2) if inp else 0,
            "avg_output": round(out),
            "avg_requests": round(mean(r["requests"] for r in rs), 2),
            "cost_per_run": cost(inp, cached, out),
            "cost_per_run_no_cache": cost_no_cache(inp, out),
        }

    weekly = sum(per_agent[a]["cost_per_run"] * n for a, n in WEEKLY_USE.items() if a in per_agent)
    weekly_nc = sum(per_agent[a]["cost_per_run_no_cache"] * n for a, n in WEEKLY_USE.items() if a in per_agent)
    month = weekly * WEEKS_PER_MONTH
    month_nc = weekly_nc * WEEKS_PER_MONTH
    scale = {n: {"per_month": month * n, "per_year": month * n * 12} for n in (1, 100, 10_000)}

    result = {
        "prices_per_1M": PRICE,
        "per_agent": per_agent,
        "weekly_use": WEEKLY_USE,
        "per_family_per_month": month,
        "per_family_per_month_without_cache": month_nc,
        "cache_saving_share": round(1 - month / month_nc, 3) if month_nc else 0,
        "scale": scale,
        "total_logged_runs": sum(len(v) for v in runs.values()),
    }
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "tokenomics.json").write_text(json.dumps(result, indent=2), encoding="utf-8")

    md = [
        "# Tokenomics (measured)",
        "",
        f"Source: `output/usage_log.jsonl`, {result['total_logged_runs']} real agent runs during development and testing. "
        f"Prices (gpt-6-luna, USD per 1M tokens): input ${PRICE['input']}, cached input ${PRICE['cached_input']}, "
        f"output ${PRICE['output']} (output includes reasoning tokens).",
        "",
        "## Per run",
        "",
        "| Agent | Runs logged | Avg input | of which cached | Avg output | Requests/run | Cost/run | Without cache |",
        "|---|---:|---:|---:|---:|---:|---:|---:|",
    ]
    for agent in NAMES:
        if agent not in per_agent:
            continue
        a = per_agent[agent]
        md.append(
            f"| {NAMES[agent]} | {a['runs']} | {a['avg_input']:,} | {a['avg_cached']:,} ({a['cache_share']:.0%}) | "
            f"{a['avg_output']:,} | {a['avg_requests']} | ${a['cost_per_run']:.5f} | ${a['cost_per_run_no_cache']:.5f} |"
        )
    md += [
        "",
        "## Per family and at scale",
        "",
        "Assumed weekly use per family (student and parents together): "
        + ", ".join(f"{NAMES[a]} x{n}" for a, n in WEEKLY_USE.items())
        + ".",
        "",
        "| Families | Per month | Per year |",
        "|---:|---:|---:|",
    ]
    for n, s in scale.items():
        md.append(f"| {n:,} | ${s['per_month']:,.2f} | ${s['per_year']:,.2f} |")
    md += [
        "",
        f"Prompt caching (static instructions first, family data after) lowers the monthly cost per family from "
        f"${month_nc:.4f} to ${month:.4f} ({result['cache_saving_share']:.0%} less).",
        "",
    ]
    (OUT / "tokenomics.md").write_text("\n".join(md), encoding="utf-8")
    print("\n".join(md))


if __name__ == "__main__":
    main()
