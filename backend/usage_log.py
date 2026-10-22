"""Appends one line per agent run to output/usage_log.jsonl (real token counts for the tokenomics report)."""

import json
from datetime import datetime, timezone

from pydantic_ai.usage import RunUsage

from config import MODEL_NAME, OUTPUT
from models import UsageInfo

USAGE_LOG = OUTPUT / "usage_log.jsonl"


def record(agent_name: str, usage: RunUsage) -> UsageInfo:
    info = UsageInfo(
        input_tokens=usage.input_tokens,
        cached_input_tokens=usage.cache_read_tokens,
        output_tokens=usage.output_tokens,
        requests=usage.requests,
    )
    OUTPUT.mkdir(exist_ok=True)
    line = {
        "time": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "agent": agent_name,
        "model": MODEL_NAME,
        **info.model_dump(),
    }
    with USAGE_LOG.open("a", encoding="utf-8") as f:
        f.write(json.dumps(line) + "\n")
    return info


def total(infos: list[UsageInfo]) -> UsageInfo:
    """Adds up several runs (e.g. one Photo Reader run per photo) for one API response."""
    return UsageInfo(
        input_tokens=sum(i.input_tokens for i in infos),
        cached_input_tokens=sum(i.cached_input_tokens for i in infos),
        output_tokens=sum(i.output_tokens for i in infos),
        requests=sum(i.requests for i in infos),
    )


GUARD_LOG = OUTPUT / "guard_log.jsonl"


def guard(agent_name: str, reason: str) -> None:
    """Records each time an output check sent an answer back to the model (evidence for the safety section)."""
    OUTPUT.mkdir(exist_ok=True)
    line = {"time": datetime.now(timezone.utc).isoformat(timespec="seconds"), "agent": agent_name, "reason": reason[:300]}
    with GUARD_LOG.open("a", encoding="utf-8") as f:
        f.write(json.dumps(line, ensure_ascii=False) + "\n")
