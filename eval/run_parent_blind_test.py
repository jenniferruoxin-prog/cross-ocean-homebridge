"""Builds the blind parent test: each message as the student would send it without the app vs the
HomeBridge rewrite, in random order, so the parent cannot tell which is which.

Run from the repo folder:  python eval/run_parent_blind_test.py
Writes eval/results/blind_test_for_parent.txt (paste into WeChat) and eval/results/answer_key.json.
"""

import asyncio
import json
import random
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / "backend"))

from agents.bridge import run_bridge  # noqa: E402
from models import BridgeRequest, FamilyProfile  # noqa: E402

OUT = HERE / "results"
SEED = 409  # fixed, so the A/B order is reproducible


async def main() -> None:
    data = json.loads((HERE / "messages.json").read_text(encoding="utf-8"))
    profile = FamilyProfile(**data["profile"])
    results = await asyncio.gather(
        *(
            run_bridge(BridgeRequest(direction="to_parents", text=m["draft"], profile=profile))
            for m in data["messages"]
        )
    )
    rng = random.Random(SEED)
    key, lines = [], [
        "妈妈/爸爸好！想请你们帮我做个小测试（大约10分钟）：",
        "下面每一组有两条意思差不多的消息（甲和乙），都是我可能会发给你们的。",
        "请告诉我：1）每组里你们读了更舒服的是哪一条；2）如果愿意，说说读完的感受。",
        "直接回复类似：1甲 2乙 3甲……，再加几句话就好。谢谢！",
        "",
    ]
    for m, r in zip(data["messages"], results):
        rewrite_first = rng.random() < 0.5
        a, b = (r.reply.message_to_send, m["without_app"]) if rewrite_first else (m["without_app"], r.reply.message_to_send)
        lines += [f"【第{m['id']}组】", f"甲：{a}", f"乙：{b}", ""]
        key.append(
            {
                "id": m["id"],
                "topic": m["topic"],
                "source": m["source"],
                "rewrite_is": "甲" if rewrite_first else "乙",
                "without_app": m["without_app"],
                "rewrite": r.reply.message_to_send,
                "what_changed": r.reply.reading_between_lines,
                "usage": r.usage.model_dump(),
            }
        )
    OUT.mkdir(exist_ok=True)
    (OUT / "blind_test_for_parent.txt").write_text("\n".join(lines), encoding="utf-8")
    (OUT / "answer_key.json").write_text(json.dumps(key, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {OUT / 'blind_test_for_parent.txt'} and answer_key.json ({len(key)} pairs)")


if __name__ == "__main__":
    asyncio.run(main())
